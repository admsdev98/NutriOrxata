from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from app.database import get_db
from app.models import (
    PlanificacionSemanal,
    PlanificacionItem,
    Plato,
    PlatoIngrediente,
    ClientePlato,
    ClientePlatoIngrediente,
    Ingrediente,
)
from app.models.usuario import Usuario
from app.schemas import (
    PlanificacionCreate,
    PlanificacionUpdate,
    PlanificacionBulkRequest,
    PlanificacionBulkResponse,
    PlanificacionResponse,
    ResumenSemanal,
    ResumenDiario,
)
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


def ensure_cliente_plato_from_base(db: Session, client_id: int, plato_id: int, momento: str) -> ClientePlato:
    plato = db.query(Plato).filter(Plato.id == plato_id).first()
    if not plato:
        raise HTTPException(status_code=404, detail="Plato no encontrado")

    existing = db.query(ClientePlato).filter(
        ClientePlato.client_id == client_id,
        ClientePlato.plato_id == plato_id,
    ).first()

    if existing:
        if momento:
            current = set(existing.momentos_dia or [])
            if momento not in current:
                existing.momentos_dia = list(current.union({momento}))
        return existing

    momentos_payload = [momento] if momento else (plato.momentos_dia or [])
    cliente_plato = ClientePlato(
        client_id=client_id,
        plato_id=plato_id,
        momentos_dia=momentos_payload,
    )
    db.add(cliente_plato)
    db.flush()

    base_ingredientes = db.query(PlatoIngrediente).filter(
        PlatoIngrediente.plato_id == plato.id
    ).all()

    for pi in base_ingredientes:
        db.add(
            ClientePlatoIngrediente(
                cliente_plato_id=cliente_plato.id,
                ingrediente_id=pi.ingrediente_id,
                cantidad_gramos=float(pi.cantidad_gramos),
            )
        )

    return cliente_plato


def get_or_create_slot(db: Session, semana_inicio: date, dia: str, momento: str, client_id: int) -> PlanificacionSemanal:
    slot = db.query(PlanificacionSemanal).filter(
        PlanificacionSemanal.semana_inicio == semana_inicio,
        PlanificacionSemanal.dia == dia,
        PlanificacionSemanal.momento == momento,
        PlanificacionSemanal.client_id == client_id,
    ).first()
    if slot:
        return slot
    slot = PlanificacionSemanal(
        semana_inicio=semana_inicio,
        dia=dia,
        momento=momento,
        plato_id=None,
        cliente_plato_id=None,
        client_id=client_id,
        notas=None,
    )
    db.add(slot)
    db.flush()
    return slot


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
        items = db.query(PlanificacionItem).filter(PlanificacionItem.planificacion_id == p.id).order_by(
            PlanificacionItem.orden.asc(), PlanificacionItem.id.asc()
        ).all()

        plato = db.query(Plato).filter(Plato.id == p.plato_id).first() if p.plato_id else None
        cliente_plato = (
            db.query(ClientePlato).filter(ClientePlato.id == p.cliente_plato_id).first()
            if p.cliente_plato_id else None
        )
        client = db.query(Usuario).filter(Usuario.id == p.client_id).first()

        items_info = []
        if items:
            for it in items:
                if not it.cliente_plato_id:
                    continue
                cp = db.query(ClientePlato).filter(ClientePlato.id == it.cliente_plato_id).first()
                if not cp:
                    continue
                info = build_plato_info_from_cliente_plato(db, cp)
                items_info.append({
                    "orden": it.orden,
                    "cliente_plato_id": it.cliente_plato_id,
                    **info,
                })

        plato_info = None
        if not items_info:
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
            "items": items_info,
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

            if not planif:
                continue

            items = db.query(PlanificacionItem).filter(
                PlanificacionItem.planificacion_id == planif.id
            ).order_by(PlanificacionItem.orden.asc(), PlanificacionItem.id.asc()).all()

            comida_items = []
            if items:
                for it in items:
                    if not it.cliente_plato_id:
                        continue
                    cp = db.query(ClientePlato).filter(ClientePlato.id == it.cliente_plato_id).first()
                    if not cp:
                        continue
                    info = build_plato_info_from_cliente_plato(db, cp)
                    comida_items.append({
                        "orden": it.orden,
                        "cliente_plato_id": it.cliente_plato_id,
                        **info,
                    })
            elif planif.cliente_plato_id or planif.plato_id:
                cliente_plato = (
                    db.query(ClientePlato).filter(ClientePlato.id == planif.cliente_plato_id).first()
                    if planif.cliente_plato_id else None
                )
                plato = db.query(Plato).filter(Plato.id == planif.plato_id).first() if planif.plato_id else None
                plato_info = None
                if cliente_plato:
                    plato_info = build_plato_info_from_cliente_plato(db, cliente_plato)
                    comida_items.append({
                        "orden": 0,
                        "cliente_plato_id": cliente_plato.id,
                        **plato_info,
                    })
                elif plato:
                    plato_info = build_plato_info_from_plato(db, plato)
                    comida_items.append({
                        "orden": 0,
                        "plato_id": plato.id,
                        **plato_info,
                    })

            if not comida_items:
                continue

            total_cal = sum(float(i.get("calorias") or 0) for i in comida_items)
            total_prot = sum(float(i.get("proteinas") or 0) for i in comida_items)
            total_carb = sum(float(i.get("carbohidratos") or 0) for i in comida_items)
            total_gras = sum(float(i.get("grasas") or 0) for i in comida_items)

            comidas.append({
                "momento": momento,
                "calorias": round(total_cal, 2),
                "proteinas": round(total_prot, 2),
                "carbohidratos": round(total_carb, 2),
                "grasas": round(total_gras, 2),
                "items": comida_items,
                # Backwards-compat: keep single fields when there is exactly one item.
                "plato_nombre": comida_items[0].get("plato_nombre") if len(comida_items) == 1 else None,
                "cliente_plato_id": comida_items[0].get("cliente_plato_id") if len(comida_items) == 1 else None,
            })

            calorias_dia += float(total_cal)
            proteinas_dia += float(total_prot)
            carbs_dia += float(total_carb)
            grasas_dia += float(total_gras)
        
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

        # Keep items in sync.
        if planif_data.cliente_plato_id is not None:
            db.query(PlanificacionItem).filter(
                PlanificacionItem.planificacion_id == existing.id
            ).delete()
            db.add(PlanificacionItem(planificacion_id=existing.id, cliente_plato_id=planif_data.cliente_plato_id, orden=0))
            db.commit()
        elif planif_data.plato_id is not None:
            db.query(PlanificacionItem).filter(
                PlanificacionItem.planificacion_id == existing.id
            ).delete()
            db.commit()
        else:
            db.query(PlanificacionItem).filter(
                PlanificacionItem.planificacion_id == existing.id
            ).delete()
            db.commit()
        return existing
    
    db_planif = PlanificacionSemanal(**planif_data.model_dump())
    db.add(db_planif)
    db.commit()
    db.refresh(db_planif)

    if planif_data.cliente_plato_id is not None:
        db.add(
            PlanificacionItem(
                planificacion_id=db_planif.id,
                cliente_plato_id=planif_data.cliente_plato_id,
                orden=0,
            )
        )
        db.commit()
    return db_planif


@router.post("/bulk", response_model=PlanificacionBulkResponse)
def bulk_apply_planificacion(
    payload: PlanificacionBulkRequest,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    if not check_client_access(user, payload.client_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")

    if payload.momento not in MOMENTOS:
        raise HTTPException(status_code=400, detail="Momento inválido")

    dias = [d for d in payload.dias if d in DIAS]
    if not dias:
        raise HTTPException(status_code=400, detail="Dias inválidos")

    base_ids = payload.base_plato_ids or []
    cliente_ids = payload.cliente_plato_ids or []
    if base_ids and cliente_ids:
        raise HTTPException(status_code=400, detail="Usa base_plato_ids o cliente_plato_ids, no ambos")

    # Resolve target cliente_plato ids.
    resolved_cliente_ids: List[int] = []
    if base_ids:
        for base_id in base_ids:
            cp = ensure_cliente_plato_from_base(db, payload.client_id, base_id, payload.momento)
            resolved_cliente_ids.append(cp.id)
    else:
        resolved_cliente_ids = [int(x) for x in cliente_ids]

    # Normalize (dedupe, keep order).
    seen = set()
    normalized_ids: List[int] = []
    for cid in resolved_cliente_ids:
        if cid in seen:
            continue
        seen.add(cid)
        normalized_ids.append(cid)

    applied = 0
    skipped = 0

    # Ensure slots exist.
    slots: List[PlanificacionSemanal] = []
    for dia in dias:
        slots.append(get_or_create_slot(db, payload.semana_inicio, dia, payload.momento, payload.client_id))

    db.flush()

    for slot in slots:
        existing_items = db.query(PlanificacionItem).filter(
            PlanificacionItem.planificacion_id == slot.id
        ).order_by(PlanificacionItem.orden.asc(), PlanificacionItem.id.asc()).all()

        has_any = any(it.cliente_plato_id for it in existing_items)
        if payload.mode == "skip_if_filled" and has_any:
            skipped += 1
            continue

        if payload.mode == "replace":
            db.query(PlanificacionItem).filter(
                PlanificacionItem.planificacion_id == slot.id
            ).delete()
            existing_items = []
            slot.cliente_plato_id = None
            slot.plato_id = None

        # Add mode: append new ids, skipping duplicates.
        existing_ids = {it.cliente_plato_id for it in existing_items if it.cliente_plato_id}
        start_order = max([it.orden for it in existing_items], default=-1) + 1
        order = start_order
        for cid in normalized_ids:
            if cid in existing_ids:
                continue
            db.add(PlanificacionItem(planificacion_id=slot.id, cliente_plato_id=cid, orden=order))
            order += 1

        applied += 1

    db.commit()
    return {"applied": applied, "skipped": skipped}


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
