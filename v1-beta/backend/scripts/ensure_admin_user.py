import argparse

from app.database import SessionLocal
from app.models.usuario import Usuario
from app.utils.security import get_password_hash


def ensure_admin(email: str, password: str, nombre: str) -> None:
    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.email == email).first()
        password_hash = get_password_hash(password)

        if user:
            user.nombre = nombre
            user.password_hash = password_hash
            user.rol = "admin"
            user.activo = True
            action = "updated"
        else:
            user = Usuario(
                nombre=nombre,
                email=email,
                password_hash=password_hash,
                rol="admin",
                activo=True,
            )
            db.add(user)
            action = "created"

        db.commit()
        print(f"Admin user {action}: {email}")
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Crea o actualiza un usuario admin.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--nombre", default="Adam Admin")
    args = parser.parse_args()

    ensure_admin(args.email, args.password, args.nombre)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
