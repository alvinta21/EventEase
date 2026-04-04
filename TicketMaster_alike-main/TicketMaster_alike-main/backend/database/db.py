import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "database.db"


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    return conn


def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'creator'))
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            location TEXT NOT NULL,
            date TEXT NOT NULL,
            available_tickets INTEGER NOT NULL,
            creator_id INTEGER NOT NULL,
            FOREIGN KEY(creator_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            user_id INTEGER,
            status TEXT NOT NULL DEFAULT 'available',
            FOREIGN KEY(event_id) REFERENCES events(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()