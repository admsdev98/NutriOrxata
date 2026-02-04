from decimal import Decimal

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.ingrediente import Ingrediente
from app.models.plato import MomentoDia, Plato, PlatoIngrediente


def create_plato(
    db: Session,
    nombre: str,
    momentos: list,
    descripcion: str,
    ingredientes_data: list[tuple[str, int]],
) -> None:
    existing = db.query(Plato).filter(Plato.nombre == nombre).first()
    if existing:
        print(f"Plato ya existe: {nombre}")
        return

    momentos_list: list[str] = []
    for item in momentos:
        if isinstance(item, MomentoDia):
            momentos_list.append(item.value)
        else:
            momentos_list.append(str(item))

    plato = Plato(nombre=nombre, descripcion=descripcion, momentos_dia=momentos_list)
    db.add(plato)
    db.commit()
    db.refresh(plato)

    total_calorias = Decimal(0)
    total_proteinas = Decimal(0)
    total_carbohidratos = Decimal(0)
    total_grasas = Decimal(0)
    total_peso = Decimal(0)

    inserted = 0
    for ing_name, grams in ingredientes_data:
        ing = db.query(Ingrediente).filter(Ingrediente.nombre == ing_name).first()
        if not ing:
            print(f"  ERROR: Ingrediente no encontrado: {ing_name} (plato: {nombre})")
            continue

        ratio = Decimal(grams) / Decimal(100)
        cal = ing.calorias_por_100g * ratio
        prot = ing.proteinas_por_100g * ratio
        carb = ing.carbohidratos_por_100g * ratio
        gras = ing.grasas_por_100g * ratio

        db.add(
            PlatoIngrediente(
                plato_id=plato.id,
                ingrediente_id=ing.id,
                cantidad_gramos=grams,
                calorias_aportadas=cal,
                proteinas_aportadas=prot,
                carbohidratos_aportados=carb,
                grasas_aportadas=gras,
            )
        )

        total_calorias += cal
        total_proteinas += prot
        total_carbohidratos += carb
        total_grasas += gras
        total_peso += Decimal(grams)
        inserted += 1

    plato.calorias_totales = total_calorias
    plato.proteinas_totales = total_proteinas
    plato.carbohidratos_totales = total_carbohidratos
    plato.grasas_totales = total_grasas
    plato.peso_total_gramos = total_peso
    db.commit()

    print(f"Creado: {nombre} ({inserted}/{len(ingredientes_data)} ingredientes)")


def main() -> None:
    db = SessionLocal()
    try:
        dishes = [
            # DESAYUNO / ALMUERZO / MERIENDA
            {
                "nombre": "Tostada integral con tomate y AOVE",
                "momento": [MomentoDia.DESAYUNO],
                "descripcion": "Clasico mediterraneo: pan integral, tomate y aceite de oliva.",
                "ingredientes": [
                    ("Pan Integral", 70),
                    ("Tomate (Ensalada)", 80),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Porridge de avena con leche y platano",
                "momento": [MomentoDia.DESAYUNO],
                "descripcion": "Avena sencilla y saciante con fruta.",
                "ingredientes": [
                    ("Copos de Avena", 50),
                    ("Leche Desnatada", 250),
                    ("Plátano", 120),
                ],
            },
            {
                "nombre": "Gachas de harina de avena (HSN) con leche",
                "momento": [MomentoDia.DESAYUNO],
                "descripcion": "Harina de avena para una textura mas fina (tipo crema).",
                "ingredientes": [
                    ("Harina de Avena (Sabores)", 50),
                    ("Leche Desnatada", 250),
                ],
            },
            {
                "nombre": "Tortitas de avena y claras",
                "momento": [MomentoDia.DESAYUNO],
                "descripcion": "Tortitas rapidas: harina de avena + claras.",
                "ingredientes": [
                    ("Harina de Avena (Sabores)", 50),
                    ("Claras de Huevo (Bote)", 200),
                ],
            },
            {
                "nombre": "Batido de whey vainilla con platano",
                "momento": [MomentoDia.DESAYUNO, MomentoDia.MERIENDA],
                "descripcion": "Batido sencillo para subir proteina.",
                "ingredientes": [
                    ("Evowhey Protein 2.0 (Vainilla)", 30),
                    ("Leche Desnatada", 250),
                    ("Plátano", 120),
                ],
            },
            {
                "nombre": "Bowl proteico: queso fresco batido con manzana y nueces",
                "momento": [MomentoDia.DESAYUNO, MomentoDia.MERIENDA],
                "descripcion": "Dulce, barato y alto en proteina.",
                "ingredientes": [
                    ("Queso Fresco Batido 0%", 250),
                    ("Manzana", 180),
                    ("Nueces (Peladas)", 15),
                ],
            },
            {
                "nombre": "Yogur proteinas con fresas",
                "momento": [MomentoDia.ALMUERZO, MomentoDia.MERIENDA],
                "descripcion": "Snack rapido alto en proteina.",
                "ingredientes": [
                    ("Yogur Proteínas (+Proteinas)", 200),
                    ("Fresas / Fresones", 150),
                ],
            },
            {
                "nombre": "Bocadillo integral de atun y tomate",
                "momento": [MomentoDia.ALMUERZO],
                "descripcion": "Facil y muy economico: atun al natural + tomate.",
                "ingredientes": [
                    ("Pan Integral", 90),
                    ("Atún Claro al Natural", 90),
                    ("Tomate (Ensalada)", 80),
                ],
            },
            {
                "nombre": "Kefir con naranja",
                "momento": [MomentoDia.ALMUERZO, MomentoDia.MERIENDA],
                "descripcion": "Opcion fresca y digestiva.",
                "ingredientes": [
                    ("Kéfir", 250),
                    ("Naranja", 200),
                ],
            },

            # COMIDA
            {
                "nombre": "Ensalada de garbanzos con atun",
                "momento": [MomentoDia.COMIDA],
                "descripcion": "Legumbre + proteina + AOVE: base mediterranea.",
                "ingredientes": [
                    ("Garbanzos Cocidos (Bote)", 250),
                    ("Atún Claro al Natural", 80),
                    ("Tomate (Ensalada)", 150),
                    ("Cebolla", 50),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Alubias con atun y tomate",
                "momento": [MomentoDia.COMIDA],
                "descripcion": "Ensalada completa sin cocinar.",
                "ingredientes": [
                    ("Alubias Cocidas (Bote)", 250),
                    ("Atún Claro al Natural", 80),
                    ("Tomate (Ensalada)", 150),
                    ("Cebolla", 40),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Arroz basmati con pollo y verduras",
                "momento": [MomentoDia.COMIDA],
                "descripcion": "Plato barato de batch cooking.",
                "ingredientes": [
                    ("Arroz Basmati (Crudo)", 80),
                    ("Pechuga de Pollo (Filetes)", 170),
                    ("Calabacín", 150),
                    ("Pimiento Rojo", 80),
                    ("Cebolla", 60),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Lentejas con verduras (express)",
                "momento": [MomentoDia.COMIDA],
                "descripcion": "Lenteja de bote con sofrito simple.",
                "ingredientes": [
                    ("Lentejas Cocidas (Bote)", 300),
                    ("Cebolla", 60),
                    ("Zanahoria", 80),
                    ("Tomate (Ensalada)", 120),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Pasta integral con tomate frito y pollo",
                "momento": [MomentoDia.COMIDA],
                "descripcion": "Pasta sencilla con proteina magra.",
                "ingredientes": [
                    ("Pasta Integral (Cruda)", 90),
                    ("Pechuga de Pollo (Filetes)", 160),
                    ("Tomate Frito (Estilo casero)", 140),
                    ("Aceite de Oliva Virgen Extra", 5),
                ],
            },
            {
                "nombre": "Quinoa con pollo y aguacate",
                "momento": [MomentoDia.COMIDA],
                "descripcion": "Bowl mediterraneo completo.",
                "ingredientes": [
                    ("Quinoa (Cruda)", 70),
                    ("Pechuga de Pollo (Filetes)", 150),
                    ("Aguacate", 80),
                    ("Tomate (Ensalada)", 120),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Pavo con brocoli y soja",
                "momento": [MomentoDia.COMIDA],
                "descripcion": "Salteado rapido alto en proteina.",
                "ingredientes": [
                    ("Solomillo de Pavo", 180),
                    ("Brócoli", 250),
                    ("Salsa de Soja", 10),
                    ("Aceite de Oliva Virgen Extra", 5),
                ],
            },

            # CENA
            {
                "nombre": "Merluza con patata y pimiento",
                "momento": [MomentoDia.CENA],
                "descripcion": "Pescado blanco con guarnicion sencilla.",
                "ingredientes": [
                    ("Merluza (Filetes/Lomos)", 200),
                    ("Patata", 220),
                    ("Pimiento Verde", 80),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Bacalao con tomate y cebolla",
                "momento": [MomentoDia.CENA],
                "descripcion": "Bacalao a la plancha con tomate y cebolla salteados.",
                "ingredientes": [
                    ("Bacalao (Desalado/Fresco)", 200),
                    ("Tomate (Ensalada)", 200),
                    ("Cebolla", 60),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Revuelto de espinacas y champinones",
                "momento": [MomentoDia.CENA],
                "descripcion": "Cena rapida con verduras y huevo.",
                "ingredientes": [
                    ("Huevo (Tamaño M/L)", 140),
                    ("Espinacas (Frescas)", 120),
                    ("Champiñones", 150),
                    ("Aceite de Oliva Virgen Extra", 5),
                ],
            },
            {
                "nombre": "Tortilla de patata y cebolla (ligera)",
                "momento": [MomentoDia.CENA],
                "descripcion": "Tortilla sencilla con AOVE (racion moderada).",
                "ingredientes": [
                    ("Patata", 250),
                    ("Cebolla", 80),
                    ("Huevo (Tamaño M/L)", 200),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Crema de calabacin",
                "momento": [MomentoDia.CENA],
                "descripcion": "Crema simple: calabacin + cebolla + AOVE.",
                "ingredientes": [
                    ("Calabacín", 350),
                    ("Cebolla", 60),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Salmon con esparragos",
                "momento": [MomentoDia.CENA],
                "descripcion": "Pescado azul con verdura sencilla.",
                "ingredientes": [
                    ("Salmón (Lomos)", 170),
                    ("Espárragos Verdes", 200),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
            {
                "nombre": "Ensalada de quinoa con pepino y tomate",
                "momento": [MomentoDia.CENA],
                "descripcion": "Cena fresca tipo tabule simplificado.",
                "ingredientes": [
                    ("Quinoa (Cruda)", 60),
                    ("Pepino", 150),
                    ("Tomate (Ensalada)", 200),
                    ("Aceite de Oliva Virgen Extra", 10),
                ],
            },
        ]

        for dish in dishes:
            create_plato(
                db,
                dish["nombre"],
                dish["momento"],
                dish["descripcion"],
                dish["ingredientes"],
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()
