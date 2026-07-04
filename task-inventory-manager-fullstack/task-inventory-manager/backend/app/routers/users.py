from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.database import get_db
from app.schemas.user import UserOut, UserUpdateRole
from app.utils.deps import get_current_user, require_roles

router = APIRouter(prefix="/api/users", tags=["Users"])


def _to_user_out(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
    )


@router.get("/", response_model=List[UserOut], dependencies=[Depends(require_roles("admin"))])
async def list_users():
    db = get_db()
    users = await db.users.find().to_list(length=500)
    return [_to_user_out(u) for u in users]


@router.patch("/{user_id}/role", response_model=UserOut, dependencies=[Depends(require_roles("admin"))])
async def update_user_role(user_id: str, payload: UserUpdateRole):
    db = get_db()
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": payload.role.value}},
        return_document=True,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return _to_user_out(result)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles("admin"))])
async def delete_user(user_id: str):
    db = get_db()
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
