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


from app.schemas.auth import LoginRequest, TokenResponse, UsuarioResponse, UsuarioCreate, UsuarioUpdate

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
    
    # Use model_dump or dict to unpack all fields including optional ones
    user_data = request.model_dump() if hasattr(request, 'model_dump') else request.dict()
    # Hash password
    user_data['password_hash'] = get_password_hash(user_data.pop('password'))
    
    user = Usuario(**user_data)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UsuarioResponse.model_validate(user)


@router.put("/usuarios/{user_id}", response_model=UsuarioResponse)
async def update_usuario(
    user_id: int,
    request: UsuarioUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # Update fields
    update_data = request.model_dump(exclude_unset=True) if hasattr(request, 'model_dump') else request.dict(exclude_unset=True)
    
    if 'password' in update_data and update_data['password']:
         update_data['password_hash'] = get_password_hash(update_data.pop('password'))
    
    for key, value in update_data.items():
        setattr(user, key, value)
        
    db.commit()
    db.refresh(user)
    
    return UsuarioResponse.model_validate(user)


@router.get("/usuarios")
async def list_usuarios(
    skip: int = 0,
    limit: int = 100,
    rol: str | None = None,
    search: str | None = None,
    trabajador_id: int | None = None,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    query = db.query(Usuario)
    
    if rol:
        if rol == 'cliente':
            query = query.filter(Usuario.rol.in_(['cliente', 'usuario']))
        else:
            query = query.filter(Usuario.rol == rol)
        
    if search:
        search_filter = f"%{search}%"
        # Search by name or email
        query = query.filter(
            (Usuario.nombre.ilike(search_filter)) | 
            (Usuario.email.ilike(search_filter))
        )

    if trabajador_id:
        query = query.filter(Usuario.trabajador_id == trabajador_id)
        
    total = query.count()
    usuarios = query.order_by(Usuario.nombre).offset(skip).limit(limit).all()
    
    return {
        "items": [UsuarioResponse.model_validate(u) for u in usuarios],
        "total": total
    }


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
