from contextlib import contextmanager
from flask import Flask, Blueprint, g
from playhouse import db_url
from .util import subclass_of, response, VarContainer, ContextSplitter

var = VarContainer()

blueprints = VarContainer()
default_blueprint = Blueprint("MCVIOJ", __name__)
blueprints.default = default_blueprint

app = Flask(__name__)
config = app.config
config.from_pyfile("config/common.py")
config.from_pyfile("config/local.py")

database = db_url.connect(config["DATABASE_URL"])


def init_app_context():
    global var, database
    g.server_var = var
    g.database = database
    database.connect()


def deinit_app_context():
    database.close()


@app.before_request
def before_request():
    init_app_context()
    splitter = ContextSplitter(database.atomic())
    g._server_db_atomic_splitter = splitter
    g.db_transaction = splitter.start()


@app.teardown_request
def teardown_request(e: Exception):
    try:
        splitter = g._server_db_atomic_splitter
        if not splitter.is_ended():
            g.db_transaction.rollback()
            splitter.end(e)
    finally:
        deinit_app_context()


@app.errorhandler(response.BaseResponse)
def response_handler(r: response.BaseResponse):
    return r.get_response()


def db_transaction_succeeded():
    splitter = g._server_db_atomic_splitter
    assert not splitter.is_ended()
    splitter.end(None)


@contextmanager
def app_context():
    with app.app_context():
        init_app_context()
        yield
        deinit_app_context()


def after_server_init():
    for key in blueprints.__dict__:
        value = blueprints.__dict__[key]
        if isinstance(value, Blueprint):
            app.register_blueprint(value)


def update_database():
    """!! This method is currently implemented only for debugging."""
    with app_context():
        from .model import BaseModel
        model_list = [sub for sub in subclass_of(BaseModel)]
        database.create_tables(model_list)


def debug_run():

    app.run(debug=True)
