from flask import Flask
from flask_cors import CORS
from routes.auth import auth
from routes.events import events
from routes.tickets import tickets
from database.db import create_tables

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

create_tables()

app.register_blueprint(auth)
app.register_blueprint(events)
app.register_blueprint(tickets)

@app.route("/")
def home():
    return "Flask is working"

if __name__ == "__main__":
    app.run(debug=True)