import typing, tigerSqlite, game_utilites

class User:
    """
    filename:protest_users.db
    tablename:users
    columns:id real, data text
    """
    def __init__(self, _data:dict) -> None:
        self.__dict__ = _data
    def __bool__(self) -> bool:
        return True
    @classmethod
    @game_utilites.validate_add_user
    def add_user(cls, _all_data:typing.List[dict], _payload:dict) -> typing.Callable:
        new_id = (lambda x:1 if not x else max(x)+1)([a for a, _ in _all_data])
        tigerSqlite.Sqlite('protest_users.db').insert('users', ('id', new_id), ('data', _payload))
        return cls({'id':new_id, **_payload})
    @classmethod
    def get_user(cls, role:int, **kwargs:dict) -> typing.Callable:
        _formatted = [{'id':a, **b} for a, b in tigerSqlite.Sqlite('protest_users.db').get_id_data('users') if int(b['role']) == int(role)]
        return (lambda x:False if not x else cls(x[0]))([i for i in _formatted if all(i[j] == k for j, k in kwargs.items())])
    
if __name__ == '__main__':
    _r = User.add_user({'name':'Joe Petullo', 'role':False, 'email':'josephpetullo65@@gmail.com'})
    print(_r)