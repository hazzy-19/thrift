import sqlite3
from datetime import datetime, timezone

from .config import get_settings


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(get_settings().database_path)
    connection.row_factory = sqlite3.Row
    return connection


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def initialize_database() -> None:
    database_path = get_settings().database_path
    database_path.parent.mkdir(parents=True, exist_ok=True)

    with _connect() as connection:
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(announcements)").fetchall()
        }
        has_legacy_announcement = bool(columns and "text" not in columns)
        if has_legacy_announcement:
            connection.execute("DROP TABLE IF EXISTS announcements_legacy")
            connection.execute("ALTER TABLE announcements RENAME TO announcements_legacy")

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL COLLATE NOCASE UNIQUE,
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                created_by INTEGER NOT NULL
            )
            """
        )
        if has_legacy_announcement:
            connection.execute(
                """
                INSERT OR IGNORE INTO announcements
                    (text, active, created_at, updated_at, created_by)
                SELECT message, 1, updated_at, updated_at, source_chat_id
                FROM announcements_legacy
                """
            )
            connection.execute("DROP TABLE announcements_legacy")


def create_announcement(text: str, created_by: int) -> dict[str, object]:
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Announcement cannot be empty.")
    if len(cleaned) > 160:
        raise ValueError("Announcement must be 160 characters or fewer.")

    now = _timestamp()
    try:
        with _connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO announcements (text, active, created_at, updated_at, created_by)
                VALUES (?, 1, ?, ?, ?)
                """,
                (cleaned, now, now, created_by),
            )
            announcement_id = cursor.lastrowid
    except sqlite3.IntegrityError as error:
        raise ValueError("That announcement already exists.") from error

    announcement = get_announcement(int(announcement_id))
    if announcement is None:
        raise RuntimeError("Announcement was not saved.")
    return announcement


def get_announcement(announcement_id: int) -> dict[str, object] | None:
    with _connect() as connection:
        row = connection.execute(
            """
            SELECT id, text, active, created_at, updated_at, created_by
            FROM announcements WHERE id = ?
            """,
            (announcement_id,),
        ).fetchone()
    return _serialize(row) if row else None


def list_announcements(active_only: bool = False) -> list[dict[str, object]]:
    query = """
        SELECT id, text, active, created_at, updated_at, created_by
        FROM announcements
    """
    if active_only:
        query += " WHERE active = 1"
    query += " ORDER BY created_at DESC, id DESC"

    with _connect() as connection:
        rows = connection.execute(query).fetchall()
    return [_serialize(row) for row in rows]


def delete_announcement(announcement_id: int) -> bool:
    with _connect() as connection:
        cursor = connection.execute("DELETE FROM announcements WHERE id = ?", (announcement_id,))
    return cursor.rowcount > 0


def set_announcement_active(announcement_id: int, active: bool) -> bool:
    with _connect() as connection:
        cursor = connection.execute(
            "UPDATE announcements SET active = ?, updated_at = ? WHERE id = ?",
            (int(active), _timestamp(), announcement_id),
        )
    return cursor.rowcount > 0


def clear_announcements() -> int:
    with _connect() as connection:
        cursor = connection.execute("DELETE FROM announcements")
    return cursor.rowcount


def _serialize(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "text": row["text"],
        "active": bool(row["active"]),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "createdBy": row["created_by"],
    }
