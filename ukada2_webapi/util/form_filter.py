def get_str(value: str)->str:
    if isinstance(value, str):
        return value
    else:
        raise ValueError


def get_alnum(value: str)->str:
    s = get_str(value)
    if s.isalnum():
        return s
    else:
        raise ValueError


def get_bool(value: str):
    l = value.lower()
    if l == "true":
        return True
    elif l == "false":
        return False
    else:
        raise ValueError


form_item_type_dict = {
    "string": get_str,
    "boolean": get_bool,
    "alnum": get_alnum
}


def get_val(req_type: str, value):
    return form_item_type_dict[req_type](value)


def filter_form(form_description: dict, _form):
    items = form_description["items"]
    assert isinstance(items, list)

    allow_redundancy = (
        form_description["allow_redundancy"]
        if "allow_redundancy" in form_description
        else False
    )

    form = _form.copy()

    res = {}
    for item in items:
        name = item["name"]
        if name in form:
            t = item["type"]
            v = form.pop(name)
            try:
                res[name] = get_val(t, v)
            except Exception:
                raise ValueError
        else:
            if ("vacant" in item) and (item["vacant"] is True):
                pass
            elif "default" in item:
                res[name] = item["default"]
            else:
                raise ValueError

    if (not allow_redundancy) and form:
        raise ValueError

    return res
