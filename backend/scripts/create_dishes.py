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

def main():
    db = SessionLocal()

    # 1. Ensure basic Ingredients exist
    # (Nombre, Categoria, Calorias, Proteinas, Carbohidratos, Grasas) per 100g
    ingredients_to_seed = {
        "Pan Integral": {"categoria": CategoriaIngrediente.PAN, "calorias_por_100g": 250, "proteinas_por_100g": 9, "carbohidratos_por_100g": 45, "grasas_por_100g": 2},
        "Tomate": {"categoria": CategoriaIngrediente.VERDURAS, "calorias_por_100g": 18, "proteinas_por_100g": 1, "carbohidratos_por_100g": 4, "grasas_por_100g": 0.2},
        "Aceite de Olivia": {"categoria": CategoriaIngrediente.ACEITES, "calorias_por_100g": 884, "proteinas_por_100g": 0, "carbohidratos_por_100g": 0, "grasas_por_100g": 100},
        "Avena": {"categoria": CategoriaIngrediente.CEREALES, "calorias_por_100g": 389, "proteinas_por_100g": 16, "carbohidratos_por_100g": 66, "grasas_por_100g": 7},
        "Leche Semidesnatada": {"categoria": CategoriaIngrediente.LACTEOS, "calorias_por_100g": 46, "proteinas_por_100g": 3.4, "carbohidratos_por_100g": 4.8, "grasas_por_100g": 1.6},
        "Huevo": {"categoria": CategoriaIngrediente.HUEVOS, "calorias_por_100g": 155, "proteinas_por_100g": 13, "carbohidratos_por_100g": 1, "grasas_por_100g": 11},
        "Arroz Integral": {"categoria": CategoriaIngrediente.PASTA_ARROZ, "calorias_por_100g": 111, "proteinas_por_100g": 2.6, "carbohidratos_por_100g": 23, "grasas_por_100g": 0.9},
        "Pollo (Pechuga)": {"categoria": CategoriaIngrediente.CARNES, "calorias_por_100g": 165, "proteinas_por_100g": 31, "carbohidratos_por_100g": 0, "grasas_por_100g": 3.6},
        "Mezcla de Verduras": {"categoria": CategoriaIngrediente.VERDURAS, "calorias_por_100g": 40, "proteinas_por_100g": 2, "carbohidratos_por_100g": 6, "grasas_por_100g": 0.5},
        "Lentejas (cocidas)": {"categoria": CategoriaIngrediente.LEGUMBRES, "calorias_por_100g": 116, "proteinas_por_100g": 9, "carbohidratos_por_100g": 20, "grasas_por_100g": 0.4},
        "Yogur Natural": {"categoria": CategoriaIngrediente.LACTEOS, "calorias_por_100g": 60, "proteinas_por_100g": 4, "carbohidratos_por_100g": 5, "grasas_por_100g": 3},
        "Nueces": {"categoria": CategoriaIngrediente.OTROS, "calorias_por_100g": 654, "proteinas_por_100g": 15, "carbohidratos_por_100g": 14, "grasas_por_100g": 65},
        "Manzana": {"categoria": CategoriaIngrediente.FRUTAS, "calorias_por_100g": 52, "proteinas_por_100g": 0.3, "carbohidratos_por_100g": 14, "grasas_por_100g": 0.2},
        "Pavo (Fiambre)": {"categoria": CategoriaIngrediente.CARNES, "calorias_por_100g": 105, "proteinas_por_100g": 18, "carbohidratos_por_100g": 2, "grasas_por_100g": 2},
        "Merluza": {"categoria": CategoriaIngrediente.PESCADOS, "calorias_por_100g": 78, "proteinas_por_100g": 17, "carbohidratos_por_100g": 0, "grasas_por_100g": 1.2},
        "Patata": {"categoria": CategoriaIngrediente.VERDURAS, "calorias_por_100g": 77, "proteinas_por_100g": 2, "carbohidratos_por_100g": 17, "grasas_por_100g": 0.1},
        "Calabacin": {"categoria": CategoriaIngrediente.VERDURAS, "calorias_por_100g": 17, "proteinas_por_100g": 1.2, "carbohidratos_por_100g": 3, "grasas_por_100g": 0.3},
    }

    for name, data in ingredients_to_seed.items():
        get_or_create_ingrediente(db, name, data)

    # 2. Create Dishes
    dishes = [
        # DESAYUNO
        {
            "nombre": "Tostadas con tomate y aceite",
            "momento": [MomentoDia.DESAYUNO],
            "descripcion": "Desayuno clásico mediterráneo.",
            "ingredientes": [("Pan Integral", 60), ("Tomate", 30), ("Aceite de Olivia", 10)]
        },
        {
            "nombre": "Porridge de avena",
            "momento": [MomentoDia.DESAYUNO],
            "descripcion": "Avena cocida con leche.",
            "ingredientes": [("Avena", 40), ("Leche Semidesnatada", 200)]
        },
        {
            "nombre": "Huevos revueltos sencillos",
            "momento": [MomentoDia.DESAYUNO],
            "descripcion": "Dos huevos revueltos.",
            "ingredientes": [("Huevo", 120)]
        },
        {
            "nombre": "Yogur con manzana y nueces",
            "momento": [MomentoDia.DESAYUNO],
            "descripcion": "Desayuno frio con fruta y frutos secos.",
            "ingredientes": [("Yogur Natural", 125), ("Manzana", 150), ("Nueces", 15)]
        },
        
        # COMIDA (LUNCH)
        {
            "nombre": "Arroz con verduras",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Arroz integral salteado con verduras variadas.",
            "ingredientes": [("Arroz Integral", 80), ("Mezcla de Verduras", 150), ("Aceite de Olivia", 5)]
        },
        {
            "nombre": "Pollo a la plancha con patatas",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Pechuga de pollo a la plancha con guarnición de patata cocida.",
            "ingredientes": [("Pollo (Pechuga)", 150), ("Patata", 200), ("Aceite de Olivia", 5)]
        },
        {
            "nombre": "Lentejas estofadas",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Plato de cuchara nutritivo.",
            "ingredientes": [("Lentejas (cocidas)", 250), ("Mezcla de Verduras", 100), ("Patata", 80)]
        },
        {
            "nombre": "Pollo con verduras y arroz",
            "momento": [MomentoDia.COMIDA],
            "descripcion": "Pechuga de pollo con arroz integral y verduras.",
            "ingredientes": [("Pollo (Pechuga)", 140), ("Arroz Integral", 70), ("Mezcla de Verduras", 120), ("Aceite de Olivia", 5)]
        },

        # MERIENDA (SNACK)
        {
            "nombre": "Yogur con nueces",
            "momento": [MomentoDia.MERIENDA],
            "descripcion": "Merienda rica en proteínas y grasas saludables.",
            "ingredientes": [("Yogur Natural", 125), ("Nueces", 15)]
        },
        {
            "nombre": "Manzana",
            "momento": [MomentoDia.MERIENDA],
            "descripcion": "Una pieza de fruta fresca.",
            "ingredientes": [("Manzana", 180)]
        },
        {
            "nombre": "Sandwich de pavo",
            "momento": [MomentoDia.MERIENDA],
            "descripcion": "Sandwich ligero de fiambre de pavo.",
            "ingredientes": [("Pan Integral", 50), ("Pavo (Fiambre)", 40)]
        },
        {
            "nombre": "Tostada de tomate y pavo",
            "momento": [MomentoDia.MERIENDA],
            "descripcion": "Tostada con tomate rallado y pavo.",
            "ingredientes": [("Pan Integral", 60), ("Tomate", 40), ("Pavo (Fiambre)", 40), ("Aceite de Olivia", 5)]
        },

        # CENA (DINNER)
        {
            "nombre": "Merluza al horno con calabacín",
            "momento": [MomentoDia.CENA],
            "descripcion": "Cena ligera de pescado blanco.",
            "ingredientes": [("Merluza", 150), ("Calabacin", 200), ("Aceite de Olivia", 5)]
        },
        {
            "nombre": "Tortilla francesa",
            "momento": [MomentoDia.CENA],
            "descripcion": "Cena rápida y proteica.",
            "ingredientes": [("Huevo", 120), ("Aceite de Olivia", 5)]
        },
        {
            "nombre": "Crema de verduras",
            "momento": [MomentoDia.CENA],
            "descripcion": "Crema suave de verduras variadas.",
            "ingredientes": [("Mezcla de Verduras", 300), ("Patata", 50), ("Aceite de Olivia", 5)]
        }
        ,
        {
            "nombre": "Ensalada templada de lentejas",
            "momento": [MomentoDia.CENA],
            "descripcion": "Lentejas con verduras salteadas y aceite.",
            "ingredientes": [("Lentejas (cocidas)", 200), ("Mezcla de Verduras", 120), ("Aceite de Olivia", 5)]
        }
    ]

    for dish in dishes:
        create_plato(db, dish["nombre"], dish["momento"], dish["descripcion"], dish["ingredientes"])

    db.close()

if __name__ == "__main__":
    main()
