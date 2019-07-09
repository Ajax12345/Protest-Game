import typing, json, game_utilites
import pusher, collections
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
        try:
            _data = json.load(open('game_data.json'))
            with open('game_data.json', 'w') as f:
                json.dump({**_data, 'time':_payload['time']}, f)
        except:
            pass

    @classmethod
    def get_gametime(cls, _payload:dict) -> str:
        return json.load(open('game_data.json'))['time']

    @classmethod
    def get_scores(cls, _payload:dict) -> str:
        return json.dumps(json.load(open('game_data.json'))['score'])

    @classmethod
    def add_player_position(cls, _payload:dict) -> dict:
        _data = json.load(open('game_data.json'))
        if any(int(i['player']) == int(_payload['player']) for i in _data['board']):
            return {'success':'NA'}
        if all(i['position'] != [_payload['position']['x'], _payload['position']['y']] for i in _data['board']):
            _new_payload = {'player':_payload['player'], 'role':_payload['role'], 'position':[_payload['position']['x'], _payload['position']['y']]}
            _updated_data = {**_data, 'board':_data['board']+[_new_payload]}
            with open('game_data.json', 'w') as f:
                json.dump(_updated_data, f)

            pusher_client.trigger('markers', f'update-markers{_payload["gameid"]}', {**_new_payload, 'candisplay':all(any(c['player'] == i['playerid'] for c in _updated_data['board']) for i in _updated_data['players'])})
            return {'success':'True', 'candisplay':all(any(c['player'] == i['playerid'] for c in _updated_data['board']) for i in _updated_data['players'])}
        return {'success':'False'}

    @classmethod
    def get_all_markers(cls, _payload:dict) -> typing.List[dict]:
        _data = json.load(open('game_data.json'))
        return _data['board']

    @classmethod
    def log_reaction(cls, _payload:dict) -> dict:
        _data = json.load(open('game_data.json'))
        new_data = {**_data, 'round':_data['round']+[_payload]}
        if all(any(int(i['player']) == int(c['playerid']) for i in new_data['round']) for c in new_data['players']):
            convert = {'violent':1, 'nonviolent':0}
            [[prot_score, _]], [[pol_score, _]] = collections.Counter([i['reaction'] for i in new_data['round'] if i['role'] == 'protester']).most_common(1), collections.Counter([i['reaction'] for i in new_data['round'] if i['role'] == 'police']).most_common(1)
            p1, p2 = {int(a):{int(c):d for c, d in b.items()} for a, b in json.load(open('payoff_matrix.json')).items()}[convert[prot_score]][convert[pol_score]]
            new_score = {'police':_data['score']['police']+p2, 'protesters':_data['score']['protesters']+p1}
            pusher_client.trigger('scores', f'update-scores{_payload["gameid"]}', {**new_score, 'keepgoing':len(new_data['rounds'])+1 < 3})
            final_data = {**_data, 'rounds':_data['rounds']+[{'moves':new_data['round'], 'matrix_score':{'police':p2, 'protesters':p1}, 'reactions':{'police':pol_score, 'protesters':prot_score}, 'running_score':new_score}], 'round':[], 'score':new_score}
            with open('game_data.json', 'w') as f:
                json.dump(final_data, f)
            return {'success':'True', **new_score, 'keepgoing':len(final_data['rounds']) < 3}
        with open('game_data.json', 'w') as f:
            json.dump(new_data, f)
        return {'success':'False'}
        
        
