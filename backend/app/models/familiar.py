from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Enum, DECIMAL
from sqlalchemy.sql import func
import enum
from app.database import Base


class GeneroFamiliar(str, enum.Enum):
    M = "M"
    F = "F"


class ActividadFisica(str, enum.Enum):
    sedentario = "sedentario"
    ligero = "ligero"
    moderado = "moderado"
    activo = "activo"
    muy_activo = "muy_activo"


class Familiar(Base):
    __tablename__ = "familiares"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    edad = Column(Integer)
    peso = Column(DECIMAL(5,2))
    altura = Column(Integer)
    genero = Column(Enum(GeneroFamiliar))
    actividad_fisica = Column(Enum(ActividadFisica), default=ActividadFisica.moderado)
    objetivo_calorias = Column(Integer, default=2000)
    notas = Column(Text)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
