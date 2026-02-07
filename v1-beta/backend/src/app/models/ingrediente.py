from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
import enum


class CategoriaIngrediente(str, enum.Enum):
    PASTA_ARROZ = "Pasta y arroz"
    CARNES = "Carnes"
    PESCADOS = "Pescados"
    VERDURAS = "Verduras"
    FRUTAS = "Frutas"
    LACTEOS = "Lácteos"
    HUEVOS = "Huevos"
    LEGUMBRES = "Legumbres"
    PAN = "Pan"
    CEREALES = "Cereales"
    ACEITES = "Aceites"
    SALSAS = "Salsas"
    BEBIDAS = "Bebidas"
    OTROS = "Otros"


class Ingrediente(Base):
    __tablename__ = "ingredientes"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(200), nullable=False)
    categoria = Column(
        SQLEnum(
            CategoriaIngrediente,
            name="categoria_ingrediente",
            values_callable=lambda enum_cls: [entry.value for entry in enum_cls],
        ),
        nullable=False,
        default=CategoriaIngrediente.OTROS,
    )
    supermercado = Column(String(50), default="Mercadona")
    calorias_por_100g = Column(Numeric(10, 2), nullable=False)
    proteinas_por_100g = Column(Numeric(10, 2), default=0)
    carbohidratos_por_100g = Column(Numeric(10, 2), default=0)
    grasas_por_100g = Column(Numeric(10, 2), default=0)
    fibra_por_100g = Column(Numeric(10, 2), default=0)
    sal_por_100g = Column(Numeric(10, 2), default=0)
    notas = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
