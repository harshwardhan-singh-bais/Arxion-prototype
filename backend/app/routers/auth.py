"""
Platform & App Layer — Component H
JWT Authentication, Dashboard Analytics, Pagination helpers.

NOTE: Auth uses python-jose for JWT. Install: pip install python-jose[cryptography] passlib[bcrypt]
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib
import os

router = APIRouter()
security = HTTPBearer(auto_error=False)

# ── Simple in-memory user store (swap for DB in production) ──────────────────
_users: dict[str, dict] = {}

# ── JWT config ────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get("JWT_SECRET", "arxion-dev-secret-change-in-production")
ALGORITHM  = "HS256"
TOKEN_TTL  = timedelta(hours=24)


def _hash_password(password: str) -> str:
    return hashlib.sha256(f"{password}{SECRET_KEY}".encode()).hexdigest()


def _create_token(email: str) -> str:
    try:
        from jose import jwt
        payload = {
            "sub": email,
            "exp": datetime.now(timezone.utc) + TOKEN_TTL,
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    except ImportError:
        # Fallback if python-jose not installed yet
        import base64, json
        payload = {"sub": email, "exp": (datetime.now(timezone.utc) + TOKEN_TTL).isoformat()}
        return base64.b64encode(json.dumps(payload).encode()).decode()


def _verify_token(token: str) -> Optional[str]:
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None


# ── Auth dependency ───────────────────────────────────────────────────────────

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    email = _verify_token(credentials.credentials)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return email


# ── Auth request/response models ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = "Researcher"


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    name: str


class MeResponse(BaseModel):
    email: str
    name: str


# ── Auth Endpoints ────────────────────────────────────────────────────────────

@router.post("/auth/register", response_model=AuthResponse, summary="Register a new researcher account")
async def register(request: RegisterRequest):
    if request.email in _users:
        raise HTTPException(status_code=409, detail="Email already registered.")

    _users[request.email] = {
        "email":    request.email,
        "name":     request.name,
        "password": _hash_password(request.password),
    }

    token = _create_token(request.email)
    return AuthResponse(access_token=token, email=request.email, name=request.name)


@router.post("/auth/login", response_model=AuthResponse, summary="Login and receive JWT")
async def login(request: LoginRequest):
    user = _users.get(request.email)
    if not user or user["password"] != _hash_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    token = _create_token(request.email)
    return AuthResponse(access_token=token, email=request.email, name=user["name"])


@router.get("/auth/me", response_model=MeResponse, summary="Get current user info (requires auth)")
async def me(email: str = Depends(get_current_user)):
    user = _users.get(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return MeResponse(email=user["email"], name=user["name"])
