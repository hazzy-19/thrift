from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_app_settings


def create_session_factory(database_url: str | None = None) -> sessionmaker[Session]:
    url = database_url or get_app_settings().database_url
    if not url:
        raise RuntimeError("DATABASE_URL is required before using PostgreSQL.")

    engine = create_engine(url, pool_pre_ping=True)
    return sessionmaker(bind=engine, expire_on_commit=False)
