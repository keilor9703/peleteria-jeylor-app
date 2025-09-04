# Sistema de Gestión de Ventas "Peleteria Jeylor"

Este proyecto es un sistema de gestión de ventas completo, diseñado para la "Peleteria Jeylor". Consiste en una aplicación web full-stack con un backend robusto desarrollado en FastAPI (Python) y un frontend interactivo construido con React (JavaScript).

## Características Principales

-   **Gestión de Ventas:** Registro y seguimiento de ventas, incluyendo detalles de productos y validación de cupo de crédito.
-   **Gestión de Clientes:** Administración de la información de clientes, historial financiero y cuentas por cobrar.
-   **Gestión de Productos:** Catálogo de productos y servicios.
-   **Gestión de Usuarios y Roles:** Sistema de autenticación basado en JWT, con roles y permisos configurables para usuarios y módulos.
-   **Órdenes de Trabajo:** Creación, seguimiento, aprobación/rechazo y gestión de evidencias para órdenes de trabajo.
-   **Reportes:** Diversos reportes para análisis de ventas, productividad, clientes (compradores, deudores) y rentabilidad.
-   **Notificaciones:** Sistema de notificaciones para eventos importantes (ej. órdenes de trabajo enviadas a revisión).

## Tecnologías Utilizadas

### Backend (FastAPI)

-   **Python 3.x**
-   **FastAPI**: Framework web moderno y rápido para construir APIs.
-   **SQLAlchemy**: ORM para interactuar con la base de datos.
-   **SQLite**: Base de datos ligera basada en archivos (`sales.db`).
-   **Passlib**: Para el hashing seguro de contraseñas.
-   **python-dotenv**: Para la gestión de variables de entorno.

### Frontend (React)

-   **React**: Librería de JavaScript para construir interfaces de usuario interactivas.
-   **React Router DOM**: Para la navegación y el enrutamiento.
-   **Axios**: Cliente HTTP para realizar peticiones al backend.
-   **Material-UI**: Biblioteca de componentes React para un diseño elegante y responsivo.
-   **React Toastify**: Para mostrar notificaciones y mensajes al usuario.
-   **Chart.js / React-Chartjs-2**: Para la visualización de datos en reportes.

## Estructura del Proyecto

```
AppWeb_PelJeylor/
├── backend/                # Contiene el código del backend (API FastAPI)
│   ├── main.py             # Punto de entrada de la API
│   ├── models.py           # Definiciones de modelos de base de datos
│   ├── schemas.py          # Esquemas de datos (Pydantic)
│   ├── crud.py             # Operaciones CRUD de la base de datos
│   ├── database.py         # Configuración de la base de datos
│   └── requirements.txt    # Dependencias de Python
├── frontend/               # Contiene el código del frontend (Aplicación React)
│   ├── public/             # Archivos estáticos (index.html, imágenes)
│   ├── src/                # Código fuente de React
│   │   ├── api.js          # Configuración de Axios
│   │   ├── App.js          # Componente principal y rutas
│   │   └── components/     # Componentes de la UI
│   └── package.json        # Dependencias y scripts de Node.js
├── sales.db                # Archivo de la base de datos SQLite (se genera automáticamente)
├── start_project.bat       # Script para iniciar ambos servidores (Windows)
└── README.md               # Este archivo
```

## Configuración y Ejecución del Proyecto

Sigue estos pasos para configurar y ejecutar la aplicación en tu máquina local.

### Requisitos Previos

Asegúrate de tener instalado lo siguiente:

-   **Python 3.x**: Descárgalo e instálalo desde [python.org](https://www.python.org/downloads/).
-   **pip**: El gestor de paquetes de Python (generalmente incluido con Python).
-   **Node.js y npm**: Descárgalo e instálalo desde [nodejs.org](https://nodejs.org/en/download/). `npm` (Node Package Manager) se instala junto con Node.js.

### Pasos para la Configuración

1.  **Clonar el Repositorio (si aplica):**
    Si aún no lo has hecho, clona este repositorio a tu máquina local:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd AppWeb_PelJeylor
    ```

2.  **Configuración del Backend:**

    a.  **Navega al directorio `backend`:**
        ```bash
        cd backend
        ```

    b.  **Crea y activa un entorno virtual:**
        ```bash
        python -m venv venv
        ```
        -   **Windows (Símbolo del Sistema/CMD):**
            ```cmd
            venv\Scripts\activate.bat
            ```
        -   **Windows (PowerShell):**
            ```powershell
            .\venv\Scripts\Activate.ps1
            ```
        -   **macOS / Linux:**
            ```bash
            source venv/bin/activate
            ```
        Tu línea de comandos debería mostrar `(venv)` al principio.

    c.  **Instala las dependencias de Python:**
        ```bash
        pip install -r requirements.txt
        ```

    d.  **(Opcional pero Recomendado) Configura la `SECRET_KEY`:**
        Para mayor seguridad, crea un archivo `.env` en el directorio `backend` y añade tu clave secreta para JWT. Asegúrate de que este archivo esté en tu `.gitignore`.
        ```
        SECRET_KEY="tu_clave_secreta_larga_y_aleatoria_aqui"
        ```
        Si no creas este archivo, se usará una clave por defecto (no segura para producción).

    e.  **Vuelve al directorio raíz del proyecto:**
        ```bash
        cd ..
        ```

3.  **Configuración del Frontend:**

    a.  **Navega al directorio `frontend`:**
        ```bash
        cd frontend
        ```

    b.  **Instala las dependencias de Node.js:**
        ```bash
        npm install
        ```

    c.  **Configura la URL del Backend en `src/api.js`:**
        Por defecto, el frontend espera que el backend esté en `http://localhost:8000`. Si tu backend se ejecuta en una IP o puerto diferente, edita `frontend/src/api.js` y actualiza la `baseURL` de Axios:
        ```javascript
        // frontend/src/api.js
        const apiClient = axios.create({
          baseURL: 'http://localhost:8000', // O la IP/dominio de tu backend
          headers: {
            'Content-Type': 'application/json',
          },
        });
        ```

    d.  **Vuelve al directorio raíz del proyecto:**
        ```bash
        cd ..
        ```

### Ejecución de la Aplicación

Una vez que ambos componentes (backend y frontend) estén configurados, puedes iniciar la aplicación.

#### Opción 1: Usando el Script `start_project.bat` (Solo Windows)

Este script iniciará automáticamente ambos servidores en ventanas de terminal separadas.

1.  Abre el Símbolo del Sistema (CMD) o PowerShell en el directorio raíz del proyecto (`AppWeb_PelJeylor`).
2.  Ejecuta el script:
    ```cmd
    start_project.bat
    ```
    Se abrirán dos nuevas ventanas: una para el backend y otra para el frontend. La aplicación se abrirá automáticamente en tu navegador.

#### Opción 2: Inicio Manual (Multiplataforma)

Si no estás en Windows o prefieres iniciar los servidores manualmente, sigue estos pasos:

1.  **Iniciar el Backend:**

    a.  Abre una nueva terminal y navega al directorio `backend`.
    b.  Activa el entorno virtual (ver paso 2.b de Configuración del Backend).
    c.  Ejecuta el servidor FastAPI:
        ```bash
        uvicorn main:app --host 0.0.0.0 --port 8000 --reload
        ```
    Deja esta terminal abierta.

2.  **Iniciar el Frontend:**

    a.  Abre *otra* nueva terminal y navega al directorio `frontend`.
    b.  Ejecuta el servidor de desarrollo de React:
        ```bash
        npm start
        ```
    Esto abrirá la aplicación en tu navegador web (normalmente en `http://localhost:3000`).

### Credenciales de Acceso Inicial

La primera vez que inicies el backend, se creará un usuario administrador por defecto:

-   **Usuario:** `admin`
-   **Contraseña:** `adminpass`

**¡Importante!** Cambia esta contraseña inmediatamente después del primer inicio de sesión en un entorno de producción.

## Base de Datos

La base de datos es un archivo SQLite llamado `sales.db`, ubicado en el directorio raíz del proyecto. Se creará automáticamente la primera vez que se inicie el servidor backend. Puedes usar herramientas como [DB Browser for SQLite](https://sqlitebrowser.org/dl/) para visualizar y gestionar los datos.

## Documentación de la API

FastAPI genera automáticamente documentación interactiva de la API. Una vez que el servidor backend esté en ejecución, puedes acceder a:

-   **Swagger UI:** `http://localhost:8000/docs`
-   **ReDoc:** `http://localhost:8000/redoc`

## Acceso desde Otros Dispositivos en la Red Local

Para acceder a la aplicación desde otros dispositivos (celulares, tablets, otras PCs) conectados a la misma red local:

1.  Asegúrate de que el backend esté configurado para aceptar conexiones desde la IP de tu frontend (revisa la configuración de CORS en `backend/main.py`).
2.  Obtén la dirección IP local de la máquina donde está corriendo el frontend.
3.  En el navegador web del otro dispositivo, ingresa la siguiente URL:
    ```
    http://[LA_IP_DEL_SERVIDOR_FRONTEND]:3000
    ```

## Consideraciones de Seguridad

-   **`SECRET_KEY` de JWT:** La clave secreta para la autenticación JWT está hardcodeada en `backend/main.py` para desarrollo. **Es CRÍTICO** moverla a una variable de entorno (`.env`) en un entorno de producción y usar una clave larga y aleatoria.
-   **Credenciales por Defecto:** Cambia las credenciales del usuario `admin` por defecto inmediatamente en producción.

## Pruebas

Actualmente, no hay pruebas automatizadas configuradas para el proyecto.

**Recomendaciones:**

-   **Backend:** Implementar pruebas unitarias y de integración utilizando `pytest`.
-   **Frontend:** Implementar pruebas unitarias para los componentes utilizando `@testing-library/react` y `jest`.

## Despliegue

Para desplegar esta aplicación en un entorno de producción, considera las siguientes opciones:

-   **Backend:** Usar un servidor de aplicaciones ASGI como Gunicorn o Uvicorn en modo producción. Dockerizar la aplicación para un despliegue consistente.
-   **Frontend:** Construir la aplicación (`npm run build`) y servir los archivos estáticos con un servidor web (Nginx, Apache) o integrarlos directamente en el backend FastAPI. Utilizar servicios de hosting estático o plataformas PaaS (Netlify, Vercel).

---


