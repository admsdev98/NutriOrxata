import sys
import os

# Añadir el directorio padre (backend/src) al path para poder importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from app.database import SessionLocal
from app.models.ingrediente import Ingrediente, CategoriaIngrediente

# Lista masiva de ingredientes
# Nota: "supermercado" se establece a "Blanca" para marcas de supermercado genéricas.
ingredientes_data = [
    # --- CARNES Y AVES ---
    # Pollo
    {"nombre": "Pechuga de Pollo (Filetes)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 113, "proteinas": 23, "carbohidratos": 0, "grasas": 2.5},
    {"nombre": "Pechuga de Pollo (Entera)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 106, "proteinas": 23.1, "carbohidratos": 0, "grasas": 1.2},
    {"nombre": "Contramuslo de Pollo (Sin piel)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 140, "proteinas": 20, "carbohidratos": 0, "grasas": 6.5},
    {"nombre": "Contramuslo de Pollo (Con piel)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 210, "proteinas": 18, "carbohidratos": 0, "grasas": 15},
    {"nombre": "Muslo de Pollo (Entero)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 170, "proteinas": 18, "carbohidratos": 0, "grasas": 11},
    {"nombre": "Alas de Pollo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 203, "proteinas": 18, "carbohidratos": 0, "grasas": 14},
    {"nombre": "Pollo Entero", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 167, "proteinas": 20, "carbohidratos": 0, "grasas": 9.7},
    {"nombre": "Hamburguesa de Pollo/Pavo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 145, "proteinas": 18, "carbohidratos": 2, "grasas": 7},
    # Pavo
    {"nombre": "Solomillo de Pavo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 108, "proteinas": 24, "carbohidratos": 0.5, "grasas": 1},
    {"nombre": "Estofado de Pavo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 115, "proteinas": 22, "carbohidratos": 0, "grasas": 2.8},
    {"nombre": "Chuleta de Pavo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 125, "proteinas": 21, "carbohidratos": 0, "grasas": 4.5},
    # Cerdo
    {"nombre": "Lomo de Cerdo (Cinta fresca)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 125, "proteinas": 22, "carbohidratos": 0, "grasas": 4},
    {"nombre": "Solomillo de Cerdo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 110, "proteinas": 21, "carbohidratos": 0, "grasas": 2.5},
    {"nombre": "Chuleta de Cerdo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 230, "proteinas": 17, "carbohidratos": 0, "grasas": 18},
    {"nombre": "Costillas de Cerdo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 280, "proteinas": 16, "carbohidratos": 0, "grasas": 24},
    {"nombre": "Magro de Cerdo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 155, "proteinas": 20, "carbohidratos": 0, "grasas": 8},
    {"nombre": "Panceta de Cerdo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 450, "proteinas": 12, "carbohidratos": 0, "grasas": 45},
    # Vacuno
    {"nombre": "Filete de Ternera (1ª Categoría)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 130, "proteinas": 21, "carbohidratos": 0, "grasas": 5},
    {"nombre": "Entrecot de Ternera", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 180, "proteinas": 20, "carbohidratos": 0, "grasas": 11},
    {"nombre": "Carne Picada Vacuno (Burger Meat)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 220, "proteinas": 18, "carbohidratos": 1, "grasas": 16},
    {"nombre": "Carne para Guisar (Vacuno)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 160, "proteinas": 20, "carbohidratos": 0, "grasas": 9},
    # Otros
    {"nombre": "Carne Picada Pollo y Pavo", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 147, "proteinas": 19, "carbohidratos": 1, "grasas": 7.5},
    {"nombre": "Carne Picada Mixta (Cerdo/Vacuno)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 240, "proteinas": 17, "carbohidratos": 1, "grasas": 19},
    {"nombre": "Conejo (Entero/Troceado)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 135, "proteinas": 22, "carbohidratos": 0, "grasas": 5.5},

    # --- EMBUTIDOS Y FIAMBRES ---
    {"nombre": "Pechuga de Pavo (Fiambre 90%+ carne)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 95, "proteinas": 19, "carbohidratos": 1.5, "grasas": 1.5},
    {"nombre": "Jamón Cocido Extra", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 110, "proteinas": 18, "carbohidratos": 1.5, "grasas": 3.5},
    {"nombre": "Jamón Serrano (Reserva)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 240, "proteinas": 30, "carbohidratos": 0.5, "grasas": 12},
    {"nombre": "Lomo Embuchado", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 195, "proteinas": 38, "carbohidratos": 0.5, "grasas": 5},
    {"nombre": "Lacón Cocido", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 120, "proteinas": 18, "carbohidratos": 0.5, "grasas": 5},
    {"nombre": "Cecina de Vacuno", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 230, "proteinas": 39, "carbohidratos": 0, "grasas": 8},
    {"nombre": "Chorizo (Rodajas/Vela)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 455, "proteinas": 24, "carbohidratos": 1.9, "grasas": 38},
    {"nombre": "Salchichón", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 440, "proteinas": 23, "carbohidratos": 2, "grasas": 37},
    {"nombre": "Fuet", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 420, "proteinas": 25, "carbohidratos": 3, "grasas": 34},
    {"nombre": "Mortadela (con aceitunas)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 310, "proteinas": 12, "carbohidratos": 3, "grasas": 28},
    {"nombre": "Salchichas Frankfurt (Pollo)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 250, "proteinas": 12, "carbohidratos": 5, "grasas": 20},
    {"nombre": "Bacon (Ahumado)", "categoria": CategoriaIngrediente.CARNES, "supermercado": "Blanca", "calorias": 305, "proteinas": 15, "carbohidratos": 0.5, "grasas": 27},

    # --- PESCADOS Y MARISCOS ---
    # Blancos
    {"nombre": "Merluza (Filetes/Lomos)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 72, "proteinas": 17, "carbohidratos": 0, "grasas": 0.8},
    {"nombre": "Bacalao (Desalado/Fresco)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 78, "proteinas": 18, "carbohidratos": 0, "grasas": 0.6},
    {"nombre": "Lubina", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 95, "proteinas": 19, "carbohidratos": 0, "grasas": 2.5},
    {"nombre": "Dorada", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 90, "proteinas": 18.5, "carbohidratos": 0, "grasas": 2},
    {"nombre": "Gallo", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 80, "proteinas": 17, "carbohidratos": 0, "grasas": 1.5},
    {"nombre": "Lenguado", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 85, "proteinas": 17.5, "carbohidratos": 0, "grasas": 1.5},
    {"nombre": "Rape", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 82, "proteinas": 16, "carbohidratos": 0, "grasas": 2},
    # Azules
    {"nombre": "Salmón (Lomos)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 208, "proteinas": 20, "carbohidratos": 0, "grasas": 13},
    {"nombre": "Salmón Ahumado", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 180, "proteinas": 23, "carbohidratos": 0, "grasas": 10},
    {"nombre": "Emperador / Pez Espada", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 120, "proteinas": 20, "carbohidratos": 0, "grasas": 4.5},
    {"nombre": "Sardinas (Frescas)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 140, "proteinas": 18, "carbohidratos": 0, "grasas": 8},
    {"nombre": "Trucha", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 120, "proteinas": 19, "carbohidratos": 0, "grasas": 5},
    # Cefalópodos y Marisco
    {"nombre": "Sepia (Limpia)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 75, "proteinas": 16, "carbohidratos": 0.7, "grasas": 0.9},
    {"nombre": "Calamar (Anillas/Entero)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 80, "proteinas": 16, "carbohidratos": 0.5, "grasas": 1.5},
    {"nombre": "Pulpo (Cocido)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 86, "proteinas": 18, "carbohidratos": 1, "grasas": 1},
    {"nombre": "Langostinos Cocidos", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 95, "proteinas": 22, "carbohidratos": 0.5, "grasas": 1},
    {"nombre": "Gambones", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 90, "proteinas": 20, "carbohidratos": 0.5, "grasas": 1},
    {"nombre": "Mejillones (Frescos/Vapor)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 70, "proteinas": 12, "carbohidratos": 2, "grasas": 1.5},
    {"nombre": "Almejas / Chirlas", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 50, "proteinas": 10, "carbohidratos": 1, "grasas": 0.5},
    {"nombre": "Surimi (Palitos de cangrejo)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 100, "proteinas": 8, "carbohidratos": 12, "grasas": 2},
    {"nombre": "Gulas (Sucedáneo)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 210, "proteinas": 6, "carbohidratos": 8, "grasas": 18},

    # --- CONSERVAS (Pescado) ---
    {"nombre": "Atún Claro al Natural", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 100, "proteinas": 24, "carbohidratos": 0, "grasas": 1},
    {"nombre": "Atún Claro en Aceite Oliva", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 190, "proteinas": 26, "carbohidratos": 0, "grasas": 10},
    {"nombre": "Atún Claro en Aceite Girasol", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 185, "proteinas": 25, "carbohidratos": 0, "grasas": 9},
    {"nombre": "Bonito del Norte (Aceite Oliva)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 200, "proteinas": 27, "carbohidratos": 0, "grasas": 11},
    {"nombre": "Sardinillas (Aceite Oliva)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 210, "proteinas": 22, "carbohidratos": 0, "grasas": 13},
    {"nombre": "Caballa (Filetes Aceite)", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 200, "proteinas": 24, "carbohidratos": 0, "grasas": 11},
    {"nombre": "Mejillones en Escabeche", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 160, "proteinas": 14, "carbohidratos": 4, "grasas": 9},
    {"nombre": "Berberechos al Natural", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 50, "proteinas": 10, "carbohidratos": 1.5, "grasas": 0.5},
    {"nombre": "Anchoas en Aceite", "categoria": CategoriaIngrediente.PESCADOS, "supermercado": "Blanca", "calorias": 210, "proteinas": 29, "carbohidratos": 0, "grasas": 10},

    # --- HUEVOS ---
    {"nombre": "Huevo (Tamaño M/L)", "categoria": CategoriaIngrediente.HUEVOS, "supermercado": "Blanca", "calorias": 140, "proteinas": 12.5, "carbohidratos": 0.5, "grasas": 9.7},
    {"nombre": "Claras de Huevo (Bote)", "categoria": CategoriaIngrediente.HUEVOS, "supermercado": "Blanca", "calorias": 50, "proteinas": 11, "carbohidratos": 0.7, "grasas": 0.2},
    {"nombre": "Huevo Codorniz", "categoria": CategoriaIngrediente.HUEVOS, "supermercado": "Blanca", "calorias": 158, "proteinas": 13, "carbohidratos": 0.4, "grasas": 11},
    {"nombre": "Yema de Huevo", "categoria": CategoriaIngrediente.HUEVOS, "supermercado": "Blanca", "calorias": 322, "proteinas": 16, "carbohidratos": 0.2, "grasas": 28},

    # --- LÁCTEOS Y DERIVADOS ---
    # Leches
    {"nombre": "Leche Entera", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 63, "proteinas": 3.1, "carbohidratos": 4.7, "grasas": 3.6},
    {"nombre": "Leche Semidesnatada", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 46, "proteinas": 3.1, "carbohidratos": 4.7, "grasas": 1.6},
    {"nombre": "Leche Desnatada", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 34, "proteinas": 3.2, "carbohidratos": 4.8, "grasas": 0.1},
    {"nombre": "Leche Sin Lactosa (Semi)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 40, "proteinas": 3.2, "carbohidratos": 4.7, "grasas": 1.6},
    {"nombre": "Bebida de Soja 0% Azúcar", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 35, "proteinas": 3.3, "carbohidratos": 1.5, "grasas": 1.8},
    {"nombre": "Bebida de Avena 0% Azúcar", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 40, "proteinas": 1, "carbohidratos": 7, "grasas": 0.8},
    {"nombre": "Bebida de Almendra 0% Azúcar", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 14, "proteinas": 0.5, "carbohidratos": 0.3, "grasas": 1.2},
    # Yogures
    {"nombre": "Yogur Natural", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 60, "proteinas": 3.5, "carbohidratos": 4.5, "grasas": 3},
    {"nombre": "Yogur Griego Natural", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 120, "proteinas": 3, "carbohidratos": 4, "grasas": 10},
    {"nombre": "Yogur Griego Ligero", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 60, "proteinas": 4, "carbohidratos": 5, "grasas": 2},
    {"nombre": "Kéfir", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 65, "proteinas": 3.5, "carbohidratos": 4, "grasas": 3.5},
    {"nombre": "Queso Fresco Batido 0%", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 46, "proteinas": 8, "carbohidratos": 3.5, "grasas": 0.1},
    {"nombre": "Yogur Proteínas (+Proteinas)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 55, "proteinas": 10, "carbohidratos": 4, "grasas": 0.1},
    # Quesos
    {"nombre": "Queso Fresco Burgos", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 160, "proteinas": 10, "carbohidratos": 3, "grasas": 12},
    {"nombre": "Queso Fresco Burgos 0%", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 68, "proteinas": 12, "carbohidratos": 3.5, "grasas": 0.5},
    {"nombre": "Mozzarella (Bola)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 240, "proteinas": 18, "carbohidratos": 1.5, "grasas": 18},
    {"nombre": "Mozzarella Light (Bola)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 165, "proteinas": 19, "carbohidratos": 1.5, "grasas": 9},
    {"nombre": "Queso Havarti Light", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 280, "proteinas": 25, "carbohidratos": 0.1, "grasas": 18},
    {"nombre": "Queso Proteínas (Lonchas)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 170, "proteinas": 30, "carbohidratos": 1, "grasas": 5},
    {"nombre": "Queso Curado (Cuña)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 410, "proteinas": 25, "carbohidratos": 1, "grasas": 34},
    {"nombre": "Queso Semicurado", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 360, "proteinas": 24, "carbohidratos": 1, "grasas": 29},
    {"nombre": "Queso Rallado (Mezcla)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 380, "proteinas": 23, "carbohidratos": 2, "grasas": 31},
    {"nombre": "Queso Parmesano (Grana Padano)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 398, "proteinas": 33, "carbohidratos": 0, "grasas": 29},
    {"nombre": "Queso de Untar (Crema)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 250, "proteinas": 6, "carbohidratos": 3, "grasas": 24},
    {"nombre": "Queso de Untar Light", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 150, "proteinas": 8, "carbohidratos": 5, "grasas": 10},
    {"nombre": "Mascarpone", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 450, "proteinas": 4, "carbohidratos": 3, "grasas": 47},
    {"nombre": "Requesón (Ricotta)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 174, "proteinas": 11, "carbohidratos": 3, "grasas": 13},
    # Otros lácteos
    {"nombre": "Mantequilla (Sin sal)", "categoria": CategoriaIngrediente.ACEITES, "supermercado": "Blanca", "calorias": 717, "proteinas": 0.8, "carbohidratos": 0.1, "grasas": 81},
    {"nombre": "Nata para Cocinar (18% MG)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 195, "proteinas": 2.5, "carbohidratos": 4, "grasas": 18},
    {"nombre": "Nata para Montar (35% MG)", "categoria": CategoriaIngrediente.LACTEOS, "supermercado": "Blanca", "calorias": 340, "proteinas": 2, "carbohidratos": 3, "grasas": 35},

    # --- VERDURAS Y HORTALIZAS ---
    {"nombre": "Tomate (Ensalada)", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 20, "proteinas": 1, "carbohidratos": 3.5, "grasas": 0.2},
    {"nombre": "Tomate Cherry", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 22, "proteinas": 1, "carbohidratos": 4, "grasas": 0.2},
    {"nombre": "Lechuga Iceberg", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 14, "proteinas": 1, "carbohidratos": 1.5, "grasas": 0.1},
    {"nombre": "Lechuga Romana", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 17, "proteinas": 1.2, "carbohidratos": 1.5, "grasas": 0.3},
    {"nombre": "Canónigos", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 21, "proteinas": 2, "carbohidratos": 1, "grasas": 0.4},
    {"nombre": "Rúcula", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 25, "proteinas": 2.6, "carbohidratos": 2, "grasas": 0.7},
    {"nombre": "Espinacas (Frescas)", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 23, "proteinas": 2.9, "carbohidratos": 1, "grasas": 0.4},
    {"nombre": "Acelgas", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 19, "proteinas": 1.8, "carbohidratos": 2, "grasas": 0.2},
    {"nombre": "Brócoli", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 34, "proteinas": 3.8, "carbohidratos": 2, "grasas": 0.4},
    {"nombre": "Coliflor", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 25, "proteinas": 2, "carbohidratos": 2.5, "grasas": 0.3},
    {"nombre": "Repollo", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 25, "proteinas": 1.3, "carbohidratos": 3.5, "grasas": 0.1},
    {"nombre": "Calabacín", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 17, "proteinas": 1.2, "carbohidratos": 2, "grasas": 0.2},
    {"nombre": "Berenjena", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 25, "proteinas": 1, "carbohidratos": 3, "grasas": 0.2},
    {"nombre": "Pepino", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 15, "proteinas": 0.7, "carbohidratos": 2, "grasas": 0.1},
    {"nombre": "Pimiento Rojo", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 31, "proteinas": 1, "carbohidratos": 4.5, "grasas": 0.3},
    {"nombre": "Pimiento Verde", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 20, "proteinas": 0.9, "carbohidratos": 2.5, "grasas": 0.2},
    {"nombre": "Cebolla", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 40, "proteinas": 1.1, "carbohidratos": 7, "grasas": 0.1},
    {"nombre": "Zanahoria", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 41, "proteinas": 0.9, "carbohidratos": 7, "grasas": 0.2},
    {"nombre": "Champiñones", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 22, "proteinas": 3, "carbohidratos": 0.5, "grasas": 0.3},
    {"nombre": "Setas (Variadas)", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 25, "proteinas": 2.5, "carbohidratos": 1, "grasas": 0.3},
    {"nombre": "Espárragos Verdes", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 20, "proteinas": 2.2, "carbohidratos": 1.8, "grasas": 0.1},
    {"nombre": "Espárragos Blancos (Conserva)", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 18, "proteinas": 2, "carbohidratos": 1.5, "grasas": 0.1},
    {"nombre": "Judías Verdes (Planas/Redondas)", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 31, "proteinas": 1.8, "carbohidratos": 4, "grasas": 0.2},
    {"nombre": "Guisantes (Congelados/Frescos)", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 81, "proteinas": 5.4, "carbohidratos": 10, "grasas": 0.4},
    {"nombre": "Maíz Dulce (Conserva)", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 80, "proteinas": 2.5, "carbohidratos": 12, "grasas": 1.5},
    {"nombre": "Puerro", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 61, "proteinas": 1.5, "carbohidratos": 12, "grasas": 0.3},
    {"nombre": "Apio", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 16, "proteinas": 0.7, "carbohidratos": 1.5, "grasas": 0.2},
    {"nombre": "Calabaza", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 26, "proteinas": 1, "carbohidratos": 5, "grasas": 0.1},
    {"nombre": "Patata", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 80, "proteinas": 2, "carbohidratos": 17, "grasas": 0.1},
    {"nombre": "Boniato / Batata", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 105, "proteinas": 1.6, "carbohidratos": 24, "grasas": 0.1},
    {"nombre": "Remolacha (Cocida)", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 43, "proteinas": 1.6, "carbohidratos": 8, "grasas": 0.1},
    {"nombre": "Ajo", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 149, "proteinas": 6, "carbohidratos": 33, "grasas": 0.5},
    {"nombre": "Perejil", "categoria": CategoriaIngrediente.VERDURAS, "supermercado": "Blanca", "calorias": 36, "proteinas": 3, "carbohidratos": 6, "grasas": 0.8},

    # --- FRUTAS ---
    {"nombre": "Plátano", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 89, "proteinas": 1.1, "carbohidratos": 20, "grasas": 0.3},
    {"nombre": "Manzana", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 52, "proteinas": 0.3, "carbohidratos": 12, "grasas": 0.2},
    {"nombre": "Pera", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 57, "proteinas": 0.4, "carbohidratos": 13, "grasas": 0.1},
    {"nombre": "Naranja", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 47, "proteinas": 0.9, "carbohidratos": 9, "grasas": 0.1},
    {"nombre": "Mandarina", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 53, "proteinas": 0.8, "carbohidratos": 11, "grasas": 0.3},
    {"nombre": "Limón", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 29, "proteinas": 1.1, "carbohidratos": 6, "grasas": 0.3},
    {"nombre": "Fresas / Fresones", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 33, "proteinas": 0.7, "carbohidratos": 6, "grasas": 0.3},
    {"nombre": "Kiwi", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 61, "proteinas": 1.1, "carbohidratos": 11, "grasas": 0.5},
    {"nombre": "Piña (Natural)", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 50, "proteinas": 0.5, "carbohidratos": 10, "grasas": 0.1},
    {"nombre": "Melón", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 34, "proteinas": 0.8, "carbohidratos": 8, "grasas": 0.2},
    {"nombre": "Sandía", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 30, "proteinas": 0.6, "carbohidratos": 7, "grasas": 0.2},
    {"nombre": "Uvas (Blancas/Negras)", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 67, "proteinas": 0.6, "carbohidratos": 16, "grasas": 0.3},
    {"nombre": "Melocotón", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 39, "proteinas": 0.9, "carbohidratos": 8, "grasas": 0.3},
    {"nombre": "Nectarina", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 44, "proteinas": 1, "carbohidratos": 9, "grasas": 0.3},
    {"nombre": "Ciruela", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 46, "proteinas": 0.7, "carbohidratos": 10, "grasas": 0.3},
    {"nombre": "Cerezas", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 50, "proteinas": 1, "carbohidratos": 10, "grasas": 0.3},
    {"nombre": "Aguacate", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 160, "proteinas": 2, "carbohidratos": 1.5, "grasas": 15},
    {"nombre": "Mango", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 60, "proteinas": 0.8, "carbohidratos": 13, "grasas": 0.4},
    {"nombre": "Arándanos", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 57, "proteinas": 0.7, "carbohidratos": 12, "grasas": 0.3},
    {"nombre": "Frambuesas", "categoria": CategoriaIngrediente.FRUTAS, "supermercado": "Blanca", "calorias": 52, "proteinas": 1.2, "carbohidratos": 5, "grasas": 0.7},

    # --- LEGUMBRES (Secas y Botes) ---
    {"nombre": "Lentejas (Secas)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 350, "proteinas": 24, "carbohidratos": 54, "grasas": 1.7},
    {"nombre": "Lentejas Cocidas (Bote)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 85, "proteinas": 7, "carbohidratos": 12, "grasas": 0.5},
    {"nombre": "Garbanzos (Secos)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 364, "proteinas": 19, "carbohidratos": 55, "grasas": 6},
    {"nombre": "Garbanzos Cocidos (Bote)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 100, "proteinas": 6, "carbohidratos": 14, "grasas": 2},
    {"nombre": "Alubias Blancas/Pintas (Secas)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 330, "proteinas": 23, "carbohidratos": 45, "grasas": 1.5},
    {"nombre": "Alubias Cocidas (Bote)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 95, "proteinas": 6.5, "carbohidratos": 13, "grasas": 0.6},
    {"nombre": "Alubias Rojas Cocidas (Bote)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 98, "proteinas": 6.8, "carbohidratos": 13.5, "grasas": 0.5},
    {"nombre": "Judías Negras Cocidas (Bote)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 95, "proteinas": 7, "carbohidratos": 13, "grasas": 0.4},
    {"nombre": "Edamame (Congelado)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 120, "proteinas": 11, "carbohidratos": 9, "grasas": 5},

    # --- CEREALES, PAN Y PASTAS ---
    {"nombre": "Arroz Redondo (Crudo)", "categoria": CategoriaIngrediente.PASTA_ARROZ, "supermercado": "Blanca", "calorias": 350, "proteinas": 7, "carbohidratos": 79, "grasas": 0.5},
    {"nombre": "Arroz Basmati (Crudo)", "categoria": CategoriaIngrediente.PASTA_ARROZ, "supermercado": "Blanca", "calorias": 355, "proteinas": 8.5, "carbohidratos": 78, "grasas": 0.8},
    {"nombre": "Arroz Integral (Crudo)", "categoria": CategoriaIngrediente.PASTA_ARROZ, "supermercado": "Blanca", "calorias": 340, "proteinas": 7.5, "carbohidratos": 72, "grasas": 2.5},
    {"nombre": "Quinoa (Cruda)", "categoria": CategoriaIngrediente.PASTA_ARROZ, "supermercado": "Blanca", "calorias": 368, "proteinas": 14, "carbohidratos": 64, "grasas": 6.1},
    {"nombre": "Cuscús (Crudo)", "categoria": CategoriaIngrediente.PASTA_ARROZ, "supermercado": "Blanca", "calorias": 376, "proteinas": 12.8, "carbohidratos": 77, "grasas": 0.6},
    {"nombre": "Bulgur (Crudo)", "categoria": CategoriaIngrediente.PASTA_ARROZ, "supermercado": "Blanca", "calorias": 342, "proteinas": 12.3, "carbohidratos": 75.9, "grasas": 1.3},
    {"nombre": "Pasta (Trigo normal) Cruda", "categoria": CategoriaIngrediente.PASTA_ARROZ, "supermercado": "Blanca", "calorias": 360, "proteinas": 12, "carbohidratos": 74, "grasas": 1.5},
    {"nombre": "Pasta Integral (Cruda)", "categoria": CategoriaIngrediente.PASTA_ARROZ, "supermercado": "Blanca", "calorias": 340, "proteinas": 13, "carbohidratos": 65, "grasas": 2},
    {"nombre": "Copos de Avena", "categoria": CategoriaIngrediente.CEREALES, "supermercado": "Blanca", "calorias": 375, "proteinas": 13.5, "carbohidratos": 60, "grasas": 7},
    {"nombre": "Cereales de Maíz (Corn Flakes 0%)", "categoria": CategoriaIngrediente.CEREALES, "supermercado": "Blanca", "calorias": 370, "proteinas": 7, "carbohidratos": 82, "grasas": 1},
    {"nombre": "Pan Barra (Blanco)", "categoria": CategoriaIngrediente.PAN, "supermercado": "Blanca", "calorias": 260, "proteinas": 8, "carbohidratos": 50, "grasas": 2},
    {"nombre": "Pan Integral", "categoria": CategoriaIngrediente.PAN, "supermercado": "Blanca", "calorias": 240, "proteinas": 9, "carbohidratos": 42, "grasas": 2.5},
    {"nombre": "Pan de Molde Blanco", "categoria": CategoriaIngrediente.PAN, "supermercado": "Blanca", "calorias": 260, "proteinas": 8, "carbohidratos": 46, "grasas": 4},
    {"nombre": "Pan de Molde Integral 100%", "categoria": CategoriaIngrediente.PAN, "supermercado": "Blanca", "calorias": 235, "proteinas": 10, "carbohidratos": 36, "grasas": 3},
    {"nombre": "Pan Burger (Brioche/Normal)", "categoria": CategoriaIngrediente.PAN, "supermercado": "Blanca", "calorias": 280, "proteinas": 9, "carbohidratos": 45, "grasas": 6},
    {"nombre": "Tortitas de Maíz", "categoria": CategoriaIngrediente.CEREALES, "supermercado": "Blanca", "calorias": 385, "proteinas": 7, "carbohidratos": 82, "grasas": 2},
    {"nombre": "Tortitas de Arroz", "categoria": CategoriaIngrediente.CEREALES, "supermercado": "Blanca", "calorias": 380, "proteinas": 8, "carbohidratos": 80, "grasas": 3},
    {"nombre": "Picos / Regañás", "categoria": CategoriaIngrediente.PAN, "supermercado": "Blanca", "calorias": 380, "proteinas": 10, "carbohidratos": 70, "grasas": 6},
    {"nombre": "Pan Tostado (Integral)", "categoria": CategoriaIngrediente.PAN, "supermercado": "Blanca", "calorias": 360, "proteinas": 12, "carbohidratos": 65, "grasas": 5},
    {"nombre": "Harina de Trigo", "categoria": CategoriaIngrediente.CEREALES, "supermercado": "Blanca", "calorias": 340, "proteinas": 10, "carbohidratos": 72, "grasas": 1},

    # --- FRUTOS SECOS (Naturales/Tostados) ---
    {"nombre": "Nueces (Peladas)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "Blanca", "calorias": 650, "proteinas": 15, "carbohidratos": 7, "grasas": 65},
    {"nombre": "Almendras (Naturales)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "Blanca", "calorias": 580, "proteinas": 21, "carbohidratos": 6, "grasas": 50},
    {"nombre": "Anacardos (Natural/Tostado)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "Blanca", "calorias": 570, "proteinas": 18, "carbohidratos": 25, "grasas": 44},
    {"nombre": "Pistachos (Sin sal)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "Blanca", "calorias": 560, "proteinas": 20, "carbohidratos": 17, "grasas": 45},
    {"nombre": "Avellanas", "categoria": CategoriaIngrediente.OTROS, "supermercado": "Blanca", "calorias": 630, "proteinas": 15, "carbohidratos": 7, "grasas": 60},
    {"nombre": "Cacahuetes (Naturales)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "Blanca", "calorias": 570, "proteinas": 26, "carbohidratos": 10, "grasas": 49},
    {"nombre": "Mix Frutos Secos (Sin sal)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "Blanca", "calorias": 600, "proteinas": 18, "carbohidratos": 10, "grasas": 54},

    # --- SALSAS Y ACEITES ---
    {"nombre": "Aceite de Oliva Virgen Extra", "categoria": CategoriaIngrediente.ACEITES, "supermercado": "Blanca", "calorias": 884, "proteinas": 0, "carbohidratos": 0, "grasas": 100},
    {"nombre": "Aceite de Girasol", "categoria": CategoriaIngrediente.ACEITES, "supermercado": "Blanca", "calorias": 884, "proteinas": 0, "carbohidratos": 0, "grasas": 100},
    {"nombre": "Vinagre (Manzana/Vino)", "categoria": CategoriaIngrediente.ACEITES, "supermercado": "Blanca", "calorias": 20, "proteinas": 0, "carbohidratos": 0.6, "grasas": 0},
    {"nombre": "Vinagre de Módena (Crema)", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 180, "proteinas": 0.5, "carbohidratos": 40, "grasas": 0},
    {"nombre": "Tomate Frito (Estilo casero)", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 82, "proteinas": 1.2, "carbohidratos": 6, "grasas": 5.8},
    {"nombre": "Tomate Frito (Light/Sin azucar)", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 35, "proteinas": 1.2, "carbohidratos": 4, "grasas": 1},
    {"nombre": "Ketchup", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 100, "proteinas": 1.5, "carbohidratos": 25, "grasas": 0.2},
    {"nombre": "Ketchup Cero", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 55, "proteinas": 1, "carbohidratos": 6, "grasas": 0.1},
    {"nombre": "Mayonesa", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 700, "proteinas": 1, "carbohidratos": 2, "grasas": 75},
    {"nombre": "Mayonesa Ligera", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 350, "proteinas": 0.5, "carbohidratos": 5, "grasas": 35},
    {"nombre": "Salsa Alioli", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 650, "proteinas": 1, "carbohidratos": 2, "grasas": 70},
    {"nombre": "Salsa de Soja", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 60, "proteinas": 8, "carbohidratos": 6, "grasas": 0},
    {"nombre": "Salsa Barbacoa", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 150, "proteinas": 1, "carbohidratos": 35, "grasas": 0.5},
    {"nombre": "Salsa César", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 350, "proteinas": 2, "carbohidratos": 5, "grasas": 35},
    {"nombre": "Salsa Pesto", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 450, "proteinas": 5, "carbohidratos": 5, "grasas": 45},
    {"nombre": "Tabasco / Salsa Picante", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 15, "proteinas": 0.5, "carbohidratos": 1, "grasas": 0.5},
    {"nombre": "Mostaza Dijon/Antigua", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 140, "proteinas": 7, "carbohidratos": 5, "grasas": 10},

    # --- VEGETARIANO / VEGANO / OTROS ---
    {"nombre": "Tofu (Firme)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 115, "proteinas": 12, "carbohidratos": 2, "grasas": 6},
    {"nombre": "Seitán", "categoria": CategoriaIngrediente.OTROS, "supermercado": "Blanca", "calorias": 120, "proteinas": 24, "carbohidratos": 4, "grasas": 1.5},
    {"nombre": "Hummus (Garbanzos)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 320, "proteinas": 7, "carbohidratos": 15, "grasas": 25},
    {"nombre": "Guacamole (Hacendado)", "categoria": CategoriaIngrediente.SALSAS, "supermercado": "Blanca", "calorias": 200, "proteinas": 2, "carbohidratos": 3, "grasas": 19},
    {"nombre": "Soja Texturizada (Fina/Gruesa)", "categoria": CategoriaIngrediente.LEGUMBRES, "supermercado": "Blanca", "calorias": 330, "proteinas": 50, "carbohidratos": 20, "grasas": 2},

    # --- HSN / SUPLEMENTOS (Se mantienen con marca HSN) ---
    {"nombre": "Evowhey Protein 2.0 (Chocolate)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 378, "proteinas": 77, "carbohidratos": 5.5, "grasas": 5.8},
    {"nombre": "Evowhey Protein 2.0 (Vainilla)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 380, "proteinas": 78, "carbohidratos": 4.5, "grasas": 5.5},
    {"nombre": "Evowhey Protein 2.0 (Doble Chocolate)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 375, "proteinas": 76, "carbohidratos": 6, "grasas": 6},
    {"nombre": "Evowhey Protein 2.0 (Chocolate Blanco y Coco)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 382, "proteinas": 75, "carbohidratos": 5.5, "grasas": 6.2},
    {"nombre": "Evowhey Protein 2.0 (Cookies & Cream)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 380, "proteinas": 76, "carbohidratos": 6.5, "grasas": 5.9},
    {"nombre": "Evowhey Protein 2.0 (Fresa y Plátano)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 379, "proteinas": 77, "carbohidratos": 5, "grasas": 5.6},
    {"nombre": "Evowhey Protein 2.0 (Caramelo Salado)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 376, "proteinas": 76, "carbohidratos": 5.8, "grasas": 5.7},
    {"nombre": "Evowhey Protein 2.0 (Turrón)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 380, "proteinas": 75, "carbohidratos": 6, "grasas": 6},
    {"nombre": "Evowhey Protein 2.0 (Café Frappé)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 378, "proteinas": 77, "carbohidratos": 5, "grasas": 5.5},
    {"nombre": "Evolate 2.0 (Whey Isolate CFM)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 370, "proteinas": 84, "carbohidratos": 2.5, "grasas": 0.9},
    {"nombre": "Evolate 2.0 (Chocolate)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 365, "proteinas": 82, "carbohidratos": 3, "grasas": 1.2},
    {"nombre": "Evolate 2.0 (Vainilla)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 368, "proteinas": 83, "carbohidratos": 2.5, "grasas": 1},
    {"nombre": "Caseína Micelar (Chocolate)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 360, "proteinas": 79, "carbohidratos": 4.5, "grasas": 1.8},
    {"nombre": "Caseína Micelar (Vainilla)", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 362, "proteinas": 80, "carbohidratos": 4, "grasas": 1.5},
    {"nombre": "Harina de Avena (Sabores)", "categoria": CategoriaIngrediente.CEREALES, "supermercado": "HSN", "calorias": 385, "proteinas": 13, "carbohidratos": 62, "grasas": 7},
    {"nombre": "Crema de Arroz (Cream of Rice)", "categoria": CategoriaIngrediente.CEREALES, "supermercado": "HSN", "calorias": 360, "proteinas": 7, "carbohidratos": 80, "grasas": 1},
    {"nombre": "Crema de Cacahuete 100%", "categoria": CategoriaIngrediente.OTROS, "supermercado": "HSN", "calorias": 590, "proteinas": 28, "carbohidratos": 12, "grasas": 46},
]

def populate():
    db = SessionLocal()
    try:
        # Eliminar ingredientes existentes
        print("Eliminando todos los ingredientes existentes de la base de datos...")
        db.query(Ingrediente).delete()
        db.commit()
        print("Ingredientes eliminados correctamente.")

        print(f"Iniciando inserción de {len(ingredientes_data)} ingredientes...")
        contador_nuevos = 0
        contador_existentes = 0

        for data in ingredientes_data:
            # Comprobar si ya existe por nombre
            exists = db.query(Ingrediente).filter(Ingrediente.nombre == data["nombre"]).first()
            if not exists:
                nuevo_ingrediente = Ingrediente(
                    nombre=data["nombre"],
                    categoria=data["categoria"],
                    supermercado=data["supermercado"],
                    calorias_por_100g=data["calorias"],
                    proteinas_por_100g=data["proteinas"],
                    carbohidratos_por_100g=data["carbohidratos"],
                    grasas_por_100g=data["grasas"],
                    fibra_por_100g=0, # Valor por defecto
                    sal_por_100g=0,   # Valor por defecto
                    notas="Insertado masivamente"
                )
                db.add(nuevo_ingrediente)
                contador_nuevos += 1
            else:
                contador_existentes += 1

        db.commit()
        print(f"Proceso finalizado.")
        print(f"- Insertados: {contador_nuevos}")
        print(f"- Omitidos (ya existían): {contador_existentes}")

    except Exception as e:
        print(f"Error durante la inserción: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate()
