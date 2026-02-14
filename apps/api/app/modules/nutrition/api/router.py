from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.dependencies.auth import CurrentUser, DbSession, WriteAccess
from app.modules.nutrition.api.schemas import NutritionProfileIn, NutritionProfileOut, NutritionTargetsOut
from app.modules.nutrition.domain.models import NutritionProfile
from app.modules.nutrition.service.calculators import NutritionInputs, age_years_from_birth_date, calculate_targets


router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])


def _profile_out(row: NutritionProfile) -> NutritionProfileOut:
    return NutritionProfileOut(
        id=str(row.id),
        tenant_id=str(row.tenant_id),
        user_id=str(row.user_id),
        sex=row.sex,
        birth_date=row.birth_date,
        height_cm=row.height_cm,
        weight_kg=float(row.weight_kg),
        activity_level=row.activity_level,
        goal=row.goal,
        override_kcal=row.override_kcal,
        override_protein_g=row.override_protein_g,
        override_carbs_g=row.override_carbs_g,
        override_fat_g=row.override_fat_g,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("/profile/me", response_model=NutritionProfileOut)
def get_profile_me(user: CurrentUser, session: DbSession) -> NutritionProfileOut:
    row = session.execute(
        select(NutritionProfile).where(
            NutritionProfile.tenant_id == user.tenant_id,
            NutritionProfile.user_id == user.id,
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="nutrition_profile_not_found")
    return _profile_out(row)


@router.put("/profile/me", response_model=NutritionProfileOut)
def put_profile_me(payload: NutritionProfileIn, user: CurrentUser, session: DbSession, _: WriteAccess) -> NutritionProfileOut:
    row = session.execute(
        select(NutritionProfile).where(
            NutritionProfile.tenant_id == user.tenant_id,
            NutritionProfile.user_id == user.id,
        )
    ).scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if row is None:
        row = NutritionProfile(
            id=uuid.uuid4(),
            tenant_id=user.tenant_id,
            user_id=user.id,
            sex=payload.sex,
            birth_date=payload.birth_date,
            height_cm=payload.height_cm,
            weight_kg=Decimal(str(payload.weight_kg)),
            activity_level=payload.activity_level,
            goal=payload.goal,
            override_kcal=payload.override_kcal,
            override_protein_g=payload.override_protein_g,
            override_carbs_g=payload.override_carbs_g,
            override_fat_g=payload.override_fat_g,
            created_at=now,
            updated_at=None,
        )
        session.add(row)
    else:
        row.sex = payload.sex
        row.birth_date = payload.birth_date
        row.height_cm = payload.height_cm
        row.weight_kg = Decimal(str(payload.weight_kg))
        row.activity_level = payload.activity_level
        row.goal = payload.goal
        row.override_kcal = payload.override_kcal
        row.override_protein_g = payload.override_protein_g
        row.override_carbs_g = payload.override_carbs_g
        row.override_fat_g = payload.override_fat_g
        row.updated_at = now

    session.commit()
    return _profile_out(row)


@router.get("/targets/me", response_model=NutritionTargetsOut)
def get_targets_me(user: CurrentUser, session: DbSession) -> NutritionTargetsOut:
    row = session.execute(
        select(NutritionProfile).where(
            NutritionProfile.tenant_id == user.tenant_id,
            NutritionProfile.user_id == user.id,
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="nutrition_profile_not_found")

    age_years = age_years_from_birth_date(birth_date=row.birth_date, as_of=date.today())
    targets = calculate_targets(
        NutritionInputs(
            sex=row.sex,
            age_years=age_years,
            height_cm=row.height_cm,
            weight_kg=float(row.weight_kg),
            activity_level=row.activity_level,
            goal=row.goal,
            override_kcal=row.override_kcal,
            override_protein_g=row.override_protein_g,
            override_carbs_g=row.override_carbs_g,
            override_fat_g=row.override_fat_g,
        )
    )

    return NutritionTargetsOut(
        daily={
            "kcal": targets.daily_kcal,
            "protein_g": targets.daily_protein_g,
            "carbs_g": targets.daily_carbs_g,
            "fat_g": targets.daily_fat_g,
        },
        weekly={
            "kcal": targets.weekly_kcal,
            "protein_g": targets.weekly_protein_g,
            "carbs_g": targets.weekly_carbs_g,
            "fat_g": targets.weekly_fat_g,
        },
        warnings=targets.warnings,
    )
