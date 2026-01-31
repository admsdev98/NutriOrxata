from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioResponse, UsuarioCreate
from app.utils.security import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    get_current_user,
    require_auth,
    require_admin
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        usuario=UsuarioResponse.model_validate(user)
    )


@router.get("/me", response_model=UsuarioResponse)
async def get_me(user: Usuario = Depends(require_auth)):
    return UsuarioResponse.model_validate(user)


@router.post("/register", response_model=UsuarioResponse)
async def register_user(
    request: UsuarioCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    existing = db.query(Usuario).filter(Usuario.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    user = Usuario(
        nombre=request.nombre,
        email=request.email,
        password_hash=get_password_hash(request.password),
        rol=request.rol,
        familiar_id=request.familiar_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UsuarioResponse.model_validate(user)


@router.get("/usuarios", response_model=list[UsuarioResponse])
async def list_usuarios(
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    usuarios = db.query(Usuario).order_by(Usuario.nombre).all()
    return [UsuarioResponse.model_validate(u) for u in usuarios]


@router.delete("/usuarios/{user_id}", status_code=204)
async def delete_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes borrar tu propio usuario")
        
    db.delete(user)
    db.commit()
    return None
