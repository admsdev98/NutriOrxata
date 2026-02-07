from datetime import datetime, date
from typing import Optional, List, Literal

from pydantic import BaseModel


TaskEstado = Literal["pendiente", "en_progreso", "hecha", "cancelada"]
TaskPrioridad = Literal["baja", "media", "alta"]
AppointmentTipo = Literal["telefono", "videollamada"]


class WorkTaskBase(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    fecha_limite: Optional[datetime] = None
    estado: TaskEstado = "pendiente"
    prioridad: TaskPrioridad = "media"
    asignado_a_id: int


class WorkTaskCreate(WorkTaskBase):
    pass


class WorkTaskUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_limite: Optional[datetime] = None
    estado: Optional[TaskEstado] = None
    prioridad: Optional[TaskPrioridad] = None
    asignado_a_id: Optional[int] = None


class WorkTaskResponse(WorkTaskBase):
    id: int
    creado_por_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkAppointmentBase(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    tipo: AppointmentTipo = "telefono"
    empieza_en: datetime
    termina_en: Optional[datetime] = None
    enlace: Optional[str] = None
    telefono: Optional[str] = None
    asignado_a_id: int


class WorkAppointmentCreate(WorkAppointmentBase):
    pass


class WorkAppointmentUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[AppointmentTipo] = None
    empieza_en: Optional[datetime] = None
    termina_en: Optional[datetime] = None
    enlace: Optional[str] = None
    telefono: Optional[str] = None
    asignado_a_id: Optional[int] = None


class WorkAppointmentResponse(WorkAppointmentBase):
    id: int
    creado_por_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkNoteBase(BaseModel):
    titulo: Optional[str] = None
    contenido: str
    fecha: Optional[date] = None
    usuario_id: int


class WorkNoteCreate(WorkNoteBase):
    pass


class WorkNoteUpdate(BaseModel):
    titulo: Optional[str] = None
    contenido: Optional[str] = None
    fecha: Optional[date] = None
    usuario_id: Optional[int] = None


class WorkNoteResponse(WorkNoteBase):
    id: int
    creado_por_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkDaySummary(BaseModel):
    fecha: date
    tareas: int = 0
    tareas_hechas: int = 0
    citas: int = 0
    llamadas: int = 0
    videollamadas: int = 0
    notas: int = 0


class WorkSummaryResponse(BaseModel):
    start: date
    end: date
    asignado_a_id: int
    dias: List[WorkDaySummary]
