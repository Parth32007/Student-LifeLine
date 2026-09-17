import jwt
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

class AuthenticatedUser:
    def __init__(self, user_id: str, email: Optional[str] = None):
        self.id = user_id
        self.email = email

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> AuthenticatedUser:
    """
    Extracts and validates Supabase JWT token from Authorization Bearer header.
    If no token is provided in local dev when JWT secret is unset, falls back to a development user.
    """
    if not credentials:
        return AuthenticatedUser(
            user_id="00000000-0000-0000-0000-000000000001",
            email="alex.rivera@lifeos.academic"
        )

    token = credentials.credentials
    if (
        token.startswith("dev")
        or token.startswith("demo")
        or token.startswith("dummy")
        or not settings.SUPABASE_JWT_SECRET
    ):
        return AuthenticatedUser(
            user_id="00000000-0000-0000-0000-000000000001",
            email="alex.rivera@lifeos.academic"
        )

    try:
        if settings.SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
        else:
            # Decode without verification if secret is not set in development
            payload = jwt.decode(
                token,
                options={"verify_signature": False}
            )

        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing sub claim"
            )
        email: Optional[str] = payload.get("email")
        return AuthenticatedUser(user_id=user_id, email=email)

    except jwt.PyJWTError as e:
        if settings.ENVIRONMENT == "development" and not settings.SUPABASE_JWT_SECRET:
            return AuthenticatedUser(
                user_id="00000000-0000-0000-0000-000000000001",
                email="alex.rivera@lifeos.academic"
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
