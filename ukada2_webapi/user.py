import uuid
from flask import request
import peewee
from peewee import CharField, UUIDField, TextField, BooleanField
from .util import response
from .util.response import Success
from . import server
from .server import default_blueprint as bp, db_transaction_succeeded
from .model import BaseModel
from .resource import ResourceWithModel


class User(BaseModel):
    email = CharField(null=False, unique=True)
    login_token_uuid = UUIDField(null=False)
    authentication_info = TextField(null=False)
    is_super = BooleanField(null=False)


class UserResource(ResourceWithModel):

    @property
    def allowed_method(self)->list:
        return ["create"]

    @property
    def model(self)->type:
        return User

    @property
    def available_lookup_method(self)->list:
        return ["by-id"]

    @property
    def default_lookup_method(self)->str:
        return "by-id"

    class Instance(ResourceWithModel.Instance):
        @property
        def is_public(self):
            return False

        @property
        def author_id(self):
            return self.obj.id

        @property
        def allow_create(self):
            return True

    @property
    def is_public(self):
        return False

    @property
    def author_id(self):
        return User.id

    @property
    def lookup_object_fetch_field(self):
        return [User.id]

    def create(self):
        email = request.form["email"]
        login_token_uuid = uuid.uuid4()
        authentication_info = server.var.generate_auth_info(
            {
                "prefix": request.form["public_salt_prefix"],
                "suffix": request.form["public_salt_suffix"],
            },
            request.form["client_hash"]
        )

        try:
            user_id = User.insert(
                email=email,
                login_token_uuid=login_token_uuid,
                authentication_info=authentication_info,
                is_super=False
            ).execute()
        except peewee.IntegrityError:
            response.json(response.Conflict)
            assert False

        db_transaction_succeeded()
        response.json(Success, id=user_id)


resource = UserResource("User")
resource.register_to_blueprint(bp, "/user")
