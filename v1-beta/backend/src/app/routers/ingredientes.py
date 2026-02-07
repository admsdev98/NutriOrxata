from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Ingrediente
from app.models.usuario import Usuario
from app.schemas import IngredienteCreate, IngredienteUpdate, IngredienteResponse
from app.utils.security import require_admin

router = APIRouter(prefix="/api/ingredientes", tags=["ingredientes"])


@router.get("", response_model=List[IngredienteResponse])
def list_ingredientes(
    skip: int = 0,
    limit: int = 100,
    categoria: Optional[str] = None,
    q: Optional[str] = Query(None, description="Buscar por nombre"),
    db: Session = Depends(get_db),
):
    query = db.query(Ingrediente)
    if categoria:
        query = query.filter(Ingrediente.categoria == categoria)
    if q:
        tokens = [token for token in q.strip().split() if token]
        for token in tokens:
            query = query.filter(Ingrediente.nombre.ilike(f"%{token}%"))
    return query.order_by(Ingrediente.categoria, Ingrediente.nombre).offset(skip).limit(limit).all()


@router.get("/categorias")
def list_categorias(db: Session = Depends(get_db)):
    result = db.query(Ingrediente.categoria).distinct().all()
    return [r[0] for r in result]


@router.get("/{ingrediente_id}", response_model=IngredienteResponse)
def get_ingrediente(ingrediente_id: int, db: Session = Depends(get_db)):
    ingrediente = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
    if not ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    return ingrediente


@router.post("", response_model=IngredienteResponse, status_code=201)
def create_ingrediente(
    ingrediente: IngredienteCreate, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    db_ingrediente = Ingrediente(**ingrediente.model_dump())
    db.add(db_ingrediente)
    db.commit()
    db.refresh(db_ingrediente)
    return db_ingrediente


@router.put("/{ingrediente_id}", response_model=IngredienteResponse)
def update_ingrediente(
    ingrediente_id: int, 
    ingrediente: IngredienteUpdate, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    db_ingrediente = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
    if not db_ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    
    update_data = ingrediente.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ingrediente, field, value)
    
    db.commit()
    db.refresh(db_ingrediente)
    return db_ingrediente


@router.delete("/{ingrediente_id}", status_code=204)
def delete_ingrediente(
    ingrediente_id: int, 
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    db_ingrediente = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
    if not db_ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    
    db.delete(db_ingrediente)
    db.commit()
    return None
