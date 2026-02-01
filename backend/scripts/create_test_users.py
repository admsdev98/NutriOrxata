from app.database import SessionLocal
from app.models.usuario import Usuario
from app.utils.security import get_password_hash


def create_test_users():
    db = SessionLocal()
    try:
        users = [
            {
                "nombre": "Laura",
                "apellidos": "Martinez",
                "email": "laura.martinez@nutriorxata.com",
                "password": "TestUser123!",
                "rol": "cliente",
                "activo": True,
                "edad": 29,
                "altura": 165,
                "peso": 61.5,
                "sexo": "mujer",
                "nivel_actividad": "moderado",
                "objetivo": "mantenimiento",
            },
            {
                "nombre": "Carlos",
                "apellidos": "Garcia",
                "email": "carlos.garcia@nutriorxata.com",
                "password": "TestUser123!",
                "rol": "cliente",
                "activo": True,
                "edad": 35,
                "altura": 178,
                "peso": 82.0,
                "sexo": "hombre",
                "nivel_actividad": "alto",
                "objetivo": "definicion",
            },
            {
                "nombre": "Sofia",
                "apellidos": "Navarro",
                "email": "sofia.navarro@nutriorxata.com",
                "password": "TestUser123!",
                "rol": "cliente",
                "activo": True,
                "edad": 42,
                "altura": 170,
                "peso": 69.0,
                "sexo": "mujer",
                "nivel_actividad": "bajo",
                "objetivo": "mantenimiento",
            },
            {
                "nombre": "Miguel",
                "apellidos": "Ruiz",
                "email": "miguel.ruiz@nutriorxata.com",
                "password": "TestUser123!",
                "rol": "cliente",
                "activo": True,
                "edad": 26,
                "altura": 182,
                "peso": 76.0,
                "sexo": "hombre",
                "nivel_actividad": "moderado",
                "objetivo": "volumen",
            },
            {
                "nombre": "Paula",
                "apellidos": "Serrano",
                "email": "paula.serrano@nutriorxata.com",
                "password": "TestUser123!",
                "rol": "cliente",
                "activo": True,
                "edad": 31,
                "altura": 160,
                "peso": 58.0,
                "sexo": "mujer",
                "nivel_actividad": "moderado",
                "objetivo": "definicion",
            },
        ]

        for data in users:
            existing = db.query(Usuario).filter(Usuario.email == data["email"]).first()
            if existing:
                print(f"User {data['email']} already exists")
                continue

            password = data.pop("password")
            user = Usuario(**data, password_hash=get_password_hash(password))
            db.add(user)
            print(f"Created user: {data['email']}")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    create_test_users()
