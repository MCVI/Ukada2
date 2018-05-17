from math import ceil
from flask import json, g
from .util import response
from .util.response import Success
from .server import default_blueprint as bp, db_transaction_succeeded
from . import identity
from .apply import content_item_list, ApplyInfo


items_per_page = 20


@bp.route("/apply_list/page/<int:page_index>")
def get_apply_list(page_index: int):
    if isinstance(g.identity, identity.Super):
        sql_cond = True
        visible_item = content_item_list
    else:
        sql_cond = (ApplyInfo.passed == True)
        visible_item = [
            "school",
            "team_name",
            "team_leader",
            "team_member1",
            "team_member2",
        ]

    apply_info_set = ApplyInfo.select().where(sql_cond)
    apply_info_count = apply_info_set.count()
    apply_info_page = apply_info_set.paginate(page_index, items_per_page).execute()
    db_transaction_succeeded()

    res = []
    for record in apply_info_page:
        content = json.loads(record.content)
        res_record = {
            item: content[item] for item in visible_item
        }
        res_record["passed"] = record.passed
        res.append(res_record)

    page_num = int(ceil(apply_info_count/items_per_page))

    response.json(Success, page_num=page_num, list=res)
