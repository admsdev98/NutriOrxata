from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from app.database import get_db
from app.models import Familiar
from app.models.usuario import Usuario
from app.schemas import FamiliarCreate, FamiliarUpdate, FamiliarResponse
from app.utils.security import require_admin, require_auth
from app.utils.nutrition import calcular_objetivos

router = APIRouter(prefix="/api/familiares", tags=["familiares"])


@router.post("/calcular-objetivos")
def calcular_objetivos_endpoint(
    peso: float,
    altura: int,
    edad: int,
    genero: str,
    actividad: str,
    admin: Usuario = Depends(require_admin)
) -> Dict[str, int]:
    """Calcula objetivos calóricos basado en métricas"""
    return calcular_objetivos(peso, altura, edad, genero, actividad)


@router.get("/activos", response_model=List[FamiliarResponse])
def list_familiares_activos(
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth)
):
    """Lista familiares activos - usuarios solo ven su familiar, admin ve todos"""
    if user.rol == "admin":
        return db.query(Familiar).filter(Familiar.activo == True).order_by(Familiar.nombre).all()
    
    # Usuario regular solo ve su propio familiar
    if not user.familiar_id:
        return []
    
    familiar = db.query(Familiar).filter(
        Familiar.id == user.familiar_id,
        Familiar.activo == True
    ).first()
    return [familiar] if familiar else []


@router.get("", response_model=List[FamiliarResponse])
def list_familiares(
    skip: int = 0, 
    limit: int = 100, 
    activo: bool = None, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    """Lista todos los familiares - solo admin"""
    query = db.query(Familiar)
    if activo is not None:
        query = query.filter(Familiar.activo == activo)
    return query.order_by(Familiar.nombre).offset(skip).limit(limit).all()


@router.get("/{familiar_id}", response_model=FamiliarResponse)
def get_familiar(
    familiar_id: int, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    familiar = db.query(Familiar).filter(Familiar.id == familiar_id).first()
    if not familiar:
        raise HTTPException(status_code=404, detail="Familiar no encontrado")
    return familiar


@router.post("", response_model=FamiliarResponse, status_code=201)
def create_familiar(
    familiar: FamiliarCreate, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    db_familiar = Familiar(**familiar.model_dump())
    db.add(db_familiar)
    db.commit()
    db.refresh(db_familiar)
    return db_familiar


@router.put("/{familiar_id}", response_model=FamiliarResponse)
def update_familiar(
    familiar_id: int, 
    familiar: FamiliarUpdate, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    db_familiar = db.query(Familiar).filter(Familiar.id == familiar_id).first()
    if not db_familiar:
        raise HTTPException(status_code=404, detail="Familiar no encontrado")
    
    update_data = familiar.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_familiar, field, value)
    
    db.commit()
    db.refresh(db_familiar)
    return db_familiar


@router.delete("/{familiar_id}", status_code=204)
def delete_familiar(
    familiar_id: int, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    db_familiar = db.query(Familiar).filter(Familiar.id == familiar_id).first()
    if not db_familiar:
        raise HTTPException(status_code=404, detail="Familiar no encontrado")
    
    db.delete(db_familiar)
    db.commit()
    return None
