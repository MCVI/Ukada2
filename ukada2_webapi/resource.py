import functools
from abc import ABCMeta, abstractmethod
from flask import Blueprint, request, g
import peewee
from .util import VarContainer, response
from .util.response import BadRequest, MethodNotAllowed, NotFound, Forbidden, MethodNotImplemented
from . import identity
from .model import BaseModel


http_method_map = {
    "PUT": "create",
    "GET": "retrieve",
    "POST": "update",
    "DELETE": "delete",
}


def not_implemented(func):
    @functools.wraps(func)
    def wrapper(*args, **argv):
        response.json(MethodNotImplemented)
    return wrapper


class Resource(metaclass=ABCMeta):

    @property
    @abstractmethod
    def allowed_method(self)->list:
        """available: ["create","retrieve","update","delete"]"""
        pass

    @not_implemented
    def create(self): pass

    @not_implemented
    def retrieve(self): pass

    @not_implemented
    def update(self): pass

    @not_implemented
    def delete(self): pass

    class Instance:

        def __init__(self, resource):
            self.resource = resource

        @property
        def allow_read(self)->bool:
            return True

        @property
        def allow_write(self)->bool:
            return isinstance(g.identity, identity.Super)

        @property
        def allow_pass(self)->bool:
            return self.allow_read

        @property
        def allow_create(self)->bool:
            return self.allow_write

        @property
        def allow_retrieve(self)->bool:
            return self.allow_read

        @property
        def allow_update(self)->bool:
            return self.allow_write

        @property
        def allow_delete(self)->bool:
            return self.allow_write

    def __init__(self, name: str):
        self.name = name
        self.sub_resource = {}

        self.http_func = {}
        for http_method, func_name in http_method_map.items():
            if func_name in self.allowed_method:
                self.http_func[http_method] = func_name

    def add_sub_resource(self, name: str, sub):
        self.sub_resource[name]=sub

    def do_pass(self, path: str):
        spl = path.split('/', maxsplit=1)
        if len(spl) == 2:
            next_path = spl[1]
        else:
            next_path = ""
        try:
            next_resource = self.sub_resource[spl[0]]
        except KeyError:
            response.json(BadRequest)
            assert False
        response.forward(next_resource.entry(next_path))

    def method_route(self, instance: Instance, method: str, path: str):
        if getattr(instance, "allow_"+method):
            g.resource_path.append(instance)
            if method == "pass":
                response.forward(self.do_pass(path))
            else:
                assert path == ""
                response.forward(getattr(self, method)())
        else:
            response.json(Forbidden)

    def entry(self, path: str):
        if path == "":
            try:
                m = self.http_func[request.method]
            except KeyError:
                response.json(MethodNotAllowed)
                assert False
        else:
            m = "pass"

        inst = self.Instance(self)
        response.forward(self.method_route(inst, m, path))

    def flask_entry(self, path: str):
        g.resource_path = []
        self.entry(path)

    def register_to_blueprint(self, blueprint: Blueprint, path: str):
        supported_http_method = http_method_map.keys()

        @blueprint.route(
            rule=path+"/<path:entry_path>",
            methods=supported_http_method,
            endpoint=self.name+"_entry_sub"
        )
        def entry_sub(entry_path):
            self.flask_entry(entry_path)

        @blueprint.route(
            rule=path,
            methods=supported_http_method,
            endpoint=self.name+"_entry_file"
        )
        def entry():
            self.flask_entry("")

        @blueprint.route(
            rule=path+"/",
            methods=supported_http_method,
            endpoint=self.name+"_entry_dir"
        )
        def entry_dir():
            self.flask_entry("")


class ResourceWithModel(Resource):

    @property
    @abstractmethod
    def model(self)->type:
        pass

    @property
    @abstractmethod
    def available_lookup_method(self)->list:
        """Supported: "auto" "by-id" "by-name" """
        pass

    @property
    @abstractmethod
    def default_lookup_method(self)->str:
        """Supported: "auto" "by-id" "by-name" """
        pass

    class Instance(Resource.Instance):

        def __init__(self, resource, lookup_info, obj):
            self.resource = resource
            self.model = resource.model
            self._lookup_info = lookup_info
            self._obj = obj

        @property
        def lookup_info(self):
            assert not (self._lookup_info is None)
            return self._lookup_info

        @property
        def obj(self):
            assert not (self._obj is None)
            return self._obj

        @property
        def is_public(self)->bool:
            return self.obj.is_public

        @property
        def is_locked(self)->bool:
            return self.obj.is_locked

        @property
        def author_id(self)->int:
            return self.obj.author_id

        @property
        def allow_read(self)->bool:
            if isinstance(g.identity, identity.Personal):
                return (self.is_public is True) or (self.author_id == g.identity.user.id)
            elif isinstance(g.identity, identity.Tourist):
                return self.is_public is True
            elif isinstance(g.identity, identity.Common):
                return self.is_public is True
            elif isinstance(g.identity, identity.Super):
                return True
            else:
                raise ValueError

        @property
        def allow_write(self)->bool:
            if isinstance(g.identity, identity.Personal):
                return (self.author_id == g.identity.user.id) and (self.is_locked is False)
            elif isinstance(g.identity, identity.Tourist):
                return False
            elif isinstance(g.identity, identity.Common):
                return False
            elif isinstance(g.identity, identity.Super):
                return True
            else:
                raise ValueError

        @property
        def allow_create(self):
            if isinstance(g.identity, identity.Tourist):
                return False
            else:
                return True

    def __init__(self, name: str):
        super(ResourceWithModel, self).__init__(name)

        assert(issubclass(self.model, BaseModel))
        self.database = self.model._meta.database

        self.lookup_func = {
            "auto": self.lookup_auto,
            "by-id": self.lookup_by_id,
            "by-name": self.lookup_by_name,
        }
        self.available_lookup_func = {
            m: self.lookup_func[m] for m in self.available_lookup_method
        }

    @property
    def is_public(self):
        return self.model.is_public

    @property
    def author_id(self):
        return self.model.author_id

    @property
    def visible_sql_cond(self):
        if isinstance(g.identity, identity.Personal):
            return (self.is_public == True) | (self.author_id == g.identity.user.id)
        elif isinstance(g.identity, identity.Tourist):
            return self.is_public == True
        elif isinstance(g.identity, identity.Common):
            return self.is_public == True
        elif isinstance(g.identity, identity.Super):
            return True
        else:
            raise ValueError

    def lookup_auto(self, lookup_info: VarContainer, path: str):
        iden = path.split('/', maxsplit=1)[0]
        if ("by-id" in self.available_lookup_method) and iden.isdecimal():
            return self.lookup_by_id(lookup_info, path)
        elif ("by-name" in self.available_lookup_method) and iden.isalnum():
            return self.lookup_by_name(lookup_info, path)
        else:
            response.json(BadRequest)

    def lookup_by_id(self, lookup_info: VarContainer, path: str):
        lookup_info.applied_method = "by-id"
        spl = path.split('/', maxsplit=1)
        try:
            iden = int(spl[0])
        except ValueError:
            response.json(BadRequest)
            assert False
        lookup_info.id = iden
        lookup_info.sql_cond = (self.model.id == iden)
        if len(spl) == 2:
            return spl[1]
        else:
            return ""

    def lookup_by_name(self, lookup_info: VarContainer, path: str):
        lookup_info.applied_method = "by-name"
        spl = path.split('/', maxsplit=1)
        if spl[0].isalnum():
            name = spl[0]
        else:
            response.json(BadRequest)
            assert False

        lookup_info.name = name
        lookup_info.sql_cond = (self.model.name == name)
        if len(spl) == 2:
            return spl[1]
        else:
            return ""

    @property
    def lookup_object_fetch_field(self)->list:
        model = self.model
        return [
            model.id,
            model.is_public,
            model.is_locked,
            model.author_id
        ]

    def lookup_object(self, lookup_sql_cond):
        model = self.model
        try:
            return (
                self.model
                    .select(*self.lookup_object_fetch_field)
                    .where(lookup_sql_cond & self.visible_sql_cond)
            ).get()
        except peewee.DoesNotExist:
            return None

    def entry(self, path: str):
        http_func = self.http_func
        lookup_func = self.available_lookup_func

        if path == "":
            if request.method == "PUT":
                inst = self.Instance(self, None, None)
                self.method_route(inst, "create", "")
            else:
                response.json(MethodNotAllowed)
                assert False
        else:
            res_l = VarContainer()
            spl = path.split('/', maxsplit=1)

            if spl[0] in lookup_func:
                requested_method = spl[0]
                res_l.requested_method = requested_method
                try:
                    p = spl[1]
                except IndexError:
                    response.json(BadRequest)
                    assert False
            else:
                requested_method = self.default_lookup_method
                res_l.requested_method = requested_method
                p = path

            next_path = lookup_func[requested_method](res_l, p)

            if next_path == "":
                if(request.method == "PUT") or (request.method not in http_func):
                    response.json(MethodNotAllowed)
                    assert False
                else:
                    method = http_method_map[request.method]
            else:
                method = "pass"

            obj = self.lookup_object(res_l.sql_cond)
            if obj is None:
                response.json(NotFound)
                assert False

            inst = self.Instance(self, res_l, obj)
            self.method_route(inst, method, next_path)
