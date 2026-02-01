import os
import sys
from sqlalchemy import create_engine, text

sys.path.append(os.getcwd())

from app.config import get_settings


def migrate_cliente_platos():
    settings = get_settings()
    engine = create_engine(settings.database_url)

    columns = [
        ("momentos_dia", "momento_dia[]"),
    ]

    print("Iniciando migracion de tabla cliente_platos...")

    with engine.connect() as conn:
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE cliente_platos ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                conn.commit()
                print(f"Columna {col_name} agregada o ya existente.")
            except Exception as e:
                conn.rollback()
                print(f"Error agregando columna {col_name}: {e}")

    print("Migracion finalizada.")


if __name__ == "__main__":
    migrate_cliente_platos()
