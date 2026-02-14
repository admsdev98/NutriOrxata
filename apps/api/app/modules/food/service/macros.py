from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


@dataclass(frozen=True)
class MacroPer100g:
    kcal: Decimal
    protein_g: Decimal
    carbs_g: Decimal
    fat_g: Decimal


@dataclass(frozen=True)
class MacroTotals:
    kcal: Decimal
    protein_g: Decimal
    carbs_g: Decimal
    fat_g: Decimal


_Q = Decimal("0.01")
_HUNDRED = Decimal("100")


def _q(value: Decimal) -> Decimal:
    return value.quantize(_Q, rounding=ROUND_HALF_UP)


def compute_item_totals(per_100g: MacroPer100g, *, quantity_g: Decimal) -> MacroTotals:
    factor = quantity_g / _HUNDRED
    return MacroTotals(
        kcal=_q(per_100g.kcal * factor),
        protein_g=_q(per_100g.protein_g * factor),
        carbs_g=_q(per_100g.carbs_g * factor),
        fat_g=_q(per_100g.fat_g * factor),
    )


def compute_template_totals(items: list[tuple[MacroPer100g, Decimal]]) -> MacroTotals:
    kcal = Decimal("0")
    protein = Decimal("0")
    carbs = Decimal("0")
    fat = Decimal("0")

    for per_100g, quantity_g in items:
        totals = compute_item_totals(per_100g, quantity_g=quantity_g)
        kcal += totals.kcal
        protein += totals.protein_g
        carbs += totals.carbs_g
        fat += totals.fat_g

    return MacroTotals(
        kcal=_q(kcal),
        protein_g=_q(protein),
        carbs_g=_q(carbs),
        fat_g=_q(fat),
    )
