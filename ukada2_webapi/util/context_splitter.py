class ContextSplitterStatus:
    NotStarted = 1
    Started = 2
    Ended = 3


class ContextSplitter:

    def __init__(self, context):
        self.status = ContextSplitterStatus.NotStarted
        self.context = context

    def start(self):
        self.status = ContextSplitterStatus.Started
        return self.context.__enter__()

    def end(self, exc):
        if exc is None:
            exc_type = None
        else:
            exc_type = type(exc)
        r = self.context.__exit__(exc_type, exc, None)
        self.status = ContextSplitterStatus.Ended
        return r

    def is_started(self)->bool:
        return self.status >= ContextSplitterStatus.Started

    def is_ended(self)->bool:
        return self.status == ContextSplitterStatus.Ended
