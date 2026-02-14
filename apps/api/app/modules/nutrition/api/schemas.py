from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class NutritionProfileIn(BaseModel):
    sex: str = Field(pattern="^(male|female)$")
    birth_date: date
    height_cm: int = Field(ge=80, le=250)
    weight_kg: float = Field(gt=0, le=500)
    activity_level: str = Field(pattern="^(sedentary|light|moderate|very_active|athlete)$")
    goal: str = Field(default="maintain", pattern="^(maintain|cut|bulk)$")

    override_kcal: int | None = Field(default=None, ge=0, le=20000)
    override_protein_g: int | None = Field(default=None, ge=0, le=2000)
    override_carbs_g: int | None = Field(default=None, ge=0, le=2000)
    override_fat_g: int | None = Field(default=None, ge=0, le=2000)


class NutritionProfileOut(BaseModel):
    id: str
    tenant_id: str
    user_id: str

    sex: str
    birth_date: date
    height_cm: int
    weight_kg: float
    activity_level: str
    goal: str

    override_kcal: int | None
    override_protein_g: int | None
    override_carbs_g: int | None
    override_fat_g: int | None

    created_at: datetime
    updated_at: datetime | None


class NutritionTargetsOut(BaseModel):
    daily: dict[str, int]
    weekly: dict[str, int]
    warnings: list[str]
