from sqlalchemy import create_engine, text

from app.config import get_settings


def ensure_work_planner_schema():
    settings = get_settings()
    engine = create_engine(settings.database_url)

    statements = [
        """
        CREATE OR REPLACE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """,
        """
        CREATE TABLE IF NOT EXISTS work_tasks (
            id SERIAL PRIMARY KEY,
            titulo VARCHAR(200) NOT NULL,
            descripcion TEXT,
            fecha_limite TIMESTAMP,
            estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
            prioridad VARCHAR(20) NOT NULL DEFAULT 'media',
            asignado_a_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            creado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS work_appointments (
            id SERIAL PRIMARY KEY,
            titulo VARCHAR(200) NOT NULL,
            descripcion TEXT,
            tipo VARCHAR(20) NOT NULL DEFAULT 'telefono',
            empieza_en TIMESTAMP NOT NULL,
            termina_en TIMESTAMP,
            enlace VARCHAR(500),
            telefono VARCHAR(50),
            asignado_a_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            creado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS work_notes (
            id SERIAL PRIMARY KEY,
            titulo VARCHAR(200),
            contenido TEXT NOT NULL,
            fecha DATE,
            usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            creado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_work_tasks_asignado ON work_tasks(asignado_a_id);",
        "CREATE INDEX IF NOT EXISTS idx_work_tasks_fecha_limite ON work_tasks(fecha_limite);",
        "CREATE INDEX IF NOT EXISTS idx_work_appointments_asignado ON work_appointments(asignado_a_id);",
        "CREATE INDEX IF NOT EXISTS idx_work_appointments_empieza ON work_appointments(empieza_en);",
        "CREATE INDEX IF NOT EXISTS idx_work_notes_usuario ON work_notes(usuario_id);",
        "CREATE INDEX IF NOT EXISTS idx_work_notes_fecha ON work_notes(fecha);",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_work_tasks_updated_at') THEN
                CREATE TRIGGER update_work_tasks_updated_at BEFORE UPDATE ON work_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_work_appointments_updated_at') THEN
                CREATE TRIGGER update_work_appointments_updated_at BEFORE UPDATE ON work_appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_work_notes_updated_at') THEN
                CREATE TRIGGER update_work_notes_updated_at BEFORE UPDATE ON work_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
            END IF;
        END
        $$;
        """,
    ]

    with engine.connect() as conn:
        with conn.begin():
            for stmt in statements:
                conn.execute(text(stmt))


if __name__ == "__main__":
    ensure_work_planner_schema()
    print("Work planner schema ensured.")
