import os

# !!This is only for debug
try:
    os.remove("debug.db")
except FileNotFoundError:
    pass

from ukada2_webapi import debug_run, update_database
import logging

logger = logging.getLogger('peewee')
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

update_database()
debug_run()
