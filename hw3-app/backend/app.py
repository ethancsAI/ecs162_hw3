from flask import Flask, jsonify, send_from_directory, redirect, url_for, session
import os
from flask_cors import CORS
from pymongo import MongoClient
from authlib.integrations.flask_client import OAuth
from authlib.common.security import generate_token
from bson import ObjectId

static_path = os.getenv('STATIC_PATH','static')
template_path = os.getenv('TEMPLATE_PATH','templates')
# Mongo connection
mongo_uri = os.getenv("MONGO_URI")
mongo = MongoClient(mongo_uri)
db = mongo.get_default_database()


app = Flask(__name__, static_folder=static_path, template_folder=template_path)
app.secret_key = os.urandom(24)
oauth = OAuth(app)
nonce = generate_token()

CORS(app)

@app.route('/api/key')
def get_key():
    return jsonify({'apiKey': os.getenv('NYT_API_KEY')})

oauth.register(
    name=os.getenv('OIDC_CLIENT_NAME'),
    client_id=os.getenv('OIDC_CLIENT_ID'),
    client_secret=os.getenv('OIDC_CLIENT_SECRET'),
    #server_metadata_url='http://dex:5556/.well-known/openid-configuration',
    authorization_endpoint="http://localhost:5556/auth",
    token_endpoint="http://dex:5556/token",
    jwks_uri="http://dex:5556/keys",
    userinfo_endpoint="http://dex:5556/userinfo",
    device_authorization_endpoint="http://dex:5556/device/code",
    client_kwargs={'scope': 'openid email profile'}
)

@app.route('/')
@app.route('/<path:path>')
def serve_frontend(path=''):
    if path != '' and os.path.exists(os.path.join(static_path,path)):
        return send_from_directory(static_path, path)
    return send_from_directory(template_path, 'index.html')

@app.route("/test-mongo")
def test_mongo():
    return jsonify({"collections": db.list_collection_names()})

@app.route('/')
def home():
    user = session.get('user')
    if user:
        return f"<h2>Logged in as {user['email']}</h2><a href='/logout'>Logout</a>"
    return '<a href="/login">Login with Dex</a>'

@app.route('/login')
def login():
    session['nonce'] = nonce
    redirect_uri = 'http://localhost:8000/authorize'
    #return oauth.flask_app.authorize_redirect(redirect_uri, nonce=nonce)
    client = oauth.create_client(os.getenv("OIDC_CLIENT_NAME"))
    return client.authorize_redirect(redirect_uri, nonce=nonce)


@app.route('/authorize')
def authorize():
    #token = oauth.flask_app.authorize_access_token()
    #nonce = session.get('nonce')

    #user_info = oauth.flask_app.parse_id_token(token, nonce=nonce)  # or use .get('userinfo').json()
    #session['user'] = user_info
    #return redirect('/')
    client = oauth.create_client(os.getenv("OIDC_CLIENT_NAME"))
    token = client.authorize_access_token()
    nonce = session.get('nonce')
    user_info = client.parse_id_token(token, nonce=nonce)
    session['user'] = user_info
    return redirect('/')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

@app.route('/me')
def get_current_user():
    user = session.get('user')
    if user:
        return jsonify({"email": user["email"]})
    return jsonify({"email": None}), 401

from datetime import datetime
from flask import request

@app.route('/api/comments', methods=['POST'])
def add_comment():
    user = session.get('user')
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    comment = {
        "articleTitle": data.get("articleTitle"),
        "user": user['email'],
        "content": data.get("content"),
        "createdAt": datetime.utcnow(),
        "deleted": False,
        "redacted": False,
    }
    db.comments.insert_one(comment)
    return jsonify({"message": "Comment added"}), 201

@app.route('/api/comments/<article_title>', methods=['GET'])
def get_comments(article_title):
    comments = db.comments.find({"articleTitle": article_title})
    results = []
    for comment in comments:
        if comment.get("deleted"):
            text = "COMMENT REMOVED BY MODERATOR"
        elif comment.get("redacted"):
            text = "█" * len(comment["content"])
        else:
            text = comment["content"]
        results.append({
            "user": comment["user"],
            "content": text
        })
    return jsonify(results)

@app.route('/api/comments/<article_title>/<user_email>', methods=['DELETE'])
def delete_comment(article_title, user_email):
    user = session.get('user')
    if not user or user['username'] not in ['admin', 'moderator']:
        return jsonify({"error": "Forbidden"}), 403

    db.comments.update_one(
        {"articleTitle": article_title, "user": user_email},
        {"$set": {"deleted": True}}
    )
    return jsonify({"message": "Comment deleted"})

@app.route('/api/comments/<article_title>/<user_email>', methods=['PATCH'])
def redact_comment(article_title, user_email):
    user = session.get('user')
    #if not user or user['email'] not in ['admin@hw3.com', 'moderator@hw3.com']:
    if not user or user['username'] not in ['admin', 'moderator']:
        return jsonify({"error": "Forbidden"}), 403

    db.comments.update_one(
        {"articleTitle": article_title, "user": user_email},
        {"$set": {"redacted": True}}
    )
    return jsonify({"message": "Comment redacted"})

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8000)),debug=debug_mode)