from abc import ABCMeta, abstractmethod
from flask import json as _json, g


class BaseResponse(Exception, metaclass=ABCMeta):
    @property
    @abstractmethod
    def status_code(self):
        pass

    @property
    def status_name(self):
        return self.__class__.__name__

    def get_content(self):
        return _json.jsonify(status=self.status_name)

    def get_response(self):
        try:
            return self.get_content(), self.status_code
        except BaseResponse as e:
            return e.get_response()


class Success(BaseResponse):
    @property
    def status_code(self):
        return 200


class BadRequest(BaseResponse):
    @property
    def status_code(self):
        return 400


class Unauthorized(BaseResponse):
    @property
    def status_code(self):
        return 401


class Forbidden(BaseResponse):
    @property
    def status_code(self):
        return 403


class NotFound(BaseResponse):
    @property
    def status_code(self):
        return 404


class MethodNotAllowed(BaseResponse):
    @property
    def status_code(self):
        return 405


class NotAcceptable(BaseResponse):
    @property
    def status_code(self):
        return 406


class Conflict(BaseResponse):
    @property
    def status_code(self):
        return 409


class InternalServerError(BaseResponse):
    @property
    def status_code(self):
        return 500


class MethodNotImplemented(BaseResponse):
    @property
    def status_name(self):
        return "NotImplemented"

    @property
    def status_code(self):
        return 501


def func(status: type, f, *args, **kwargs):
    assert(callable(f))
    res = status()

    def get_content():
        return f(*args, **kwargs)
    res.get_content = get_content
    raise res


def json(status: type, **kwargs):
    res = status()

    def get_content():
        d = dict(
            kwargs,
            status=res.status_name,
        )
        if(hasattr(g,"identity") and
                not hasattr(d,"authenticated_identity")):
            d["authenticated_identity"] = g.identity.name
        return _json.jsonify(d)
    res.get_content = get_content
    raise res


def forward(val: type(None)):
    json(InternalServerError, detail="NoResponse")
    assert False
