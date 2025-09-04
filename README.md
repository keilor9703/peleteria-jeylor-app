# Sistema de Gestión de Ventas "Peleteria Jeylor"

## Visión General del Proyecto

Este proyecto es un sistema de gestión de ventas integral diseñado específicamente para "Peleteria Jeylor", una empresa dedicada a la venta de productos de peletería. La aplicación es una solución web full-stack que optimiza los procesos de negocio, desde la gestión de clientes y productos hasta el registro de ventas, órdenes de trabajo y generación de reportes. Su objetivo principal es proporcionar una herramienta eficiente y centralizada para la administración de las operaciones diarias, mejorando la toma de decisiones y la productividad.

## Características Principales

El sistema ofrece las siguientes funcionalidades clave:

*   **Autenticación y Autorización de Usuarios:**
    *   Sistema de login seguro basado en JSON Web Tokens (JWT).
    *   Gestión de usuarios, roles y permisos.
    *   Control de acceso basado en módulos, permitiendo una configuración granular de lo que cada rol puede ver y hacer.
*   **Gestión de Clientes:**
    *   Registro, consulta, edición y eliminación de información de clientes.
    *   Seguimiento de cuentas por cobrar y historial financiero de cada cliente.
*   **Gestión de Productos:**
    *   Catálogo completo de productos con detalles como nombre, descripción, precio y unidad de medida.
    *   Funcionalidades para añadir, actualizar y eliminar productos.
*   **Gestión de Ventas:**
    *   Registro intuitivo de nuevas ventas, incluyendo múltiples productos y cantidades.
    *   Control del estado de pago (pagado, parcial, pendiente) y validación de crédito.
    *   Historial detallado de todas las ventas realizadas.
*   **Gestión de Órdenes de Trabajo:**
    *   Creación y seguimiento del ciclo de vida de las órdenes de trabajo.
    *   Procesos de aprobación/rechazo y gestión de evidencias asociadas a cada orden.
*   **Reportes y Análisis:**
    *   **Resumen de Ventas:** Visualización de ventas diarias y totales.
    *   **Reporte de Productividad:** Análisis del rendimiento operativo.
    *   **Reporte de Rentabilidad:** Evaluación de la rentabilidad de productos y ventas.
    *   **Reportes de Clientes:** Identificación de clientes compradores, deudores y pagadores.
*   **Notificaciones:**
    *   Sistema de notificaciones en tiempo real para eventos importantes (ej. órdenes de trabajo enviadas a revisión).
*   **Panel del Operador:**
    *   Dashboard centralizado para una visión rápida de las tareas pendientes, productividad y métricas clave.

## Arquitectura del Sistema

El proyecto sigue una arquitectura cliente-servidor (o de dos capas) bien definida:

*   **Frontend (Cliente):** Desarrollado con **React.js**, es una Single Page Application (SPA) que proporciona la interfaz de usuario interactiva. Se encarga de la presentación de datos, la lógica de la interfaz de usuario y la comunicación con el backend a través de peticiones HTTP.
*   **Backend (Servidor):** Construido con **FastAPI** (Python), actúa como una API RESTful. Es responsable de la lógica de negocio, la interacción con la base de datos, la autenticación/autorización y la exposición de los endpoints necesarios para que el frontend consuma y manipule los datos.

La comunicación entre el frontend y el backend se realiza mediante peticiones HTTP (GET, POST, PUT, DELETE) que intercambian datos en formato JSON.

```mermaid
graph TD
    A[Usuario] -->|Accede a| B(Navegador Web)
    B -->|Peticiones HTTP (JSON)| C(Frontend React.js)
    C -->|Peticiones HTTP (JSON)| D(Backend FastAPI)
    D -->|Consultas SQL| E(Base de Datos SQLite)
    E -->|Resultados SQL| D
    D -->|Respuestas HTTP (JSON)| C
    C -->|Renderiza UI| B
```

## Tecnologías Utilizadas

### Backend (FastAPI)

*   **Lenguaje:** Python 3.x
*   **Framework Web:** FastAPI (para construir APIs rápidas y modernas)
*   **ORM:** SQLAlchemy (para la interacción con la base de datos de manera orientada a objetos)
*   **Base de Datos:** SQLite (base de datos ligera basada en archivos, `sales.db`)
*   **Validación de Datos:** Pydantic (integrado con FastAPI para la validación y serialización de datos)
*   **Autenticación:** `python-jose` (para JWT) y `passlib` (para hashing de contraseñas con `bcrypt`)
*   **Servidor ASGI:** Uvicorn (servidor web asíncrono para FastAPI)
*   **Gestión de Entorno:** `python-dotenv` (para cargar variables de entorno)
*   **Otros:** `python-multipart`, `asyncio`, `websockets`, `watchfiles`, `greenlet`, `anyio`, `h11`, `httptools`, `idna`, `sniffio`, `starlette`, `uvloop`, `click`, `colorama`, `cryptography`, `ecdsa`, `pycparser`, `pyOpenSSL`, `PyYAML`, `rsa`, `six`, `typing-extensions`

### Frontend (React)

*   **Lenguaje:** JavaScript (ES6+)
*   **Librería UI:** React.js
*   **Enrutamiento:** React Router DOM
*   **Peticiones HTTP:** Axios
*   **Componentes UI:** Material-UI (MUI) con `@emotion/react` y `@emotion/styled`
*   **Estilos Adicionales:** Bootstrap (para algunos componentes y utilidades)
*   **Notificaciones:** React Toastify
*   **Visualización de Datos:** Chart.js y React-Chartjs-2
*   **Herramientas de Desarrollo:** `react-scripts` (para la configuración de Webpack y Babel), `cross-env`

## Estructura del Proyecto

```
AppWeb_PelJeylor/
├── backend/                # Contiene el código del backend (API FastAPI)
│   ├── __init__.py         # Inicialización del paquete Python
│   ├── crud.py             # Operaciones CRUD para la base de datos
│   ├── database.py         # Configuración de la conexión a la base de datos
│   ├── main.py             # Punto de entrada de la aplicación FastAPI, define endpoints y lógica principal
│   ├── models.py           # Definiciones de modelos de SQLAlchemy para la base de datos
│   ├── requirements.txt    # Lista de dependencias de Python para el backend
│   ├── schemas.py          # Esquemas de datos Pydantic para validación y serialización
│   ├── __pycache__/        # Archivos compilados de Python
│   └── venv/               # Entorno virtual de Python para el backend
├── frontend/               # Contiene el código del frontend (Aplicación React)
│   ├── public/             # Archivos estáticos (index.html, favicon, imágenes, etc.)
│   ├── src/                # Código fuente de la aplicación React
│   │   ├── api.js          # Configuración de Axios y funciones para interactuar con la API del backend
│   │   ├── App.js          # Componente principal de React, maneja el enrutamiento y la autenticación
│   │   ├── index.js        # Punto de entrada de la aplicación React
│   │   ├── components/     # Directorio que contiene todos los componentes reutilizables de la UI
│   │   ├── utils/          # Funciones de utilidad (ej. formatters.js)
│   │   └── ...             # Otros archivos de configuración y estilos
│   ├── package.json        # Metadatos del proyecto y lista de dependencias de Node.js para el frontend
│   └── package-lock.json   # Bloqueo de versiones de dependencias de Node.js
├── sales.db                # Archivo de la base de datos SQLite (se genera automáticamente al iniciar el backend)
├── start_project.bat       # Script de Windows para iniciar ambos servidores simultáneamente
├── README.md               # Este archivo de documentación
├── manual_de_usuario.txt   # Manual de usuario del sistema
├── manual_tecnico.txt      # Manual técnico del sistema
└── package.json            # Metadatos del proyecto principal (puede ser redundante si los subproyectos tienen los suyos)
```

## Configuración y Ejecución del Proyecto

Sigue estos pasos para configurar y ejecutar la aplicación en tu máquina local.

### Requisitos Previos

Asegúrate de tener instalado lo siguiente:

*   **Python 3.x**: Descárgalo e instálalo desde [python.org](https://www.python.org/downloads/).
*   **pip**: El gestor de paquetes de Python (generalmente incluido con Python).
*   **Node.js y npm**: Descárgalo e instálalo desde [nodejs.org](https://nodejs.org/en/download/). `npm` (Node Package Manager) se instala junto con Node.js.

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
        *   **Windows (Símbolo del Sistema/CMD):**
            ```cmd
            venv\Scripts\activate.bat
            ```
        *   **Windows (PowerShell):**
            ```powershell
            .\venv\Scripts\Activate.ps1
            ```
        *   **macOS / Linux:**
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
        El frontend está configurado para consumir una API desplegada en Render. Si deseas ejecutar el backend localmente, edita `frontend/src/api.js` y actualiza la `baseURL` de Axios para apuntar a tu servidor local (por defecto `http://localhost:8000`):
        ```javascript
        // frontend/src/api.js
        const apiClient = axios.create({
          baseURL: 'http://localhost:8000', // O la IP/dominio de tu backend local
          headers: {
            'Content-Type': 'application/json',
          },
        });
        ```
        **Nota:** La configuración actual en `api.js` apunta a `https://peleteria-jeylor-app.onrender.com`. Si vas a trabajar con el backend local, asegúrate de comentar o eliminar la línea que apunta a Render y descomentar/añadir la línea para `localhost`.

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
    Se abrirán dos nuevas ventanas: una para el backend y otra para el frontend. La aplicación se abrirá automáticamente en tu navegador (normalmente en `http://localhost:3000`).

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

*   **Usuario:** `admin`
*   **Contraseña:** `adminpass`

**¡Importante!** Cambia esta contraseña inmediatamente después del primer inicio de sesión en un entorno de producción.

## Base de Datos

La base de datos es un archivo SQLite llamado `sales.db`, ubicado en el directorio raíz del proyecto. Se creará automáticamente la primera vez que se inicie el servidor backend. Puedes usar herramientas como [DB Browser for SQLite](https://sqlitebrowser.org/dl/) para visualizar y gestionar los datos.

## Documentación de la API

FastAPI genera automáticamente documentación interactiva de la API. Una vez que el servidor backend esté en ejecución, puedes acceder a:

*   **Swagger UI:** `http://localhost:8000/docs`
*   **ReDoc:** `http://localhost:8000/redoc`

## Acceso desde Otros Dispositivos en la Red Local

Para acceder a la aplicación desde otros dispositivos (celulares, tablets, otras PCs) conectados a la misma red local:

1.  Asegúrate de que el backend esté configurado para aceptar conexiones desde la IP de tu frontend (revisa la configuración de CORS en `backend/main.py`).
2.  Obtén la dirección IP local de la máquina donde está corriendo el frontend.
3.  En el navegador web del otro dispositivo, ingresa la siguiente URL:
    ```
    http://[LA_IP_DEL_SERVIDOR_FRONTEND]:3000
    ```

## Consideraciones de Seguridad

*   **`SECRET_KEY` de JWT:** La clave secreta para la autenticación JWT está hardcodeada en `backend/main.py` para desarrollo. **Es CRÍTICO** moverla a una variable de entorno (`.env`) en un entorno de producción y usar una clave larga y aleatoria.
*   **Credenciales por Defecto:** Cambia las credenciales del usuario `admin` por defecto inmediatamente en producción.
*   **CORS:** Asegúrate de configurar adecuadamente las políticas de CORS en el backend para permitir solo los orígenes de confianza en un entorno de producción.

## Pruebas

Actualmente, no hay pruebas automatizadas configuradas para el proyecto.

**Recomendaciones:**

*   **Backend:** Implementar pruebas unitarias y de integración utilizando `pytest`.
*   **Frontend:** Implementar pruebas unitarias para los componentes utilizando `@testing-library/react` y `jest`.

## Despliegue

### Despliegue Actual (Backend)

El backend de la aplicación está actualmente desplegado y accesible públicamente en:
`https://peleteria-jeylor-app.onrender.com`

### Consideraciones para Despliegue en Producción

Para desplegar esta aplicación en un entorno de producción, considera las siguientes opciones y mejores prácticas:

*   **Backend (FastAPI):**
    *   Utilizar un servidor de aplicaciones ASGI robusto como Gunicorn o Uvicorn en modo producción.
    *   **Dockerización:** Empaquetar la aplicación FastAPI en un contenedor Docker para asegurar un entorno consistente y reproducible.
    *   **Variables de Entorno:** Gestionar todas las configuraciones sensibles (claves secretas, credenciales de base de datos) mediante variables de entorno.
    *   **Base de Datos:** Para producción, se recomienda migrar de SQLite a una base de datos más escalable y robusta como PostgreSQL o MySQL.
    *   **Servicios PaaS:** Plataformas como Render, Heroku, Google Cloud Run, AWS Elastic Beanstalk son excelentes opciones para desplegar aplicaciones FastAPI.

*   **Frontend (React):**
    *   **Construcción de Producción:** Generar una versión optimizada para producción de la aplicación React usando `npm run build`. Esto creará una carpeta `build` con todos los archivos estáticos.
    *   **Servidor Web Estático:** Servir los archivos estáticos generados por el build con un servidor web de alto rendimiento como Nginx o Apache.
    *   **Integración con Backend:** Los archivos estáticos del frontend pueden ser servidos por el mismo servidor FastAPI (si se configura adecuadamente) o por un servidor web separado.
    *   **Servicios de Hosting Estático/CDN:** Utilizar servicios como Netlify, Vercel, AWS S3 + CloudFront para un despliegue rápido y global de la aplicación frontend.

---