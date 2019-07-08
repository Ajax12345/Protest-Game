import typing, json, game_utilites

class _message:
    def __init__(self, _data:dict) -> None:
        self.__dict__ = _data

class Game:
    def __init__(self, _payload:dict, _user:str) -> None:
        self.__dict__ = {**_payload, 'loggedin':_user}
        self.game_role = [i for i in self.players if i['name'] == self.loggedin][0]
    @property
    def role(self):
        return self.game_role['role']
    @property
    def display_role(self):
        return self.role.capitalize()
    @property
    def player_id(self):
        return self.game_role['playerid']

    @property
    def is_instructor(self):
        return self.role == 'instructor'

    @property
    def chat_role(self):
        return 'Protesters' if self.role == 'protester' else 'Police'
    @property
    def chat_role_data(self):
        return self.chat_role.lower()


    @classmethod
    @game_utilites.validate_user
    @game_utilites.test_game_load(flag=True)
    def load_game(cls, _data:dict, _id:int, _user:str) -> typing.Callable:
        pass

    @classmethod
    def get_chat_history(cls, _payload:dict) -> typing.List[typing.NamedTuple]:
        return list(map(_message, json.load(open('game_data.json'))[f'{_payload["role"]}_chat']))

    @classmethod
    def log_message(cls, _payload:dict) -> dict:
        _data = json.load(open('game_data.json'))
        with open('game_data.json', 'w') as f:
            json.dump({**_data, f'{_payload["role"]}_chat':_data[f'{_payload["role"]}_chat']+[_payload['payload']]}, f)
        return {'success':'True'}
    
    @classmethod
    def update_gametime(cls, _payload:dict) -> None:
        _data = json.load(open('game_data.json'))
        with open('game_data.json', 'w') as f:
            json.dump({**_data, 'time':_payload['time']}, f)
    
    @classmethod
    def get_gametime(cls, _payload:dict) -> str:
        return json.load(open('game_data.json'))['time']

    @classmethod
    def get_scores(cls, _payload:dict) -> str:
        return json.dumps(json.load(open('game_data.json'))['score'])