import typing, json, game_utilites
import pusher, collections, re, os
import pandas as pd
import user_manager, tigerSqlite
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

class ReactionObj(typing.NamedTuple):
    name:str
    role:str
    reaction:str
    @property
    def role_text(self):
        return self.role.capitalize()

class Move:
    def __init__(self, _data:dict, _round:int, _users:dict) -> None:
        self.data, self.round, self.users = _data, _round, _users
    def __iter__(self):
        for i in self.data['moves']:
            yield ReactionObj(self.users[i['player']], i['role'], i['reaction'].capitalize())

    @property
    def running_score_police(self):
        return int(self.data['running_score']['police'])
    @property
    def running_score_protester(self):
        return int(self.data['running_score']['protesters'])

    @property
    def running_score_winner(self):
        return 'police' if self.running_score_police > self.running_score_protester else 'draw' if self.running_score_police == self.running_score_protester else 'protester'
    
    @property
    def running_winner_text(self):
        return f'{self.running_score_winner.capitalize()}{"s" if self.running_score_winner == "protester" else ""}'

class Game:
    """
    filename:game_reviews.db
    tablename:reviews
    columns:data text
    ------------------------
    """

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
    def can_add_reaction(cls, _payload:dict) -> dict:
        _data = json.load(open('game_data.json'))
        return {'can_add_reaction':len(_data['rounds']) < 3 and all(any(c['player'] == i['playerid'] for c in _data['board']) for i in _data['players']), 'scores':json.dumps(_data['score'])}

    @classmethod
    def log_message(cls, _payload:dict) -> dict:
        _data = json.load(open('game_data.json'))
        with open('game_data.json', 'w') as f:
            json.dump({**_data, f'{_payload["role"]}_chat':_data[f'{_payload["role"]}_chat']+[_payload['payload']]}, f)
        return {'success':'True'}

    @property
    def game_history(self):
        _user_convert = {int(i['playerid']):i['name'] for i in self.players}
        yield from [Move(a, i, _user_convert) for i, a in enumerate(self.rounds, 1)]

    @property
    def current_round(self):
        return len(self.rounds)+1
    
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
        print('payload in log_reaction', _payload)
        #{'role': 'protester', 'gameid': 1, 'player': 3, 'reaction': 'violent'}
        _data = json.load(open('game_data.json'))
        _user_convert = {int(i['playerid']):i['name'] for i in _data['players']}
        pusher_client.trigger('history', f'update-history{_payload["gameid"]}', {'html':f"<span class='reactor'>{_user_convert[int(_payload['player'])]}</span><span class='mini_badge badge_{_payload['role']}'>{_payload['role'].capitalize()}</span>   <span class='reacted_text'>reacted</span> <span class='reactor'>{_payload['reaction'].capitalize()}</span>"})
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

    @classmethod
    def post_review(cls, _payload:dict) -> None:
        tigerSqlite.Sqlite('game_reviews.db').insert('reviews', ('data', _payload))
        

class _class:
    def __init__(self, _data:dict) -> None:
        self.data = _data
    def __repr__(self) -> str:
        return json.dumps(self.data)
    def __getattr__(self, _attr:str) -> typing.Any:
        return self.data[_attr]

class All_classes:
    def __init__(self, _classes:typing.List[_class]) -> None:
        self.classes = _classes
    def __bool__(self) -> bool:
        return bool(self.classes)
    def __iter__(self):
        yield from self.classes    

class Classes:
    """
    filename:student_classes.db
    tablename:classes
    columns:id real, data text
    """
    @classmethod
    def csv_create_class(cls, _name:str, _filename:str, _maker:int) -> int:
        pass
    @classmethod
    def xlsx_create_class(cls, _name:str, _filename:str, _maker:int) -> int:
        _data = pd.read_excel(f'class_rosters/{_filename}')
        new_data = list(zip(list(_data['Student']), list(_data['E-mail Address'])))
        _new_rows = [{'name':' '.join(a.split(', ')[::-1]), 'email':b, 'role':False} for a, b in new_data]
        final_rows = [user_manager.User.add_user(i).__dict__ for i in _new_rows]
        _new_id = (lambda x:1 if not x else max(x)+1)([a for a, _ in tigerSqlite.Sqlite('student_classes.db').get_id_data('classes')])
        tigerSqlite.Sqlite('student_classes.db').insert('classes', ('id', _new_id), ('data', {'name':_name, 'owner':_maker, 'students':[{'classid':i, **a} for i, a in enumerate(final_rows, 1)]}))
        return _new_id
    @classmethod
    def create_class(cls, _name:str, _id:int, _maker:int) -> int:
        _file = [i for i in os.listdir('class_rosters') if i.startswith(f'class_roster{_id}')][0]
        return getattr(cls, f'{_file.split(".")[-1]}_create_class')(_name, _file, _maker)

    @classmethod
    def get_maker_classes(cls, _maker:id) -> typing.List[typing.Callable]:
        return All_classes([_class({'id':int(a), **b}) for a, b in tigerSqlite.Sqlite('student_classes.db').get_id_data('classes') if int(b['owner']) == _maker])
