from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class InventoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    sku: str = Field(..., min_length=1, max_length=50)
    category: Optional[str] = Field(default="general", max_length=80)
    quantity: int = Field(..., ge=0)
    unit_price: float = Field(..., ge=0)
    reorder_level: int = Field(default=10, ge=0)


class InventoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    category: Optional[str] = Field(None, max_length=80)
    quantity: Optional[int] = Field(None, ge=0)
    unit_price: Optional[float] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)


class InventoryAdjustStock(BaseModel):
    delta: int  # positive to add stock, negative to remove


class InventoryOut(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    quantity: int
    unit_price: float
    reorder_level: int
    low_stock: bool
    created_at: datetime
    updated_at: datetime
