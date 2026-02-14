from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from app.core.dependencies.auth import CurrentUser, DbSession, WriteAccess
from app.modules.food.api.schemas import (
    DishTemplateIn,
    DishTemplateListItemOut,
    DishTemplateOut,
    DishTemplateUsedByOut,
    IngredientIn,
    IngredientOut,
    MacroTotalsOut,
)
from app.modules.food.domain.models import DishTemplate, DishTemplateItem, Ingredient
from app.modules.food.service.macros import MacroPer100g, compute_template_totals


router = APIRouter(prefix="/api/food", tags=["food"])


def _ingredient_out(row: Ingredient) -> IngredientOut:
    return IngredientOut(
        id=str(row.id),
        tenant_id=str(row.tenant_id),
        name=row.name,
        kcal_per_100g=float(row.kcal_per_100g),
        protein_g_per_100g=float(row.protein_g_per_100g),
        carbs_g_per_100g=float(row.carbs_g_per_100g),
        fat_g_per_100g=float(row.fat_g_per_100g),
        serving_size_g=None if row.serving_size_g is None else float(row.serving_size_g),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("/ingredients", response_model=list[IngredientOut])
def list_ingredients(
    user: CurrentUser,
    session: DbSession,
    query: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[IngredientOut]:
    stmt = select(Ingredient).where(Ingredient.tenant_id == user.tenant_id)
    if query:
        stmt = stmt.where(Ingredient.name.ilike(f"%{query.strip()}%"))
    rows = session.execute(stmt.order_by(Ingredient.name.asc()).limit(limit).offset(offset)).scalars().all()
    return [_ingredient_out(row) for row in rows]


@router.post("/ingredients", response_model=IngredientOut)
def create_ingredient(payload: IngredientIn, user: CurrentUser, session: DbSession, _: WriteAccess) -> IngredientOut:
    now = datetime.now(timezone.utc)
    row = Ingredient(
        id=uuid.uuid4(),
        tenant_id=user.tenant_id,
        name=payload.name.strip(),
        kcal_per_100g=Decimal(str(payload.kcal_per_100g)),
        protein_g_per_100g=Decimal(str(payload.protein_g_per_100g)),
        carbs_g_per_100g=Decimal(str(payload.carbs_g_per_100g)),
        fat_g_per_100g=Decimal(str(payload.fat_g_per_100g)),
        serving_size_g=None if payload.serving_size_g is None else Decimal(str(payload.serving_size_g)),
        created_at=now,
        updated_at=None,
    )
    session.add(row)
    session.commit()
    return _ingredient_out(row)


@router.get("/ingredients/{ingredient_id}", response_model=IngredientOut)
def get_ingredient(ingredient_id: uuid.UUID, user: CurrentUser, session: DbSession) -> IngredientOut:
    row = session.execute(
        select(Ingredient).where(
            Ingredient.tenant_id == user.tenant_id,
            Ingredient.id == ingredient_id,
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="ingredient_not_found")
    return _ingredient_out(row)


@router.put("/ingredients/{ingredient_id}", response_model=IngredientOut)
def update_ingredient(
    ingredient_id: uuid.UUID,
    payload: IngredientIn,
    user: CurrentUser,
    session: DbSession,
    _: WriteAccess,
) -> IngredientOut:
    row = session.execute(
        select(Ingredient).where(
            Ingredient.tenant_id == user.tenant_id,
            Ingredient.id == ingredient_id,
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="ingredient_not_found")

    row.name = payload.name.strip()
    row.kcal_per_100g = Decimal(str(payload.kcal_per_100g))
    row.protein_g_per_100g = Decimal(str(payload.protein_g_per_100g))
    row.carbs_g_per_100g = Decimal(str(payload.carbs_g_per_100g))
    row.fat_g_per_100g = Decimal(str(payload.fat_g_per_100g))
    row.serving_size_g = None if payload.serving_size_g is None else Decimal(str(payload.serving_size_g))
    row.updated_at = datetime.now(timezone.utc)

    session.commit()
    return _ingredient_out(row)


@router.get("/ingredients/{ingredient_id}/used-by", response_model=list[DishTemplateUsedByOut])
def ingredient_used_by(ingredient_id: uuid.UUID, user: CurrentUser, session: DbSession) -> list[DishTemplateUsedByOut]:
    exists = session.execute(
        select(Ingredient.id).where(
            Ingredient.tenant_id == user.tenant_id,
            Ingredient.id == ingredient_id,
        )
    ).first()
    if exists is None:
        raise HTTPException(status_code=404, detail="ingredient_not_found")

    rows = session.execute(
        select(DishTemplate.id, DishTemplate.name)
        .distinct()
        .join(DishTemplateItem, DishTemplateItem.dish_template_id == DishTemplate.id)
        .where(
            DishTemplate.tenant_id == user.tenant_id,
            DishTemplateItem.tenant_id == user.tenant_id,
            DishTemplateItem.ingredient_id == ingredient_id,
        )
        .order_by(DishTemplate.name.asc())
    ).all()

    return [DishTemplateUsedByOut(id=str(row[0]), name=row[1]) for row in rows]


@router.delete("/ingredients/{ingredient_id}")
def delete_ingredient(ingredient_id: uuid.UUID, user: CurrentUser, session: DbSession, _: WriteAccess) -> dict[str, str]:
    row = session.execute(
        select(Ingredient).where(
            Ingredient.tenant_id == user.tenant_id,
            Ingredient.id == ingredient_id,
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="ingredient_not_found")

    in_use = session.execute(
        select(DishTemplateItem.id).where(
            DishTemplateItem.tenant_id == user.tenant_id,
            DishTemplateItem.ingredient_id == ingredient_id,
        )
    ).first()
    if in_use is not None:
        raise HTTPException(status_code=409, detail="ingredient_in_use")

    session.delete(row)
    session.commit()
    return {"status": "ok"}


def _template_totals(rows: list[tuple[DishTemplateItem, Ingredient]]) -> MacroTotalsOut:
    totals = compute_template_totals(
        [
            (
                MacroPer100g(
                    kcal=ingredient.kcal_per_100g,
                    protein_g=ingredient.protein_g_per_100g,
                    carbs_g=ingredient.carbs_g_per_100g,
                    fat_g=ingredient.fat_g_per_100g,
                ),
                item.quantity_g,
            )
            for item, ingredient in rows
        ]
    )
    return MacroTotalsOut(
        kcal=float(totals.kcal),
        protein_g=float(totals.protein_g),
        carbs_g=float(totals.carbs_g),
        fat_g=float(totals.fat_g),
    )


@router.get("/dish-templates", response_model=list[DishTemplateListItemOut])
def list_dish_templates(
    user: CurrentUser,
    session: DbSession,
    query: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[DishTemplateListItemOut]:
    stmt = select(DishTemplate).where(DishTemplate.tenant_id == user.tenant_id)
    if query:
        stmt = stmt.where(DishTemplate.name.ilike(f"%{query.strip()}%"))
    rows = session.execute(stmt.order_by(DishTemplate.name.asc()).limit(limit).offset(offset)).scalars().all()
    return [
        DishTemplateListItemOut(
            id=str(row.id),
            tenant_id=str(row.tenant_id),
            name=row.name,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.get("/dish-templates/{template_id}", response_model=DishTemplateOut)
def get_dish_template(template_id: uuid.UUID, user: CurrentUser, session: DbSession) -> DishTemplateOut:
    template = session.execute(
        select(DishTemplate).where(
            DishTemplate.tenant_id == user.tenant_id,
            DishTemplate.id == template_id,
        )
    ).scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=404, detail="dish_template_not_found")

    rows = session.execute(
        select(DishTemplateItem, Ingredient)
        .join(Ingredient, Ingredient.id == DishTemplateItem.ingredient_id)
        .where(
            DishTemplateItem.tenant_id == user.tenant_id,
            DishTemplateItem.dish_template_id == template.id,
            Ingredient.tenant_id == user.tenant_id,
        )
        .order_by(DishTemplateItem.created_at.asc())
    ).all()

    return DishTemplateOut(
        id=str(template.id),
        tenant_id=str(template.tenant_id),
        name=template.name,
        items=[
            {
                "ingredient_id": str(item.ingredient_id),
                "ingredient_name": ingredient.name,
                "quantity_g": float(item.quantity_g),
            }
            for item, ingredient in rows
        ],
        totals=_template_totals(rows),
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.post("/dish-templates", response_model=DishTemplateOut)
def create_dish_template(payload: DishTemplateIn, user: CurrentUser, session: DbSession, _: WriteAccess) -> DishTemplateOut:
    now = datetime.now(timezone.utc)
    item_ids: list[uuid.UUID] = []
    for item in payload.items:
        try:
            item_ids.append(uuid.UUID(item.ingredient_id))
        except Exception:
            raise HTTPException(status_code=400, detail="invalid_ingredient_id")

    ingredients = session.execute(
        select(Ingredient).where(
            Ingredient.tenant_id == user.tenant_id,
            Ingredient.id.in_(item_ids),
        )
    ).scalars().all()
    ingredients_by_id = {ingredient.id: ingredient for ingredient in ingredients}
    if len(ingredients_by_id) != len(set(item_ids)):
        raise HTTPException(status_code=404, detail="ingredient_not_found")

    template = DishTemplate(
        id=uuid.uuid4(),
        tenant_id=user.tenant_id,
        name=payload.name.strip(),
        created_at=now,
        updated_at=None,
    )
    session.add(template)

    for item in payload.items:
        ingredient_id = uuid.UUID(item.ingredient_id)
        session.add(
            DishTemplateItem(
                id=uuid.uuid4(),
                tenant_id=user.tenant_id,
                dish_template_id=template.id,
                ingredient_id=ingredient_id,
                quantity_g=Decimal(str(item.quantity_g)),
                created_at=now,
            )
        )

    session.commit()
    return get_dish_template(template.id, user, session)


@router.put("/dish-templates/{template_id}", response_model=DishTemplateOut)
def update_dish_template(
    template_id: uuid.UUID,
    payload: DishTemplateIn,
    user: CurrentUser,
    session: DbSession,
    _: WriteAccess,
) -> DishTemplateOut:
    template = session.execute(
        select(DishTemplate).where(
            DishTemplate.tenant_id == user.tenant_id,
            DishTemplate.id == template_id,
        )
    ).scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=404, detail="dish_template_not_found")

    item_ids: list[uuid.UUID] = []
    for item in payload.items:
        try:
            item_ids.append(uuid.UUID(item.ingredient_id))
        except Exception:
            raise HTTPException(status_code=400, detail="invalid_ingredient_id")

    ingredients = session.execute(
        select(Ingredient).where(
            Ingredient.tenant_id == user.tenant_id,
            Ingredient.id.in_(item_ids),
        )
    ).scalars().all()
    ingredients_by_id = {ingredient.id: ingredient for ingredient in ingredients}
    if len(ingredients_by_id) != len(set(item_ids)):
        raise HTTPException(status_code=404, detail="ingredient_not_found")

    now = datetime.now(timezone.utc)
    template.name = payload.name.strip()
    template.updated_at = now

    existing = session.execute(
        select(DishTemplateItem).where(
            DishTemplateItem.tenant_id == user.tenant_id,
            DishTemplateItem.dish_template_id == template.id,
        )
    ).scalars().all()
    for row in existing:
        session.delete(row)

    for item in payload.items:
        session.add(
            DishTemplateItem(
                id=uuid.uuid4(),
                tenant_id=user.tenant_id,
                dish_template_id=template.id,
                ingredient_id=uuid.UUID(item.ingredient_id),
                quantity_g=Decimal(str(item.quantity_g)),
                created_at=now,
            )
        )

    session.commit()
    return get_dish_template(template.id, user, session)


@router.delete("/dish-templates/{template_id}")
def delete_dish_template(template_id: uuid.UUID, user: CurrentUser, session: DbSession, _: WriteAccess) -> dict[str, str]:
    template = session.execute(
        select(DishTemplate).where(
            DishTemplate.tenant_id == user.tenant_id,
            DishTemplate.id == template_id,
        )
    ).scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=404, detail="dish_template_not_found")
    session.delete(template)
    session.commit()
    return {"status": "ok"}
