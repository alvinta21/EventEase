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


@tickets.route("/events/<int:event_id>/confirm-booking", methods=["POST"])
def confirm_booking(event_id):
    data = request.get_json()

    user_id = data.get("user_id")
    quantity = data.get("quantity")
    card_name = data.get("card_name", "").strip()
    card_number = data.get("card_number", "").replace(" ", "")
    expiry = data.get("expiry", "").strip()
    cvv = data.get("cvv", "").strip()

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    if quantity is None:
        return jsonify({"error": "Missing quantity"}), 400

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "Quantity must be a valid number"}), 400

    if quantity < 1:
        return jsonify({"error": "Quantity must be at least 1"}), 400

    if not card_name or not card_number or not expiry or not cvv:
        return jsonify({"error": "All checkout fields are required"}), 400

    if len(card_name) < 2:
        return jsonify({"error": "Invalid card name"}), 400

    if not card_number.isdigit() or len(card_number) != 16:
        return jsonify({"error": "Card number must be exactly 16 digits"}), 400

    if len(cvv) != 3 or not cvv.isdigit():
        return jsonify({"error": "CVV must be exactly 3 digits"}), 400

    if len(expiry) != 5 or expiry[2] != "/":
        return jsonify({"error": "Expiry date must be in MM/YY format"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if user[0] != "user":
        conn.close()
        return jsonify({"error": "Only ticket buyers can confirm bookings"}), 403

    cursor.execute(
        "SELECT id FROM tickets WHERE event_id = ? AND status = 'available' LIMIT ?",
        (event_id, quantity)
    )
    available_tickets = cursor.fetchall()

    if len(available_tickets) < quantity:
        conn.close()
        return jsonify({"error": "Not enough tickets available"}), 400

    booked_ticket_ids = []

    for ticket in available_tickets:
        ticket_id = ticket[0]
        cursor.execute(
            "UPDATE tickets SET status = 'confirmed', user_id = ? WHERE id = ?",
            (user_id, ticket_id)
        )
        booked_ticket_ids.append(ticket_id)

    conn.commit()
    conn.close()

    ticket_references = [f"EE-TKT-{ticket_id:05d}" for ticket_id in booked_ticket_ids]

    return jsonify({
        "message": "Booking confirmed successfully",
        "quantity_confirmed": quantity,
        "ticket_references": ticket_references
    }), 200


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