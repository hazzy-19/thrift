import sqlite3
from datetime import datetime, timezone

from .config import get_settings


def initialize_database() -> None:
    database_path = get_settings().database_path
    database_path.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(database_path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                message TEXT NOT NULL,
                source_chat_id INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )


def get_current_announcement() -> dict[str, str] | None:
    with sqlite3.connect(get_settings().database_path) as connection:
        row = connection.execute(
            "SELECT message, updated_at FROM announcements WHERE id = 1"
        ).fetchone()

    if row is None:
        return None

    return {"message": row[0], "updated_at": row[1]}


def save_announcement(message: str, source_chat_id: int) -> dict[str, str]:
    updated_at = datetime.now(timezone.utc).isoformat()

    with sqlite3.connect(get_settings().database_path) as connection:
        connection.execute(
            """
            INSERT INTO announcements (id, message, source_chat_id, updated_at)
            VALUES (1, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                message = excluded.message,
                source_chat_id = excluded.source_chat_id,
                updated_at = excluded.updated_at
            """,
            (message, source_chat_id, updated_at),
        )

    return {"message": message, "updated_at": updated_at}


def clear_announcement() -> None:
    with sqlite3.connect(get_settings().database_path) as connection:
        connection.execute("DELETE FROM announcements WHERE id = 1")
