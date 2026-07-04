from bson import ObjectId
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.database import get_db
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
    InventoryOut,
    InventoryAdjustStock,
)
from app.utils.deps import get_current_user, require_roles

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


def _to_inventory_out(item: dict) -> InventoryOut:
    return InventoryOut(
        id=str(item["_id"]),
        name=item["name"],
        sku=item["sku"],
        category=item.get("category", "general"),
        quantity=item["quantity"],
        unit_price=item["unit_price"],
        reorder_level=item.get("reorder_level", 10),
        low_stock=item["quantity"] <= item.get("reorder_level", 10),
        created_at=item["created_at"],
        updated_at=item["updated_at"],
    )


# Creating, updating stock levels, and deleting items are restricted to admin/manager (RBAC).
# Any authenticated user can view inventory.

@router.post(
    "/",
    response_model=InventoryOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin", "manager"))],
)
async def create_item(payload: InventoryCreate):
    db = get_db()

    existing = await db.inventory.find_one({"sku": payload.sku})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists")

    now = datetime.now(timezone.utc)
    item_doc = payload.model_dump()
    item_doc["created_at"] = now
    item_doc["updated_at"] = now

    result = await db.inventory.insert_one(item_doc)
    item_doc["_id"] = result.inserted_id
    return _to_inventory_out(item_doc)


@router.get("/", response_model=List[InventoryOut])
async def list_items(current_user: dict = Depends(get_current_user)):
    db = get_db()
    items = await db.inventory.find().sort("name", 1).to_list(length=2000)
    return [_to_inventory_out(i) for i in items]


@router.get("/low-stock", response_model=List[InventoryOut])
async def list_low_stock(current_user: dict = Depends(get_current_user)):
    db = get_db()
    items = await db.inventory.find().to_list(length=2000)
    low_stock_items = [i for i in items if i["quantity"] <= i.get("reorder_level", 10)]
    return [_to_inventory_out(i) for i in low_stock_items]


@router.get("/{item_id}", response_model=InventoryOut)
async def get_item(item_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item id")

    item = await db.inventory.find_one({"_id": ObjectId(item_id)})
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return _to_inventory_out(item)


@router.put(
    "/{item_id}",
    response_model=InventoryOut,
    dependencies=[Depends(require_roles("admin", "manager"))],
)
async def update_item(item_id: str, payload: InventoryUpdate):
    db = get_db()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item id")

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db.inventory.find_one_and_update(
        {"_id": ObjectId(item_id)}, {"$set": update_data}, return_document=True
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return _to_inventory_out(result)


@router.patch(
    "/{item_id}/stock",
    response_model=InventoryOut,
    dependencies=[Depends(require_roles("admin", "manager"))],
)
async def adjust_stock(item_id: str, payload: InventoryAdjustStock):
    db = get_db()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item id")

    item = await db.inventory.find_one({"_id": ObjectId(item_id)})
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    new_quantity = item["quantity"] + payload.delta
    if new_quantity < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock for this adjustment")

    result = await db.inventory.find_one_and_update(
        {"_id": ObjectId(item_id)},
        {"$set": {"quantity": new_quantity, "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
    )
    return _to_inventory_out(result)


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("admin", "manager"))],
)
async def delete_item(item_id: str):
    db = get_db()
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item id")

    result = await db.inventory.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
