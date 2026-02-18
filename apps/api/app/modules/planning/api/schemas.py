from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


DAY_KEY_PATTERN = "^(mon|tue|wed|thu|fri|sat|sun)$"


class WeekPlanTemplateItemIn(BaseModel):
    day_key: str = Field(pattern=DAY_KEY_PATTERN)
    slot_key: str = Field(min_length=1, max_length=50)
    dish_template_id: str | None = Field(default=None)
    notes: str | None = Field(default=None, max_length=1000)


class WeekPlanTemplateIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    items: list[WeekPlanTemplateItemIn] = Field(min_length=1)


class WeekPlanTemplateItemOut(BaseModel):
    id: str
    day_key: str
    slot_key: str
    dish_template_id: str | None
    dish_template_name: str | None
    notes: str | None
    position: int


class WeekPlanTemplateListItemOut(BaseModel):
    id: str
    tenant_id: str
    name: str
    item_count: int
    created_at: datetime
    updated_at: datetime | None


class WeekPlanTemplateOut(BaseModel):
    id: str
    tenant_id: str
    name: str
    items: list[WeekPlanTemplateItemOut]
    created_at: datetime
    updated_at: datetime | None


class WeekPlanInstanceCreateFromTemplateIn(BaseModel):
    template_id: str = Field(min_length=1)
    client_ref: str = Field(min_length=1, max_length=64)
    week_start_date: date


class WeekPlanInstanceItemIn(BaseModel):
    day_key: str = Field(pattern=DAY_KEY_PATTERN)
    slot_key: str = Field(min_length=1, max_length=50)
    dish_template_id: str | None = Field(default=None)
    dish_name: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=1000)


class WeekPlanInstanceUpdateIn(BaseModel):
    items: list[WeekPlanInstanceItemIn] = Field(min_length=1)


class WeekPlanInstanceItemOut(BaseModel):
    id: str
    source_template_item_id: str | None
    day_key: str
    slot_key: str
    dish_template_id: str | None
    dish_name: str | None
    notes: str | None
    position: int


class WeekPlanInstanceOut(BaseModel):
    id: str
    tenant_id: str
    template_id: str | None
    client_ref: str
    week_start_date: date
    template_name_snapshot: str | None
    items: list[WeekPlanInstanceItemOut]
    created_at: datetime
    updated_at: datetime | None


class WeekPlanDishSuggestionOut(BaseModel):
    id: str
    name: str
    meal_type: str | None
    score: int
