from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies.auth import CurrentUser, DbSession, WriteAccess
from app.modules.food.domain.models import DishTemplate
from app.modules.planning.api.schemas import (
    WeekPlanDishSuggestionOut,
    WeekPlanInstanceCreateFromTemplateIn,
    WeekPlanInstanceItemOut,
    WeekPlanInstanceOut,
    WeekPlanInstanceUpdateIn,
    WeekPlanTemplateIn,
    WeekPlanTemplateItemOut,
    WeekPlanTemplateListItemOut,
    WeekPlanTemplateOut,
)
from app.modules.planning.domain.models import (
    WeekPlanInstance,
    WeekPlanInstanceItem,
    WeekPlanTemplate,
    WeekPlanTemplateItem,
)
from app.modules.planning.service.snapshot import has_duplicate_day_slot, item_sort_key


router = APIRouter(prefix="/api/planning", tags=["planning"])


MEAL_TYPE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "breakfast": ("breakfast", "desayuno"),
    "lunch": ("lunch", "almuerzo", "comida"),
    "dinner": ("dinner", "cena"),
    "snack": ("snack", "merienda"),
}


def _meal_type_from_slot_key(slot_key: str) -> str | None:
    normalized_slot = slot_key.strip().lower()
    for meal_type, keywords in MEAL_TYPE_KEYWORDS.items():
        if any(keyword in normalized_slot for keyword in keywords):
            return meal_type
    return None


def _dish_name_matches_meal_type(dish_name: str, meal_type: str) -> bool:
    normalized_name = dish_name.strip().lower()
    keywords = MEAL_TYPE_KEYWORDS.get(meal_type)
    if keywords is None:
        return False
    return any(keyword in normalized_name for keyword in keywords)


def _historical_dish_ids_for_meal_type(session: Session, tenant_id: uuid.UUID, meal_type: str) -> set[uuid.UUID]:
    template_rows = session.execute(
        select(WeekPlanTemplateItem.slot_key, WeekPlanTemplateItem.dish_template_id).where(
            WeekPlanTemplateItem.tenant_id == tenant_id,
            WeekPlanTemplateItem.dish_template_id.is_not(None),
        )
    ).all()
    instance_rows = session.execute(
        select(WeekPlanInstanceItem.slot_key, WeekPlanInstanceItem.dish_template_id).where(
            WeekPlanInstanceItem.tenant_id == tenant_id,
            WeekPlanInstanceItem.dish_template_id.is_not(None),
        )
    ).all()

    matched_ids: set[uuid.UUID] = set()
    for slot_key, dish_template_id in [*template_rows, *instance_rows]:
        if dish_template_id is None:
            continue
        if _meal_type_from_slot_key(slot_key) == meal_type:
            matched_ids.add(dish_template_id)

    return matched_ids


def _parse_uuid(raw: str, detail: str) -> uuid.UUID:
    try:
        return uuid.UUID(raw)
    except Exception:
        raise HTTPException(status_code=400, detail=detail)


def _template_item_out(row: WeekPlanTemplateItem) -> WeekPlanTemplateItemOut:
    return WeekPlanTemplateItemOut(
        id=str(row.id),
        day_key=row.day_key,
        slot_key=row.slot_key,
        dish_template_id=None if row.dish_template_id is None else str(row.dish_template_id),
        dish_template_name=row.dish_template_name,
        notes=row.notes,
        position=row.position,
    )


def _instance_item_out(row: WeekPlanInstanceItem) -> WeekPlanInstanceItemOut:
    return WeekPlanInstanceItemOut(
        id=str(row.id),
        source_template_item_id=None if row.source_template_item_id is None else str(row.source_template_item_id),
        day_key=row.day_key,
        slot_key=row.slot_key,
        dish_template_id=None if row.dish_template_id is None else str(row.dish_template_id),
        dish_name=row.dish_name,
        notes=row.notes,
        position=row.position,
    )


def _fetch_template(template_id: uuid.UUID, tenant_id: uuid.UUID, session: Session) -> WeekPlanTemplate:
    template = session.execute(
        select(WeekPlanTemplate).where(
            WeekPlanTemplate.id == template_id,
            WeekPlanTemplate.tenant_id == tenant_id,
        )
    ).scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=404, detail="week_plan_template_not_found")
    return template


def _fetch_template_items(template_id: uuid.UUID, tenant_id: uuid.UUID, session: Session) -> list[WeekPlanTemplateItem]:
    return session.execute(
        select(WeekPlanTemplateItem)
        .where(
            WeekPlanTemplateItem.week_plan_template_id == template_id,
            WeekPlanTemplateItem.tenant_id == tenant_id,
        )
        .order_by(WeekPlanTemplateItem.position.asc(), WeekPlanTemplateItem.created_at.asc())
    ).scalars().all()


def _template_out(template: WeekPlanTemplate, items: list[WeekPlanTemplateItem]) -> WeekPlanTemplateOut:
    return WeekPlanTemplateOut(
        id=str(template.id),
        tenant_id=str(template.tenant_id),
        name=template.name,
        items=[_template_item_out(item) for item in items],
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


def _fetch_instance(instance_id: uuid.UUID, tenant_id: uuid.UUID, session: Session) -> WeekPlanInstance:
    instance = session.execute(
        select(WeekPlanInstance).where(
            WeekPlanInstance.id == instance_id,
            WeekPlanInstance.tenant_id == tenant_id,
        )
    ).scalar_one_or_none()
    if instance is None:
        raise HTTPException(status_code=404, detail="week_plan_instance_not_found")
    return instance


def _fetch_instance_items(instance_id: uuid.UUID, tenant_id: uuid.UUID, session: Session) -> list[WeekPlanInstanceItem]:
    return session.execute(
        select(WeekPlanInstanceItem)
        .where(
            WeekPlanInstanceItem.week_plan_instance_id == instance_id,
            WeekPlanInstanceItem.tenant_id == tenant_id,
        )
        .order_by(WeekPlanInstanceItem.position.asc(), WeekPlanInstanceItem.created_at.asc())
    ).scalars().all()


def _instance_out(instance: WeekPlanInstance, items: list[WeekPlanInstanceItem]) -> WeekPlanInstanceOut:
    return WeekPlanInstanceOut(
        id=str(instance.id),
        tenant_id=str(instance.tenant_id),
        template_id=None if instance.template_id is None else str(instance.template_id),
        client_ref=instance.client_ref,
        week_start_date=instance.week_start_date,
        template_name_snapshot=instance.template_name_snapshot,
        items=[_instance_item_out(item) for item in items],
        created_at=instance.created_at,
        updated_at=instance.updated_at,
    )


def _dish_names_by_id(session: Session, tenant_id: uuid.UUID, raw_ids: list[str | None]) -> dict[uuid.UUID, str]:
    parsed_ids = [_parse_uuid(raw, "invalid_dish_template_id") for raw in raw_ids if raw is not None]
    if not parsed_ids:
        return {}

    rows = session.execute(
        select(DishTemplate.id, DishTemplate.name).where(
            DishTemplate.tenant_id == tenant_id,
            DishTemplate.id.in_(parsed_ids),
        )
    ).all()
    names_by_id = {row[0]: row[1] for row in rows}
    if len(names_by_id) != len(set(parsed_ids)):
        raise HTTPException(status_code=404, detail="dish_template_not_found")
    return names_by_id


@router.get("/week-plan-templates", response_model=list[WeekPlanTemplateListItemOut])
def list_week_plan_templates(
    user: CurrentUser,
    session: DbSession,
    query: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[WeekPlanTemplateListItemOut]:
    stmt = (
        select(WeekPlanTemplate, func.count(WeekPlanTemplateItem.id))
        .outerjoin(
            WeekPlanTemplateItem,
            WeekPlanTemplateItem.week_plan_template_id == WeekPlanTemplate.id,
        )
        .where(WeekPlanTemplate.tenant_id == user.tenant_id)
        .group_by(WeekPlanTemplate.id)
    )
    if query:
        stmt = stmt.where(WeekPlanTemplate.name.ilike(f"%{query.strip()}%"))
    rows = session.execute(stmt.order_by(WeekPlanTemplate.name.asc()).limit(limit).offset(offset)).all()

    return [
        WeekPlanTemplateListItemOut(
            id=str(template.id),
            tenant_id=str(template.tenant_id),
            name=template.name,
            item_count=int(item_count),
            created_at=template.created_at,
            updated_at=template.updated_at,
        )
        for template, item_count in rows
    ]


@router.get("/dish-suggestions", response_model=list[WeekPlanDishSuggestionOut])
def list_week_plan_dish_suggestions(
    user: CurrentUser,
    session: DbSession,
    slot_key: str = Query(min_length=1, max_length=50),
    query: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[WeekPlanDishSuggestionOut]:
    normalized_slot = slot_key.strip()
    if not normalized_slot:
        raise HTTPException(status_code=400, detail="invalid_slot_key")

    meal_type = _meal_type_from_slot_key(normalized_slot)
    historical_ids: set[uuid.UUID] = set()
    if meal_type is not None:
        historical_ids = _historical_dish_ids_for_meal_type(session=session, tenant_id=user.tenant_id, meal_type=meal_type)

    normalized_query = query.strip() if query else None
    stmt = select(DishTemplate.id, DishTemplate.name).where(DishTemplate.tenant_id == user.tenant_id)
    if normalized_query:
        stmt = stmt.where(DishTemplate.name.ilike(f"%{normalized_query}%"))

    rows = session.execute(stmt).all()
    scored_rows: list[tuple[int, str, uuid.UUID]] = []
    for dish_id, dish_name in rows:
        score = 0
        if meal_type is not None and dish_id in historical_ids:
            score += 2
        if meal_type is not None and _dish_name_matches_meal_type(dish_name, meal_type):
            score += 1
        scored_rows.append((score, dish_name, dish_id))

    matched_rows = [row for row in scored_rows if row[0] > 0]
    ordered_rows = matched_rows if matched_rows else scored_rows
    ordered_rows.sort(key=lambda row: (-row[0], row[1].lower()))

    return [
        WeekPlanDishSuggestionOut(id=str(dish_id), name=dish_name, meal_type=meal_type, score=score)
        for score, dish_name, dish_id in ordered_rows[:limit]
    ]


@router.get("/week-plan-templates/{template_id}", response_model=WeekPlanTemplateOut)
def get_week_plan_template(template_id: uuid.UUID, user: CurrentUser, session: DbSession) -> WeekPlanTemplateOut:
    template = _fetch_template(template_id=template_id, tenant_id=user.tenant_id, session=session)
    items = _fetch_template_items(template_id=template.id, tenant_id=user.tenant_id, session=session)
    return _template_out(template=template, items=items)


@router.post("/week-plan-templates", response_model=WeekPlanTemplateOut)
def create_week_plan_template(
    payload: WeekPlanTemplateIn,
    user: CurrentUser,
    session: DbSession,
    _: WriteAccess,
) -> WeekPlanTemplateOut:
    normalized_slots = [(item.day_key, item.slot_key.strip()) for item in payload.items]
    if any(not slot_key for _, slot_key in normalized_slots):
        raise HTTPException(status_code=400, detail="invalid_slot_key")
    if has_duplicate_day_slot(normalized_slots):
        raise HTTPException(status_code=400, detail="duplicate_day_slot")

    dish_names = _dish_names_by_id(session, user.tenant_id, [item.dish_template_id for item in payload.items])
    now = datetime.now(timezone.utc)
    template_name = payload.name.strip()
    if not template_name:
        raise HTTPException(status_code=400, detail="invalid_template_name")

    template = WeekPlanTemplate(
        id=uuid.uuid4(),
        tenant_id=user.tenant_id,
        name=template_name,
        created_at=now,
        updated_at=None,
    )
    session.add(template)

    sorted_items = sorted(payload.items, key=lambda item: item_sort_key(item.day_key, item.slot_key.strip()))
    for idx, item in enumerate(sorted_items):
        dish_template_uuid = None if item.dish_template_id is None else uuid.UUID(item.dish_template_id)
        session.add(
            WeekPlanTemplateItem(
                id=uuid.uuid4(),
                tenant_id=user.tenant_id,
                week_plan_template_id=template.id,
                day_key=item.day_key,
                slot_key=item.slot_key.strip(),
                dish_template_id=dish_template_uuid,
                dish_template_name=None if dish_template_uuid is None else dish_names[dish_template_uuid],
                notes=item.notes,
                position=idx,
                created_at=now,
            )
        )

    session.commit()
    items = _fetch_template_items(template_id=template.id, tenant_id=user.tenant_id, session=session)
    return _template_out(template=template, items=items)


@router.put("/week-plan-templates/{template_id}", response_model=WeekPlanTemplateOut)
def update_week_plan_template(
    template_id: uuid.UUID,
    payload: WeekPlanTemplateIn,
    user: CurrentUser,
    session: DbSession,
    _: WriteAccess,
) -> WeekPlanTemplateOut:
    template = _fetch_template(template_id=template_id, tenant_id=user.tenant_id, session=session)
    normalized_slots = [(item.day_key, item.slot_key.strip()) for item in payload.items]
    if any(not slot_key for _, slot_key in normalized_slots):
        raise HTTPException(status_code=400, detail="invalid_slot_key")
    if has_duplicate_day_slot(normalized_slots):
        raise HTTPException(status_code=400, detail="duplicate_day_slot")

    dish_names = _dish_names_by_id(session, user.tenant_id, [item.dish_template_id for item in payload.items])
    now = datetime.now(timezone.utc)
    template_name = payload.name.strip()
    if not template_name:
        raise HTTPException(status_code=400, detail="invalid_template_name")

    template.name = template_name
    template.updated_at = now

    existing = _fetch_template_items(template_id=template.id, tenant_id=user.tenant_id, session=session)
    for row in existing:
        session.delete(row)

    sorted_items = sorted(payload.items, key=lambda item: item_sort_key(item.day_key, item.slot_key.strip()))
    for idx, item in enumerate(sorted_items):
        dish_template_uuid = None if item.dish_template_id is None else uuid.UUID(item.dish_template_id)
        session.add(
            WeekPlanTemplateItem(
                id=uuid.uuid4(),
                tenant_id=user.tenant_id,
                week_plan_template_id=template.id,
                day_key=item.day_key,
                slot_key=item.slot_key.strip(),
                dish_template_id=dish_template_uuid,
                dish_template_name=None if dish_template_uuid is None else dish_names[dish_template_uuid],
                notes=item.notes,
                position=idx,
                created_at=now,
            )
        )

    session.commit()
    items = _fetch_template_items(template_id=template.id, tenant_id=user.tenant_id, session=session)
    return _template_out(template=template, items=items)


@router.delete("/week-plan-templates/{template_id}")
def delete_week_plan_template(template_id: uuid.UUID, user: CurrentUser, session: DbSession, _: WriteAccess) -> dict[str, str]:
    template = _fetch_template(template_id=template_id, tenant_id=user.tenant_id, session=session)
    session.delete(template)
    session.commit()
    return {"status": "ok"}


@router.post("/week-plan-instances/from-template", response_model=WeekPlanInstanceOut)
def create_week_plan_instance_from_template(
    payload: WeekPlanInstanceCreateFromTemplateIn,
    user: CurrentUser,
    session: DbSession,
    _: WriteAccess,
) -> WeekPlanInstanceOut:
    template_id = _parse_uuid(payload.template_id, "invalid_template_id")
    client_ref = payload.client_ref.strip()
    if not client_ref:
        raise HTTPException(status_code=400, detail="invalid_client_ref")

    existing = session.execute(
        select(WeekPlanInstance).where(
            WeekPlanInstance.tenant_id == user.tenant_id,
            WeekPlanInstance.client_ref == client_ref,
            WeekPlanInstance.week_start_date == payload.week_start_date,
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="week_plan_instance_exists")

    template = _fetch_template(template_id=template_id, tenant_id=user.tenant_id, session=session)
    template_items = _fetch_template_items(template_id=template.id, tenant_id=user.tenant_id, session=session)
    now = datetime.now(timezone.utc)

    instance = WeekPlanInstance(
        id=uuid.uuid4(),
        tenant_id=user.tenant_id,
        template_id=template.id,
        client_ref=client_ref,
        week_start_date=payload.week_start_date,
        template_name_snapshot=template.name,
        created_at=now,
        updated_at=None,
    )
    session.add(instance)

    for template_item in template_items:
        session.add(
            WeekPlanInstanceItem(
                id=uuid.uuid4(),
                tenant_id=user.tenant_id,
                week_plan_instance_id=instance.id,
                source_template_item_id=template_item.id,
                day_key=template_item.day_key,
                slot_key=template_item.slot_key,
                dish_template_id=template_item.dish_template_id,
                dish_name=template_item.dish_template_name,
                notes=template_item.notes,
                position=template_item.position,
                created_at=now,
                updated_at=None,
            )
        )

    session.commit()
    items = _fetch_instance_items(instance_id=instance.id, tenant_id=user.tenant_id, session=session)
    return _instance_out(instance=instance, items=items)


@router.get("/week-plan-instances/by-client-week", response_model=WeekPlanInstanceOut)
def get_week_plan_instance_by_client_week(
    user: CurrentUser,
    session: DbSession,
    client_ref: str = Query(min_length=1, max_length=64),
    week_start_date: date = Query(),
) -> WeekPlanInstanceOut:
    normalized_client_ref = client_ref.strip()
    if not normalized_client_ref:
        raise HTTPException(status_code=400, detail="invalid_client_ref")
    instance = session.execute(
        select(WeekPlanInstance).where(
            WeekPlanInstance.tenant_id == user.tenant_id,
            WeekPlanInstance.client_ref == normalized_client_ref,
            WeekPlanInstance.week_start_date == week_start_date,
        )
    ).scalar_one_or_none()
    if instance is None:
        raise HTTPException(status_code=404, detail="week_plan_instance_not_found")

    items = _fetch_instance_items(instance_id=instance.id, tenant_id=user.tenant_id, session=session)
    return _instance_out(instance=instance, items=items)


@router.get("/week-plan-instances/{instance_id}", response_model=WeekPlanInstanceOut)
def get_week_plan_instance(instance_id: uuid.UUID, user: CurrentUser, session: DbSession) -> WeekPlanInstanceOut:
    instance = _fetch_instance(instance_id=instance_id, tenant_id=user.tenant_id, session=session)
    items = _fetch_instance_items(instance_id=instance.id, tenant_id=user.tenant_id, session=session)
    return _instance_out(instance=instance, items=items)


@router.put("/week-plan-instances/{instance_id}", response_model=WeekPlanInstanceOut)
def update_week_plan_instance(
    instance_id: uuid.UUID,
    payload: WeekPlanInstanceUpdateIn,
    user: CurrentUser,
    session: DbSession,
    _: WriteAccess,
) -> WeekPlanInstanceOut:
    instance = _fetch_instance(instance_id=instance_id, tenant_id=user.tenant_id, session=session)
    normalized_slots = [(item.day_key, item.slot_key.strip()) for item in payload.items]
    if any(not slot_key for _, slot_key in normalized_slots):
        raise HTTPException(status_code=400, detail="invalid_slot_key")
    if has_duplicate_day_slot(normalized_slots):
        raise HTTPException(status_code=400, detail="duplicate_day_slot")

    dish_names = _dish_names_by_id(session, user.tenant_id, [item.dish_template_id for item in payload.items])
    now = datetime.now(timezone.utc)

    existing = _fetch_instance_items(instance_id=instance.id, tenant_id=user.tenant_id, session=session)
    for row in existing:
        session.delete(row)

    sorted_items = sorted(payload.items, key=lambda item: item_sort_key(item.day_key, item.slot_key.strip()))
    for idx, item in enumerate(sorted_items):
        dish_template_uuid = None if item.dish_template_id is None else uuid.UUID(item.dish_template_id)
        resolved_dish_name = item.dish_name
        if dish_template_uuid is not None:
            resolved_dish_name = dish_names[dish_template_uuid]

        session.add(
            WeekPlanInstanceItem(
                id=uuid.uuid4(),
                tenant_id=user.tenant_id,
                week_plan_instance_id=instance.id,
                source_template_item_id=None,
                day_key=item.day_key,
                slot_key=item.slot_key.strip(),
                dish_template_id=dish_template_uuid,
                dish_name=resolved_dish_name,
                notes=item.notes,
                position=idx,
                created_at=now,
                updated_at=None,
            )
        )

    instance.updated_at = now
    session.commit()

    items = _fetch_instance_items(instance_id=instance.id, tenant_id=user.tenant_id, session=session)
    return _instance_out(instance=instance, items=items)
