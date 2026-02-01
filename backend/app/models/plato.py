from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class MomentoDia(str, enum.Enum):
    DESAYUNO = "desayuno"
    ALMUERZO = "almuerzo"
    COMIDA = "comida"
    MERIENDA = "merienda"
    CENA = "cena"


class Plato(Base):
    __tablename__ = "platos"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    momentos_dia = Column(
        ARRAY(
            Enum(
                MomentoDia,
                name="momento_dia",
                values_callable=lambda enum_cls: [e.value for e in enum_cls],
            )
        ),
        nullable=False,
    )
    calorias_totales = Column(Numeric(10, 2), default=0)
    proteinas_totales = Column(Numeric(10, 2), default=0)
    carbohidratos_totales = Column(Numeric(10, 2), default=0)
    grasas_totales = Column(Numeric(10, 2), default=0)
    fibra_totales = Column(Numeric(10, 2), default=0)
    peso_total_gramos = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    ingredientes = relationship("PlatoIngrediente", back_populates="plato", cascade="all, delete-orphan")


class PlatoIngrediente(Base):
    __tablename__ = "plato_ingredientes"

    id = Column(Integer, primary_key=True)
    plato_id = Column(Integer, ForeignKey("platos.id", ondelete="CASCADE"), nullable=False)
    ingrediente_id = Column(Integer, ForeignKey("ingredientes.id", ondelete="CASCADE"), nullable=False)
    cantidad_gramos = Column(Numeric(10, 2), nullable=False)
    calorias_aportadas = Column(Numeric(10, 2), default=0)
    proteinas_aportadas = Column(Numeric(10, 2), default=0)
    carbohidratos_aportados = Column(Numeric(10, 2), default=0)
    grasas_aportadas = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime, server_default=func.now())

    plato = relationship("Plato", back_populates="ingredientes")
    ingrediente = relationship("Ingrediente")
