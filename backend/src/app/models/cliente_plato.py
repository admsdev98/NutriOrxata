from sqlalchemy import Column, Integer, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.plato import MomentoDia


class ClientePlato(Base):
    __tablename__ = "cliente_platos"

    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    plato_id = Column(Integer, ForeignKey("platos.id", ondelete="CASCADE"), nullable=False)
    momentos_dia = Column(
        ARRAY(
            Enum(
                MomentoDia,
                name="momento_dia",
                values_callable=lambda enum_cls: [e.value for e in enum_cls],
            )
        ),
        nullable=True,
    )
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    plato = relationship("Plato")
    client = relationship("Usuario")
    ingredientes = relationship(
        "ClientePlatoIngrediente",
        back_populates="cliente_plato",
        cascade="all, delete-orphan",
    )


class ClientePlatoIngrediente(Base):
    __tablename__ = "cliente_plato_ingredientes"

    id = Column(Integer, primary_key=True)
    cliente_plato_id = Column(Integer, ForeignKey("cliente_platos.id", ondelete="CASCADE"), nullable=False)
    ingrediente_id = Column(Integer, ForeignKey("ingredientes.id", ondelete="CASCADE"), nullable=False)
    cantidad_gramos = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    cliente_plato = relationship("ClientePlato", back_populates="ingredientes")
    ingrediente = relationship("Ingrediente")
