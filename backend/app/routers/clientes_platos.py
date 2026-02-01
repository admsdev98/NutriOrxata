from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import ClientePlato, ClientePlatoIngrediente, Plato, PlatoIngrediente, Ingrediente
from app.models.usuario import Usuario
from app.schemas.cliente_plato import ClientePlatoCreate, ClientePlatoUpdate, ClientePlatoResponse
from app.utils.security import require_auth

router = APIRouter(prefix="/api/clientes", tags=["clientes_platos"])


def check_client_access(user: Usuario, client_id: int) -> bool:
    if user.rol == "admin":
        return True
    return user.id == client_id


def build_cliente_plato_detail(db: Session, cliente_plato: ClientePlato) -> dict:
    plato = db.query(Plato).filter(Plato.id == cliente_plato.plato_id).first()

    ingredientes = []
    total_cal = 0
    total_prot = 0
    total_carb = 0
    total_grasas = 0
    total_peso = 0

    for cpi in cliente_plato.ingredientes:
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
        total_peso += float(cpi.cantidad_gramos)

        ingredientes.append({
            "ingrediente_id": cpi.ingrediente_id,
            "ingrediente_nombre": ing.nombre,
            "cantidad_gramos": float(cpi.cantidad_gramos),
            "calorias_aportadas": round(cal, 2),
            "proteinas_aportadas": round(prot, 2),
            "carbohidratos_aportados": round(carb, 2),
            "grasas_aportadas": round(grasas, 2),
        })

    momentos = cliente_plato.momentos_dia if cliente_plato.momentos_dia else (plato.momentos_dia if plato else [])

    return {
        "id": cliente_plato.id,
        "client_id": cliente_plato.client_id,
        "plato_id": cliente_plato.plato_id,
        "plato_nombre": plato.nombre if plato else "",
        "momentos_dia": momentos,
        "calorias_totales": round(total_cal, 2),
        "proteinas_totales": round(total_prot, 2),
        "carbohidratos_totales": round(total_carb, 2),
        "grasas_totales": round(total_grasas, 2),
        "peso_total_gramos": round(total_peso, 2),
        "ingredientes": ingredientes,
        "created_at": cliente_plato.created_at,
        "updated_at": cliente_plato.updated_at,
    }


@router.get("/{client_id}/platos", response_model=List[ClientePlatoResponse])
def list_client_platos(
    client_id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    if not check_client_access(user, client_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")

    platos = db.query(ClientePlato).filter(ClientePlato.client_id == client_id).all()
    return [build_cliente_plato_detail(db, p) for p in platos]


@router.post("/{client_id}/platos", response_model=ClientePlatoResponse, status_code=201)
def create_client_plato(
    client_id: int,
    payload: ClientePlatoCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    if not check_client_access(user, client_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")

    plato = db.query(Plato).filter(Plato.id == payload.plato_id).first()
    if not plato:
        raise HTTPException(status_code=404, detail="Plato no encontrado")

    existing = db.query(ClientePlato).filter(
        ClientePlato.client_id == client_id,
        ClientePlato.plato_id == payload.plato_id,
    ).first()

    momentos_payload = payload.momentos_dia or plato.momentos_dia

    if existing:
        if momentos_payload:
            current = set(existing.momentos_dia or [])
            existing.momentos_dia = list(current.union(momentos_payload))
        cliente_plato = existing
    else:
        cliente_plato = ClientePlato(
            client_id=client_id,
            plato_id=payload.plato_id,
            momentos_dia=momentos_payload,
        )
        db.add(cliente_plato)
        db.commit()
        db.refresh(cliente_plato)

    should_upsert_ingredientes = payload.ingredientes is not None or not existing

    if should_upsert_ingredientes:
        ingredientes = payload.ingredientes
        if not ingredientes:
            base_ingredientes = db.query(PlatoIngrediente).filter(
                PlatoIngrediente.plato_id == plato.id
            ).all()
            ingredientes = [
                {"ingrediente_id": pi.ingrediente_id, "cantidad_gramos": float(pi.cantidad_gramos)}
                for pi in base_ingredientes
            ]

        db.query(ClientePlatoIngrediente).filter(
            ClientePlatoIngrediente.cliente_plato_id == cliente_plato.id
        ).delete()

        for ing in ingredientes:
            if isinstance(ing, dict):
                ingrediente_id = ing.get("ingrediente_id")
                cantidad_gramos = ing.get("cantidad_gramos")
            else:
                ingrediente_id = ing.ingrediente_id
                cantidad_gramos = ing.cantidad_gramos
            db.add(
                ClientePlatoIngrediente(
                    cliente_plato_id=cliente_plato.id,
                    ingrediente_id=ingrediente_id,
                    cantidad_gramos=cantidad_gramos,
                )
            )

    db.commit()
    db.refresh(cliente_plato)
    return build_cliente_plato_detail(db, cliente_plato)


@router.put("/{client_id}/platos/{cliente_plato_id}", response_model=ClientePlatoResponse)
def update_client_plato(
    client_id: int,
    cliente_plato_id: int,
    payload: ClientePlatoUpdate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    if not check_client_access(user, client_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")

    cliente_plato = db.query(ClientePlato).filter(
        ClientePlato.id == cliente_plato_id,
        ClientePlato.client_id == client_id,
    ).first()
    if not cliente_plato:
        raise HTTPException(status_code=404, detail="Plato asociado no encontrado")

    if payload.momentos_dia is not None:
        cliente_plato.momentos_dia = payload.momentos_dia

    if payload.ingredientes is not None:
        db.query(ClientePlatoIngrediente).filter(
            ClientePlatoIngrediente.cliente_plato_id == cliente_plato.id
        ).delete()

        for ing in payload.ingredientes:
            db.add(
                ClientePlatoIngrediente(
                    cliente_plato_id=cliente_plato.id,
                    ingrediente_id=ing.ingrediente_id,
                    cantidad_gramos=ing.cantidad_gramos,
                )
            )

    db.commit()
    db.refresh(cliente_plato)
    return build_cliente_plato_detail(db, cliente_plato)


@router.delete("/{client_id}/platos/{cliente_plato_id}", status_code=204)
def delete_client_plato(
    client_id: int,
    cliente_plato_id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    if not check_client_access(user, client_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a este cliente")

    cliente_plato = db.query(ClientePlato).filter(
        ClientePlato.id == cliente_plato_id,
        ClientePlato.client_id == client_id,
    ).first()
    if not cliente_plato:
        raise HTTPException(status_code=404, detail="Plato asociado no encontrado")

    db.delete(cliente_plato)
    db.commit()
    return None
