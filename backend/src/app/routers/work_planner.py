from datetime import date, datetime, time, timedelta
from typing import Optional, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_

from app.database import get_db
from app.models.usuario import Usuario
from app.models.work_planner import WorkTask, WorkAppointment, WorkNote
from app.schemas.work_planner import (
    WorkTaskCreate,
    WorkTaskUpdate,
    WorkTaskResponse,
    WorkAppointmentCreate,
    WorkAppointmentUpdate,
    WorkAppointmentResponse,
    WorkNoteCreate,
    WorkNoteUpdate,
    WorkNoteResponse,
    WorkSummaryResponse,
    WorkDaySummary,
)
from app.utils.security import require_auth


router = APIRouter(prefix="/api/work-planner", tags=["work_planner"])


def _ensure_range(start: Optional[date], end: Optional[date]) -> tuple[date, date]:
    today = date.today()
    if start is None and end is None:
        return today, today + timedelta(days=30)
    if start is None:
        start = end
    if end is None:
        end = start
    if end < start:
        raise HTTPException(status_code=400, detail="Rango de fechas inválido")
    return start, end


def _range_dt(start: date, end: date) -> tuple[datetime, datetime]:
    start_dt = datetime.combine(start, time.min)
    end_dt = datetime.combine(end, time.max)
    return start_dt, end_dt


def _target_user_id(user: Usuario, requested_id: Optional[int]) -> int:
    if user.rol != "admin":
        return user.id
    return requested_id or user.id


def _assert_can_assign(user: Usuario, target_user_id: int):
    if user.rol == "admin":
        return
    if user.id != target_user_id:
        raise HTTPException(status_code=403, detail="Solo puedes asignarte a ti mismo")


def _get_user_or_404(db: Session, user_id: int) -> Usuario:
    u = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return u


@router.get("/tasks", response_model=list[WorkTaskResponse])
def list_tasks(
    start: Optional[date] = None,
    end: Optional[date] = None,
    asignado_a_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    start, end = _ensure_range(start, end)
    target_id = _target_user_id(user, asignado_a_id)

    start_dt, end_dt = _range_dt(start, end)

    q = db.query(WorkTask).filter(WorkTask.asignado_a_id == target_id)
    q = q.filter(
        (WorkTask.fecha_limite.is_(None))
        | and_(WorkTask.fecha_limite >= start_dt, WorkTask.fecha_limite <= end_dt)
    )
    return q.order_by(WorkTask.fecha_limite.asc().nulls_last(), WorkTask.created_at.desc()).all()


@router.post("/tasks", status_code=201, response_model=WorkTaskResponse)
def create_task(
    payload: WorkTaskCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    _assert_can_assign(user, payload.asignado_a_id)
    target = _get_user_or_404(db, payload.asignado_a_id)
    if target.rol != "admin":
        raise HTTPException(status_code=400, detail="Solo se pueden asignar tareas a trabajadores")

    task = WorkTask(**payload.model_dump(), creado_por_id=user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/tasks/{task_id}", response_model=WorkTaskResponse)
def update_task(
    task_id: int,
    payload: WorkTaskUpdate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    task = db.query(WorkTask).filter(WorkTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if user.rol != "admin" and task.asignado_a_id != user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tarea")

    data = payload.model_dump(exclude_unset=True)
    if "asignado_a_id" in data and data["asignado_a_id"] is not None:
        _assert_can_assign(user, data["asignado_a_id"])
        target = _get_user_or_404(db, data["asignado_a_id"])
        if target.rol != "admin":
            raise HTTPException(status_code=400, detail="Solo se pueden asignar tareas a trabajadores")

    for k, v in data.items():
        setattr(task, k, v)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    task = db.query(WorkTask).filter(WorkTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    if user.rol != "admin" and task.asignado_a_id != user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tarea")
    db.delete(task)
    db.commit()
    return None


@router.get("/appointments", response_model=list[WorkAppointmentResponse])
def list_appointments(
    start: Optional[date] = None,
    end: Optional[date] = None,
    asignado_a_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    start, end = _ensure_range(start, end)
    target_id = _target_user_id(user, asignado_a_id)
    start_dt, end_dt = _range_dt(start, end)

    q = db.query(WorkAppointment).filter(
        WorkAppointment.asignado_a_id == target_id,
        WorkAppointment.empieza_en >= start_dt,
        WorkAppointment.empieza_en <= end_dt,
    )
    return q.order_by(WorkAppointment.empieza_en.asc()).all()


@router.post("/appointments", status_code=201, response_model=WorkAppointmentResponse)
def create_appointment(
    payload: WorkAppointmentCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    _assert_can_assign(user, payload.asignado_a_id)
    target = _get_user_or_404(db, payload.asignado_a_id)
    if target.rol != "admin":
        raise HTTPException(status_code=400, detail="Solo se pueden asignar citas a trabajadores")

    appt = WorkAppointment(**payload.model_dump(), creado_por_id=user.id)
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


@router.put("/appointments/{appointment_id}", response_model=WorkAppointmentResponse)
def update_appointment(
    appointment_id: int,
    payload: WorkAppointmentUpdate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    appt = db.query(WorkAppointment).filter(WorkAppointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if user.rol != "admin" and appt.asignado_a_id != user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta cita")

    data = payload.model_dump(exclude_unset=True)
    if "asignado_a_id" in data and data["asignado_a_id"] is not None:
        _assert_can_assign(user, data["asignado_a_id"])
        target = _get_user_or_404(db, data["asignado_a_id"])
        if target.rol != "admin":
            raise HTTPException(status_code=400, detail="Solo se pueden asignar citas a trabajadores")

    for k, v in data.items():
        setattr(appt, k, v)
    db.commit()
    db.refresh(appt)
    return appt


@router.delete("/appointments/{appointment_id}", status_code=204)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    appt = db.query(WorkAppointment).filter(WorkAppointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if user.rol != "admin" and appt.asignado_a_id != user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta cita")
    db.delete(appt)
    db.commit()
    return None


@router.get("/notes", response_model=list[WorkNoteResponse])
def list_notes(
    start: Optional[date] = None,
    end: Optional[date] = None,
    usuario_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    start, end = _ensure_range(start, end)
    target_id = _target_user_id(user, usuario_id)

    q = db.query(WorkNote).filter(WorkNote.usuario_id == target_id)
    q = q.filter(
        (WorkNote.fecha.is_(None)) | and_(WorkNote.fecha >= start, WorkNote.fecha <= end)
    )
    return q.order_by(WorkNote.fecha.desc().nulls_last(), WorkNote.created_at.desc()).all()


@router.post("/notes", status_code=201, response_model=WorkNoteResponse)
def create_note(
    payload: WorkNoteCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    if payload.fecha is None:
        payload.fecha = date.today()

    _assert_can_assign(user, payload.usuario_id)
    target = _get_user_or_404(db, payload.usuario_id)
    if target.rol != "admin":
        raise HTTPException(status_code=400, detail="Solo se pueden asignar notas a trabajadores")

    note = WorkNote(**payload.model_dump(), creado_por_id=user.id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/notes/{note_id}", response_model=WorkNoteResponse)
def update_note(
    note_id: int,
    payload: WorkNoteUpdate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    note = db.query(WorkNote).filter(WorkNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    if user.rol != "admin" and note.usuario_id != user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta nota")

    data = payload.model_dump(exclude_unset=True)
    if "usuario_id" in data and data["usuario_id"] is not None:
        _assert_can_assign(user, data["usuario_id"])
        target = _get_user_or_404(db, data["usuario_id"])
        if target.rol != "admin":
            raise HTTPException(status_code=400, detail="Solo se pueden asignar notas a trabajadores")

    for k, v in data.items():
        setattr(note, k, v)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/notes/{note_id}", status_code=204)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    note = db.query(WorkNote).filter(WorkNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    if user.rol != "admin" and note.usuario_id != user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta nota")
    db.delete(note)
    db.commit()
    return None


@router.get("/summary", response_model=WorkSummaryResponse)
def get_summary(
    start: Optional[date] = None,
    end: Optional[date] = None,
    asignado_a_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_auth),
):
    start, end = _ensure_range(start, end)
    target_id = _target_user_id(user, asignado_a_id)

    start_dt, end_dt = _range_dt(start, end)

    # Tasks grouped by fecha_limite date
    tasks_rows = (
        db.query(
            func.date(WorkTask.fecha_limite).label("d"),
            func.count(WorkTask.id).label("tareas"),
            func.sum(case((WorkTask.estado == "hecha", 1), else_=0)).label("tareas_hechas"),
        )
        .filter(
            WorkTask.asignado_a_id == target_id,
            WorkTask.fecha_limite.isnot(None),
            WorkTask.fecha_limite >= start_dt,
            WorkTask.fecha_limite <= end_dt,
        )
        .group_by(func.date(WorkTask.fecha_limite))
        .all()
    )

    appt_rows = (
        db.query(
            func.date(WorkAppointment.empieza_en).label("d"),
            func.count(WorkAppointment.id).label("citas"),
            func.sum(case((WorkAppointment.tipo == "telefono", 1), else_=0)).label("llamadas"),
            func.sum(case((WorkAppointment.tipo == "videollamada", 1), else_=0)).label("videollamadas"),
        )
        .filter(
            WorkAppointment.asignado_a_id == target_id,
            WorkAppointment.empieza_en >= start_dt,
            WorkAppointment.empieza_en <= end_dt,
        )
        .group_by(func.date(WorkAppointment.empieza_en))
        .all()
    )

    notes_rows = (
        db.query(
            WorkNote.fecha.label("d"),
            func.count(WorkNote.id).label("notas"),
        )
        .filter(
            WorkNote.usuario_id == target_id,
            WorkNote.fecha.isnot(None),
            WorkNote.fecha >= start,
            WorkNote.fecha <= end,
        )
        .group_by(WorkNote.fecha)
        .all()
    )

    by_day: Dict[date, WorkDaySummary] = {}
    cursor = start
    while cursor <= end:
        by_day[cursor] = WorkDaySummary(fecha=cursor)
        cursor = cursor + timedelta(days=1)

    for r in tasks_rows:
        d = r.d
        if d in by_day:
            by_day[d].tareas = int(r.tareas or 0)
            by_day[d].tareas_hechas = int(r.tareas_hechas or 0)

    for r in appt_rows:
        d = r.d
        if d in by_day:
            by_day[d].citas = int(r.citas or 0)
            by_day[d].llamadas = int(r.llamadas or 0)
            by_day[d].videollamadas = int(r.videollamadas or 0)

    for r in notes_rows:
        d = r.d
        if d in by_day:
            by_day[d].notas = int(r.notas or 0)

    return WorkSummaryResponse(
        start=start,
        end=end,
        asignado_a_id=target_id,
        dias=[by_day[d] for d in sorted(by_day.keys())],
    )
