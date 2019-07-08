import flask, random, string
import game_user, json, pusher
import game_manager

app = flask.Flask(__name__)
app.secret_key = ''.join(random.choice(string.ascii_letters) for _ in range(30))

pusher_client = pusher.Pusher(
  app_id='814342',
  key='f7e3f6c14176cdde1625',
  secret='5f4648c5a702b25bdb23',
  cluster='us2',
  ssl=True
)

def is_loggedin(f):
    def wrapper(*args, **kwargs):
        if all(b is None for _, b in flask.session.items()):
            return flask.redirect('/')
        return f(*args, **kwargs)
    return wrapper

@app.route('/', methods=['GET'])
def home():
    return flask.render_template('game_test.html')

@app.route('/signout')
def signout():
    for a, _ in flask.session.items():
        flask.session[a] = None
    return flask.redirect('/login')

@app.route('/login', methods=['GET'])
def login():
    return flask.render_template('login.html')

@app.route('/login_user')
def login_user():
    for a, b in game_user.TestUser.get_user_login(**json.loads(flask.request.args.get('payload'))).to_dict.items():
        flask.session[a] = b
    return flask.jsonify({'success':'True'})


@app.route('/game/<val>/<tuser>', methods=['GET'])
@is_loggedin
def game(val, tuser):
    _result = game_manager.Game.load_game(int(val), tuser)
    return '<h1>404</h1>' if isinstance(_result, dict) else flask.render_template('game_pannel1.html', game = _result)

@app.route('/log_message')
def log_message():
    return flask.jsonify({'success':game_manager.Game.log_message(json.loads(flask.request.args.get('payload')))})

@app.route('/get_message_history')
def get_message_history():
    return flask.jsonify({'html':flask.render_template('render_messages.html', messages = game_manager.Game.get_chat_history(json.loads(flask.request.args.get('payload'))))})

@app.route('/get_gametime')
def get_gametime():
    return flask.jsonify({'time':game_manager.Game.get_gametime(json.loads(flask.request.args.get('payload')))})

@app.route('/update_gametime')
def update_gametime():
    game_manager.Game.update_gametime(json.loads(flask.request.args.get('payload')))
    return flask.jsonify({'success':'True'})

@app.route('/get_scores')
def get_scores():
    return flask.jsonify({'scores':game_manager.Game.get_scores(json.loads(flask.request.args.get('payload')))})

@app.route("/pusher/auth", methods=['POST'])
def pusher_authentication():
    # pusher_client is obtained through pusher.Pusher( ... )
    auth = pusher_client.authenticate(
        channel=flask.request.form['channel_name'],
        socket_id=flask.request.form['socket_id']
    )
    return json.dumps(auth)

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r

if __name__ == '__main__':
    app.debug = True
    app.run()
