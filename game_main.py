import flask, random, string
import game_user, json, pusher

app = flask.Flask(__name__)
app.secret_key = ''.join(random.choice(string.ascii_letters) for _ in range(30))

pusher_client = pusher.Pusher(
  app_id='....',
  key='......',
  secret='..........',
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
    return flask.render_template('game_pannel.html', val = val, user = game_user.TestUser.get_user(flask.session['id']), tuser = tuser)

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
