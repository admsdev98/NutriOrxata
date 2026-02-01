from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import get_settings
from app.database import get_db
from app.models.usuario import Usuario

security = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    settings = get_settings()
    return bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt(rounds=settings.bcrypt_rounds)
    ).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    if settings.environment == "production" and settings.secret_key == "nutriorxata-secret-key-change-in-production-2024":
        raise RuntimeError("SECRET_KEY must be set in production")
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    issued_at = datetime.now(timezone.utc)
    to_encode.update({"exp": expire, "iat": issued_at, "nbf": issued_at})
    if settings.jwt_issuer:
        to_encode["iss"] = settings.jwt_issuer
    if settings.jwt_audience:
        to_encode["aud"] = settings.jwt_audience
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        settings = get_settings()
        options = {"require": ["exp", "sub"]}
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
            options=options,
        )
        return payload
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[Usuario]:
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if not user or not user.activo:
        return None
    
    return user


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await get_current_user(credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def require_admin(
    user: Usuario = Depends(require_auth)
) -> Usuario:
    if user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    return user
