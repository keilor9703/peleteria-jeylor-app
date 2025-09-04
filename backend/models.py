from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    cedula = Column(String, unique=True, index=True, nullable=True)
    telefono = Column(String, nullable=True)
    direccion = Column(String, nullable=True)
    cupo_credito = Column(Float, default=0.0)

    ventas = relationship("Venta", back_populates="cliente")
    ordenes_trabajo = relationship("OrdenTrabajo", back_populates="cliente")

class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    precio = Column(Float)
    costo = Column(Float, default=0.0)
    es_servicio = Column(Boolean, default=False)
    unidad_medida = Column(String, default="UND")

class DetalleVenta(Base):
    __tablename__ = "detalles_venta"
    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Float)
    precio_unitario = Column(Float)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto")

class Pago(Base):
    __tablename__ = "pagos"
    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"))
    monto = Column(Float)
    fecha = Column(DateTime, default=datetime.utcnow)
    metodo_pago = Column(String, nullable=True)

    venta = relationship("Venta", back_populates="pagos")

class Venta(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    total = Column(Float)
    fecha = Column(DateTime, default=datetime.utcnow)
    monto_pagado = Column(Float, default=0.0)
    estado_pago = Column(String, default="pendiente") # pagado, parcial, pendiente
    fecha_pago = Column(DateTime, nullable=True) # New field for payment date

    cliente = relationship("Cliente", back_populates="ventas")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")
    pagos = relationship("Pago", back_populates="venta", cascade="all, delete-orphan")
    orden_trabajo_asociada = relationship("OrdenTrabajo", back_populates="venta_asociada", uselist=False)

class Modulo(Base):
    __tablename__ = "modulos"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    frontend_path = Column(String, unique=True)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    users = relationship("User", back_populates="role")
    modules = relationship("Modulo", secondary="role_modules", back_populates="roles")

class RoleModule(Base):
    __tablename__ = "role_modules"
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    module_id = Column(Integer, ForeignKey("modulos.id"), primary_key=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role_id = Column(Integer, ForeignKey("roles.id"))

    role = relationship("Role", back_populates="users")
    ordenes_trabajo = relationship("OrdenTrabajo", back_populates="operador")
    notificaciones = relationship("Notificacion", back_populates="usuario")

Modulo.roles = relationship("Role", secondary="role_modules", back_populates="modules")

class OrdenProducto(Base):
    __tablename__ = "orden_productos"
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_trabajo.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Float)
    precio_unitario = Column(Float)

    orden = relationship("OrdenTrabajo", back_populates="productos")
    producto = relationship("Producto")

class OrdenServicio(Base):
    __tablename__ = "orden_servicios"
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_trabajo.id"))
    servicio_id = Column(Integer, ForeignKey("productos.id")) # Un servicio es un producto
    cantidad = Column(Float)
    precio_servicio = Column(Float)

    orden = relationship("OrdenTrabajo", back_populates="servicios")
    servicio = relationship("Producto")

class Evidencia(Base):
    __tablename__ = "evidencias"
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_trabajo.id"))
    file_path = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    orden = relationship("OrdenTrabajo", back_populates="evidencias")

class OrdenTrabajo(Base):
    __tablename__ = "ordenes_trabajo"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    operador_id = Column(Integer, ForeignKey("users.id"))
    total = Column(Float)
    estado = Column(String, default="Borrador")
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    observaciones_aprobador = Column(String, nullable=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"), nullable=True) # Foreign key to Venta

    cliente = relationship("Cliente", back_populates="ordenes_trabajo")
    operador = relationship("User", back_populates="ordenes_trabajo")
    productos = relationship("OrdenProducto", back_populates="orden", cascade="all, delete-orphan")
    servicios = relationship("OrdenServicio", back_populates="orden", cascade="all, delete-orphan")
    evidencias = relationship("Evidencia", back_populates="orden", cascade="all, delete-orphan")
    venta_asociada = relationship("Venta", back_populates="orden_trabajo_asociada", uselist=False) # Relationship to Venta

class Notificacion(Base):
    __tablename__ = "notificaciones"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"))
    mensaje = Column(String)
    leido = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    orden_id = Column(Integer, ForeignKey("ordenes_trabajo.id"), nullable=True)

    usuario = relationship("User", back_populates="notificaciones")
    orden = relationship("OrdenTrabajo")

class RegistroProductividad(Base):
    __tablename__ = "registros_productividad"
    id = Column(Integer, primary_key=True, index=True)
    operador_id = Column(Integer, ForeignKey("users.id"))
    orden_id = Column(Integer, ForeignKey("ordenes_trabajo.id"))
    servicio_id = Column(Integer, ForeignKey("productos.id"))
    valor_productividad = Column(Float)
    modalidad_pago = Column(String)
    fecha = Column(DateTime, default=datetime.utcnow)

    operador = relationship("User")
    orden = relationship("OrdenTrabajo")
    servicio = relationship("Producto")