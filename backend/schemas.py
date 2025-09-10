from pydantic import BaseModel, ConfigDict
from typing import Optional, List
import datetime
from enum import Enum


# ---------- Kardex ----------
class KardexItem(BaseModel):
    fecha: datetime.datetime
    tipo: str           # 'entrada' | 'salida' | 'ajuste'
    cantidad: float
    costo_unitario: float
    referencia: Optional[str] = None
    saldo_cantidad: float
    saldo_costo_unitario: float
    saldo_valor: float

    class Config:
        from_attributes = True

class KardexResponse(BaseModel):
    producto_id: int
    producto_nombre: str
    items: List[KardexItem]

# ---------- Inventario actual ----------
class InventarioItem(BaseModel):
    id: int
    nombre: str
    es_servicio: bool
    unidad_medida: Optional[str]
    stock_actual: float
    costo: float
    precio: float
    valor_costo: float        # stock_actual * costo
    valor_venta: float        # stock_actual * precio

    class Config:
        from_attributes = True

class InventarioSnapshot(BaseModel):
    items: List[InventarioItem]
    total_valor_costo: float
    total_valor_venta: float

# ---------- Rotación (más vendidos / más lentos) ----------
class ProductoRotacionItem(BaseModel):
    producto_id: int
    nombre: str
    es_servicio: bool
    total_cantidad_vendida: float
    total_ingresos: float     # suma (cantidad * precio_unitario)

class ReporteRotacion(BaseModel):
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    top: List[ProductoRotacionItem]
    slow: List[ProductoRotacionItem]



# =========================
# Producto / Inventario
# =========================
class ProductoBase(BaseModel):
    nombre: str
    precio: float
    costo: float = 0.0
    es_servicio: bool = False
    unidad_medida: Optional[str] = "UND"
    # Inventario
    stock_minimo: float = 0.0  # nuevo en fase 1 (editable)
    # stock_actual NO se edita aquí; se mueve con movimientos

class ProductoCreate(ProductoBase):
    pass

class Producto(ProductoBase):
    id: int
    stock_actual: float = 0.0  # solo lectura hacia el front (lo mantiene el backend con movimientos)

    model_config = ConfigDict(from_attributes=True)

class MovementType(str, Enum):
    entrada = "entrada"
    salida = "salida"
    ajuste = "ajuste"

class InventoryMovementCreate(BaseModel):
    producto_id: int
    tipo: MovementType
    cantidad: float
    costo_unitario: float = 0.0
    motivo: Optional[str] = ""
    referencia: Optional[str] = ""
    observacion: Optional[str] = ""

class InventoryMovementOut(BaseModel):
    id: int
    producto_id: int
    producto: Optional[Producto] = None      # 👈 para traer el nombre
    tipo: MovementType
    cantidad: float
    costo_unitario: float                    # 👈 antes tenías "floatPago"
    motivo: Optional[str] = None
    referencia: Optional[str] = None
    observacion: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryAlertOut(BaseModel):
    producto_id: int
    nombre: str
    stock_actual: float
    stock_minimo: float

class ProductoStockUpdate(BaseModel):
    stock_minimo: Optional[float] = None


# =========================
# Cliente
# =========================
class ClienteBase(BaseModel):
    nombre: str
    cedula: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    cupo_credito: Optional[float] = 0.0

class ClienteCreate(ClienteBase):
    pass

class Cliente(ClienteBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class ClienteDetails(Cliente):
    deuda_actual: float


# =========================
# Pago
# =========================
class PagoBase(BaseModel):
    venta_id: int
    monto: float
    metodo_pago: Optional[str] = None

class PagoCreate(PagoBase):
    pass

class PagoUpdate(BaseModel):
    monto: Optional[float] = None
    metodo_pago: Optional[str] = None

class Pago(PagoBase):
    id: int
    fecha: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# =========================
# Módulos / Roles / Usuarios
# =========================
class ModuloBase(BaseModel):
    name: str
    description: Optional[str] = None
    frontend_path: str

class ModuloCreate(ModuloBase):
    pass

class Modulo(ModuloBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    modules: List[Modulo] = []

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str
    role_id: int

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: Role

    # hashed_password está en modelo ORM; aquí no se expone
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# =========================
# Venta
# =========================
class DetalleVentaBase(BaseModel):
    producto_id: int
    cantidad: Optional[float]

class DetalleVentaCreate(DetalleVentaBase):
    precio_unitario: Optional[float] = None  # opcional en creación

class DetalleVenta(DetalleVentaBase):
    id: int
    venta_id: int
    precio_unitario: float
    producto: Optional[Producto]

    model_config = ConfigDict(from_attributes=True)

class VentaBase(BaseModel):
    cliente_id: int
    detalles: List[DetalleVentaCreate]
    pagada: bool = True

class VentaCreate(VentaBase):
    pass

class Venta(VentaBase):
    id: int
    total: float
    fecha: datetime.datetime
    monto_pagado: float
    estado_pago: str
    cliente_id: Optional[int]
    cliente: Optional[Cliente]
    detalles: List[DetalleVenta] = []
    pagos: List[Pago] = []

    model_config = ConfigDict(from_attributes=True)


# =========================
# Reportes
# =========================
class VentasSummary(BaseModel):
    total_pagado: float
    total_pendiente: float
    total_general: float
    total_ventas_hoy: float

class ClienteCuentasPorCobrar(BaseModel):
    cliente_id: int
    cliente_nombre: str
    monto_pendiente: float
    ventas_pendientes: List[Venta] = []

class VentaHistoryItem(BaseModel):
    id: int
    detalles: List[DetalleVenta] = []
    total: float
    fecha: datetime.datetime
    monto_pagado: float
    estado_pago: str
    pagos: List[Pago] = []

    model_config = ConfigDict(from_attributes=True)

class ClienteHistory(BaseModel):
    cliente: Cliente
    ventas: List[VentaHistoryItem] = []
    total_deuda: float
    total_pagado_general: float
    total_ventas_general: float

    model_config = ConfigDict(from_attributes=True)

class ProductoVendido(BaseModel):
    product_id: int
    product_name: str
    total_quantity_sold: float
    es_servicio: bool
    total_revenue: float

    model_config = ConfigDict(from_attributes=True)

class ReporteProductosVendidos(BaseModel):
    productos: List[ProductoVendido]
    servicios: List[ProductoVendido]

class ClienteComprador(BaseModel):
    client_id: int
    client_name: str
    total_purchase_amount: float

    model_config = ConfigDict(from_attributes=True)

class ClienteDeudor(BaseModel):
    client_id: int
    client_name: str
    total_debt_amount: float

    model_config = ConfigDict(from_attributes=True)

class ProductoRentabilidad(BaseModel):
    product_id: int
    product_name: str
    total_quantity_sold: float
    total_revenue: float
    total_cost: float
    net_profit: float
    profit_margin: float


# =========================
# Órdenes de Trabajo / Productividad
# =========================
class EvidenciaBase(BaseModel):
    file_path: str

class EvidenciaCreate(EvidenciaBase):
    pass

class Evidencia(EvidenciaBase):
    id: int
    orden_id: int
    uploaded_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class OrdenProductoBase(BaseModel):
    producto_id: int
    cantidad: float
    precio_unitario: float

class OrdenProductoCreate(OrdenProductoBase):
    pass

class OrdenProducto(OrdenProductoBase):
    id: int
    orden_id: int
    producto: Producto

    model_config = ConfigDict(from_attributes=True)

class OrdenServicioBase(BaseModel):
    servicio_id: int
    cantidad: float
    precio_servicio: float

class OrdenServicioCreate(OrdenServicioBase):
    pass

class OrdenServicio(OrdenServicioBase):
    id: int
    orden_id: int
    servicio: Producto
    cantidad: Optional[float]

    model_config = ConfigDict(from_attributes=True)

class OrdenTrabajoBase(BaseModel):
    cliente_id: int
    total: float
    operador_id: Optional[int] = None

class OrdenTrabajoCreate(OrdenTrabajoBase):
    productos: List[OrdenProductoCreate] = []
    servicios: List[OrdenServicioCreate] = []

class OrdenTrabajoUpdate(BaseModel):
    estado: Optional[str] = None
    observaciones_aprobador: Optional[str] = None

class OrdenTrabajoClose(BaseModel):
    was_paid: bool
    payment_type: Optional[str] = None  # 'total' | 'partial'
    paid_amount: Optional[float] = None

class OrdenTrabajo(OrdenTrabajoBase):
    id: int
    operador_id: int
    estado: str
    fecha_creacion: datetime.datetime
    fecha_actualizacion: datetime.datetime
    observaciones_aprobador: Optional[str] = None

    cliente: Cliente
    operador: User
    productos: List[OrdenProducto] = []
    servicios: List[OrdenServicio] = []
    evidencias: List[Evidencia] = []

    model_config = ConfigDict(from_attributes=True)

class NotificacionBase(BaseModel):
    usuario_id: int
    mensaje: str
    orden_id: Optional[int] = None

class NotificacionCreate(NotificacionBase):
    pass

class Notificacion(NotificacionBase):
    id: int
    leido: bool
    fecha_creacion: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class RegistroProductividadBase(BaseModel):
    operador_id: int
    orden_id: int
    servicio_id: int
    valor_productividad: float
    modalidad_pago: str

class RegistroProductividadCreate(RegistroProductividadBase):
    pass

class RegistroProductividad(RegistroProductividadBase):
    id: int
    fecha: datetime.datetime
    servicio: Producto

    model_config = ConfigDict(from_attributes=True)

class ProductividadOperadorDetalle(BaseModel):
    orden_id: int
    servicio_nombre: str
    valor_ganado: float

class ProductividadOperador(BaseModel):
    operador_id: int
    operador_username: str
    total_ganado: float
    desglose: List[ProductividadOperadorDetalle] = []

class ReporteProductividad(BaseModel):
    start_date: datetime.date
    end_date: datetime.date
    reporte: List[ProductividadOperador] = []


# =========================
# Panel Operador
# =========================
class PanelOrdenPendiente(BaseModel):
    id: int
    cliente_id: int
    cliente_nombre: str
    cliente_telefono: Optional[str] = None
    cliente_direccion: Optional[str] = None
    estado: str
    fecha_creacion: datetime.datetime
    fecha_actualizacion: datetime.datetime
    total: float
    productos: List[OrdenProducto] = []
    servicios: List[OrdenServicio] = []

    model_config = ConfigDict(from_attributes=True)

class PanelProductividadDataPoint(BaseModel):
    name: str
    value: int

class PanelProductividad(BaseModel):
    servicios_hoy: int
    servicios_semana: int
    servicios_mes: int
    ordenes_completadas_semana: int
    grafica_servicios_semana: List[PanelProductividadDataPoint]

class PanelHistorialItem(BaseModel):
    id: int
    cliente_nombre: str
    fecha_actualizacion: datetime.datetime
    total: float
    estado_pago_venta: str

    model_config = ConfigDict(from_attributes=True)


# =========================
# Carga Masiva
# =========================
class ProductoExcel(BaseModel):
    nombre: str
    precio: float
    costo: float = 0.0
    es_servicio: bool = False
    unidad_medida: Optional[str] = "UND"
    stock_minimo: float = 0.0
    stock_inicial: float = 0.0   # 👈 nuevo campo opcional


class ClienteExcel(BaseModel):
    nombre: str
    cedula: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    cupo_credito: Optional[float] = 0.0

class BulkLoadResponse(BaseModel):
    success: bool
    message: str
    created_records: int = 0
    errors: List[str] = []

class MovementExcel(BaseModel):
    producto_id: Optional[int]
    producto_nombre: Optional[str]
    tipo: str   # entrada | salida | ajuste
    cantidad: float
    costo_unitario: Optional[float] = 0.0
    motivo: Optional[str] = None
    referencia: Optional[str] = None
    observacion: Optional[str] = None
