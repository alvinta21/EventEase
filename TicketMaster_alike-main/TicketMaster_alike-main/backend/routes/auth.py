from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash

auth = Blueprint("auth", __name__)


@auth.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not username or not email or not password or not role:
        return jsonify({"error": "Missing required fields"}), 400

    if role not in ["user", "creator"]:
        return jsonify({"error": "Invalid role"}), 400

    hashed_password = generate_password_hash(password)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
            (username, email, hashed_password, role)
        )
        conn.commit()
    except Exception:
        conn.close()
        return jsonify({"error": "User already exists"}), 400

    conn.close()
    return jsonify({"message": "User registered successfully"}), 201


@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if user is None:
        return jsonify({"error": "User not found"}), 404

    stored_password = user[3]

    if not check_password_hash(stored_password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "role": user[4]
        }
    }), 200


@auth.route("/users", methods=["GET"])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, username, email, role FROM users")
    users = cursor.fetchall()
    conn.close()

    users_data = []
    for user in users:
        users_data.append({
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "role": user[3]
        })

    return jsonify({"users": users_data}), 200