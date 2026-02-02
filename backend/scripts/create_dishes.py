import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.plato import Plato, PlatoIngrediente, MomentoDia
from app.models.ingrediente import Ingrediente, CategoriaIngrediente
from decimal import Decimal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_or_create_ingrediente(db: Session, nombre: str, defaults: dict) -> Ingrediente:
    ingrediente = db.query(Ingrediente).filter(Ingrediente.nombre == nombre).first()
    if not ingrediente:
        print(f"Creando ingrediente: {nombre}")
        ingrediente = Ingrediente(nombre=nombre, **defaults)
        db.add(ingrediente)
        db.commit()
        db.refresh(ingrediente)
    return ingrediente

def create_plato(db: Session, nombre: str, momentos: list, descripcion: str, ingredientes_data: list):
    # Check if plato exists
    existing = db.query(Plato).filter(Plato.nombre == nombre).first()
    if existing:
        print(f"Plato ya existe: {nombre}")
        return

    print(f"Creando plato: {nombre}")
    momentos_list = []
    for item in momentos:
        if isinstance(item, MomentoDia):
            momentos_list.append(item.value)
        else:
            momentos_list.append(str(item))

    plato = Plato(
        nombre=nombre,
        descripcion=descripcion,
        momentos_dia=momentos_list
    )
    db.add(plato)
    db.commit()
    db.refresh(plato)

    total_calorias = Decimal(0)
    total_proteinas = Decimal(0)
    total_carbohidratos = Decimal(0)
    total_grasas = Decimal(0)
    total_fibra = Decimal(0)
    total_peso = Decimal(0)

    for ing_name, grams in ingredientes_data:
        ing = db.query(Ingrediente).filter(Ingrediente.nombre == ing_name).first()
        if not ing:
            print(f"  ERROR: Ingrediente no encontrado {ing_name}, saltando.")
            continue
        
        ratio = Decimal(grams) / Decimal(100)
        cal = ing.calorias_por_100g * ratio
        prot = ing.proteinas_por_100g * ratio
        carb = ing.carbohidratos_por_100g * ratio
        gras = ing.grasas_por_100g * ratio

        plato_ing = PlatoIngrediente(
            plato_id=plato.id,
            ingrediente_id=ing.id,
            cantidad_gramos=grams,
            calorias_aportadas=cal,
            proteinas_aportadas=prot,
            carbohidratos_aportados=carb,
            grasas_aportadas=gras
        )
        db.add(plato_ing)

        total_calorias += cal
        total_proteinas += prot
        total_carbohidratos += carb
        total_grasas += gras
        # Fibre is not always populated but good to have if model supports it
        # total_fibra += (ing.fibra_por_100g or 0) * ratio
        total_peso += Decimal(grams)

    plato.calorias_totales = total_calorias
    plato.proteinas_totales = total_proteinas
    plato.carbohidratos_totales = total_carbohidratos
    plato.grasas_totales = total_grasas
    plato.peso_total_gramos = total_peso
    
    db.commit()
    print(f"  Plato creado con {len(ingredientes_data)} ingredientes.")


def recalc_plato_totals(db: Session, plato: Plato) -> None:
    total_calorias = Decimal(0)
    total_proteinas = Decimal(0)
    total_carbohidratos = Decimal(0)
    total_grasas = Decimal(0)
    total_fibra = Decimal(0)
    total_peso = Decimal(0)

    for pi in plato.ingredientes:
        ing = db.query(Ingrediente).filter(Ingrediente.id == pi.ingrediente_id).first()
        if not ing:
            continue
        ratio = Decimal(pi.cantidad_gramos) / Decimal(100)
        cal = ing.calorias_por_100g * ratio
        prot = ing.proteinas_por_100g * ratio
        carb = ing.carbohidratos_por_100g * ratio
        gras = ing.grasas_por_100g * ratio
        fibra = (ing.fibra_por_100g or 0) * ratio

        pi.calorias_aportadas = cal
        pi.proteinas_aportadas = prot
        pi.carbohidratos_aportados = carb
        pi.grasas_aportadas = gras

        total_calorias += cal
        total_proteinas += prot
        total_carbohidratos += carb
        total_grasas += gras
        total_fibra += Decimal(str(fibra))
        total_peso += Decimal(pi.cantidad_gramos)

    plato.calorias_totales = total_calorias
    plato.proteinas_totales = total_proteinas
    plato.carbohidratos_totales = total_carbohidratos
    plato.grasas_totales = total_grasas
    plato.fibra_totales = total_fibra
    plato.peso_total_gramos = total_peso

    db.commit()


def ensure_ingrediente_in_plato(db: Session, plato_nombre: str, ingrediente_nombre: str, gramos: int) -> None:
    plato = db.query(Plato).filter(Plato.nombre == plato_nombre).first()
    if not plato:
        return
    ingrediente = db.query(Ingrediente).filter(Ingrediente.nombre == ingrediente_nombre).first()
    if not ingrediente:
        print(f"  ERROR: Ingrediente no encontrado {ingrediente_nombre}, saltando.")
        return
    existing = db.query(PlatoIngrediente).filter(
        PlatoIngrediente.plato_id == plato.id,
        PlatoIngrediente.ingrediente_id == ingrediente.id,
    ).first()
    if existing:
        return

    plato_ing = PlatoIngrediente(
        plato_id=plato.id,
        ingrediente_id=ingrediente.id,
        cantidad_gramos=gramos,
    )
    db.add(plato_ing)
    db.commit()
    db.refresh(plato)
    recalc_plato_totals(db, plato)

def main():
    db = SessionLocal()

    dishes = [
        # DESAYUNO
        {
            "nombre": "Tostadas con tomate y aceite",
            "momento": [MomentoDia.DESAYUNO],
            "descripcion": "Desayuno clásico mediterráneo y económico.",
            "ingredientes": [("Pan de Molde Integral 100%", 60), ("Tomate (Ensalada)", 40), ("Aceite de Oliva Virgen Extra", 10)]
        },
        {
            "nombre": "Avena con leche y plátano",
            "momento": [MomentoDia.DESAYUNO],
            "descripcion": "Avena cocida con leche y fruta.",
            "ingredientes": [("Copos de Avena", 40), ("Leche Desnatada", 200), ("Plátano", 100)]
        },
        {
            "nombre": "Yogur griego con frutos rojos y nueces",
            "momento": [MomentoDia.DESAYUNO],
            "descripcion": "Desayuno frío con grasas saludables.",
            "ingredientes": [("Yogur Griego Natural", 170), ("Arándanos", 80), ("Nueces (Peladas)", 15)]
        },
        {
            "nombre": "Tortilla de claras con espinacas",
            "momento": [MomentoDia.DESAYUNO],
            "descripcion": "Proteína rápida con verduras.",
            "ingredientes": [("Claras de Huevo (Bote)", 200), ("Espinacas (Frescas)", 80), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Tostada de pavo y queso fresco",
            "momento": [MomentoDia.DESAYUNO],
            "descripcion": "Salado ligero con proteína.",
            "ingredientes": [("Pan de Molde Integral 100%", 60), ("Pechuga de Pavo (Fiambre 90%+ carne)", 60), ("Queso Fresco Burgos 0%", 60)]
        },

        # ALMUERZO
        {
            "nombre": "Bocadillo integral de atún",
            "momento": [MomentoDia.ALMUERZO],
            "descripcion": "Media mañana con proteína y carbohidratos.",
            "ingredientes": [("Pan Integral", 80), ("Atún Claro al Natural", 80), ("Tomate (Ensalada)", 60)]
        },
        {
            "nombre": "Queso fresco batido con manzana",
            "momento": [MomentoDia.ALMUERZO],
            "descripcion": "Rápido, ligero y barato.",
            "ingredientes": [("Queso Fresco Batido 0%", 200), ("Manzana", 150)]
        },
        {
            "nombre": "Yogur proteico con plátano",
            "momento": [MomentoDia.ALMUERZO],
            "descripcion": "Proteína rápida con fruta.",
            "ingredientes": [("Yogur Proteínas (+Proteinas)", 200), ("Plátano", 120)]
        },
        {
            "nombre": "Tortitas de arroz con jamón serrano",
            "momento": [MomentoDia.ALMUERZO],
            "descripcion": "Snack salado con proteína.",
            "ingredientes": [("Tortitas de Arroz", 40), ("Jamón Serrano (Reserva)", 40)]
        },
        {
            "nombre": "Kéfir con fresas",
            "momento": [MomentoDia.ALMUERZO],
            "descripcion": "Opción fresca y fácil.",
            "ingredientes": [("Kéfir", 250), ("Fresas / Fresones", 120)]
        },
        
        # COMIDA (LUNCH)
        {
            "nombre": "Pollo con arroz basmati y brócoli",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Plato clásico y equilibrado.",
            "ingredientes": [("Pechuga de Pollo (Filetes)", 160), ("Arroz Basmati (Crudo)", 80), ("Brócoli", 150), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Salmón con quinoa y espárragos",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Pescado graso con carbohidratos de calidad.",
            "ingredientes": [("Salmón (Lomos)", 160), ("Quinoa (Cruda)", 70), ("Espárragos Verdes", 150), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Ensalada de garbanzos con atún",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Legumbre con proteína y grasas saludables.",
            "ingredientes": [("Garbanzos Cocidos (Bote)", 220), ("Atún Claro al Natural", 80), ("Tomate (Ensalada)", 100), ("Cebolla", 40), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Lentejas con verduras y arroz integral",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Plato completo con carbohidratos y proteína vegetal.",
            "ingredientes": [("Lentejas Cocidas (Bote)", 240), ("Arroz Integral (Crudo)", 60), ("Zanahoria", 60), ("Pimiento Rojo", 60), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Pavo con boniato y ensalada",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Plato alto en proteína con carbohidrato complejo.",
            "ingredientes": [("Solomillo de Pavo", 170), ("Boniato / Batata", 200), ("Lechuga Romana", 80), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Pasta integral con tomate y parmesano",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Pasta fácil con grasas controladas.",
            "ingredientes": [("Pasta Integral (Cruda)", 90), ("Tomate Frito (Estilo casero)", 120), ("Queso Parmesano (Grana Padano)", 15), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Merluza con patata y pimientos",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Pescado blanco con guarnición sencilla.",
            "ingredientes": [("Merluza (Filetes/Lomos)", 180), ("Patata", 200), ("Pimiento Verde", 60), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Bowl de quinoa con pollo y aguacate",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Plato completo con grasas saludables.",
            "ingredientes": [("Quinoa (Cruda)", 70), ("Pechuga de Pollo (Filetes)", 150), ("Aguacate", 80), ("Tomate (Ensalada)", 80), ("Aceite de Oliva Virgen Extra", 5)]
        },

        # MERIENDA (SNACK)
        {
            "nombre": "Yogur natural con avena y arándanos",
            "momento": [MomentoDia.MERIENDA],
            "descripcion": "Merienda saciante con fibra.",
            "ingredientes": [("Yogur Natural", 200), ("Copos de Avena", 30), ("Arándanos", 80)]
        },
        {
            "nombre": "Sándwich de pavo y tomate",
            "momento": [MomentoDia.MERIENDA],
            "descripcion": "Opción rápida y equilibrada.",
            "ingredientes": [("Pan de Molde Integral 100%", 70), ("Pechuga de Pavo (Fiambre 90%+ carne)", 60), ("Tomate (Ensalada)", 50)]
        },
        {
            "nombre": "Queso fresco batido con pera",
            "momento": [MomentoDia.MERIENDA],
            "descripcion": "Merienda dulce y ligera.",
            "ingredientes": [("Queso Fresco Batido 0%", 200), ("Pera", 150)]
        },
        {
            "nombre": "Tostada con crema de cacahuete y plátano",
            "momento": [MomentoDia.MERIENDA],
            "descripcion": "Merienda energética con grasas saludables.",
            "ingredientes": [("Pan Integral", 60), ("Crema de Cacahuete 100%", 20), ("Plátano", 100)]
        },

        # CENA (DINNER)
        {
            "nombre": "Tortilla francesa con verduras",
            "momento": [MomentoDia.CENA],
            "descripcion": "Cena rápida con proteína y verduras.",
            "ingredientes": [("Huevo (Tamaño M/L)", 140), ("Pimiento Rojo", 80), ("Calabacín", 150), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Salmón con brócoli",
            "momento": [MomentoDia.CENA],
            "descripcion": "Cena ligera con grasas saludables.",
            "ingredientes": [("Salmón (Lomos)", 150), ("Brócoli", 200), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Ensalada de quinoa con verduras",
            "momento": [MomentoDia.CENA],
            "descripcion": "Cena fresca con carbohidratos y grasas saludables.",
            "ingredientes": [("Quinoa (Cruda)", 60), ("Pepino", 100), ("Tomate (Ensalada)", 120), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Revuelto de setas y gambones",
            "momento": [MomentoDia.CENA],
            "descripcion": "Cena proteica y ligera.",
            "ingredientes": [("Setas (Variadas)", 150), ("Gambones", 140), ("Huevo (Tamaño M/L)", 100), ("Aceite de Oliva Virgen Extra", 5)]
        },
        {
            "nombre": "Crema de calabacín",
            "momento": [MomentoDia.CENA],
            "descripcion": "Crema ligera y económica.",
            "ingredientes": [("Calabacín", 300), ("Cebolla", 40), ("Aceite de Oliva Virgen Extra", 5)]
        }
    ]

    for dish in dishes:
        create_plato(db, dish["nombre"], dish["momento"], dish["descripcion"], dish["ingredientes"])

    db.close()

if __name__ == "__main__":
    main()
