from functools import lru_cache
from pathlib import Path

import firebase_admin
from fastapi import Header, HTTPException, status
from firebase_admin import auth, credentials

from app.config import WORKSPACE_ROOT, get_app_settings


@lru_cache
def initialize_firebase_admin() -> firebase_admin.App:
    settings = get_app_settings()
    configured_path = settings.firebase_service_account_path
    options = {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None
    if configured_path:
        path = Path(configured_path)
        if not path.is_absolute():
            path = WORKSPACE_ROOT / path
        return firebase_admin.initialize_app(credentials.Certificate(path), options)
    return firebase_admin.initialize_app(options=options)


def get_authenticated_user_id(authorization: str = Header(default="")) -> str:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    try:
        initialize_firebase_admin()
        decoded = auth.verify_id_token(token)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token",
        ) from error
    return str(decoded["uid"])
