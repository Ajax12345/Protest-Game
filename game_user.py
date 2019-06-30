import json, typing

class TestUser:
    def __init__(self, _payload:dict) -> None:
        self.__dict__ = _payload
    @classmethod
    def get_user_login(cls, **kwargs:dict) -> typing.Callable:
        return cls([{'id':a, **b} for a, b in json.load(open('creds.json')).items() if all(b.get(c) == d for c, d in kwargs.items())][0])
    @classmethod
    def get_user(cls, _id:int) -> typing.Callable:
        return cls({'id':_id, **json.load(open('creds.json'))[_id]})
    @property
    def to_dict(self) -> dict:
        return self.__dict__
    