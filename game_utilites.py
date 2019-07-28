import typing, json, functools
import tigerSqlite

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

def validate_add_user(_f:typing.Callable) -> typing.Callable:
    @functools.wraps(_f)
    def wrapper(cls, _payload:dict) -> typing.Any:
        _formatted = tigerSqlite.Sqlite('protest_users.db').get_id_data('users')
        _option = [{'id':a, **b} for a, b in _formatted if all(b[j] == k for j, k in _payload.items())]
        return _f(cls, _formatted, _payload) if not _option else cls(_option[0])
    return wrapper


if __name__ == '__main__':
    d = json.load(open('game_data.json'))
    d['time'] = '0:00'
    d['board'] = []
    d['rounds'] = []
    d['round'] = []
    d['score'] =  {"police": 0, "protesters": 0}
    with open('game_data.json', 'w') as f:
        json.dump(d, f)
    
