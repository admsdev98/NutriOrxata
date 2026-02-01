import os
import sys
from sqlalchemy import text
from app.database import SessionLocal

def add_column():
    db = SessionLocal()
    try:
        print("Adding 'sexo' column to 'usuarios' table...")
        # Check if column exists first to avoid error
        check_sql = text("SELECT column_name FROM information_schema.columns WHERE table_name='usuarios' AND column_name='sexo'")
        result = db.execute(check_sql).fetchone()
        
        if not result:
            sql = text("ALTER TABLE usuarios ADD COLUMN sexo VARCHAR(10)")
            db.execute(sql)
            db.commit()
            print("Column 'sexo' added successfully.")
        else:
            print("Column 'sexo' already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Add backend directory to path so imports work
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.append(current_dir)
    add_column()
