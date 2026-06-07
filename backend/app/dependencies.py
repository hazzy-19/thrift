from collections.abc import Generator
from functools import lru_cache

from sqlalchemy.orm import Session, sessionmaker

from app.database.session import create_session_factory


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return create_session_factory()


def get_database() -> Generator[Session, None, None]:
    database = get_session_factory()()
    try:
        yield database
    finally:
        database.close()
