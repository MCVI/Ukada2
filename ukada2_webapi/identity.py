from abc import ABCMeta


class Identity(metaclass=ABCMeta):

    @property
    def name(self):
        return self.__class__.__name__

    def __init__(self, user):
        self.user = user


class Tourist(Identity):

    def __init__(self):
        super(Tourist, self).__init__(None)


class Common(Identity):
    pass


class Personal(Identity):
    pass


class Super(Identity):
    pass
