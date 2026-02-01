import argparse
import json
import os
import sys
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import cast
import xml.etree.ElementTree as ET

from app.services.bedca_client import (
    BedcaClient,
    build_level_2_query,
    build_level_3_query,
    build_level_3f_query,
)


FG_ID_TO_CATEGORIA = {
    1: "Lácteos",
    2: "Huevos",
    3: "Carnes",
    4: "Pescados",
    5: "Aceites",
    6: "Cereales",
    7: "Legumbres",
    8: "Verduras",
    9: "Frutas",
    10: "Otros",
    11: "Bebidas",
}

PASTA_KEYWORDS = ("arroz", "pasta", "fideo", "macarr", "espagu", "tallar", "cusc", "quinoa")
PAN_KEYWORDS = ("pan", "boll", "tost", "pico", "baguette")
SALSA_KEYWORDS = ("salsa", "mayonesa", "ketchup", "mostaza", "tomate frito", "pesto")

REQUIRED_COMPONENTS = {
    "energy": "409",
    "protein": "416",
    "carbs": "53",
    "fat": "410",
}

OPTIONAL_COMPONENTS = {
    "fiber": "307",
    "sodium": "323",
}

ALLOWED_VALUE_TYPES = {"BE", "AR", "LZ"}


def _collapse_spaces(value):
    return " ".join(value.split())


def _parse_float(value):
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    value = value.replace(",", ".")
    try:
        return float(value)
    except ValueError:
        return None


def _round_2(value):
    try:
        return float(Decimal(str(value)).quantize(Decimal("0.01")))
    except (InvalidOperation, ValueError):
        return None


def _get_text(elem, tag):
    if elem is None:
        return None
    child = elem.find(tag)
    if child is None or child.text is None:
        return None
    return child.text


def _refine_categoria(nombre, categoria, fg_id):
    lower = nombre.lower()
    if any(keyword in lower for keyword in PASTA_KEYWORDS):
        return "Pasta y arroz"
    if any(keyword in lower for keyword in PAN_KEYWORDS):
        return "Pan"
    if any(keyword in lower for keyword in SALSA_KEYWORDS):
        return "Salsas"
    if "cereal" in lower and fg_id == 6:
        return categoria
    return categoria


def _build_notas(food_id, origin, fg_id):
    return "\n".join(
        [
            "Fuente: BEDCA",
            f"BEDCA f_id: {food_id}",
            f"BEDCA origen: {origin}",
            f"BEDCA fg_id: {fg_id}",
        ]
    )


def _parse_food_values(food_elem):
    values = {}
    if food_elem is None:
        return values
    food_elem = cast(ET.Element, food_elem)
    for food_value in food_elem.findall("foodvalue"):
        c_id = _get_text(food_value, "c_id")
        if not c_id:
            continue
        value_type = _get_text(food_value, "value_type")
        if value_type and value_type not in ALLOWED_VALUE_TYPES:
            continue
        raw_value = _get_text(food_value, "best_location")
        unit = _get_text(food_value, "v_unit")
        if (raw_value is None or raw_value.strip() == "") and value_type != "LZ":
            continue
        parsed_value = 0.0 if value_type == "LZ" else _parse_float(raw_value)
        if parsed_value is None:
            continue
        existing = values.get(c_id)
        if existing and existing.get("value_type") != "LZ":
            continue
        values[c_id] = {"value": parsed_value, "unit": unit, "value_type": value_type}
    return values


def _extract_macros(values, min_required):
    energy = values.get(REQUIRED_COMPONENTS["energy"])
    protein = values.get(REQUIRED_COMPONENTS["protein"])
    carbs = values.get(REQUIRED_COMPONENTS["carbs"])
    fat = values.get(REQUIRED_COMPONENTS["fat"])
    fiber = values.get(OPTIONAL_COMPONENTS["fiber"])
    sodium = values.get(OPTIONAL_COMPONENTS["sodium"])

    missing = []
    if "energy" in min_required and not energy:
        missing.append("energy")
    if "protein" in min_required and not protein:
        missing.append("protein")
    if "carbs" in min_required and not carbs:
        missing.append("carbs")
    if "fat" in min_required and not fat:
        missing.append("fat")

    if missing:
        return None, missing

    kcal = None
    if energy:
        unit = (energy.get("unit") or "").lower()
        if "kj" in unit:
            kcal = energy["value"] / 4.184
        elif "kcal" in unit:
            kcal = energy["value"]
        else:
            kcal = energy["value"] / 4.184

    protein_g = protein["value"] if protein else None
    carbs_g = carbs["value"] if carbs else None
    fat_g = fat["value"] if fat else None
    fiber_g = fiber["value"] if fiber else None

    sal_g = None
    if sodium:
        sodio_mg = sodium["value"]
        sodio_g = sodio_mg / 1000.0
        sal_g = sodio_g * 2.5

    return {
        "kcal": _round_2(kcal) if kcal is not None else None,
        "proteina": _round_2(protein_g) if protein_g is not None else None,
        "carbohidratos": _round_2(carbs_g) if carbs_g is not None else None,
        "grasas": _round_2(fat_g) if fat_g is not None else None,
        "fibra": _round_2(fiber_g) if fiber_g is not None else None,
        "sal": _round_2(sal_g) if sal_g is not None else None,
    }, []


def _validate_macros(macros):
    for key in ("proteina", "carbohidratos", "grasas", "fibra"):
        value = macros.get(key)
        if value is None:
            continue
        if value < 0 or value > 100:
            return False
    kcal = macros.get("kcal")
    if kcal is None or kcal <= 0:
        return False
    return True


def _load_existing(output_path):
    if not os.path.exists(output_path):
        return []
    with open(output_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get("items", [])
    return []


def _write_output(output_path, items):
    payload = {
        "source": "BEDCA",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "items": items,
    }
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)


def _load_output_items(output_path):
    data = _load_existing(output_path)
    return data


def main():
    parser = argparse.ArgumentParser(description="Importa alimentos BEDCA y genera un JSON local.")
    parser.add_argument("--group-ids", default="1,2,3,4,5,6,7,8,9,11")
    parser.add_argument("--origins", default="BEDCA,BEDCA2")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--rate-limit-ms", type=int, default=200)
    parser.add_argument("--min-required", default="energy,protein,carbs,fat")
    parser.add_argument("--update-existing", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--supermercado", default="BEDCA")
    parser.add_argument("--write-db", action="store_true", help="Inserta/actualiza en la base de datos.")
    parser.add_argument(
        "--from-file",
        action="store_true",
        help="Carga los datos desde el fichero en lugar de llamar a BEDCA.",
    )
    parser.add_argument(
        "--output",
        default="backend/data/bedca_ingredientes.json",
        help="Ruta del fichero JSON de salida.",
    )

    args = parser.parse_args()

    group_ids = [int(value.strip()) for value in args.group_ids.split(",") if value.strip()]
    origins = [value.strip() for value in args.origins.split(",") if value.strip()]
    min_required = {value.strip() for value in args.min_required.split(",") if value.strip()}

    foods_queue = []
    errors_http = 0
    errors_parse = 0

    client = None
    if not args.from_file:
        client = BedcaClient(rate_limit_ms=args.rate_limit_ms)

        try:
            client.post_query(build_level_3_query())
        except Exception:
            pass

        assert client is not None
        for fg_id in group_ids:
            for origin in origins:
                try:
                    root = client.post_query(build_level_3f_query(fg_id, origin))
                except Exception:
                    errors_http += 1
                    continue
                if root is None:
                    errors_parse += 1
                    continue
                for food in root.findall("food"):
                    f_id = _get_text(food, "f_id")
                    if not f_id:
                        continue
                    foods_queue.append((f_id.strip(), fg_id, origin))

        if args.limit is not None:
            foods_queue = foods_queue[: args.limit]

    existing_items = []
    existing_index = {}
    if args.update_existing and not args.dry_run:
        existing_items = _load_existing(args.output)
        for item in existing_items:
            key = (item.get("fuente"), item.get("fuente_id"))
            if all(key):
                existing_index[key] = item

    output_items = list(existing_items) if args.update_existing else []
    added = 0
    updated = 0
    skipped = 0

    if args.from_file:
        output_items = _load_output_items(args.output)
        added = len(output_items)
        total = added
    else:
        assert client is not None
        for food_id, fg_id, origin in foods_queue:
            try:
                root = client.post_query(build_level_2_query(food_id))
            except Exception:
                errors_http += 1
                continue

            if root is None:
                errors_parse += 1
                continue

            food_elem = root.find("food")
            if food_elem is None:
                errors_parse += 1
                continue

            nombre = _get_text(food_elem, "f_ori_name") or ""
            nombre = _collapse_spaces(nombre)
            if not nombre:
                skipped += 1
                continue

            values = _parse_food_values(food_elem)
            macros, missing = _extract_macros(values, min_required)
            if macros is None:
                skipped += 1
                continue

            if not _validate_macros(macros):
                skipped += 1
                continue

            categoria = FG_ID_TO_CATEGORIA.get(fg_id, "Otros")
            categoria = _refine_categoria(nombre, categoria, fg_id)

            item = {
                "nombre": nombre,
                "categoria": categoria,
                "supermercado": args.supermercado,
                "calorias_por_100g": macros["kcal"],
                "proteinas_por_100g": macros["proteina"],
                "carbohidratos_por_100g": macros["carbohidratos"],
                "grasas_por_100g": macros["grasas"],
                "fibra_por_100g": macros.get("fibra"),
                "sal_por_100g": macros.get("sal"),
                "notas": _build_notas(food_id, origin, fg_id),
                "fuente": "BEDCA",
                "fuente_id": str(food_id),
                "bedca_origen": origin,
                "bedca_fg_id": fg_id,
            }

            key = (item["fuente"], item["fuente_id"])
            if args.update_existing and key in existing_index:
                existing_index[key].update(item)
                updated += 1
            else:
                output_items.append(item)
                added += 1

        total = len(foods_queue)

    print("BEDCA import summary")
    print(f"Total foods queued: {total}")
    print(f"Added: {added}")
    print(f"Updated: {updated}")
    print(f"Skipped: {skipped}")
    print(f"HTTP errors: {errors_http}")
    print(f"Parse errors: {errors_parse}")

    if args.dry_run:
        examples = output_items[:3]
        if examples:
            print("Sample items:")
            for example in examples:
                print(json.dumps(example, ensure_ascii=False, indent=2))
        return 0

    _write_output(args.output, output_items)
    print(f"Output written to: {args.output}")

    if args.write_db:
        from app.database import SessionLocal
        from app.models.ingrediente import Ingrediente, CategoriaIngrediente

        db = SessionLocal()
        batch_size = 100
        batch_count = 0

        try:
            for item in output_items:
                try:
                    categoria_value = CategoriaIngrediente(item["categoria"])
                except ValueError:
                    categoria_value = CategoriaIngrediente.OTROS

                lookup = db.query(Ingrediente).filter(
                    Ingrediente.nombre == item["nombre"],
                    Ingrediente.categoria == categoria_value,
                    Ingrediente.supermercado == item["supermercado"],
                )
                existing = lookup.first() if args.update_existing else None

                if existing:
                    existing.categoria = categoria_value  # type: ignore[assignment]
                    existing.calorias_por_100g = item["calorias_por_100g"]
                    existing.proteinas_por_100g = item["proteinas_por_100g"]
                    existing.carbohidratos_por_100g = item["carbohidratos_por_100g"]
                    existing.grasas_por_100g = item["grasas_por_100g"]
                    fibra_value = item.get("fibra_por_100g") or 0
                    sal_value = item.get("sal_por_100g") or 0
                    existing.fibra_por_100g = Decimal(str(fibra_value))  # type: ignore[assignment]
                    existing.sal_por_100g = Decimal(str(sal_value))  # type: ignore[assignment]
                    existing.notas = item.get("notas")
                else:
                    ingrediente = Ingrediente(
                        nombre=item["nombre"],
                        categoria=categoria_value,
                        supermercado=item["supermercado"],
                        calorias_por_100g=item["calorias_por_100g"],
                        proteinas_por_100g=item["proteinas_por_100g"],
                        carbohidratos_por_100g=item["carbohidratos_por_100g"],
                        grasas_por_100g=item["grasas_por_100g"],
                        fibra_por_100g=Decimal(str(item.get("fibra_por_100g") or 0)),
                        sal_por_100g=Decimal(str(item.get("sal_por_100g") or 0)),
                        notas=item.get("notas"),
                    )
                    db.add(ingrediente)

                batch_count += 1
                if batch_count >= batch_size:
                    db.commit()
                    batch_count = 0

            if batch_count:
                db.commit()
        finally:
            db.close()

        print("DB insert completed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
