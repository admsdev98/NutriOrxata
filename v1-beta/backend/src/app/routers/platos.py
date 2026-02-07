from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Plato, PlatoIngrediente, Ingrediente
from app.models.usuario import Usuario
from app.schemas import (
    PlatoCreate,
    PlatoUpdate,
    PlatoResponse,
    PlatoDetailResponse,
    PlatoIngredienteCreate,
    PlatoIngredienteUpdate,
    PlatoIngredienteResponse,
)
from app.utils.security import require_admin

router = APIRouter(prefix="/api/platos", tags=["platos"])


def get_plato_detail(db: Session, plato: Plato) -> dict:
    ingredientes = []
    for pi in plato.ingredientes:
        ing = db.query(Ingrediente).filter(Ingrediente.id == pi.ingrediente_id).first()
        ingredientes.append({
            "id": pi.id,
            "ingrediente_id": pi.ingrediente_id,
            "ingrediente_nombre": ing.nombre if ing else "Desconocido",
            "cantidad_gramos": float(pi.cantidad_gramos),
            "calorias_aportadas": float(pi.calorias_aportadas or 0),
            "proteinas_aportadas": float(pi.proteinas_aportadas or 0),
            "carbohidratos_aportados": float(pi.carbohidratos_aportados or 0),
            "grasas_aportadas": float(pi.grasas_aportadas or 0),
        })
    
    return {
        "id": plato.id,
        "nombre": plato.nombre,
        "descripcion": plato.descripcion,
        "momentos_dia": plato.momentos_dia or [],
        "calorias_totales": float(plato.calorias_totales or 0),
        "proteinas_totales": float(plato.proteinas_totales or 0),
        "carbohidratos_totales": float(plato.carbohidratos_totales or 0),
        "grasas_totales": float(plato.grasas_totales or 0),
        "peso_total_gramos": float(plato.peso_total_gramos or 0),
        "created_at": plato.created_at,
        "updated_at": plato.updated_at,
        "ingredientes": ingredientes,
    }


@router.get("", response_model=List[PlatoResponse])
def list_platos(skip: int = 0, limit: int = 100, momento_dia: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Plato)
    if momento_dia:
        query = query.filter(Plato.momentos_dia.any(momento_dia))
    return query.order_by(Plato.nombre).offset(skip).limit(limit).all()


@router.get("/{plato_id}")
def get_plato(plato_id: int, db: Session = Depends(get_db)):
    plato = db.query(Plato).filter(Plato.id == plato_id).first()
    if not plato:
        raise HTTPException(status_code=404, detail="Plato no encontrado")
    return get_plato_detail(db, plato)


@router.post("", status_code=201)
def create_plato(
    plato_data: PlatoCreate, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    if not plato_data.momentos_dia:
        raise HTTPException(status_code=400, detail="Selecciona al menos un momento del dia")
    db_plato = Plato(
        nombre=plato_data.nombre,
        descripcion=plato_data.descripcion,
        momentos_dia=plato_data.momentos_dia,
    )
    db.add(db_plato)
    db.commit()
    db.refresh(db_plato)
    
    for ing_data in plato_data.ingredientes:
        db_pi = PlatoIngrediente(
            plato_id=db_plato.id,
            ingrediente_id=ing_data.ingrediente_id,
            cantidad_gramos=ing_data.cantidad_gramos,
        )
        db.add(db_pi)
    
    db.commit()
    db.refresh(db_plato)
    return get_plato_detail(db, db_plato)


@router.put("/{plato_id}")
def update_plato(
    plato_id: int, 
    plato_data: PlatoUpdate, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    db_plato = db.query(Plato).filter(Plato.id == plato_id).first()
    if not db_plato:
        raise HTTPException(status_code=404, detail="Plato no encontrado")
    
    update_data = plato_data.model_dump(exclude_unset=True)
    if "momentos_dia" in update_data and not update_data["momentos_dia"]:
        raise HTTPException(status_code=400, detail="Selecciona al menos un momento del dia")
    for field, value in update_data.items():
        setattr(db_plato, field, value)
    
    db.commit()
    db.refresh(db_plato)
    return get_plato_detail(db, db_plato)


@router.delete("/{plato_id}", status_code=204)
def delete_plato(
    plato_id: int, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    db_plato = db.query(Plato).filter(Plato.id == plato_id).first()
    if not db_plato:
        raise HTTPException(status_code=404, detail="Plato no encontrado")
    
    db.delete(db_plato)
    db.commit()
    return None


@router.post("/{plato_id}/ingredientes")
def add_ingrediente_to_plato(
    plato_id: int, 
    ing_data: PlatoIngredienteCreate, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    plato = db.query(Plato).filter(Plato.id == plato_id).first()
    if not plato:
        raise HTTPException(status_code=404, detail="Plato no encontrado")
    
    ingrediente = db.query(Ingrediente).filter(Ingrediente.id == ing_data.ingrediente_id).first()
    if not ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    
    existing = db.query(PlatoIngrediente).filter(
        PlatoIngrediente.plato_id == plato_id,
        PlatoIngrediente.ingrediente_id == ing_data.ingrediente_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="El ingrediente ya está en el plato")
    
    db_pi = PlatoIngrediente(
        plato_id=plato_id,
        ingrediente_id=ing_data.ingrediente_id,
        cantidad_gramos=ing_data.cantidad_gramos,
    )
    db.add(db_pi)
    db.commit()
    db.refresh(plato)
    return get_plato_detail(db, plato)


@router.put("/{plato_id}/ingredientes/{ingrediente_id}")
def update_ingrediente_in_plato(
    plato_id: int,
    ingrediente_id: int,
    ing_data: PlatoIngredienteUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    db_pi = db.query(PlatoIngrediente).filter(
        PlatoIngrediente.plato_id == plato_id,
        PlatoIngrediente.ingrediente_id == ingrediente_id
    ).first()
    if not db_pi:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado en el plato")
    
    db_pi.cantidad_gramos = ing_data.cantidad_gramos
    db.commit()
    
    plato = db.query(Plato).filter(Plato.id == plato_id).first()
    return get_plato_detail(db, plato)


@router.delete("/{plato_id}/ingredientes/{ingrediente_id}")
def remove_ingrediente_from_plato(
    plato_id: int, 
    ingrediente_id: int, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    db_pi = db.query(PlatoIngrediente).filter(
        PlatoIngrediente.plato_id == plato_id,
        PlatoIngrediente.ingrediente_id == ingrediente_id
    ).first()
    if not db_pi:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado en el plato")
    
    db.delete(db_pi)
    db.commit()
    
    plato = db.query(Plato).filter(Plato.id == plato_id).first()
    return get_plato_detail(db, plato)
