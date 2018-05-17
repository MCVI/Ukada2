import re;

uuid_pattern=re.compile("^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$");

def is_uuid(str):
    return True if re.match(uuid_pattern,str) else False;
