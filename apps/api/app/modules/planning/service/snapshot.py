from __future__ import annotations

from collections.abc import Iterable


DAY_ORDER = {
    "mon": 1,
    "tue": 2,
    "wed": 3,
    "thu": 4,
    "fri": 5,
    "sat": 6,
    "sun": 7,
}


def item_sort_key(day_key: str, slot_key: str) -> tuple[int, str]:
    return (DAY_ORDER.get(day_key, 99), slot_key)


def has_duplicate_day_slot(items: Iterable[tuple[str, str]]) -> bool:
    seen: set[tuple[str, str]] = set()
    for day_key, slot_key in items:
        key = (day_key, slot_key)
        if key in seen:
            return True
        seen.add(key)
    return False
