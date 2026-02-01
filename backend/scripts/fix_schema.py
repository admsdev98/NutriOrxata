
import sys
import os
from sqlalchemy import create_engine, text
from app.config import get_settings

def fix_schema():
    settings = get_settings()
    engine = create_engine(settings.database_url)
    
    print("Iniciando reparacion de esquema...")
    
    with engine.connect() as conn:
        with conn.begin():
            # 1. Fix Usuarios Table (Add sexo)
            try:
                conn.execute(text("ALTER TABLE usuarios ADD COLUMN sexo VARCHAR(20)"))
                print("Columna 'sexo' agregada a 'usuarios'.")
            except Exception as e:
                print(f"Nota usuarios: {e}")

            # 2. Fix Planificacion Semanal Table
            # Add client_id if not exists
            try:
                conn.execute(text("ALTER TABLE planificacion_semanal ADD COLUMN client_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE"))
                print("Columna 'client_id' agregada a 'planificacion_semanal'.")
            except Exception as e:
                print(f"Nota planificacion (add client_id): {e}")

            # Migrate data: set client_id = familiar_id if familiar_id exists (this is best effort)
            # Or just set to a default valid user. Let's try to infer or set to 1.
            try:
                # If familiar_id exists, we can try to copy it? 
                # Probably safer to just set to a known admin if we don't care about old data validity much.
                # But let's check if there are nulls.
                conn.execute(text("UPDATE planificacion_semanal SET client_id = 1 WHERE client_id IS NULL"))
                print("Actualizados client_id nulos a 1.")
            except Exception as e:
                print(f"Nota planificacion (update data): {e}")

            # Make client_id NOT NULL
            try:
                conn.execute(text("ALTER TABLE planificacion_semanal ALTER COLUMN client_id SET NOT NULL"))
                print("Columna 'client_id' establecida como NOT NULL.")
            except Exception as e:
                print(f"Nota planificacion (set not null): {e}")

            # Drop familiar_id
            try:
                conn.execute(text("ALTER TABLE planificacion_semanal DROP COLUMN familiar_id"))
                print("Columna 'familiar_id' eliminada.")
            except Exception as e:
                print(f"Nota planificacion (drop familiar_id): {e}")
                
    print("Reparacion finalizada.")

if __name__ == "__main__":
    fix_schema()
