
import sys
import os
from sqlalchemy import create_engine, text

# Add the parent directory to sys.path to find the app module if needed, 
# though we are just using sql here
sys.path.append(os.getcwd())

from app.database import engine
# OR use settings
from app.config import get_settings

def migrate_usuarios():
    # Use the existing engine or create new one from settings
    # engine = create_engine(get_settings().database_url) 
    # Actually, we can just use the imported engine from app.database if we want
    
    settings = get_settings()
    engine = create_engine(settings.database_url)
    
    # List of new columns to add
    new_columns = [
        ("apellidos", "VARCHAR(100)"),
        ("edad", "INTEGER"),
        ("altura", "INTEGER"),
        ("peso", "FLOAT"),
        ("grasa_corporal", "FLOAT"),
        ("nivel_actividad", "VARCHAR(50)"),
        ("objetivo", "VARCHAR(50)"),
        ("calorias_mantenimiento", "FLOAT"),
        ("calorias_objetivo", "FLOAT"),
        ("distribucion_desayuno", "FLOAT"),
        ("distribucion_almuerzo", "FLOAT"),
        ("distribucion_comida", "FLOAT"),
        ("distribucion_merienda", "FLOAT"),
        ("distribucion_cena", "FLOAT"),
    ]
    
    print("Iniciando migracion de tabla usuarios...")
    
    with engine.connect() as conn:
        for col_name, col_type in new_columns:
            try:
                conn.execute(text(f"ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                conn.commit()
                print(f"Columna {col_name} agregada o ya existente.")
            except Exception as e:
                conn.rollback()
                print(f"Error agregando columna {col_name}: {e}")
            
    print("Migracion finalizada.")

if __name__ == "__main__":
    migrate_usuarios()
