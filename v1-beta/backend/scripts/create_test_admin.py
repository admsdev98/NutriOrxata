
from app.database import SessionLocal
from app.models.usuario import Usuario
from app.utils.security import get_password_hash

ADMIN_EMAIL = "adam_admin@nutriorxata.com"
ADMIN_PASSWORD = "admin1234"


def create_admin():
    db = SessionLocal()
    try:
        other_admins = db.query(Usuario).filter(
            Usuario.rol == "admin",
            Usuario.email != ADMIN_EMAIL,
        )
        if other_admins.count():
            for user in other_admins.all():
                user.rol = "cliente"  # type: ignore[assignment]
            db.commit()

        existing = db.query(Usuario).filter(Usuario.email == ADMIN_EMAIL).first()
        if existing:
            existing.nombre = "Adam Admin"  # type: ignore[assignment]
            existing.rol = "admin"  # type: ignore[assignment]
            existing.activo = True  # type: ignore[assignment]
            existing.password_hash = get_password_hash(ADMIN_PASSWORD)  # type: ignore[assignment]
            db.commit()
            print(f"Updated admin user: {ADMIN_EMAIL}")
            return

        user = Usuario(
            nombre="Adam Admin",
            email=ADMIN_EMAIL,
            password_hash=get_password_hash(ADMIN_PASSWORD),
            rol="admin",
            activo=True,
        )
        db.add(user)
        db.commit()
        print(f"Created admin user: {ADMIN_EMAIL}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
