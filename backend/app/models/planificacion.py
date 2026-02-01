from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum
from app.models.usuario import Usuario


class DiaSemana(str, enum.Enum):
    LUNES = "lunes"
    MARTES = "martes"
    MIERCOLES = "miercoles"
    JUEVES = "jueves"
    VIERNES = "viernes"
    SABADO = "sabado"
    DOMINGO = "domingo"


class PlanificacionSemanal(Base):
    __tablename__ = "planificacion_semanal"

    id = Column(Integer, primary_key=True)
    semana_inicio = Column(Date, nullable=False)
    dia = Column(String(20), nullable=False)
    momento = Column(String(20), nullable=False)
    plato_id = Column(Integer, ForeignKey("platos.id", ondelete="SET NULL"))
    cliente_plato_id = Column(Integer, ForeignKey("cliente_platos.id", ondelete="SET NULL"))
    client_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    notas = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    plato = relationship("Plato")
    cliente_plato = relationship("ClientePlato")
    client = relationship("Usuario")
