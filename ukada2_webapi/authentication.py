import uuid
import hashlib
import itsdangerous
from itsdangerous import TimedJSONWebSignatureSerializer
from flask import request, g, json
import peewee
from .util import response, is_uuid
from .util.response import Success, NotFound, NotAcceptable, BadRequest, Unauthorized
from . import server
from .server import default_blueprint as bp, app, db_transaction_succeeded
from . import identity
from .resource import Resource
from .user import User


def server_hash(server_salt, client_hash):
    complete_str = "".join([
        server_salt["prefix"], "-",
        app.config["MCVI_PASSWD_PREFIX_SERVER"], "-",
        client_hash, "-",
        server_salt["suffix"],
    ])
    return hashlib.sha512(
        bytes(complete_str, encoding="utf-8")
    ).hexdigest()


def generate_auth_info(public_salt, client_hash):
    for name in ["prefix", "suffix"]:
        if not is_uuid(public_salt[name]):
            raise ValueError()

    server_salt = {
        "prefix": str(uuid.uuid4()),
        "suffix": str(uuid.uuid4()),
    }
    auth_info = {
        "available_scheme": [
            {
                "scheme": "double_salt",
                "public_salt": {
                    "prefix": public_salt["prefix"],
                    "suffix": public_salt["suffix"],
                },
                "server_salt": server_salt,
                "hash_result": server_hash(server_salt, client_hash),
            },
        ],
    }
    return json.dumps(auth_info)


server.var.generate_auth_info = generate_auth_info


@bp.route("/auth/public_salt", methods=["POST"])
def get_public_salt():

    email = request.form["email"]

    try:
        user = (
            User
            .select(User.authentication_info)
            .where(User.email == email)
        ).get()
    except peewee.DoesNotExist:
        response.json(NotFound)
        assert False

    auth_info = json.loads(user.authentication_info)

    public_salt = None
    for s in auth_info["available_scheme"]:
        if s["scheme"] == "double_salt":
            public_salt = s["public_salt"]
            break

    if not public_salt:
        response.json(NotAcceptable)
    else:
        res = {
            "prefix": public_salt["prefix"],
            "suffix": public_salt["suffix"],
        }
        response.json(Success, public_salt=res)


identity_token_serializer = TimedJSONWebSignatureSerializer(
    app.config["SECRET_KEY"],
    expires_in=60 * 60 * 24 * 15,
)


@bp.route("/auth/login", methods=["POST"])
def create_login_token():
    if "password_hash" not in request.form:
        response.json(BadRequest)

    email = request.form["email"]
    try:
        user = User.select(
            User.id,
            User.login_token_uuid,
            User.authentication_info
        ).where(User.email == email).get()
    except peewee.DoesNotExist:
        response.json(NotFound)
        assert False

    auth_info = json.loads(user.authentication_info)

    available_scheme = None
    for s in auth_info["available_scheme"]:
        if s["scheme"] == "double_salt":
            available_scheme = s
            break
    if not available_scheme:
        response.json(NotAcceptable)
    else:
        client_hash = request.form["password_hash"]
        server_salt = available_scheme["server_salt"]
        h = server_hash(server_salt, client_hash)
        if h != available_scheme["hash_result"]:
            response.json(Unauthorized)
        else:
            data = {
                "version": app.config["MCVIOJ_INTERNAL_VERSION"],
                "id": user.id,
                "uuid": str(user.login_token_uuid),
            }
            token = identity_token_serializer.dumps(data).decode()
            response.json(Success, token=token)


class IdentityVerificationFailed(Exception):
    pass


def verify_identity():
    try:
        requested_identity = request.headers["X-MCVI-Auth-Privilege"]
    except KeyError:
        raise IdentityVerificationFailed()

    available_identity = ["Tourist", "Common", "Personal", "Super"]
    if requested_identity not in available_identity:
        raise IdentityVerificationFailed()

    if requested_identity == "Tourist":
        return identity.Tourist()

    try:
        token = request.headers["X-MCVI-Auth-Token"]
    except KeyError:
        raise IdentityVerificationFailed()

    try:
        data = identity_token_serializer.loads(token)
    except itsdangerous.SignatureExpired:
        raise IdentityVerificationFailed()
    except itsdangerous.BadSignature:
        raise IdentityVerificationFailed()

    try:
        version = int(data["version"])
        if version != app.config["MCVIOJ_INTERNAL_VERSION"]:
            raise IdentityVerificationFailed()
        user_id = int(data["id"])
        login_token_uuid = data["uuid"]
    except KeyError:
        raise IdentityVerificationFailed()
    except ValueError:
        raise IdentityVerificationFailed()

    try:
        user = User.select(
            User.id,
            User.login_token_uuid,
            User.is_super
        ).where(User.id == user_id).get()
    except peewee.DoesNotExist:
        raise IdentityVerificationFailed()
    if login_token_uuid != str(user.login_token_uuid):
        raise IdentityVerificationFailed()

    if requested_identity == "Super":
        if user.is_super:
            return identity.Super(user)
        else:
            return identity.Personal(user)
    elif requested_identity == "Personal":
        return identity.Personal(user)
    else:
        return identity.Common(user)


@app.before_request
def verify_identity_before_request():
    try:
        g.identity = verify_identity()
    except IdentityVerificationFailed:
        g.identity = identity.Tourist()


class AuthEchoResource(Resource):

    @property
    def allowed_method(self):
        return ["update"]

    class Instance(Resource.Instance):

        @property
        def allow_update(self):
            return True

    def update(self):
        if isinstance(g.identity, identity.Tourist):
            obj = {}
        else:
            user_id = g.identity.user.id
            try:
                user = User.select(User.id, User.email, User.is_super).where(User.id == user_id).get()
            except peewee.DoesNotExist:
                response.json(NotFound)

            obj = {
                "id": user.id,
                "email": user.email,
                "is_super": user.is_super,
            }

        db_transaction_succeeded()
        response.json(Success, object=obj)


echo_resource = AuthEchoResource("AuthEcho")
echo_resource.register_to_blueprint(bp, "/auth/echo")
