from sqlalchemy import create_engine

from app.config import get_settings
from app.utils.schema import ensure_planificacion_items_schema


if __name__ == "__main__":
    settings = get_settings()
    engine = create_engine(settings.database_url)
    ensure_planificacion_items_schema(engine)
    print("Planificacion items schema ensured.")
