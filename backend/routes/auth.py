from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash
import re

auth = Blueprint("auth", __name__)


def is_valid_name(value):
    return bool(re.fullmatch(r"[A-Za-z\s'-]+", value))


def is_valid_org_name(value):
    return bool(re.fullmatch(r"[A-Za-z0-9\s&'.,\-()]+", value))


@auth.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    title = data.get("title", "").strip()
    first_name = data.get("first_name", "").strip()
    middle_names = data.get("middle_names", "").strip()
    last_name = data.get("last_name", "").strip()
    organisation_name = data.get("organisation_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    role = data.get("role", "").strip()

    if not email or not password or not role:
        return jsonify({"error": "All required fields must be completed"}), 400

    if role not in ["user", "creator"]:
        return jsonify({"error": "Invalid role"}), 400

    if role == "user":
        if not title or not first_name or not last_name:
            return jsonify({"error": "All required fields must be completed"}), 400

        if title not in ["Mr", "Mrs", "Ms", "Miss", "Dr"]:
            return jsonify({"error": "Invalid title selected"}), 400

        if not is_valid_name(first_name):
            return jsonify({"error": "First name must only contain letters"}), 400

        if middle_names and not is_valid_name(middle_names):
            return jsonify({"error": "Middle names must only contain letters"}), 400

        if not is_valid_name(last_name):
            return jsonify({"error": "Last name must only contain letters"}), 400

        if len(first_name) > 50:
            return jsonify({"error": "First name is too long"}), 400

        if len(middle_names) > 100:
            return jsonify({"error": "Middle names are too long"}), 400

        if len(last_name) > 50:
            return jsonify({"error": "Last name is too long"}), 400

    if role == "creator":
        if not organisation_name:
            return jsonify({"error": "Organisation name is required"}), 400

        if not is_valid_org_name(organisation_name):
            return jsonify({"error": "Organisation name contains invalid characters"}), 400

        if len(organisation_name) > 100:
            return jsonify({"error": "Organisation name is too long"}), 400

    if len(email) > 254:
        return jsonify({"error": "Email is too long"}), 400

    if not re.fullmatch(r"^\S+@\S+\.\S+$", email):
        return jsonify({"error": "Invalid email format"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if len(password) > 128:
        return jsonify({"error": "Password is too long"}), 400

    if not re.search(r"[A-Z]", password):
        return jsonify({"error": "Password must contain at least one uppercase letter"}), 400

    if not re.search(r"[0-9]", password):
        return jsonify({"error": "Password must contain at least one number"}), 400

    if not re.search(r"[!@#$%^&*()_\-+=\[\]{};:'\",.<>?/\\|`~]", password):
        return jsonify({"error": "Password must contain at least one special character"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
    existing_user = cursor.fetchone()

    if existing_user:
        conn.close()
        return jsonify({"error": "Email is already registered"}), 400

    hashed_password = generate_password_hash(password)

    cursor.execute(
        """
        INSERT INTO users (
            title,
            first_name,
            middle_names,
            last_name,
            organisation_name,
            email,
            password,
            role
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            title if role == "user" else None,
            first_name if role == "user" else None,
            middle_names if role == "user" else None,
            last_name if role == "user" else None,
            organisation_name if role == "creator" else None,
            email,
            hashed_password,
            role
        )
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "User registered successfully"}), 201


@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if user is None:
        return jsonify({"error": "User not found"}), 404

    stored_password = user[7]

    if not check_password_hash(stored_password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user[0],
            "title": user[1],
            "first_name": user[2],
            "middle_names": user[3],
            "last_name": user[4],
            "organisation_name": user[5],
            "email": user[6],
            "role": user[8]
        }
    }), 200


@auth.route("/users", methods=["GET"])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, title, first_name, middle_names, last_name, organisation_name, email, role
        FROM users
    """)
    users = cursor.fetchall()
    conn.close()

    users_data = []
    for user in users:
        users_data.append({
            "id": user[0],
            "title": user[1],
            "first_name": user[2],
            "middle_names": user[3],
            "last_name": user[4],
            "organisation_name": user[5],
            "email": user[6],
            "role": user[7]
        })

    return jsonify({"users": users_data}), 200