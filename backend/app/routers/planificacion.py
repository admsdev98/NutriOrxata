from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from app.database import get_db
from app.models import PlanificacionSemanal, Plato, Familiar
from app.models.usuario import Usuario
from app.schemas import PlanificacionCreate, PlanificacionUpdate, PlanificacionResponse, ResumenSemanal, ResumenDiario
from app.utils.security import require_auth

router = APIRouter(prefix="/api/planificacion", tags=["planificacion"])

DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
MOMENTOS = ["desayuno", "almuerzo", "comida", "merienda", "cena"]


def get_monday(d: date) -> date:
    return d - timedelta(days=d.weekday())


def check_familiar_access(user: Usuario, familiar_id: int):
    """Verifica que el usuario tenga acceso al familiar"""
    if user.rol == "admin":
        return True
    if user.familiar_id and user.familiar_id == familiar_id:
        return True
    return False


@router.get("")
def list_planificacion(
    semana_inicio: date = None,
    familiar_id: int = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth)
):
    if semana_inicio is None:
        semana_inicio = get_monday(date.today())
    
    # Si no es admin, forzar su familiar_id
    if user.rol != "admin":
        if not user.familiar_id:
            raise HTTPException(status_code=403, detail="No tienes un familiar asignado")
        familiar_id = user.familiar_id
    
    query = db.query(PlanificacionSemanal).filter(
        PlanificacionSemanal.semana_inicio == semana_inicio
    )
    if familiar_id:
        query = query.filter(PlanificacionSemanal.familiar_id == familiar_id)
    
    results = []
    for p in query.all():
        plato = db.query(Plato).filter(Plato.id == p.plato_id).first() if p.plato_id else None
        familiar = db.query(Familiar).filter(Familiar.id == p.familiar_id).first()
        results.append({
            "id": p.id,
            "semana_inicio": p.semana_inicio,
            "dia": p.dia,
            "momento": p.momento,
            "plato_id": p.plato_id,
            "plato_nombre": plato.nombre if plato else None,
            "calorias": float(plato.calorias_totales) if plato else None,
            "familiar_id": p.familiar_id,
            "familiar_nombre": familiar.nombre if familiar else "Desconocido",
            "notas": p.notas,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        })
    return results


@router.get("/resumen/{familiar_id}")
def get_resumen_semanal(
    familiar_id: int, 
    semana_inicio: date = None, 
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth)
):
    # Verificar acceso
    if not check_familiar_access(user, familiar_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este familiar")
    
    familiar = db.query(Familiar).filter(Familiar.id == familiar_id).first()
    if not familiar:
        raise HTTPException(status_code=404, detail="Familiar no encontrado")
    
    if semana_inicio is None:
        semana_inicio = get_monday(date.today())
    
    planificaciones = db.query(PlanificacionSemanal).filter(
        PlanificacionSemanal.semana_inicio == semana_inicio,
        PlanificacionSemanal.familiar_id == familiar_id
    ).all()
    
    dias_data = []
    for dia in DIAS:
        comidas = []
        calorias_dia = 0
        proteinas_dia = 0
        carbs_dia = 0
        grasas_dia = 0
        
        for momento in MOMENTOS:
            planif = next(
                (p for p in planificaciones if p.dia == dia and p.momento == momento),
                None
            )
            if planif and planif.plato_id:
                plato = db.query(Plato).filter(Plato.id == planif.plato_id).first()
                if plato:
                    comidas.append({
                        "momento": momento,
                        "plato_id": plato.id,
                        "plato_nombre": plato.nombre,
                        "calorias": float(plato.calorias_totales),
                        "proteinas": float(plato.proteinas_totales),
                        "carbohidratos": float(plato.carbohidratos_totales),
                        "grasas": float(plato.grasas_totales),
                    })
                    calorias_dia += float(plato.calorias_totales)
                    proteinas_dia += float(plato.proteinas_totales)
                    carbs_dia += float(plato.carbohidratos_totales)
                    grasas_dia += float(plato.grasas_totales)
        
        dias_data.append({
            "dia": dia,
            "calorias_totales": round(calorias_dia, 2),
            "proteinas_totales": round(proteinas_dia, 2),
            "carbohidratos_totales": round(carbs_dia, 2),
            "grasas_totales": round(grasas_dia, 2),
            "comidas": comidas,
        })
    
    return {
        "semana_inicio": semana_inicio,
        "familiar_id": familiar.id,
        "familiar_nombre": familiar.nombre,
        "objetivo_calorias": familiar.objetivo_calorias,
        "dias": dias_data,
    }


@router.post("", status_code=201)
def create_planificacion(
    planif_data: PlanificacionCreate, 
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth)
):
    # Verificar acceso
    if not check_familiar_access(user, planif_data.familiar_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este familiar")
    
    familiar = db.query(Familiar).filter(Familiar.id == planif_data.familiar_id).first()
    if not familiar:
        raise HTTPException(status_code=404, detail="Familiar no encontrado")
    
    if planif_data.plato_id:
        plato = db.query(Plato).filter(Plato.id == planif_data.plato_id).first()
        if not plato:
            raise HTTPException(status_code=404, detail="Plato no encontrado")
    
    existing = db.query(PlanificacionSemanal).filter(
        PlanificacionSemanal.semana_inicio == planif_data.semana_inicio,
        PlanificacionSemanal.dia == planif_data.dia,
        PlanificacionSemanal.momento == planif_data.momento,
        PlanificacionSemanal.familiar_id == planif_data.familiar_id,
    ).first()
    
    if existing:
        existing.plato_id = planif_data.plato_id
        existing.notas = planif_data.notas
        db.commit()
        db.refresh(existing)
        return existing
    
    db_planif = PlanificacionSemanal(**planif_data.model_dump())
    db.add(db_planif)
    db.commit()
    db.refresh(db_planif)
    return db_planif


@router.put("/{planif_id}")
def update_planificacion(
    planif_id: int, 
    planif_data: PlanificacionUpdate, 
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth)
):
    db_planif = db.query(PlanificacionSemanal).filter(PlanificacionSemanal.id == planif_id).first()
    if not db_planif:
        raise HTTPException(status_code=404, detail="Planificación no encontrada")
    
    # Verificar acceso
    if not check_familiar_access(user, db_planif.familiar_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este familiar")
    
    update_data = planif_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_planif, field, value)
    
    db.commit()
    db.refresh(db_planif)
    return db_planif


@router.delete("/{planif_id}", status_code=204)
def delete_planificacion(
    planif_id: int, 
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth)
):
    db_planif = db.query(PlanificacionSemanal).filter(PlanificacionSemanal.id == planif_id).first()
    if not db_planif:
        raise HTTPException(status_code=404, detail="Planificación no encontrada")
    
    # Verificar acceso
    if not check_familiar_access(user, db_planif.familiar_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este familiar")
    
    db.delete(db_planif)
    db.commit()
    return None
