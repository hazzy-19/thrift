from collections.abc import Generator
from functools import lru_cache

from sqlalchemy.orm import Session, sessionmaker

from app.database.session import create_session_factory, validate_database_schema


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return create_session_factory()


def validate_configured_database_schema() -> None:
    factory = get_session_factory()
    if factory.kw["bind"] is None:
        raise RuntimeError("Database session factory has no configured engine.")
    validate_database_schema(factory.kw["bind"])


def get_database() -> Generator[Session, None, None]:
    database = get_session_factory()()
    try:
        yield database
    except Exception:
        database.rollback()
        raise
    finally:
        database.close()
