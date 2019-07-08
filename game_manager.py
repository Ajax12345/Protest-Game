import typing, json, game_utilites
import pusher
pusher_client = pusher.Pusher(
  app_id='814342',
  key='f7e3f6c14176cdde1625',
  secret='5f4648c5a702b25bdb23',
  cluster='us2',
  ssl=True
)

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

    @classmethod
    def add_player_position(cls, _payload:dict) -> dict:
        print(_payload)
        _data = json.load(open('game_data.json'))
        if all(i['position'] != [_payload['position']['x'], _payload['position']['y']] for i in _data['board']):
            _new_payload = {'player':_payload['player'], 'role':_payload['role'], 'position':[_payload['position']['x'], _payload['position']['y']]}
            with open('game_data.json', 'w') as f:
                json.dump({**_data, 'board':_data['board']+[_new_payload]}, f)
            print(f'update-markers{_payload["gameid"]}')
            pusher_client.trigger('markers', f'update-markers{_payload["gameid"]}', _new_payload)
            return {'success':'True'}
        return {'success':'False'}

    @classmethod
    def get_all_markers(cls, _payload:dict) -> typing.List[dict]:
        _data = json.load(open('game_data.json'))
        return _data['board']
