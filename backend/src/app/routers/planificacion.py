from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from app.database import get_db
from app.models import PlanificacionSemanal, Plato, PlatoIngrediente, ClientePlato, ClientePlatoIngrediente, Ingrediente
from app.models.usuario import Usuario
from app.schemas import PlanificacionCreate, PlanificacionUpdate, PlanificacionResponse, ResumenSemanal, ResumenDiario
from app.utils.security import require_auth

router = APIRouter(prefix="/api/planificacion", tags=["planificacion"])

DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
MOMENTOS = ["desayuno", "almuerzo", "comida", "merienda", "cena"]


def get_monday(d: date) -> date:
    return d - timedelta(days=d.weekday())



def check_client_access(user: Usuario, client_id: int):
    """Verifica que el usuario tenga acceso al cliente"""
    if user.rol == "admin":
        return True
    if user.id == client_id:
        return True
    return False


def build_plato_info_from_plato(db: Session, plato: Plato) -> dict:
    ingredientes = []
    for pi in db.query(PlatoIngrediente).filter(PlatoIngrediente.plato_id == plato.id).all():
        ing = db.query(Ingrediente).filter(Ingrediente.id == pi.ingrediente_id).first()
        if not ing:
            continue
        ingredientes.append({
            "ingrediente_id": pi.ingrediente_id,
            "ingrediente_nombre": ing.nombre,
            "cantidad_gramos": float(pi.cantidad_gramos),
        })

    return {
        "plato_nombre": plato.nombre,
        "calorias": float(plato.calorias_totales or 0),
        "proteinas": float(plato.proteinas_totales or 0),
        "carbohidratos": float(plato.carbohidratos_totales or 0),
        "grasas": float(plato.grasas_totales or 0),
        "ingredientes": ingredientes,
    }


def build_plato_info_from_cliente_plato(db: Session, cliente_plato: ClientePlato) -> dict:
    plato = db.query(Plato).filter(Plato.id == cliente_plato.plato_id).first()
    ingredientes = []
    total_cal = 0
    total_prot = 0
    total_carb = 0
    total_grasas = 0

    items = db.query(ClientePlatoIngrediente).filter(
        ClientePlatoIngrediente.cliente_plato_id == cliente_plato.id
    ).all()

    for cpi in items:
        ing = db.query(Ingrediente).filter(Ingrediente.id == cpi.ingrediente_id).first()
        if not ing:
            continue
        factor = float(cpi.cantidad_gramos) / 100
        cal = float(ing.calorias_por_100g) * factor
        prot = float(ing.proteinas_por_100g) * factor
        carb = float(ing.carbohidratos_por_100g) * factor
        grasas = float(ing.grasas_por_100g) * factor
        total_cal += cal
        total_prot += prot
        total_carb += carb
        total_grasas += grasas

        ingredientes.append({
            "ingrediente_id": cpi.ingrediente_id,
            "ingrediente_nombre": ing.nombre,
            "cantidad_gramos": float(cpi.cantidad_gramos),
        })

    return {
        "plato_nombre": plato.nombre if plato else "",
        "calorias": round(total_cal, 2),
        "proteinas": round(total_prot, 2),
        "carbohidratos": round(total_carb, 2),
        "grasas": round(total_grasas, 2),
        "ingredientes": ingredientes,
    }


@router.get("")
def list_planificacion(
    semana_inicio: date = None,
    client_id: int = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth)
):
    if semana_inicio is None:
        semana_inicio = get_monday(date.today())
    
    # Si no es admin, forzar su id
    if user.rol != "admin":
        client_id = user.id
    
    query = db.query(PlanificacionSemanal).filter(
        PlanificacionSemanal.semana_inicio == semana_inicio
    )
    if client_id:
        query = query.filter(PlanificacionSemanal.client_id == client_id)
    
    results = []
    for p in query.all():
        plato = db.query(Plato).filter(Plato.id == p.plato_id).first() if p.plato_id else None
        cliente_plato = (
            db.query(ClientePlato).filter(ClientePlato.id == p.cliente_plato_id).first()
            if p.cliente_plato_id else None
        )
        client = db.query(Usuario).filter(Usuario.id == p.client_id).first()
        plato_info = None
        if cliente_plato:
            plato_info = build_plato_info_from_cliente_plato(db, cliente_plato)
        elif plato:
            plato_info = build_plato_info_from_plato(db, plato)
        results.append({
            "id": p.id,
            "semana_inicio": p.semana_inicio,
            "dia": p.dia,
            "momento": p.momento,
            "plato_id": p.plato_id,
            "cliente_plato_id": p.cliente_plato_id,
            "plato_nombre": plato_info["plato_nombre"] if plato_info else None,
            "calorias": plato_info["calorias"] if plato_info else None,
            "client_id": p.client_id,
            "client_nombre": client.nombre if client else "Desconocido",
            "ingredientes": plato_info["ingredientes"] if plato_info else [],
            "notas": p.notas,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        })
    return results


@router.get("/resumen/{client_id}")
def get_resumen_semanal(
    client_id: int, 
    semana_inicio: date = None, 
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth)
):
    # Verificar acceso
    if not check_client_access(user, client_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")
    
    client = db.query(Usuario).filter(Usuario.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    if semana_inicio is None:
        semana_inicio = get_monday(date.today())
    
    planificaciones = db.query(PlanificacionSemanal).filter(
        PlanificacionSemanal.semana_inicio == semana_inicio,
        PlanificacionSemanal.client_id == client_id
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
            if planif and (planif.plato_id or planif.cliente_plato_id):
                cliente_plato = (
                    db.query(ClientePlato).filter(ClientePlato.id == planif.cliente_plato_id).first()
                    if planif.cliente_plato_id else None
                )
                plato = db.query(Plato).filter(Plato.id == planif.plato_id).first() if planif.plato_id else None
                plato_info = None
                if cliente_plato:
                    plato_info = build_plato_info_from_cliente_plato(db, cliente_plato)
                elif plato:
                    plato_info = build_plato_info_from_plato(db, plato)

                if plato_info:
                    comidas.append({
                        "momento": momento,
                        "plato_id": plato.id if plato else None,
                        "cliente_plato_id": cliente_plato.id if cliente_plato else None,
                        "plato_nombre": plato_info["plato_nombre"],
                        "calorias": plato_info["calorias"],
                        "proteinas": plato_info["proteinas"],
                        "carbohidratos": plato_info["carbohidratos"],
                        "grasas": plato_info["grasas"],
                        "ingredientes": plato_info["ingredientes"],
                    })
                    calorias_dia += float(plato_info["calorias"])
                    proteinas_dia += float(plato_info["proteinas"])
                    carbs_dia += float(plato_info["carbohidratos"])
                    grasas_dia += float(plato_info["grasas"])
        
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
        "client_id": client.id,
        "client_nombre": client.nombre,
        "dias": dias_data,
    }


@router.post("", status_code=201)
def create_planificacion(
    planif_data: PlanificacionCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth)
):
    # Verificar acceso
    if not check_client_access(user, planif_data.client_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")
    
    client = db.query(Usuario).filter(Usuario.id == planif_data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    if planif_data.plato_id and planif_data.cliente_plato_id:
        raise HTTPException(status_code=400, detail="Elige plato o plato asociado, no ambos")

    if planif_data.plato_id:
        plato = db.query(Plato).filter(Plato.id == planif_data.plato_id).first()
        if not plato:
            raise HTTPException(status_code=404, detail="Plato no encontrado")

    if planif_data.cliente_plato_id:
        cliente_plato = db.query(ClientePlato).filter(
            ClientePlato.id == planif_data.cliente_plato_id,
            ClientePlato.client_id == planif_data.client_id
        ).first()
        if not cliente_plato:
            raise HTTPException(status_code=404, detail="Plato asociado no encontrado")
    
    existing = db.query(PlanificacionSemanal).filter(
        PlanificacionSemanal.semana_inicio == planif_data.semana_inicio,
        PlanificacionSemanal.dia == planif_data.dia,
        PlanificacionSemanal.momento == planif_data.momento,
        PlanificacionSemanal.client_id == planif_data.client_id,
    ).first()
    
    if existing:
        existing.plato_id = planif_data.plato_id
        existing.cliente_plato_id = planif_data.cliente_plato_id
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
    if not check_client_access(user, db_planif.client_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")
    
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
    if not check_client_access(user, db_planif.client_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")
    
    db.delete(db_planif)
    db.commit()
    return None
