"""
Clerk JWT verification for FastAPI.
Validates the session token from the frontend and extracts the user ID.
"""
import logging
import jwt
import httpx
from functools import lru_cache
from fastapi import Depends, HTTPException, Request

logger = logging.getLogger(__name__)

# Clerk JWKS endpoint — fetched once on first request
_jwks_client: jwt.PyJWKClient | None = None


def _get_jwks_client() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        from app.core.config import settings
        # Clerk's JWKS URL is derived from the frontend publishable key domain
        # or can use the standard Clerk API endpoint
        clerk_domain = settings.CLERK_ISSUER_URL
        jwks_url = f"{clerk_domain}/.well-known/jwks.json"
        _jwks_client = jwt.PyJWKClient(jwks_url)
    return _jwks_client


def _extract_token(request: Request) -> str | None:
    """Extract the Bearer token from the Authorization header or __session cookie."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]

    # Clerk also sends the token as a __session cookie
    return request.cookies.get("__session")


async def get_current_user_id(request: Request) -> str:
    """
    FastAPI dependency: verifies the Clerk JWT and returns the user's Clerk ID.
    Use as: user_id: str = Depends(get_current_user_id)
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        from app.core.config import settings
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Clerk doesn't always set audience
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: no user ID")
        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"JWT validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def optional_user_id(request: Request) -> str | None:
    """Optional auth — returns user ID if present, None otherwise."""
    try:
        return await get_current_user_id(request)
    except HTTPException:
        return None
