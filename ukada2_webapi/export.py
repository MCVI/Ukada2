import pymysql
import xlwt
from io import BytesIO
from flask import json, g, render_template
from .util import response
from .server import default_blueprint as bp, db_transaction_succeeded
from . import identity
from .apply import ApplyInfo


class UnknownSchool(Exception):
    pass


class School:
    def __init__(self, abbreviation: str, name: str, alias_name: list):
        self.abbreviation = abbreviation
        self.name = name
        self.alias_name = alias_name


class User:
    @classmethod
    def from_dict(cls, content: dict):
        user = User()
        user.school = recognize_school(content["school"])
        user.name = content["team_name"]
        user.leader = content["team_leader"]
        user.member1 = content["team_member1"]
        user.member2 = content["team_member2"]
        user.phone = content["phone"]
        user.qq = content["qq"]
        return user

    def sql_escape(self):
        escape_string = pymysql.escape_string

        escaped = User()
        escaped.school = self.school
        escaped.name = escape_string(self.name)
        escaped.leader = escape_string(self.leader)
        escaped.member1 = escape_string(self.member1)
        escaped.member2 = escape_string(self.member2)
        return escaped


school_list=[
    School("CCNU", "华中师范大学", []),
    School("HZAU", "华中农业大学", []),
    School("WHUT", "武汉理工大学", []),
    School("WHU", "武汉大学", []),
    School("HUST", "华中科技大学", []),
    School("WUST", "武汉科技大学", []),
    School("SCUEC", "中南民族大学", []),
    School("CUG", "中国地质大学", []),
    School("HUT", "湖北工业大学", []),
]

school_index = 1
for school in school_list:
    school.id = school_index
    school_index = school_index + 1

def recognize_school(school_name: str)->School:
    s = school_name.lower()
    for school in school_list:
        if s==school.abbreviation.lower() or s==school.name.lower():
            return school
        for alias_name in school.alias_name:
            if s==alias_name.lower():
                return school

    for school in school_list:
        if s.find(school.name.lower())>=0:
            return school
        for alias_name in school.alias_name:
            if s.find(school.alias_name.lower())>=0:
                return school

    count = 0
    last_school = None
    for school in school_list:
        if s.find(school.abbreviation.lower())>=0:
            count = count + 1
            last_school = school
    if count == 1:
        return last_school

    raise UnknownSchool()


def get_user_list(unknown_school=[]):
    records = ApplyInfo.select().where(ApplyInfo.passed == True).order_by(+ApplyInfo.random_id).execute()
    db_transaction_succeeded()

    user_list = []
    for record in records:
        content = json.loads(record.content)
        try:
            user = User.from_dict(content)
        except UnknownSchool:
            unknown_school.append(content["school"])
            continue

        user_list.append(user)
    return user_list

@bp.route("/apply_list/export/domjudge.sql")
def export_to_domjudge():
    if not isinstance(g.identity, identity.Super):
        response.json(response.Forbidden)
    else:
        unknown_school = []
        raw_user_list = get_user_list(unknown_school=unknown_school)
        if len(unknown_school)==0:
            user_list = []
            for user in raw_user_list:
                user_list.append(user.sql_escape())

            return render_template("domjudge.sql", school_list=school_list, user_list = user_list)
        else:
            response.json(response.Conflict, unknown_school=unknown_school)
            assert False

@bp.route("/apply_list/export/excel.xls")
def export_to_excel():
    if not isinstance(g.identity, identity.Super):
        response.json(response.Forbidden)
    else:
        unknown_school = []
        user_list = get_user_list(unknown_school=unknown_school)
        if len(unknown_school)==0:

            xls_column_name = ["队伍", "学校", "队名", "队长", "队员1", "队员2", "电话", "QQ"]
            xls_column_content = ["team_id", "school", "name", "leader", "member1", "member2", "phone", "qq"]

            wbk = xlwt.Workbook()
            sheet = wbk.add_sheet("报名数据")
            for i, name in enumerate(xls_column_name):
                sheet.write(0, i, name)

            for user_index, user in enumerate(user_list):
                for column_index, column_content in enumerate(xls_column_content):
                    if column_content=="team_id":
                        grid_content = "t%d" % (user_index+1)
                    elif column_content=="school":
                        grid_content = user.school.name
                    else:
                        grid_content = getattr(user, column_content)

                    sheet.write(user_index+1, column_index, grid_content)

            bytes = BytesIO()
            wbk.save(bytes)
            return bytes.getvalue()

        else:
            response.json(response.Conflict, unknown_school=unknown_school)
            assert False
