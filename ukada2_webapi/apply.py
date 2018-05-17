from flask import json, g, request
import peewee
from peewee import ForeignKeyField, TextField, BooleanField
from .util import response
from .util.response import Success, NotFound, BadRequest, Forbidden
from .server import db_transaction_succeeded
from . import identity
from .model import BaseModel
from .resource import Resource
from .user import User, resource as user_resource


content_item_list = [
    "school",
    "team_name",
    "team_leader",
    "team_member1",
    "team_member2",
    "phone",
    "qq",
]


class ApplyInfo(BaseModel):
    user = ForeignKeyField(User, null=False, primary_key=True)
    passed = BooleanField(null=False)
    content = TextField(null=False)


class ApplyResource(Resource):

    @property
    def allowed_method(self)->list:
        return ["retrieve", "update"]

    class Instance(Resource.Instance):

        @property
        def allow_read(self):
            if isinstance(g.identity, identity.Personal):
                user = g.resource_path[0].obj
                return user.id == g.identity.user.id
            elif isinstance(g.identity, identity.Super):
                return True
            else:
                return False

        @property
        def allow_write(self)->bool:
            if isinstance(g.identity, identity.Personal):
                user = g.resource_path[0].obj
                return user.id == g.identity.user.id
            elif isinstance(g.identity, identity.Super):
                return True
            else:
                return False

    def retrieve(self):
        user = g.resource_path[0].obj
        try:
            apply_info = ApplyInfo.select().where(ApplyInfo.user_id == user.id).get()
        except peewee.DoesNotExist:
            response.json(NotFound)
            assert False

        db_transaction_succeeded()

        raw_content = json.loads(apply_info.content)
        obj = dict(raw_content, passed=apply_info.passed)
        response.json(Success, object=obj)

    def update(self):

        if "passed" in request.form:
            request_passed_lower = request.form["passed"].lower()
            if request_passed_lower == "false":
                request_passed = False
            elif request_passed_lower == "true":
                request_passed = True
            else:
                response.json(BadRequest)
                assert False
        else:
            request_passed = False

        content_updated = False
        user = g.resource_path[0].obj
        try:
            apply_info = ApplyInfo.select().where(ApplyInfo.user_id == user.id).get()

            if isinstance(g.identity, identity.Super):
                apply_info.passed = request_passed
            else:
                if apply_info.passed is True:
                    response.json(Forbidden)
                    assert False
                else:
                    if request_passed is False:
                        apply_info.passed = False
                    else:
                        response.json(Forbidden)
                        assert False

            content = json.loads(apply_info.content)
            for item in content_item_list:
                if item in request.form:
                    content_updated = True
                    content[item] = request.form[item]

            force_insert = False

        except peewee.DoesNotExist:
            apply_info = ApplyInfo(user_id=user.id)

            if isinstance(g.identity, identity.Super):
                apply_info.passed = request_passed
            else:
                if request_passed is False:
                    apply_info.passed = False
                else:
                    response.json(Forbidden)

            content = {}
            for item in content_item_list:
                if item in request.form:
                    content[item] = request.form[item]
                else:
                    response.json(BadRequest)

            content_updated = True
            force_insert = True

        if content_updated is True:
            apply_info.content = json.dumps(content)

        apply_info.save(force_insert=force_insert)
        db_transaction_succeeded()
        response.json(Success)


apply_resource = ApplyResource("ApplyInfo")
user_resource.add_sub_resource("apply_info", apply_resource)
