from sqlalchemy import text
from sqlalchemy.engine import Engine


def ensure_planificacion_items_schema(engine: Engine) -> None:
    statements = [
        """
        CREATE TABLE IF NOT EXISTS planificacion_items (
            id SERIAL PRIMARY KEY,
            planificacion_id INTEGER NOT NULL REFERENCES planificacion_semanal(id) ON DELETE CASCADE,
            cliente_plato_id INTEGER REFERENCES cliente_platos(id) ON DELETE SET NULL,
            orden INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_planif_items_planif ON planificacion_items(planificacion_id);",
        "CREATE INDEX IF NOT EXISTS idx_planif_items_cliente_plato ON planificacion_items(cliente_plato_id);",
        """
        INSERT INTO planificacion_items (planificacion_id, cliente_plato_id, orden)
        SELECT ps.id, ps.cliente_plato_id, 0
        FROM planificacion_semanal ps
        WHERE ps.cliente_plato_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM planificacion_items pi WHERE pi.planificacion_id = ps.id
          );
        """,
    ]

    with engine.connect() as conn:
        with conn.begin():
            for stmt in statements:
                conn.execute(text(stmt))
