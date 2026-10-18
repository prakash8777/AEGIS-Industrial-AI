
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

# Store the database beside this Python file.
DATABASE_PATH = Path(__file__).resolve().parent / "aegis.db"


def get_connection():
    """Open a SQLite connection with named-column access."""
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    """Create the tables needed to persist AEGIS incidents."""
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                status TEXT NOT NULL,
                severity TEXT NOT NULL,
                machine TEXT NOT NULL,
                batch_id TEXT NOT NULL,
                incident_data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS audit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                event TEXT NOT NULL,
                details TEXT NOT NULL,
                FOREIGN KEY (incident_id)
                    REFERENCES incidents(id)
            )
        """)


def save_incident(incident: dict):
    """Insert or update an incident without deleting existing data."""
    now = datetime.now(timezone.utc).isoformat()
    incident_data = json.dumps(incident)

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO incidents (
                id, title, status, severity, machine, batch_id,
                incident_data, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                status = excluded.status,
                severity = excluded.severity,
                machine = excluded.machine,
                batch_id = excluded.batch_id,
                incident_data = excluded.incident_data,
                updated_at = excluded.updated_at
            """,
            (
                incident["id"],
                incident["title"],
                incident["status"],
                incident["severity"],
                incident["machine"],
                incident["batch_id"],
                incident_data,
                now,
                now,
            ),
        )


def load_incident(incident_id: str) -> dict | None:
    """Load an incident from SQLite, or return None if not found."""
    with get_connection() as connection:
        row = connection.execute(
            "SELECT incident_data FROM incidents WHERE id = ?",
            (incident_id,),
        ).fetchone()

    if row is None:
        return None

    return json.loads(row["incident_data"])


if __name__ == "__main__":
    initialize_database()
    print(f"AEGIS database initialized: {DATABASE_PATH}")
