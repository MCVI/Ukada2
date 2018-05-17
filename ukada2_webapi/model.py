import peewee
from .server import database as db, app_context
from .util import subclass_of


class BaseModel(peewee.Model):
    class Meta:
        database = db
        only_save_dirty = True
