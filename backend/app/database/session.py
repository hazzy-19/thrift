from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_app_settings


REQUIRED_TABLES = frozenset({"alembic_version", "carts", "cart_items", "items", "item_reviews"})


def create_session_factory(database_url: str | None = None) -> sessionmaker[Session]:
    url = database_url or get_app_settings().database_url
    if not url:
        raise RuntimeError("DATABASE_URL is required before using PostgreSQL.")

    engine = create_engine(url, pool_pre_ping=True)
    return sessionmaker(bind=engine, expire_on_commit=False)


def validate_database_schema(engine: Engine) -> None:
    """Fail fast when the configured database has not received required migrations."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    missing_tables = sorted(REQUIRED_TABLES - existing_tables)
    if missing_tables:
        missing = ", ".join(missing_tables)
        raise RuntimeError(
            f"Database schema is not migrated; missing tables: {missing}. "
            "Run `python -m alembic upgrade head` from the backend directory."
        )
