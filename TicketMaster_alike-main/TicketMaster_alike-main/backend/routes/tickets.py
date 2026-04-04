from flask import Blueprint, request, jsonify
from database.db import get_db_connection

tickets = Blueprint("tickets", __name__)


@tickets.route("/events/<int:event_id>/tickets", methods=["GET"])
def get_event_tickets(event_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE event_id = ?", (event_id,))
    tickets_list = cursor.fetchall()
    conn.close()

    ticket_data = []
    for t in tickets_list:
        ticket_data.append({
            "id": t[0],
            "event_id": t[1],
            "user_id": t[2],
            "status": t[3]
        })

    return jsonify(ticket_data)


@tickets.route("/tickets/<int:ticket_id>/reserve", methods=["POST"])
def reserve_ticket(ticket_id):
    user_id = request.json.get("user_id")

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check user exists and is a ticket buyer
    cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if user[0] != "user":
        conn.close()
        return jsonify({"error": "Only ticket buyers can reserve tickets"}), 403

    # Check if ticket exists and is available
    cursor.execute("SELECT status FROM tickets WHERE id = ?", (ticket_id,))
    ticket = cursor.fetchone()

    if not ticket:
        conn.close()
        return jsonify({"error": "Ticket not found"}), 404

    if ticket[0] != "available":
        conn.close()
        return jsonify({"error": "Ticket not available"}), 400

    # Reserve ticket
    cursor.execute(
        "UPDATE tickets SET status = 'reserved', user_id = ? WHERE id = ?",
        (user_id, ticket_id)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Ticket reserved"}), 200


@tickets.route("/users/<int:user_id>/tickets", methods=["GET"])
def get_user_tickets(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            tickets.id,
            tickets.event_id,
            tickets.user_id,
            tickets.status,
            users.username,
            events.title,
            events.date,
            events.location
        FROM tickets
        JOIN users ON tickets.user_id = users.id
        JOIN events ON tickets.event_id = events.id
        WHERE tickets.user_id = ?
        """,
        (user_id,)
    )

    tickets_list = cursor.fetchall()
    conn.close()

    ticket_data = []
    for t in tickets_list:
        ticket_data.append({
            "id": t[0],
            "event_id": t[1],
            "user_id": t[2],
            "status": t[3],
            "username": t[4],
            "event_title": t[5],
            "event_date": t[6],
            "event_location": t[7],
            "ticket_reference": f"EE-TKT-{t[0]:05d}"
        })

    return jsonify(ticket_data), 200