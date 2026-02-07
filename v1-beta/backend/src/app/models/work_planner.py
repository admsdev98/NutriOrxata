from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class WorkTask(Base):
    __tablename__ = "work_tasks"

    id = Column(Integer, primary_key=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    fecha_limite = Column(DateTime, nullable=True)
    estado = Column(String(20), nullable=False, default="pendiente")
    prioridad = Column(String(20), nullable=False, default="media")

    asignado_a_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    creado_por_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    asignado_a = relationship("Usuario", foreign_keys=[asignado_a_id])
    creado_por = relationship("Usuario", foreign_keys=[creado_por_id])


class WorkAppointment(Base):
    __tablename__ = "work_appointments"

    id = Column(Integer, primary_key=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    tipo = Column(String(20), nullable=False, default="telefono")

    empieza_en = Column(DateTime, nullable=False)
    termina_en = Column(DateTime, nullable=True)
    enlace = Column(String(500), nullable=True)
    telefono = Column(String(50), nullable=True)

    asignado_a_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    creado_por_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    asignado_a = relationship("Usuario", foreign_keys=[asignado_a_id])
    creado_por = relationship("Usuario", foreign_keys=[creado_por_id])


class WorkNote(Base):
    __tablename__ = "work_notes"

    id = Column(Integer, primary_key=True)
    titulo = Column(String(200), nullable=True)
    contenido = Column(Text, nullable=False)
    fecha = Column(Date, nullable=True)

    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    creado_por_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    creado_por = relationship("Usuario", foreign_keys=[creado_por_id])
