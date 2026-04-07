from flask import Blueprint, request, jsonify
from database.db import get_db_connection

tickets = Blueprint("tickets", __name__)


def build_full_name(title, first_name, middle_names, last_name, organisation_name):
    if organisation_name:
        return organisation_name

    parts = [title, first_name]
    if middle_names:
        parts.append(middle_names)
    parts.append(last_name)
    return " ".join(part for part in parts if part)


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
            "status": t[3],
            "ticket_type": t[4],
            "booking_id": t[5]
        })

    return jsonify(ticket_data)


@tickets.route("/events/<int:event_id>/confirm-booking", methods=["POST"])
def confirm_booking(event_id):
    data = request.get_json()

    user_id = data.get("user_id")
    adult_quantity = data.get("adult_quantity", 0)
    child_quantity = data.get("child_quantity", 0)
    card_name = data.get("card_name", "").strip()
    card_number = data.get("card_number", "").replace(" ", "")
    expiry = data.get("expiry", "").strip()
    cvv = data.get("cvv", "").strip()

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        adult_quantity = int(adult_quantity)
        child_quantity = int(child_quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "Ticket quantities must be valid numbers"}), 400

    if adult_quantity < 0 or child_quantity < 0:
        return jsonify({"error": "Ticket quantities cannot be negative"}), 400

    total_quantity = adult_quantity + child_quantity

    if total_quantity < 1:
        return jsonify({"error": "Select at least 1 ticket"}), 400

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
        """
        SELECT adult_price, child_price
        FROM events
        WHERE id = ?
        """,
        (event_id,)
    )
    event_prices = cursor.fetchone()

    if not event_prices:
        conn.close()
        return jsonify({"error": "Event not found"}), 404

    adult_price = float(event_prices[0])
    child_price = float(event_prices[1])

    cursor.execute(
        "SELECT id FROM tickets WHERE event_id = ? AND status = 'available' LIMIT ?",
        (event_id, total_quantity)
    )
    available_tickets = cursor.fetchall()

    if len(available_tickets) < total_quantity:
        conn.close()
        return jsonify({"error": "Not enough tickets available"}), 400

    total_cost = (adult_quantity * adult_price) + (child_quantity * child_price)

    cursor.execute(
        """
        INSERT INTO bookings (event_id, user_id, adult_quantity, child_quantity, total_cost)
        VALUES (?, ?, ?, ?, ?)
        """,
        (event_id, user_id, adult_quantity, child_quantity, total_cost)
    )
    booking_id = cursor.lastrowid

    ticket_ids = [ticket[0] for ticket in available_tickets]

    adult_ticket_ids = ticket_ids[:adult_quantity]
    child_ticket_ids = ticket_ids[adult_quantity:]

    for ticket_id in adult_ticket_ids:
        cursor.execute(
            """
            UPDATE tickets
            SET status = 'confirmed', user_id = ?, ticket_type = ?, booking_id = ?
            WHERE id = ?
            """,
            (user_id, "adult", booking_id, ticket_id)
        )

    for ticket_id in child_ticket_ids:
        cursor.execute(
            """
            UPDATE tickets
            SET status = 'confirmed', user_id = ?, ticket_type = ?, booking_id = ?
            WHERE id = ?
            """,
            (user_id, "child", booking_id, ticket_id)
        )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Booking confirmed successfully",
        "booking_reference": f"EE-BKG-{booking_id:05d}",
        "adult_quantity": adult_quantity,
        "child_quantity": child_quantity,
        "total_tickets": total_quantity,
        "total_cost": round(total_cost, 2)
    }), 200


@tickets.route("/users/<int:user_id>/tickets", methods=["GET"])
def get_user_tickets(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            bookings.id,
            bookings.event_id,
            bookings.user_id,
            bookings.adult_quantity,
            bookings.child_quantity,
            bookings.total_cost,
            bookings.created_at,
            users.title,
            users.first_name,
            users.middle_names,
            users.last_name,
            users.organisation_name,
            events.title,
            events.date,
            events.location
        FROM bookings
        JOIN users ON bookings.user_id = users.id
        JOIN events ON bookings.event_id = events.id
        WHERE bookings.user_id = ?
        ORDER BY bookings.id DESC
        """,
        (user_id,)
    )

    bookings_list = cursor.fetchall()
    conn.close()

    booking_data = []
    for b in bookings_list:
        full_name = build_full_name(b[7], b[8], b[9], b[10], b[11])

        booking_data.append({
            "booking_id": b[0],
            "event_id": b[1],
            "user_id": b[2],
            "adult_quantity": b[3],
            "child_quantity": b[4],
            "total_tickets": b[3] + b[4],
            "total_cost": round(float(b[5]), 2),
            "created_at": b[6],
            "full_name": full_name,
            "event_title": b[12],
            "event_date": b[13],
            "event_location": b[14],
            "booking_reference": f"EE-BKG-{b[0]:05d}"
        })

    return jsonify(booking_data), 200