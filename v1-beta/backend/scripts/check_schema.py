from sqlalchemy import create_engine, text
import os

# Use the URL from config or hardcoded for checking
DATABASE_URL = "postgresql://nutriorxata:nutriorxata123@db:5432/nutriorxata"

def inspect_table():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'planificacion_semanal';"))
            print("Columns in 'planificacion_semanal':")
            for row in result:
                print(f"- {row.column_name} ({row.data_type})")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_table()
