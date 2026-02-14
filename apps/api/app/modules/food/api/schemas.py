from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class IngredientIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    kcal_per_100g: float = Field(ge=0)
    protein_g_per_100g: float = Field(ge=0)
    carbs_g_per_100g: float = Field(ge=0)
    fat_g_per_100g: float = Field(ge=0)
    serving_size_g: float | None = Field(default=None, gt=0)


class IngredientOut(BaseModel):
    id: str
    tenant_id: str
    name: str
    kcal_per_100g: float
    protein_g_per_100g: float
    carbs_g_per_100g: float
    fat_g_per_100g: float
    serving_size_g: float | None
    created_at: datetime
    updated_at: datetime | None


class DishTemplateItemIn(BaseModel):
    ingredient_id: str
    quantity_g: float = Field(gt=0)


class DishTemplateIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    items: list[DishTemplateItemIn] = Field(min_length=1)


class DishTemplateItemOut(BaseModel):
    ingredient_id: str
    ingredient_name: str
    quantity_g: float


class MacroTotalsOut(BaseModel):
    kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float


class DishTemplateOut(BaseModel):
    id: str
    tenant_id: str
    name: str
    items: list[DishTemplateItemOut]
    totals: MacroTotalsOut
    created_at: datetime
    updated_at: datetime | None


class DishTemplateListItemOut(BaseModel):
    id: str
    tenant_id: str
    name: str
    created_at: datetime
    updated_at: datetime | None


class DishTemplateUsedByOut(BaseModel):
    id: str
    name: str
