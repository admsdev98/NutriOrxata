from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Float
from sqlalchemy.sql import func
import enum
from app.database import Base


class RolUsuario(str, enum.Enum):
    admin = "admin"
    cliente = "cliente"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False, default="cliente")
    activo = Column(Boolean, default=True)
    trabajador_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    
    # Datos personales
    apellidos = Column(String(100), nullable=True)
    edad = Column(Integer, nullable=True)
    altura = Column(Integer, nullable=True) # cm
    peso = Column(Float, nullable=True) # kg
    sexo = Column(String(10), nullable=True) # hombre, mujer
    grasa_corporal = Column(Float, nullable=True) # porcentaje
    
    # Objetivos
    nivel_actividad = Column(String(50), nullable=True)
    objetivo = Column(String(50), nullable=True) # mantenimiento, definicion, volumen
    calorias_mantenimiento = Column(Float, nullable=True)
    calorias_objetivo = Column(Float, nullable=True)
    distribucion_desayuno = Column(Float, nullable=True)
    distribucion_almuerzo = Column(Float, nullable=True)
    distribucion_comida = Column(Float, nullable=True)
    distribucion_merienda = Column(Float, nullable=True)
    distribucion_cena = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
