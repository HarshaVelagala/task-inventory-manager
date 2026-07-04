from bson import ObjectId
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.schemas.user import UserRegister, UserLogin, TokenPair, UserOut, RefreshRequest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _to_user_out(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
    )


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    db = get_db()

    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": payload.role.value,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    access_token = create_access_token(str(result.inserted_id), payload.role.value)
    refresh_token = create_refresh_token(str(result.inserted_id))

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_to_user_out(user_doc),
    )


@router.post("/login", response_model=TokenPair)
async def login(payload: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": payload.email})

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(str(user["_id"]), user["role"])
    refresh_token = create_refresh_token(str(user["_id"]))

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_to_user_out(user),
    )


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest):
    token_data = decode_token(payload.refresh_token)
    if token_data is None or token_data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(token_data["sub"])})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token(str(user["_id"]), user["role"])
    new_refresh_token = create_refresh_token(str(user["_id"]))

    return TokenPair(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=_to_user_out(user),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _to_user_out(current_user)
