from pydantic import BaseModel
from typing import Optional, List
import datetime

# Esquemas para Producto
class ProductoBase(BaseModel):
    nombre: str
    precio: float
    costo: float = 0.0
    es_servicio: bool = False
    unidad_medida: Optional[str] = "UND"

class ProductoCreate(ProductoBase):
    pass

class Producto(ProductoBase):
    id: int

    class Config:
        from_attributes = True

# Esquemas para Cliente
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

    class Config:
        from_attributes = True

class ClienteDetails(Cliente):
    deuda_actual: float

# Esquemas para Pago
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

    class Config:
        from_attributes = True

# Esquemas para Modulo
class ModuloBase(BaseModel):
    name: str
    description: Optional[str] = None
    frontend_path: str

class ModuloCreate(ModuloBase):
    pass

class Modulo(ModuloBase):
    id: int

    class Config:
        from_attributes = True

# Esquemas para Rol
class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    modules: List[Modulo] = [] # Añadir la lista de módulos

    class Config:
        from_attributes = True

# Esquemas para Usuario
class UserBase(BaseModel):
    username: str
    role_id: int

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: Role # Relación con el esquema de Role (que ahora incluye módulos)

    class Config:
        from_attributes = True
        exclude = ["hashed_password"] # Excluir la contraseña hasheada al devolver el usuario

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Esquemas para DetalleVenta
class DetalleVentaBase(BaseModel):
    producto_id: int
    cantidad: Optional[float]

class DetalleVentaCreate(DetalleVentaBase):
    precio_unitario: Optional[float] = None # Hacer opcional para la creación

class DetalleVenta(DetalleVentaBase):
    id: int
    venta_id: int
    precio_unitario: float
    producto: Optional[Producto] # To load product details

    class Config:
        from_attributes = True

# Esquemas para Venta
class VentaBase(BaseModel):
    cliente_id: int
    detalles: List[DetalleVentaCreate]
    pagada: bool = True # Keep pagada for initial creation

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
    detalles: List[DetalleVenta] = [] # List of sale details
    pagos: List[Pago] = []

    class Config:
        from_attributes = True

# Nuevos esquemas para Reportes
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

# Esquemas para Historial de Cliente
class VentaHistoryItem(BaseModel):
    id: int
    detalles: List[DetalleVenta] = []
    total: float
    fecha: datetime.datetime
    monto_pagado: float
    estado_pago: str
    pagos: List[Pago] = [] # Incluir pagos específicos de esta venta

    class Config:
        from_attributes = True

class ClienteHistory(BaseModel):
    cliente: Cliente
    ventas: List[VentaHistoryItem] = []
    total_deuda: float
    total_pagado_general: float
    total_ventas_general: float

    class Config:
        from_attributes = True

# Nuevos esquemas para Reportes Detallados
class ProductoVendido(BaseModel):
    product_id: int
    product_name: str
    total_quantity_sold: float
    es_servicio: bool # Añadir para poder filtrar en el frontend
    total_revenue: float

    class Config:
        from_attributes = True

class ReporteProductosVendidos(BaseModel):
    productos: List[ProductoVendido]
    servicios: List[ProductoVendido]

class ClienteComprador(BaseModel):
    client_id: int
    client_name: str
    total_purchase_amount: float

    class Config:
        from_attributes = True

class ClienteDeudor(BaseModel):
    client_id: int
    client_name: str
    total_debt_amount: float

    class Config:
        from_attributes = True

class ProductoRentabilidad(BaseModel):
    product_id: int
    product_name: str
    total_quantity_sold: float
    total_revenue: float
    total_cost: float
    net_profit: float
    profit_margin: float

# --- Esquemas para Órdenes de Trabajo y Productividad ---

# Esquema para Evidencia
class EvidenciaBase(BaseModel):
    file_path: str

class EvidenciaCreate(EvidenciaBase):
    pass

class Evidencia(EvidenciaBase):
    id: int
    orden_id: int
    uploaded_at: datetime.datetime

    class Config:
        from_attributes = True

# Esquema para Productos en una Orden de Trabajo
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

    class Config:
        from_attributes = True

# Esquema para Servicios en una Orden de Trabajo
class OrdenServicioBase(BaseModel):
    servicio_id: int
    cantidad: float
    precio_servicio: float

class OrdenServicioCreate(OrdenServicioBase):
    pass

class OrdenServicio(OrdenServicioBase):
    id: int
    orden_id: int
    servicio: Producto # Un servicio es un producto
    cantidad: Optional[float]


    class Config:
        from_attributes = True

# Esquema para Órdenes de Trabajo
class OrdenTrabajoBase(BaseModel):
    cliente_id: int
    total: float
    operador_id: Optional[int] = None # Añadido para permitir la modificación del operador

class OrdenTrabajoCreate(OrdenTrabajoBase):
    productos: List[OrdenProductoCreate] = []
    servicios: List[OrdenServicioCreate] = []

class OrdenTrabajoUpdate(BaseModel):
    estado: Optional[str] = None
    observaciones_aprobador: Optional[str] = None

class OrdenTrabajoClose(BaseModel):
    was_paid: bool
    payment_type: Optional[str] = None # 'total' or 'partial'
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

    class Config:
        from_attributes = True

# Esquema para Notificaciones
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

    class Config:
        from_attributes = True

# Esquema para Registro de Productividad
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

    class Config:
        from_attributes = True

# Esquemas para Reporte de Productividad
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


# --- Esquemas para el Panel del Operador ---

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

    class Config:
        from_attributes = True

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

    class Config:
        from_attributes = True

# Esquemas para Carga Masiva desde Excel
class ProductoExcel(BaseModel):
    nombre: str
    precio: float
    costo: float = 0.0
    es_servicio: bool = False
    unidad_medida: Optional[str] = "UND"

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