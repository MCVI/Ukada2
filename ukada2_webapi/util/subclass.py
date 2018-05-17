def subclass_of(aclass:type):
    def _subclass_of(c:type,visited:list):
        for sub in c.__subclasses__():
            if(sub not in visited):
                visited.append(sub);
                yield sub;
                yield from _subclass_of(sub,visited);
    yield from _subclass_of(aclass, []);
