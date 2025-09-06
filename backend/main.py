
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime, timedelta
from jose import JWTError, jwt

import crud, models, schemas
from database import SessionLocal, engine
from models import Base

models.Base.metadata.create_all(bind=engine)



app = FastAPI()

# Configuración de CORS
origins = [
    "http://localhost:3000",
    "http://192.168.1.11:3000", # Añadido para permitir el acceso desde la red local
    "http://10.73.45.191:3000",
    "http://10.88.1.107:3000", # Añadido para permitir el acceso desde el otro dispositivo     
   "http://192.168.133.20:3000",
    "http://10.88.1.65:3000",
   "http://192.168.23.171:3000",
   "http://192.168.20.133:3000",
   "https://golden-gumption-0edc3a.netlify.app/",
   "https://golden-gumption-0edc3a.netlify.app:8000",
   "https://frolicking-belekoy-f0e791.netlify.app:8000",
   "https://peleteria-jeylor-app.vercel.app",
   # Si estás probando desde un dispositivo móvil en tu red local, añade aquí la IP de tu dispositivo móvil y el puerto del frontend (normalmente 3000).
   # Ejemplo: "http://192.168.1.X:3000", donde X es la IP de tu móvil.

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Configuración de seguridad para JWT
SECRET_KEY = "a-very-secure-random-key-that-should-be-in-env-for-production-1234567890" # ¡CAMBIA ESTO EN PRODUCCIÓN! Considera usar variables de entorno.
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependencia para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def initialize_default_data(db: Session):
    # Default Modules
    default_modules_data = [
        {"name": "Ventas", "description": "Módulo para la gestión de ventas.", "frontend_path": "/ventas"},
        {"name": "Clientes", "description": "Módulo para la gestión de clientes.", "frontend_path": "/clientes"},
        {"name": "Productos", "description": "Módulo para la gestión de productos y servicios.", "frontend_path": "/productos"},
        {"name": "Reportes", "description": "Módulo para la visualización de reportes.", "frontend_path": "/reportes"},
        {"name": "Gestion Usuarios", "description": "Módulo para la administración de usuarios.", "frontend_path": "/admin/users"},
        {"name": "Gestion Roles", "description": "Módulo para la administración de roles.", "frontend_path": "/admin/roles"},
        {"name": "Gestion Modulos", "description": "Módulo para la administración de módulos.", "frontend_path": "/admin/modules"},
        {"name": "Órdenes de Trabajo", "description": "Módulo para la gestión de órdenes de trabajo.", "frontend_path": "/ordenes-trabajo"},
        {"name": "Panel del Operador", "description": "Panel de productividad y gestión para operadores.", "frontend_path": "/panel-operador"},
    ]

    # Ensure Admin Role exists
    admin_role = crud.get_role_by_name(db, name="Admin")
    if not admin_role:
        admin_role = crud.create_role(db, schemas.RoleCreate(name="Admin"))

    # Create or get default modules
    created_modules = []
    for mod_data in default_modules_data:
        modulo = crud.get_modulo_by_name(db, name=mod_data["name"])
        if not modulo:
            modulo = crud.create_modulo(db, schemas.ModuloCreate(**mod_data))
        created_modules.append(modulo)

    # Assign all default modules to Admin role
    crud.set_modules_for_role(db, admin_role.id, [m.id for m in created_modules])

    # Create default admin user if not exists
    admin_user = crud.get_user_by_username(db, username="admin")
    if not admin_user:
        crud.create_user(db, schemas.UserCreate(username="admin", password="adminpass", role_id=admin_role.id))

@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    try:
        initialize_default_data(db)
    finally:
        db.close()

# Funciones de utilidad para JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: schemas.User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_admin_user(current_user: schemas.User = Depends(get_current_user)):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user

# --- Endpoints de Autenticación ---
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.name, "modules": [m.frontend_path for m in user.role.modules]},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Endpoints para Roles ---
@app.post("/roles/", response_model=schemas.Role)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    db_role = crud.get_role_by_name(db, name=role.name)
    if db_role:
        raise HTTPException(status_code=400, detail="Role already registered")
    return crud.create_role(db=db, role=role)

@app.get("/roles/", response_model=List[schemas.Role])
def read_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    roles = crud.get_roles(db, skip=skip, limit=limit)
    return roles

@app.put("/roles/{role_id}/modules", response_model=schemas.Role)
def set_role_modules(role_id: int, module_ids: List[int], db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    db_role = crud.set_modules_for_role(db, role_id=role_id, module_ids=module_ids)
    if db_role is None:
        raise HTTPException(status_code=404, detail="Role not found")
    return db_role

# --- Endpoints para Modulos ---
@app.post("/modulos/", response_model=schemas.Modulo)
def create_modulo(modulo: schemas.ModuloCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    db_modulo = crud.get_modulo_by_name(db, name=modulo.name)
    if db_modulo:
        raise HTTPException(status_code=400, detail="Modulo already registered")
    return crud.create_modulo(db=db, modulo=modulo)

@app.get("/modulos/", response_model=List[schemas.Modulo])
def read_modulos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    modulos = crud.get_modulos(db, skip=skip, limit=limit)
    return modulos

@app.put("/modulos/{modulo_id}", response_model=schemas.Modulo)
def update_modulo(modulo_id: int, modulo: schemas.ModuloCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    db_modulo = crud.update_modulo(db, modulo_id=modulo_id, modulo=modulo)
    if db_modulo is None:
        raise HTTPException(status_code=404, detail="Modulo not found")
    return db_modulo

@app.delete("/modulos/{modulo_id}")
def delete_modulo(modulo_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    db_modulo = crud.delete_modulo(db, modulo_id=modulo_id)
    if db_modulo is None:
        raise HTTPException(status_code=404, detail="Modulo not found")
    return {"message": "Modulo deleted successfully"}

# --- Endpoints para Usuarios ---
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_active_user)):
    return current_user

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user: schemas.UserCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    db_user = crud.update_user(db, user_id=user_id, user=user)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin_user)):
    db_user = crud.delete_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# --- Endpoints para Clientes ---
@app.post("/clientes/", response_model=schemas.Cliente)
def create_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    return crud.create_cliente(db=db, cliente=cliente)

@app.post("/clientes/upload", response_model=schemas.BulkLoadResponse)
def upload_clientes(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(get_current_active_user)
):
    return crud.bulk_create_clientes(db=db, file=file.file, filename=file.filename)

@app.get("/clientes/", response_model=List[schemas.Cliente])
def read_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    clientes = crud.get_clientes(db, skip=skip, limit=limit)
    return clientes

@app.get("/clientes/{cliente_id}", response_model=schemas.Cliente)
def read_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_cliente = crud.get_cliente(db, cliente_id=cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    return db_cliente

@app.put("/clientes/{cliente_id}", response_model=schemas.Cliente)
def update_cliente(cliente_id: int, cliente: schemas.ClienteCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_cliente = crud.update_cliente(db, cliente_id=cliente_id, cliente=cliente)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    return db_cliente

@app.get("/clientes/{cliente_id}/details", response_model=schemas.ClienteDetails)
def get_cliente_details(cliente_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_cliente = crud.get_cliente(db, cliente_id=cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    deuda_actual = crud.get_cliente_deuda(db, cliente_id=cliente_id)
    
    return schemas.ClienteDetails(
        **db_cliente.__dict__,
        deuda_actual=deuda_actual
    )

@app.delete("/clientes/{cliente_id}")
def delete_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_cliente = crud.delete_cliente(db, cliente_id=cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    return {"message": "Cliente deleted successfully"}

@app.get("/clientes/{cliente_id}/history", response_model=schemas.ClienteHistory)
def get_cliente_history(cliente_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    history = crud.get_cliente_history(db, cliente_id=cliente_id)
    if history is None:
        raise HTTPException(status_code=404, detail="Historial no encontrado para este cliente")
    return history

# --- Endpoints para Productos ---
@app.post("/productos/", response_model=schemas.Producto)
def create_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    return crud.create_producto(db=db, producto=producto)

@app.post("/productos/upload", response_model=schemas.BulkLoadResponse)
def upload_productos(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(get_current_active_user)
):
    return crud.bulk_create_productos(db=db, file=file.file, filename=file.filename)

@app.get("/productos/", response_model=List[schemas.Producto])
def read_productos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    productos = crud.get_productos(db, skip=skip, limit=limit)
    return productos

@app.put("/productos/{producto_id}", response_model=schemas.Producto)
def update_producto(producto_id: int, producto: schemas.ProductoCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_producto = crud.update_producto(db, producto_id=producto_id, producto=producto)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto not found")
    return db_producto

@app.delete("/productos/{producto_id}")
def delete_producto(producto_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_producto = crud.delete_producto(db, producto_id=producto_id)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto not found")
    return {"message": "Producto deleted successfully"}

# --- Endpoints para Ventas ---
@app.post("/ventas/", response_model=schemas.Venta)
def create_venta(venta: schemas.VentaCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_cliente = crud.get_cliente(db, cliente_id=venta.cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente not found")

    if not venta.detalles:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un producto.")

    # Validar cupo de crédito para ventas no pagadas
    if not venta.pagada:
        total_nueva_venta = sum(
            (d.precio_unitario if d.precio_unitario is not None else crud.get_producto(db, d.producto_id).precio) * d.cantidad
            for d in venta.detalles
        )
        deuda_actual = crud.get_cliente_deuda(db, venta.cliente_id)
        
        if (deuda_actual + total_nueva_venta) > db_cliente.cupo_credito:
            cupo_disponible = db_cliente.cupo_credito - deuda_actual
            raise HTTPException(
                status_code=400, 
                detail=f"La venta excede el cupo de crédito. Cupo disponible: {cupo_disponible:.2f}"
            )

    return crud.create_venta(db=db, venta=venta)

@app.get("/ventas/", response_model=List[schemas.Venta])
def read_ventas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    ventas = crud.get_ventas(db, skip=skip, limit=limit)
    return ventas

@app.get("/ventas/{venta_id}", response_model=schemas.Venta)
def read_venta(venta_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_venta = crud.get_venta(db, venta_id=venta_id)
    if db_venta is None:
        raise HTTPException(status_code=404, detail="Venta not found")
    return db_venta

@app.put("/ventas/{venta_id}", response_model=schemas.Venta)
def update_venta(venta_id: int, venta: schemas.VentaCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    # Validar que el cliente exista
    db_cliente = crud.get_cliente(db, cliente_id=venta.cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    # Validar que al menos un detalle de venta sea proporcionado
    if not venta.detalles:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un producto para la venta.")

    # Validar que todos los productos en los detalles existan
    for detalle in venta.detalles:
        db_producto = crud.get_producto(db, producto_id=detalle.producto_id)
        if not db_producto:
            raise HTTPException(status_code=404, detail=f"Producto con ID {detalle.producto_id} no encontrado.")

    db_venta = crud.update_venta(db, venta_id=venta_id, venta=venta)
    if db_venta is None:
        raise HTTPException(status_code=404, detail="Venta not found")
    return db_venta

@app.delete("/ventas/{venta_id}")
def delete_venta(venta_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_venta = crud.delete_venta(db, venta_id=venta_id)
    if db_venta is None:
        raise HTTPException(status_code=404, detail="Venta not found")
    return {"message": "Venta deleted successfully"}

# --- Endpoints para Pagos ---
@app.post("/pagos/", response_model=schemas.Pago)
def create_pago(pago: schemas.PagoCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_venta = crud.get_venta(db, venta_id=pago.venta_id)
    if not db_venta:
        raise HTTPException(status_code=404, detail="Venta not found")
    
    # Validar que el pago no exceda el monto pendiente
    monto_pendiente = db_venta.total - db_venta.monto_pagado
    if pago.monto > monto_pendiente:
        raise HTTPException(status_code=400, detail=f"El monto del pago excede el monto pendiente de {monto_pendiente:.2f}")

    return crud.create_pago(db=db, pago=pago)

@app.get("/pagos/", response_model=List[schemas.Pago])
def read_pagos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    pagos = db.query(models.Pago).offset(skip).limit(limit).all()
    return pagos

@app.get("/pagos/{pago_id}", response_model=schemas.Pago)
def read_pago(pago_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_pago = db.query(models.Pago).filter(models.Pago.id == pago_id).first()
    if db_pago is None:
        raise HTTPException(status_code=404, detail="Pago not found")
    return db_pago

@app.put("/pagos/{pago_id}", response_model=schemas.Pago)
def update_pago(pago_id: int, pago: schemas.PagoUpdate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    db_pago = crud.update_pago(db, pago_id=pago_id, pago=pago)
    if db_pago is None:
        raise HTTPException(status_code=404, detail="Pago not found")
    return db_pago

@app.get("/")
def read_root():
    return {"message": "Bienvenido al API de Sistema de Ventas"}

# --- Endpoints para Reportes ---
@app.get("/reportes/ventas_summary", response_model=schemas.VentasSummary)
def get_ventas_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    return crud.get_ventas_summary(db, start_date=start_date, end_date=end_date)

@app.get("/reportes/productos_vendidos", response_model=schemas.ReporteProductosVendidos)
def get_productos_vendidos(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    return crud.get_productos_vendidos(db, start_date=start_date, end_date=end_date)

@app.get("/reportes/clientes_compradores", response_model=List[schemas.ClienteComprador])
def get_clientes_compradores(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    return crud.get_clientes_compradores(db, start_date=start_date, end_date=end_date)

@app.get("/reportes/clientes_deudores", response_model=List[schemas.ClienteDeudor])
def get_clientes_deudores(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    return crud.get_clientes_deudores(db)

@app.get("/reportes/rentabilidad_productos", response_model=List[schemas.ProductoRentabilidad])
def get_rentabilidad_productos(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    return crud.get_rentabilidad_por_producto(db, start_date=start_date, end_date=end_date)



@app.get("/reportes/cuentas_por_cobrar", response_model=List[schemas.ClienteCuentasPorCobrar])
def get_cuentas_por_cobrar(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_active_user)):
    return crud.get_cuentas_por_cobrar_por_cliente(db)

# --- Endpoints para Órdenes de Trabajo y Productividad ---

from fastapi import APIRouter, UploadFile, File, Query
import shutil
import os

# Crear un directorio para las evidencias si no existe
EVIDENCE_DIR = "evidencias"
os.makedirs(EVIDENCE_DIR, exist_ok=True)

ordenes_router = APIRouter(
    prefix="/ordenes-trabajo",
    tags=["Órdenes de Trabajo"],
    dependencies=[Depends(get_current_active_user)]
)

@ordenes_router.post("/", response_model=schemas.OrdenTrabajo)
def create_orden_trabajo(
    orden: schemas.OrdenTrabajoCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Si el usuario actual es un administrador y se proporciona un operador_id en la orden,
    # se usa ese operador_id. De lo contrario, se usa el ID del usuario actual.
    operador_a_asignar = current_user.id
    if current_user.role.name == 'Admin' and orden.operador_id is not None:
        # Verificar que el operador_id proporcionado exista
        if not crud.get_user(db, orden.operador_id):
            raise HTTPException(status_code=404, detail="Operador no encontrado")
        operador_a_asignar = orden.operador_id

    return crud.create_orden_trabajo(db=db, orden=orden, operador_id=operador_a_asignar)

@ordenes_router.get("/", response_model=List[schemas.OrdenTrabajo])
def read_ordenes_trabajo(
    skip: int = 0, 
    limit: int = 100, 
    estado: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    cliente_id: Optional[int] = None,
    filter_operador_id: Optional[int] = Query(None, alias="operador_id"), # New parameter for filtering
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    actual_operador_id_to_filter = None
    if current_user.role.name == 'Admin':
        # If Admin, use the provided filter_operador_id, otherwise see all
        actual_operador_id_to_filter = filter_operador_id
    else:
        # If not Admin, they can only see their own orders
        actual_operador_id_to_filter = current_user.id

    return crud.get_ordenes_trabajo(
        db, 
        skip=skip, 
        limit=limit, 
        operador_id=actual_operador_id_to_filter, 
        estado=estado,
        start_date=start_date, 
        end_date=end_date,     
        cliente_id=cliente_id  
    )

@ordenes_router.get("/total", response_model=float)
def get_total_ordenes_trabajo_endpoint(
    estado: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    cliente_id: Optional[int] = None,
    filter_operador_id: Optional[int] = Query(None, alias="operador_id"), # New parameter for filtering
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    actual_operador_id_to_filter = None
    if current_user.role.name == 'Admin':
        actual_operador_id_to_filter = filter_operador_id
    else:
        actual_operador_id_to_filter = current_user.id
    return crud.get_total_ordenes_trabajo(
        db,
        operador_id=actual_operador_id_to_filter,
        estado=estado,
        start_date=start_date,
        end_date=end_date,
        cliente_id=cliente_id
    )

@ordenes_router.get("/{orden_id}", response_model=schemas.OrdenTrabajo)
def read_orden_trabajo(orden_id: int, db: Session = Depends(get_db)):
    db_orden = crud.get_orden_trabajo(db, orden_id=orden_id)
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    return db_orden

@ordenes_router.put("/{orden_id}", response_model=schemas.OrdenTrabajo)
def update_orden_trabajo(
    orden_id: int,
    orden: schemas.OrdenTrabajoCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_orden = crud.get_orden_trabajo(db, orden_id)
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")

    # Solo el operador que creó la orden o un administrador puede editarla
    if db_orden.operador_id != current_user.id and current_user.role.name != 'Admin':
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta orden")

    # Si el operador_id se proporciona en la solicitud y es diferente al actual
    # y el usuario actual NO es un administrador, se ignora el cambio de operador_id.
    # Si el usuario actual ES un administrador, se permite el cambio.
    if orden.operador_id is not None and orden.operador_id != db_orden.operador_id:
        if current_user.role.name != 'Admin':
            # Si no es admin, no puede cambiar el operador_id, así que lo revertimos al original
            orden.operador_id = db_orden.operador_id
        else:
            # Si es admin, verificamos que el nuevo operador_id sea válido
            if not crud.get_user(db, orden.operador_id):
                raise HTTPException(status_code=404, detail="Operador no encontrado")

    # Validar que el cliente exista
    db_cliente = crud.get_cliente(db, cliente_id=orden.cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Validar que todos los productos/servicios en los detalles existan
    for item in orden.productos:
        db_producto = crud.get_producto(db, producto_id=item.producto_id)
        if not db_producto:
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.producto_id} no encontrado.")
    for item in orden.servicios:
        db_servicio = crud.get_producto(db, producto_id=item.servicio_id)
        if not db_servicio:
            raise HTTPException(status_code=404, detail=f"Servicio con ID {item.servicio_id} no encontrado.")

    updated_orden = crud.update_orden_trabajo(db, orden_id=orden_id, orden=orden)
    if updated_orden is None:
        raise HTTPException(status_code=500, detail="Error al actualizar la orden de trabajo")
    return updated_orden

@ordenes_router.put("/{orden_id}/enviar-revision", response_model=schemas.OrdenTrabajo)
def enviar_orden_para_revision(orden_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_orden = crud.get_orden_trabajo(db, orden_id)
    if db_orden.operador_id != current_user.id and current_user.role.name != 'Admin':
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar esta orden")
    
    # Notificar a los administradores
    admins = [u for u in crud.get_users(db, limit=1000) if u.role.name == 'Admin']
    for admin in admins:
        crud.create_notificacion(db, schemas.NotificacionCreate(
            usuario_id=admin.id,
            mensaje=f"La orden de trabajo #{orden_id} ha sido enviada a revisión por {current_user.username}.",
            orden_id=orden_id
        ))

    return crud.update_orden_trabajo_estado(db, orden_id=orden_id, estado="En revisión")

@ordenes_router.post("/{orden_id}/aprobar", response_model=schemas.OrdenTrabajo)
def approve_orden_trabajo(orden_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    db_orden = crud.aprobar_orden_trabajo(db, orden_id=orden_id, admin_user=current_user)
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden no encontrada o no está en estado de revisión")
    return db_orden

@ordenes_router.post("/{orden_id}/rechazar", response_model=schemas.OrdenTrabajo)
def reject_orden_trabajo(orden_id: int, observaciones: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    db_orden = crud.rechazar_orden_trabajo(db, orden_id=orden_id, observaciones=observaciones, admin_user=current_user)
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden no encontrada o no está en estado de revisión")
    return db_orden

@ordenes_router.put("/{orden_id}/cerrar", response_model=schemas.OrdenTrabajo)
def cerrar_orden_trabajo_endpoint(
    orden_id: int,
    close_data: schemas.OrdenTrabajoClose, # New parameter for payment data
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    # Validate payment amount if it's a partial payment
    if close_data.was_paid and close_data.payment_type == "partial":
        if close_data.paid_amount is None or close_data.paid_amount <= 0:
            raise HTTPException(status_code=400, detail="El monto pagado es requerido y debe ser positivo para un pago parcial.")
        
        # Fetch the order to get its total and associated sale
        db_orden = crud.get_orden_trabajo(db, orden_id=orden_id)
        if db_orden is None:
            raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada.")
        
        # Assuming an order has an associated sale (from approval process)
        # We need to get the sale associated with this order to validate the payment
        # This might require a change in models or crud to link order to sale
        # For now, let's assume db_orden.venta_asociada exists and has a total
        # If not, we'll need to adjust this after reviewing models.py and crud.py
        
        # Placeholder for sale total validation (will refine after models/crud review)
        # For now, let's use orden.total as a proxy, but ideally it should be sale.total
        if close_data.paid_amount > db_orden.total: # This needs to be db_orden.venta_asociada.total
            raise HTTPException(status_code=400, detail=f"El monto pagado ({close_data.paid_amount}) no puede exceder el total de la orden ({db_orden.total}).")

    db_orden = crud.cerrar_orden_trabajo(db, orden_id=orden_id, admin_user=current_user, close_data=close_data) # Pass close_data
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden no encontrada o no está en un estado que pueda ser cerrada")
    return db_orden

@ordenes_router.post("/{orden_id}/evidencia")
def upload_evidence_file(orden_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = os.path.join(EVIDENCE_DIR, f"{orden_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    crud.add_evidencia_orden_trabajo(db, orden_id=orden_id, file_path=file_path)
    return {"filename": file.filename, "path": file_path}

app.include_router(ordenes_router)

# --- Endpoints para Notificaciones ---
notificaciones_router = APIRouter(
    prefix="/notificaciones",
    tags=["Notificaciones"],
    dependencies=[Depends(get_current_active_user)]
)

@notificaciones_router.get("/", response_model=List[schemas.Notificacion])
def get_my_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return crud.get_notificaciones_usuario(db, usuario_id=current_user.id)

@notificaciones_router.put("/{notificacion_id}/leida", response_model=schemas.Notificacion)
def mark_notification_as_read(notificacion_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_notif = crud.marcar_notificacion_leida(db, notificacion_id=notificacion_id, usuario_id=current_user.id)
    if db_notif is None:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return db_notif

app.include_router(notificaciones_router)

from fastapi.staticfiles import StaticFiles

# ... existing code ...

# --- Endpoint para Reporte de Productividad ---
@app.get("/reportes/productividad", response_model=schemas.ReporteProductividad, dependencies=[Depends(get_current_admin_user)])
def get_productivity_report(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    return crud.get_reporte_productividad(db, start_date=start_date, end_date=end_date)

# Mount static files directory for evidences
app.mount("/evidencias", StaticFiles(directory=EVIDENCE_DIR), name="evidencias")

# --- Router para el Panel del Operador ---
panel_operador_router = APIRouter(
    prefix="/panel_operador",
    tags=["Panel del Operador"],
    dependencies=[Depends(get_current_active_user)]
)

@panel_operador_router.get("/pendientes", response_model=List[schemas.PanelOrdenPendiente])
def get_panel_ordenes_pendientes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role.name != 'Operador' and current_user.role.name != 'Admin':
        raise HTTPException(status_code=403, detail="Acceso denegado. Funcionalidad solo para operadores.")
    
    operador_id_to_fetch = current_user.id
    # Optional: If you want Admins to be able to see a specific operator's panel
    # you could add a query parameter `operador_id` and check for it here.

    return crud.get_ordenes_pendientes_operador(db, operador_id=operador_id_to_fetch)

@panel_operador_router.get("/productividad", response_model=schemas.PanelProductividad)
def get_panel_productividad(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role.name != 'Operador' and current_user.role.name != 'Admin':
        raise HTTPException(status_code=403, detail="Acceso denegado. Funcionalidad solo para operadores.")
    
    operador_id_to_fetch = current_user.id
    return crud.get_productividad_operador(db, operador_id=operador_id_to_fetch)

@panel_operador_router.get("/historial", response_model=List[schemas.PanelHistorialItem])
def get_panel_historial(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role.name != 'Operador' and current_user.role.name != 'Admin':
        raise HTTPException(status_code=403, detail="Acceso denegado. Funcionalidad solo para operadores.")
    
    operador_id_to_fetch = current_user.id
    return crud.get_historial_reciente_operador(db, operador_id=operador_id_to_fetch)

app.include_router(panel_operador_router)

