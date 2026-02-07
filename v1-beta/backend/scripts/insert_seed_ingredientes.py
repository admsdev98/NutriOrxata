import argparse
from decimal import Decimal

from app.database import SessionLocal
from app.models.ingrediente import Ingrediente, CategoriaIngrediente


SEED_INGREDIENTES = [
    {
        "nombre": "Macarrones integrales Hacendado",
        "categoria": "Pasta y arroz",
        "calorias_por_100g": 350,
        "proteinas_por_100g": 12.0,
        "carbohidratos_por_100g": 70.0,
        "grasas_por_100g": 2.5,
        "fibra_por_100g": 8.0,
    },
    {
        "nombre": "Arroz basmati Hacendado",
        "categoria": "Pasta y arroz",
        "calorias_por_100g": 345,
        "proteinas_por_100g": 7.5,
        "carbohidratos_por_100g": 78.0,
        "grasas_por_100g": 0.5,
        "fibra_por_100g": 1.5,
    },
    {
        "nombre": "Espaguetis integrales Hacendado",
        "categoria": "Pasta y arroz",
        "calorias_por_100g": 348,
        "proteinas_por_100g": 13.0,
        "carbohidratos_por_100g": 68.0,
        "grasas_por_100g": 2.8,
        "fibra_por_100g": 9.0,
    },
    {
        "nombre": "Fideos de arroz",
        "categoria": "Pasta y arroz",
        "calorias_por_100g": 360,
        "proteinas_por_100g": 3.5,
        "carbohidratos_por_100g": 83.0,
        "grasas_por_100g": 0.5,
        "fibra_por_100g": 1.0,
    },
    {
        "nombre": "Carne picada mixta Hacendado",
        "categoria": "Carnes",
        "calorias_por_100g": 220,
        "proteinas_por_100g": 18.0,
        "carbohidratos_por_100g": 0,
        "grasas_por_100g": 17.5,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Pechuga de pollo Hacendado",
        "categoria": "Carnes",
        "calorias_por_100g": 110,
        "proteinas_por_100g": 23.0,
        "carbohidratos_por_100g": 0,
        "grasas_por_100g": 2.5,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Pavo en filetes Hacendado",
        "categoria": "Carnes",
        "calorias_por_100g": 105,
        "proteinas_por_100g": 22.0,
        "carbohidratos_por_100g": 0.5,
        "grasas_por_100g": 1.5,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Lomo de cerdo",
        "categoria": "Carnes",
        "calorias_por_100g": 143,
        "proteinas_por_100g": 21.0,
        "carbohidratos_por_100g": 0,
        "grasas_por_100g": 6.5,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Ternera para guisar",
        "categoria": "Carnes",
        "calorias_por_100g": 150,
        "proteinas_por_100g": 20.0,
        "carbohidratos_por_100g": 0,
        "grasas_por_100g": 8.0,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Salmón fresco",
        "categoria": "Pescados",
        "calorias_por_100g": 180,
        "proteinas_por_100g": 20.0,
        "carbohidratos_por_100g": 0,
        "grasas_por_100g": 12.0,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Merluza congelada Hacendado",
        "categoria": "Pescados",
        "calorias_por_100g": 85,
        "proteinas_por_100g": 17.0,
        "carbohidratos_por_100g": 0,
        "grasas_por_100g": 2.0,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Atún al natural Hacendado",
        "categoria": "Pescados",
        "calorias_por_100g": 108,
        "proteinas_por_100g": 25.0,
        "carbohidratos_por_100g": 0,
        "grasas_por_100g": 1.0,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Gambas peladas congeladas",
        "categoria": "Pescados",
        "calorias_por_100g": 85,
        "proteinas_por_100g": 18.0,
        "carbohidratos_por_100g": 0,
        "grasas_por_100g": 1.0,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Bacalao desalado",
        "categoria": "Pescados",
        "calorias_por_100g": 82,
        "proteinas_por_100g": 18.0,
        "carbohidratos_por_100g": 0,
        "grasas_por_100g": 0.7,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Cebolla",
        "categoria": "Verduras",
        "calorias_por_100g": 40,
        "proteinas_por_100g": 1.0,
        "carbohidratos_por_100g": 9.0,
        "grasas_por_100g": 0.1,
        "fibra_por_100g": 1.7,
    },
    {
        "nombre": "Tomate natural",
        "categoria": "Verduras",
        "calorias_por_100g": 18,
        "proteinas_por_100g": 0.9,
        "carbohidratos_por_100g": 3.5,
        "grasas_por_100g": 0.2,
        "fibra_por_100g": 1.2,
    },
    {
        "nombre": "Espárragos verdes",
        "categoria": "Verduras",
        "calorias_por_100g": 20,
        "proteinas_por_100g": 2.2,
        "carbohidratos_por_100g": 2.0,
        "grasas_por_100g": 0.2,
        "fibra_por_100g": 2.0,
    },
    {
        "nombre": "Calabacín",
        "categoria": "Verduras",
        "calorias_por_100g": 17,
        "proteinas_por_100g": 1.2,
        "carbohidratos_por_100g": 3.1,
        "grasas_por_100g": 0.3,
        "fibra_por_100g": 1.0,
    },
    {
        "nombre": "Pimiento rojo",
        "categoria": "Verduras",
        "calorias_por_100g": 31,
        "proteinas_por_100g": 1.0,
        "carbohidratos_por_100g": 6.0,
        "grasas_por_100g": 0.3,
        "fibra_por_100g": 2.1,
    },
    {
        "nombre": "Zanahoria",
        "categoria": "Verduras",
        "calorias_por_100g": 41,
        "proteinas_por_100g": 0.9,
        "carbohidratos_por_100g": 10.0,
        "grasas_por_100g": 0.2,
        "fibra_por_100g": 2.8,
    },
    {
        "nombre": "Brócoli",
        "categoria": "Verduras",
        "calorias_por_100g": 34,
        "proteinas_por_100g": 2.8,
        "carbohidratos_por_100g": 7.0,
        "grasas_por_100g": 0.4,
        "fibra_por_100g": 2.6,
    },
    {
        "nombre": "Espinacas frescas",
        "categoria": "Verduras",
        "calorias_por_100g": 23,
        "proteinas_por_100g": 2.9,
        "carbohidratos_por_100g": 3.6,
        "grasas_por_100g": 0.4,
        "fibra_por_100g": 2.2,
    },
    {
        "nombre": "Plátano",
        "categoria": "Frutas",
        "calorias_por_100g": 89,
        "proteinas_por_100g": 1.1,
        "carbohidratos_por_100g": 23.0,
        "grasas_por_100g": 0.3,
        "fibra_por_100g": 2.6,
    },
    {
        "nombre": "Manzana",
        "categoria": "Frutas",
        "calorias_por_100g": 52,
        "proteinas_por_100g": 0.3,
        "carbohidratos_por_100g": 14.0,
        "grasas_por_100g": 0.2,
        "fibra_por_100g": 2.4,
    },
    {
        "nombre": "Fresas",
        "categoria": "Frutas",
        "calorias_por_100g": 32,
        "proteinas_por_100g": 0.7,
        "carbohidratos_por_100g": 7.7,
        "grasas_por_100g": 0.3,
        "fibra_por_100g": 2.0,
    },
    {
        "nombre": "Naranja",
        "categoria": "Frutas",
        "calorias_por_100g": 47,
        "proteinas_por_100g": 0.9,
        "carbohidratos_por_100g": 12.0,
        "grasas_por_100g": 0.1,
        "fibra_por_100g": 2.4,
    },
    {
        "nombre": "Queso rallado Hacendado",
        "categoria": "Lácteos",
        "calorias_por_100g": 400,
        "proteinas_por_100g": 26.0,
        "carbohidratos_por_100g": 2.0,
        "grasas_por_100g": 33.0,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Yogur griego natural Hacendado",
        "categoria": "Lácteos",
        "calorias_por_100g": 97,
        "proteinas_por_100g": 9.0,
        "carbohidratos_por_100g": 4.0,
        "grasas_por_100g": 5.0,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Leche desnatada Hacendado",
        "categoria": "Lácteos",
        "calorias_por_100g": 35,
        "proteinas_por_100g": 3.5,
        "carbohidratos_por_100g": 5.0,
        "grasas_por_100g": 0.1,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Queso fresco batido 0%",
        "categoria": "Lácteos",
        "calorias_por_100g": 55,
        "proteinas_por_100g": 8.0,
        "carbohidratos_por_100g": 4.0,
        "grasas_por_100g": 0.2,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Huevos L Hacendado",
        "categoria": "Huevos",
        "calorias_por_100g": 155,
        "proteinas_por_100g": 13.0,
        "carbohidratos_por_100g": 1.1,
        "grasas_por_100g": 11.0,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Lentejas cocidas Hacendado",
        "categoria": "Legumbres",
        "calorias_por_100g": 115,
        "proteinas_por_100g": 9.0,
        "carbohidratos_por_100g": 20.0,
        "grasas_por_100g": 0.4,
        "fibra_por_100g": 7.9,
    },
    {
        "nombre": "Garbanzos cocidos Hacendado",
        "categoria": "Legumbres",
        "calorias_por_100g": 120,
        "proteinas_por_100g": 8.0,
        "carbohidratos_por_100g": 18.0,
        "grasas_por_100g": 2.0,
        "fibra_por_100g": 6.0,
    },
    {
        "nombre": "Alubias blancas cocidas",
        "categoria": "Legumbres",
        "calorias_por_100g": 100,
        "proteinas_por_100g": 7.0,
        "carbohidratos_por_100g": 17.0,
        "grasas_por_100g": 0.5,
        "fibra_por_100g": 6.0,
    },
    {
        "nombre": "Pan integral de molde Hacendado",
        "categoria": "Pan",
        "calorias_por_100g": 240,
        "proteinas_por_100g": 9.0,
        "carbohidratos_por_100g": 44.0,
        "grasas_por_100g": 3.0,
        "fibra_por_100g": 6.5,
    },
    {
        "nombre": "Avena integral Hacendado",
        "categoria": "Cereales",
        "calorias_por_100g": 370,
        "proteinas_por_100g": 13.0,
        "carbohidratos_por_100g": 60.0,
        "grasas_por_100g": 7.0,
        "fibra_por_100g": 10.0,
    },
    {
        "nombre": "Copos de maíz Hacendado",
        "categoria": "Cereales",
        "calorias_por_100g": 378,
        "proteinas_por_100g": 7.0,
        "carbohidratos_por_100g": 84.0,
        "grasas_por_100g": 0.9,
        "fibra_por_100g": 3.0,
    },
    {
        "nombre": "Aceite de oliva virgen extra",
        "categoria": "Aceites",
        "calorias_por_100g": 900,
        "proteinas_por_100g": 0,
        "carbohidratos_por_100g": 0,
        "grasas_por_100g": 100,
        "fibra_por_100g": 0,
    },
    {
        "nombre": "Tomate frito Hacendado",
        "categoria": "Salsas",
        "calorias_por_100g": 85,
        "proteinas_por_100g": 1.5,
        "carbohidratos_por_100g": 12.0,
        "grasas_por_100g": 3.5,
        "fibra_por_100g": 1.8,
    },
    {
        "nombre": "Salsa de soja",
        "categoria": "Salsas",
        "calorias_por_100g": 53,
        "proteinas_por_100g": 5.0,
        "carbohidratos_por_100g": 6.0,
        "grasas_por_100g": 0.1,
        "fibra_por_100g": 0,
    },
]


def insert_seed_ingredientes(update_existing: bool, dry_run: bool) -> int:
    db = SessionLocal()
    added = 0
    updated = 0
    try:
        for item in SEED_INGREDIENTES:
            try:
                categoria_value = CategoriaIngrediente(item["categoria"])
            except ValueError:
                categoria_value = CategoriaIngrediente.OTROS

            supermercado = item.get("supermercado", "Mercadona")
            lookup = db.query(Ingrediente).filter(
                Ingrediente.nombre == item["nombre"],
                Ingrediente.categoria == categoria_value,
                Ingrediente.supermercado == supermercado,
            )
            existing = lookup.first() if update_existing else None

            if existing:
                existing.categoria = categoria_value  # type: ignore[assignment]
                existing.calorias_por_100g = item["calorias_por_100g"]
                existing.proteinas_por_100g = item["proteinas_por_100g"]
                existing.carbohidratos_por_100g = item["carbohidratos_por_100g"]
                existing.grasas_por_100g = item["grasas_por_100g"]
                existing.fibra_por_100g = Decimal(str(item.get("fibra_por_100g") or 0))  # type: ignore[assignment]
                existing.sal_por_100g = Decimal(str(item.get("sal_por_100g") or 0))  # type: ignore[assignment]
                updated += 1
                continue

            ingrediente = Ingrediente(
                nombre=item["nombre"],
                categoria=categoria_value,
                supermercado=supermercado,
                calorias_por_100g=item["calorias_por_100g"],
                proteinas_por_100g=item["proteinas_por_100g"],
                carbohidratos_por_100g=item["carbohidratos_por_100g"],
                grasas_por_100g=item["grasas_por_100g"],
                fibra_por_100g=Decimal(str(item.get("fibra_por_100g") or 0)),
                sal_por_100g=Decimal(str(item.get("sal_por_100g") or 0)),
            )
            db.add(ingrediente)
            added += 1

        if dry_run:
            db.rollback()
        else:
            db.commit()
    finally:
        db.close()

    print("Seed ingredientes summary")
    print(f"Total: {len(SEED_INGREDIENTES)}")
    print(f"Added: {added}")
    print(f"Updated: {updated}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Inserta ingredientes seed locales en la base de datos.")
    parser.add_argument("--update-existing", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    return insert_seed_ingredientes(args.update_existing, args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())
