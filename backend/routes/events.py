from flask import Blueprint, request, jsonify
from database.db import get_db_connection

events = Blueprint("events", __name__)


@events.route("/events", methods=["POST"])
def create_event():
    data = request.get_json()

    title = data.get("title")
    location = data.get("location")
    date = data.get("date")
    available_tickets = data.get("available_tickets")
    creator_id = data.get("creator_id")

    if (
        not title
        or not location
        or not date
        or available_tickets is None
        or creator_id is None
    ):
        return jsonify({"error": "Missing required fields"}), 400

    total_tickets = int(available_tickets)

    if total_tickets < 1:
        return jsonify({"error": "Ticket count must be at least 1"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO events (title, location, date, available_tickets, creator_id)
        VALUES (?, ?, ?, ?, ?)
        """,
        (title, location, date, total_tickets, creator_id)
    )

    event_id = cursor.lastrowid

    for _ in range(total_tickets):
        cursor.execute(
            "INSERT INTO tickets (event_id, user_id, status) VALUES (?, ?, ?)",
            (event_id, None, "available")
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
            events.creator_id,
            users.username
        FROM events
        JOIN users ON events.creator_id = users.id
        """
    )

    events_list = cursor.fetchall()
    conn.close()

    events_data = []
    for event in events_list:
        events_data.append({
            "id": event[0],
            "title": event[1],
            "location": event[2],
            "date": event[3],
            "available_tickets": event[4],
            "creator_id": event[5],
            "creator_name": event[6]
        })

    return jsonify({"events": events_data}), 200


@events.route("/users/<int:creator_id>/events", methods=["GET"])
def get_creator_events(creator_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM events WHERE creator_id = ?", (creator_id,))
    events_list = cursor.fetchall()

    conn.close()

    return jsonify({"events": events_list}), 200


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
            events.creator_id,
            users.username
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

    return jsonify({
        "event": {
            "id": event[0],
            "title": event[1],
            "location": event[2],
            "date": event[3],
            "available_tickets": event[4],
            "creator_id": event[5],
            "creator_name": event[6]
        }
    }), 200


@events.route("/events/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    data = request.get_json()

    title = data.get("title")
    location = data.get("location")
    date = data.get("date")
    available_tickets = data.get("available_tickets")
    creator_id = data.get("creator_id")

    if (
        not title
        or not location
        or not date
        or available_tickets is None
        or creator_id is None
    ):
        return jsonify({"error": "Missing required fields"}), 400

    new_total = int(available_tickets)

    if new_total < 1:
        return jsonify({"error": "Ticket count must be at least 1"}), 400

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
        "SELECT COUNT(*) FROM tickets WHERE event_id = ? AND status = 'reserved'",
        (event_id,)
    )
    reserved_count = cursor.fetchone()[0]

    if new_total < reserved_count:
        conn.close()
        return jsonify({
            "error": f"Cannot reduce tickets below {reserved_count} because some tickets are already reserved"
        }), 400

    if new_total > current_total:
        extra_tickets = new_total - current_total

        for _ in range(extra_tickets):
            cursor.execute(
                "INSERT INTO tickets (event_id, user_id, status) VALUES (?, ?, ?)",
                (event_id, None, "available")
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
        SET title = ?, location = ?, date = ?, available_tickets = ?
        WHERE id = ?
        """,
        (title, location, date, new_total, event_id)
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
    cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Event deleted successfully"}), 200