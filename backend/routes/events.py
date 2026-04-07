from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from decimal import Decimal, InvalidOperation

events = Blueprint("events", __name__)


def build_creator_name(title, first_name, middle_names, last_name, organisation_name):
    if organisation_name:
        return organisation_name

    parts = [title, first_name]
    if middle_names:
        parts.append(middle_names)
    parts.append(last_name)
    return " ".join(part for part in parts if part)


def parse_price(value):
    try:
        price = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None

    if price < 0:
        return None

    if price.as_tuple().exponent < -2:
        return None

    return float(price)


@events.route("/events", methods=["POST"])
def create_event():
    data = request.get_json()

    title = data.get("title")
    location = data.get("location")
    date = data.get("date")
    available_tickets = data.get("available_tickets")
    adult_price = data.get("adult_price")
    child_price = data.get("child_price")
    creator_id = data.get("creator_id")

    if (
        not title
        or not location
        or not date
        or available_tickets is None
        or adult_price is None
        or child_price is None
        or creator_id is None
    ):
        return jsonify({"error": "Missing required fields"}), 400

    total_tickets = int(available_tickets)
    adult_price = parse_price(adult_price)
    child_price = parse_price(child_price)

    if total_tickets < 1:
        return jsonify({"error": "Ticket count must be at least 1"}), 400

    if adult_price is None or child_price is None:
        return jsonify({"error": "Ticket prices must be valid amounts with up to 2 decimal places"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO events (
            title, location, date, available_tickets, adult_price, child_price, creator_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (title, location, date, total_tickets, adult_price, child_price, creator_id)
    )

    event_id = cursor.lastrowid

    for _ in range(total_tickets):
        cursor.execute(
            """
            INSERT INTO tickets (event_id, user_id, status, ticket_type, booking_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            (event_id, None, "available", None, None)
        )

    conn.commit()
    conn.close()

    return jsonify({"message": "Event created with tickets"}), 201


@events.route("/events", methods=["GET"])
def get_events():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            events.id,
            events.title,
            events.location,
            events.date,
            events.available_tickets,
            events.adult_price,
            events.child_price,
            events.creator_id,
            users.title,
            users.first_name,
            users.middle_names,
            users.last_name,
            users.organisation_name,
            (
                SELECT COUNT(*)
                FROM tickets
                WHERE tickets.event_id = events.id AND tickets.status = 'available'
            ) AS tickets_remaining
        FROM events
        JOIN users ON events.creator_id = users.id
        """
    )

    events_list = cursor.fetchall()
    conn.close()

    events_data = []
    for event in events_list:
        creator_name = build_creator_name(
            event[8], event[9], event[10], event[11], event[12]
        )

        tickets_remaining = event[13]

        events_data.append({
            "id": event[0],
            "title": event[1],
            "location": event[2],
            "date": event[3],
            "available_tickets": event[4],
            "adult_price": event[5],
            "child_price": event[6],
            "creator_id": event[7],
            "creator_name": creator_name,
            "tickets_remaining": tickets_remaining,
            "sold_out": tickets_remaining == 0
        })

    return jsonify({"events": events_data}), 200


@events.route("/users/<int:creator_id>/events", methods=["GET"])
def get_creator_events(creator_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            events.id,
            events.title,
            events.location,
            events.date,
            events.available_tickets,
            events.adult_price,
            events.child_price,
            events.creator_id,
            (
                SELECT COUNT(*)
                FROM tickets
                WHERE tickets.event_id = events.id AND tickets.status = 'available'
            ) AS tickets_remaining,
            COALESCE((
                SELECT SUM(bookings.total_cost)
                FROM bookings
                WHERE bookings.event_id = events.id
            ), 0) AS revenue_generated
        FROM events
        WHERE creator_id = ?
        """,
        (creator_id,)
    )
    events_list = cursor.fetchall()
    conn.close()

    events_data = []
    for event in events_list:
        tickets_remaining = event[8]
        sold_tickets = event[4] - tickets_remaining

        events_data.append({
            "id": event[0],
            "title": event[1],
            "location": event[2],
            "date": event[3],
            "available_tickets": event[4],
            "adult_price": event[5],
            "child_price": event[6],
            "creator_id": event[7],
            "tickets_remaining": tickets_remaining,
            "sold_tickets": sold_tickets,
            "revenue_generated": round(float(event[9]), 2)
        })

    return jsonify({"events": events_data}), 200


@events.route("/events/<int:event_id>", methods=["GET"])
def get_event_by_id(event_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            events.id,
            events.title,
            events.location,
            events.date,
            events.available_tickets,
            events.adult_price,
            events.child_price,
            events.creator_id,
            users.title,
            users.first_name,
            users.middle_names,
            users.last_name,
            users.organisation_name,
            (
                SELECT COUNT(*)
                FROM tickets
                WHERE tickets.event_id = events.id AND tickets.status = 'available'
            ) AS tickets_remaining
        FROM events
        JOIN users ON events.creator_id = users.id
        WHERE events.id = ?
        """,
        (event_id,)
    )

    event = cursor.fetchone()
    conn.close()

    if not event:
        return jsonify({"error": "Event not found"}), 404

    creator_name = build_creator_name(
        event[8], event[9], event[10], event[11], event[12]
    )

    tickets_remaining = event[13]

    return jsonify({
        "event": {
            "id": event[0],
            "title": event[1],
            "location": event[2],
            "date": event[3],
            "available_tickets": event[4],
            "adult_price": event[5],
            "child_price": event[6],
            "creator_id": event[7],
            "creator_name": creator_name,
            "tickets_remaining": tickets_remaining,
            "sold_out": tickets_remaining == 0
        }
    }), 200


@events.route("/events/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    data = request.get_json()

    title = data.get("title")
    location = data.get("location")
    date = data.get("date")
    available_tickets = data.get("available_tickets")
    adult_price = data.get("adult_price")
    child_price = data.get("child_price")
    creator_id = data.get("creator_id")

    if (
        not title
        or not location
        or not date
        or available_tickets is None
        or adult_price is None
        or child_price is None
        or creator_id is None
    ):
        return jsonify({"error": "Missing required fields"}), 400

    new_total = int(available_tickets)
    adult_price = parse_price(adult_price)
    child_price = parse_price(child_price)

    if new_total < 1:
        return jsonify({"error": "Ticket count must be at least 1"}), 400

    if adult_price is None or child_price is None:
        return jsonify({"error": "Ticket prices must be valid amounts with up to 2 decimal places"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT creator_id FROM events WHERE id = ?", (event_id,))
    event = cursor.fetchone()

    if not event:
        conn.close()
        return jsonify({"error": "Event not found"}), 404

    if event[0] != creator_id:
        conn.close()
        return jsonify({"error": "You can only edit your own events"}), 403

    cursor.execute("SELECT COUNT(*) FROM tickets WHERE event_id = ?", (event_id,))
    current_total = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM tickets WHERE event_id = ? AND status = 'confirmed'",
        (event_id,)
    )
    confirmed_count = cursor.fetchone()[0]

    if new_total < confirmed_count:
        conn.close()
        return jsonify({
            "error": f"Cannot reduce tickets below {confirmed_count} because some tickets are already booked"
        }), 400

    if new_total > current_total:
        extra_tickets = new_total - current_total

        for _ in range(extra_tickets):
            cursor.execute(
                """
                INSERT INTO tickets (event_id, user_id, status, ticket_type, booking_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                (event_id, None, "available", None, None)
            )

    elif new_total < current_total:
        tickets_to_remove = current_total - new_total

        cursor.execute(
            """
            SELECT id FROM tickets
            WHERE event_id = ? AND status = 'available'
            LIMIT ?
            """,
            (event_id, tickets_to_remove)
        )
        ticket_ids = cursor.fetchall()

        for ticket in ticket_ids:
            cursor.execute("DELETE FROM tickets WHERE id = ?", (ticket[0],))

    cursor.execute(
        """
        UPDATE events
        SET title = ?, location = ?, date = ?, available_tickets = ?, adult_price = ?, child_price = ?
        WHERE id = ?
        """,
        (title, location, date, new_total, adult_price, child_price, event_id)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Event updated successfully"}), 200


@events.route("/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    data = request.get_json()
    creator_id = data.get("creator_id") if data else None

    if creator_id is None:
        return jsonify({"error": "Missing creator_id"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT creator_id FROM events WHERE id = ?", (event_id,))
    event = cursor.fetchone()

    if not event:
        conn.close()
        return jsonify({"error": "Event not found"}), 404

    if event[0] != creator_id:
        conn.close()
        return jsonify({"error": "You can only delete your own events"}), 403

    cursor.execute("DELETE FROM tickets WHERE event_id = ?", (event_id,))
    cursor.execute("DELETE FROM bookings WHERE event_id = ?", (event_id,))
    cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Event deleted successfully"}), 200