import typing, json

def test_game_load(flag:bool = False) -> typing.Callable:
    def _inner(_f:typing.Callable) -> typing.Callable:
        def wrapper(cls, _data, _id:int, _user:str) -> typing.Any:
            return cls(_data, _user) if flag else _f(cls, _data, _id, _user)
        return wrapper
    return _inner


def validate_user(_f:typing.Callable) -> typing.Callable:
    def wrapper(cls, _id:int, _user:str) -> typing.Any:
        _data = json.load(open('game_data.json'))
        return {'success':'False'} if not any(i['name'] == _user for i in _data['players']) else _f(cls, _data, _id, _user)
    return wrapper