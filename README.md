# SCZ Segura Predictiva

Proyecto de ejemplo: plataforma de reporte y gestión de incidentes para vecinos, policías y administradores (superadmin). Provee APIs REST en backend (FastAPI), una UI estática en el frontend (HTML/CSS/JS) y utilidades para respaldos, monitoreo y reentrenamiento de modelos simples de IA.

---

## Contenido del repositorio

- `backend/` : Código del servidor FastAPI, rutas, esquemas y utilidades.
- `frontend/` : Archivos estáticos (HTML, CSS, JS) para distintos paneles: vecino, policía, admin, superadmin.
- `database/` : Conector y helpers para MySQL (`db.py`).
- `db.sql` : Script SQL para crear la base de datos y tablas iniciales (esquema canónico).
- `backend/scripts/` : Scripts para pruebas/integración y utilidades (por ejemplo `integration_tests.py`).
- `backend/backups/` : Carpeta donde el servidor guarda respaldos creados por endpoints de superadmin.

---

## Resumen funcional

El sistema soporta los siguientes flujos principales:

- Registro, login y gestión de perfil de usuarios (vecinos, policía, admin_junta, superadmin).
- Reporte de incidentes por vecinos (geolocalizados, con fotos y descripciones).
- Visualización de incidentes en mapa (Leaflet + heatmap).
- Flujo de trabajo para policías: asignación, resolución y registro de patrullajes.
- Módulo `superadmin`: gestión completa de usuarios (listar/editar/cambiar roles/eliminar), configuración del sistema, generación y descarga de respaldos, logs de auditoría, monitoreo básico y endpoint para reentrenamiento de IA (dev/demo).
- Auditoría: todas las acciones críticas se registran en `logs_sistema`.

---

## Tecnologías y para qué sirve cada una

- Python 3.x: lenguaje principal del backend.
- FastAPI: framework web asíncrono para construir las APIs REST.
- Uvicorn: ASGI server para servir la app FastAPI en desarrollo.
- MySQL: base de datos relacional (esquema en `db.sql`).
- mysql-connector-python: driver para conectar con MySQL.
- python-jose: manejo de JWT para autenticación y autorización.
- passlib[bcrypt]: hashing seguro de contraseñas.
- pydantic: validación y serialización de modelos/schemas.
- requests: llamadas HTTP desde scripts y utilidades internas.
- Leaflet.js + leaflet.heat: renderizado de mapas y heatmaps en el frontend.
- HTML/CSS/Vanilla JS: frontend estático y lógica cliente.

Extras (dev / utilidades):
- `email-validator`: requerido por pydantic para `EmailStr`.
- `bcrypt`: dependencia nativa para passlib/seguridad.

---

## Requisitos previos (local)

- Python 3.10+ instalado.
- MySQL o MariaDB funcionando (usuario con permisos para crear base y tablas).
- Git (opcional) para clonar el repo.
- Recomiendo crear y usar un entorno virtual (`venv`) para aislar dependencias.

---

## Variables de entorno importantes

Configure estas variables antes de arrancar el servidor. Ejemplos para PowerShell:

```powershell
$env:SECRET_KEY = 'cambiar_por_una_secreta_larga'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3306'
$env:DB_USER = 'tu_usuario'
$env:DB_PASSWORD = 'tu_password'
$env:DB_NAME = 'scz_segura_predictiva'
$env:ALLOW_DEV_TOKEN = '1' # (opcional) habilitar endpoint dev para generar tokens en pruebas
```

En Linux/macOS (bash):

```bash
export SECRET_KEY='cambiar_por_una_secreta_larga'
export DB_HOST='127.0.0.1'
export DB_PORT='3306'
export DB_USER='tu_usuario'
export DB_PASSWORD='tu_password'
export DB_NAME='scz_segura_predictiva'
export ALLOW_DEV_TOKEN=1
```

Nota: los nombres exactos de variables pueden variar si cambia la configuración en `backend/main.py`. Ajusta según sea necesario.

---

## Instalación (paso a paso)

1. Clona el repositorio y entra al directorio del proyecto:

```powershell
git clone <repo-url>
cd scz_segura_predictiva
```

2. Crea y activa un entorno virtual (Windows PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

En Linux/macOS:

```bash
python -m venv .venv
source .venv/bin/activate
```

3. Instala dependencias básicas (recomendado):

```bash
pip install --upgrade pip
pip install fastapi uvicorn mysql-connector-python python-jose[cryptography] passlib[bcrypt] pydantic[email] requests python-multipart email-validator bcrypt
```

4. (Opcional) si vas a ejecutar los scripts de integración, instala también:

```bash
pip install pytest httpx
```

5. Crea la base de datos y objetos usando `db.sql`:

```sql
-- En tu cliente MySQL
CREATE DATABASE scz_segura_predictiva CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE scz_segura_predictiva;
SOURCE db.sql;
```

Nota: Si tu usuario MySQL no tiene permisos para `CREATE DATABASE`, crea la base manualmente y luego ejecuta el contenido de `db.sql` sobre la base creada.

6. Ajusta las variables de entorno descritas arriba.

---

## Arrancar la aplicación (desarrollo)

Con el entorno virtual activado y variables configuradas:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
# o
.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

La API quedará accesible en `http://127.0.0.1:8000`.

Frontend: puedes abrir los archivos HTML directamente desde `frontend/public/` en tu navegador o servirlos con un servidor estático simple (recomendado para evitar problemas con CORS/archivos):

```bash
cd frontend
python -m http.server 8080
# luego abrir http://127.0.0.1:8080/public/vecino.html (o la página que corresponda)
```

---

## Instalar dependencias usando `requirements.txt`

Si prefieres instalar todas las dependencias desde un archivo, usa el `requirements.txt` incluido:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Esto instalará las mismas versiones de paquetes usadas durante el desarrollo.

---

## Usar Docker

El repositorio incluye un `Dockerfile` para crear una imagen del servicio backend. Antes de construir, asegúrate de que `requirements.txt` exista y de configurar las variables de entorno necesarias (por ejemplo `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SECRET_KEY`).

Construir la imagen:

```bash
docker build -t scz-segura-backend:latest .
```

Ejecutar el contenedor (conexión a una base MySQL externa):

```bash
docker run -e DB_HOST=host.docker.internal -e DB_USER=root -e DB_PASSWORD=tu_pass -e DB_NAME=scz_segura_predictiva -e SECRET_KEY='tu_clave' -p 8000:8000 scz-segura-backend:latest
```

Notas:
- En Windows, `host.docker.internal` permite al contenedor localizar el host donde se ejecuta MySQL en desarrollo. En Linux quizá necesites usar la IP del host o usar `--network` junto a un contenedor de MySQL.
- Para un entorno completo (MySQL + app) recomiendo crear un `docker-compose.yml` que orqueste ambos servicios. Puedo generarlo si quieres.

### Usar Docker Compose (MySQL + App)

Se incluyó un ejemplo `docker-compose.yml` que levanta un servicio MySQL y la aplicación.

1. Copia/ajusta las variables sensibles en un archivo `.env` (misma carpeta) o modifica el `docker-compose.yml` para usar tus credenciales.

Ejemplo mínimo de `.env`:

```env
DB_HOST=db
DB_USER=appuser
DB_PASSWORD=apppass
DB_NAME=scz_segura_predictiva
SECRET_KEY=una_clave_segura
ALLOW_DEV_TOKEN=1
```

2. Construir y levantar los servicios:

```bash
docker-compose up --build -d
```

3. Ver logs:

```bash
docker-compose logs -f app
```

4. Parar y remover contenedores:

```bash
docker-compose down -v
```

Ejecutar las pruebas de integración desde el contenedor `app` (requiere que la app esté lista y que la base de datos acepte conexiones):

```bash
docker-compose exec app python backend/scripts/integration_tests.py
```

Notas:
- Si MySQL tarda en inicializar, el contenedor `app` puede fallar al inicio. Usa reintentos o espera a que el puerto 3306 acepte conexiones antes de ejecutar pruebas.
- Para producción no expongas credenciales en el archivo `docker-compose.yml`; usa secretos de Docker o un gestor de secretos.


---

## Endpoints principales (resumen)

- Autenticación: `POST /api/login`, `POST /api/register`, `PUT /api/perfil`.
- Incidentes: `POST /api/incidentes` (reporte), `GET /api/incidentes` (filtros), `GET /api/incidentes/{id}`.
- Policía: rutas bajo `/api/policia/*` — listar asignados, pendientes, resolver, rechazar, patrullajes y recomendaciones.
- Superadmin: rutas bajo `/api/superadmin/*` — listar usuarios, cambiar rol, editar, eliminar, respaldos (`/respaldo-manual`, `/respaldos`), logs (`/logs`), reentrenar IA (`/reentrenar-ia`), monitoreo (`/monitoreo`), configuración (`/configuracion`).
- Dev: `POST /api/dev/generate-token` (si `ALLOW_DEV_TOKEN` habilitado) para tests locales rápidos.

Consulta los archivos en `backend/routes/` para ver las rutas exactas y payloads esperados.

---

## Respaldo y restauración

- El endpoint de superadmin genera archivos JSON (o dumps SQL, según implementación) en `backend/backups/` y registra metadatos en la tabla `respaldos_sistema`.
- Para restaurar manualmente, revisa el archivo de respaldo y utiliza herramientas MySQL o scripts de restauración apropiados.

---

## Reentrenamiento de IA (demo)

Hay un endpoint en `superadmin` que lanza un proceso de reentrenamiento simulado para el modelo de clasificación/recomendación usado por el proyecto. En producción esto debe reemplazarse por un pipeline reproducible (dataset, pipeline de features, evaluación y despliegue del artefacto).

---

## Logs y auditoría

- Todas las operaciones críticas se registran en la tabla `logs_sistema` mediante `backend/utils/log_utils.py`.
- Consulta `logs_sistema` para auditoría o depuración de acciones administrativas.

---

## Problemas comunes y soluciones rápidas

- Error pydantic `EmailStr` → instala `email-validator`.
- ImportError `FileResponse` → usar `from fastapi.responses import FileResponse`.
- Problemas con `passlib`/`bcrypt` → asegurar que `bcrypt` esté instalado y que la versión de `passlib` sea compatible.
- Errores al ejecutar scripts mientras `uvicorn` corre en la misma terminal → usar tareas o terminales separadas.
- Si las rutas de backup o escritura fallan, verifica permisos de carpeta `backend/backups/`.

---

## Pruebas de integración (rápido)

Se incluyen scripts en `backend/scripts/integration_tests.py` que realizan flujos básicos end-to-end (generación de token dev, listar usuarios, cambiar rol, crear respaldo, ejecutar flujo policial). Ejecuta con el entorno y servidor activos:

```bash
.venv\Scripts\python.exe backend/scripts/integration_tests.py
```

Revisa el script para ver qué variables espera y cómo consumir los endpoints.

---

## Siguientes pasos recomendados

- Añadir un `requirements.txt` o `pyproject.toml` para controlar versiones exactas de dependencias.
- Preparar `Dockerfile` y `docker-compose.yml` para facilitar despliegue y reproducibilidad (MySQL + app).
- Implementar tests unitarios y CI (GitHub Actions) que ejecuten los scripts de integración contra una base temporal.
- Hardenizar seguridad: secretos en vault/env manager, limitar privilegios DB, sanitizar uploads, protección CSRF y CORS según despliegue.

---

Si quieres, puedo:

- Añadir un `requirements.txt` con las versiones usadas durante desarrollo.
- Crear un `Dockerfile` y `docker-compose.yml` de ejemplo.
- Generar un `README` traducido al inglés.

Dime qué prefieres que haga a continuación.
# SCZ Segura Predictiva

Sistema de seguridad ciudadana con inteligencia artificial predictiva para Santa Cruz de la Sierra, Bolivia.

## Descripcion del Proyecto

SCZ Segura Predictiva es una plataforma web que permite a los vecinos reportar incidentes de seguridad en tiempo real, recibir alertas predictivas y ayudar a las autoridades a planificar patrullajes preventivos basados en datos. El sistema incluye roles diferenciados (vecino, administrador de junta vecinal, policia y superadministrador) para gestionar la seguridad ciudadana de manera colaborativa.

## Tecnologias Utilizadas

### Backend
- Python 3.14
- FastAPI 0.136.1
- Uvicorn 0.47.0
- MySQL 8.0
- JWT para autenticacion
- Bcrypt para hash de contraseñas
- Passlib para manejo de hashes
- python-jose para tokens
- python-dotenv para variables de entorno
- requests para geocodificacion

### Frontend
- HTML5
- CSS3
- JavaScript ES6
- Leaflet.js para mapas
- Leaflet.heat para mapa de calor
- OpenStreetMap para mapas base

### Herramientas
- Git 2.54.0
- MySQL Workbench
- VS Code

## Estructura del Proyecto
scz_segura_predictiva/
----.env
----.gitignore
----db.sql
----package.json
----package-lock.json
----README.md
----backend/
--------main.py
--------routes/
------------admin.routes.py
------------auth_routes.py
------------incidente_routes.py
------------policia_routes.py
--------schemas/
------------auth_schemas.py
------------incidente_schemas.py
--------utils/
------------auth_utils.py
------------email_utils.py
------------log_utils.py
------------websocket_manager.py
----database/
--------db.py
----frontend/
--------index.html
--------css/
------------auth.css
------------base.css
------------components.css
------------incidentes.css
------------mapa.css
------------styles.css
--------js/
------------app.js
------------auth.js
------------config.js
------------incidentes.js
------------mapa.js
------------ui.js
------------websocket.js
--------node_modules

## Instalacion

### Requisitos Previos
- Python 3.14+
- MySQL 8.0+
- Git

### Pasos de Instalacion

1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/scz-segura-predictiva.git
cd scz-segura-predictiva
Crear entorno virtual

bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
Instalar dependencias

bash
pip install fastapi uvicorn mysql-connector-python bcrypt passlib python-jose[cryptography] python-dotenv email-validator requests
Configurar variables de entorno (.env)

env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=scz_segura_predictiva
SMTP_EMAIL=tu_email@gmail.com
SMTP_PASSWORD=tu_contraseña_aplicacion
SECRET_KEY=tu_clave_secreta
Crear base de datos
Ejecutar el script SQL en MySQL Workbench

Ejecutar el servidor

bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
Abrir navegador en http://localhost:8000

Base de Datos
Script Completo de Base de Datos
sql
drop database if exists scz_segura_predictiva;
create database scz_segura_predictiva;
use scz_segura_predictiva;

set global max_allowed_packet = 268435456;

create table usuarios (
    id int auto_increment primary key,
    ci varchar(15) unique not null,
    nombre varchar(100) not null,
    apellido varchar(100) not null,
    email varchar(150) unique not null,
    telefono varchar(20),
    contra varchar(255) not null,
    rol enum('vecino', 'admin_junta', 'policia', 'superadmin') not null default 'vecino',
    esta_verificado boolean default false,
    codigo_verificacion varchar(6),
    token_recuperacion varchar(255) null,
    token_recuperacion_expiracion datetime null,
    numero_placa varchar(20) null,
    ubicacion_vivienda text null,
    telefono_emergencia varchar(20) null,
    direccion_puesto varchar(200) null,
    creado_en timestamp default current_timestamp,
    actualizado_en timestamp default current_timestamp on update current_timestamp
);

create table incidentes (
    id int auto_increment primary key,
    usuario_id int not null,
    tipo_delito varchar(50) not null,
    descripcion text,
    latitud decimal(10,8) not null,
    longitud decimal(11,8) not null,
    direccion varchar(255),
    imagenes text null,
    ubicacion_valida boolean default false,
    ip_address varchar(45) null,
    estado enum('pendiente', 'validado', 'rechazado', 'en_proceso', 'resuelto') default 'pendiente',
    actualizado_por int null,
    actualizado_en timestamp null,
    comentario_validacion text null,
    creado_en timestamp default current_timestamp,
    foreign key (usuario_id) references usuarios(id) on delete cascade
);

create table barrios (
    id int auto_increment primary key,
    nombre varchar(100) not null,
    distrito varchar(50),
    latitud decimal(10,8),
    longitud decimal(11,8)
);

create table logs_sistema (
    id int auto_increment primary key,
    usuario_id int not null,
    accion varchar(100) not null,
    tabla_afectada varchar(50),
    registro_id int,
    datos_anteriores text,
    datos_nuevos text,
    ip_address varchar(45),
    user_agent varchar(255),
    creado_en timestamp default current_timestamp,
    foreign key (usuario_id) references usuarios(id) on delete cascade
);

create table seguimiento_incidentes (
    id int auto_increment primary key,
    incidente_id int not null,
    usuario_id int not null,
    accion varchar(50) not null,
    comentario text,
    creado_en timestamp default current_timestamp,
    foreign key (incidente_id) references incidentes(id) on delete cascade,
    foreign key (usuario_id) references usuarios(id) on delete cascade
);

create table asignaciones_policiales (
    id int auto_increment primary key,
    incidente_id int not null,
    policia_id int not null,
    estado varchar(50) default 'asignado',
    fecha_asignacion timestamp default current_timestamp,
    fecha_resolucion timestamp null,
    observaciones text,
    foreign key (incidente_id) references incidentes(id) on delete cascade,
    foreign key (policia_id) references usuarios(id) on delete cascade
);

insert into barrios (nombre, distrito, latitud, longitud) values
('Plan 3000', 'Distrito 8', -17.783333, -63.183333),
('Los Lotes', 'Distrito 8', -17.800000, -63.200000),
('El Remanso', 'Distrito 8', -17.790000, -63.190000),
('Villa 1° de Mayo', 'Distrito 9', -17.810000, -63.210000),
('Palmar del Oratorio', 'Distrito 9', -17.820000, -63.220000),
('Zona Sur', 'Distrito 12', -17.850000, -63.250000),
('Centro', 'Distrito 1', -17.783333, -63.182222);

insert into usuarios (ci, nombre, apellido, email, telefono, contra, esta_verificado, rol) 
values ('1111111', 'Carlos', 'Vecino', 'carlos@test.com', '71111111', '$2b$12$Mj1ZBirJzQDGX1k.fNkMZeOCZoOK5E.Gha86G9h6Zm.aDASI5KMp6', 1, 'vecino');

insert into usuarios (ci, nombre, apellido, email, telefono, contra, esta_verificado, rol, ubicacion_vivienda, telefono_emergencia) 
values ('2222222', 'Ana', 'Junta', 'ana@test.com', '72222222', '$2b$12$Mj1ZBirJzQDGX1k.fNkMZeOCZoOK5E.Gha86G9h6Zm.aDASI5KMp6', 1, 'admin_junta', 'Barrio Plan 3000, Calle 7, Casa 123', '72222223');

insert into usuarios (ci, nombre, apellido, email, telefono, contra, esta_verificado, rol, numero_placa, direccion_puesto, telefono_emergencia) 
values ('3333333', 'Luis', 'Policia', 'luis@test.com', '73333333', '$2b$12$Mj1ZBirJzQDGX1k.fNkMZeOCZoOK5E.Gha86G9h6Zm.aDASI5KMp6', 1, 'policia', 'PLACA-001', 'Estacion Policial Norte, Av. Santos Dumont', '110');

insert into usuarios (ci, nombre, apellido, email, telefono, contra, esta_verificado, rol, numero_placa, direccion_puesto) 
values ('4444444', 'Admin', 'Super', 'super@test.com', '74444444', '$2b$12$Mj1ZBirJzQDGX1k.fNkMZeOCZoOK5E.Gha86G9h6Zm.aDASI5KMp6', 1, 'superadmin', 'ADMIN-001', 'Oficina Central');

select id, nombre, email, rol from usuarios;
Usuarios de Prueba
Usuario	Email	Contraseña	Rol
Carlos Vecino	carlos@test.com	123456	vecino
Ana Junta	ana@test.com	123456	admin_junta
Luis Policia	luis@test.com	123456	policia
Super Admin	super@test.com	123456	superadmin
Funcionalidades Implementadas
Modulo de Autenticacion
Registro de usuarios con verificacion por email

Inicio de sesion con JWT

Recuperacion de contraseña

Verificacion de cuenta por codigo de 6 digitos

Modulo de Incidentes
Reportar incidente con ubicacion actual (geolocalizacion)

Subir maximo 3 fotos por incidente

Obtener direccion automatica (calle/avenida) desde coordenadas

Listado de incidentes publicos

Mapa de calor de incidentes

Detalle de incidente con imagenes

Sistema de Roles
Vecino: Reportar incidentes, ver incidentes, ver mis reportes

Admin Junta: Ver estadisticas, ver incidentes por validar, visualizar reportes

Policia: Asignarse incidentes, resolver incidentes, rechazar incidentes

Superadmin: Gestionar usuarios, cambiar roles, eliminar usuarios

Caracteristicas Tecnicas
Mapa interactivo con Leaflet.js

Mapa de calor con densidad de incidentes

Geolocalizacion automatica

Direccion inversa (coordenadas a calle)

Diseño responsive (movil, tablet, laptop)

Logs de auditoria

Seguimiento de incidentes

Endpoints de la API
Autenticacion
Metodo	Endpoint	Descripcion
POST	/api/registro	Registrar usuario
POST	/api/login	Iniciar sesion
POST	/api/verificar-codigo	Verificar codigo de email
POST	/api/solicitar-recuperacion	Solicitar recuperacion
POST	/api/cambiar-contrasena	Cambiar contraseña
GET	/api/perfil	Obtener perfil
PUT	/api/perfil	Actualizar perfil
Incidentes
Metodo	Endpoint	Descripcion
POST	/api/reportar-incidente	Reportar incidente
GET	/api/incidentes	Listar incidentes (autenticado)
GET	/api/incidentes-publicos	Listar incidentes publicos
GET	/api/mis-incidentes	Mis reportes
GET	/api/geocodificar	Convertir coordenadas a direccion
Administracion
Metodo	Endpoint	Descripcion
GET	/api/admin/estadisticas-barrio	Estadisticas por barrio
GET	/api/admin/incidentes-por-validar	Incidentes pendientes
GET	/api/superadmin/usuarios	Listar usuarios
PUT	/api/superadmin/usuarios/{id}/rol	Cambiar rol
Policia
Metodo	Endpoint	Descripcion
GET	/api/policia/incidentes-asignados	Mis incidentes asignados
GET	/api/policia/incidentes-pendientes	Incidentes pendientes
POST	/api/policia/asignar-incidente/{id}	Asignar incidente
PUT	/api/policia/resolver-incidente/{id}	Resolver incidente
PUT	/api/policia/rechazar-incidente/{id}	Rechazar incidente
Variables de Entorno (.env)
env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=scz_segura_predictiva
SMTP_EMAIL=tu_email@gmail.com
SMTP_PASSWORD=tu_contraseña_aplicacion
SECRET_KEY=tu_clave_secreta
Comandos Utiles
Ejecutar servidor en desarrollo
bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
Ejecutar con ngrok (exponer a internet)
bash
# Terminal 1
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2
ngrok http 8000
Verificar conexion a base de datos
bash
python -c "from database.db import db; print(db.get_connection())"
Instalar dependencias
bash
pip install fastapi uvicorn mysql-connector-python bcrypt passlib python-jose[cryptography] python-dotenv email-validator requests
Autor
Josue Claros - Desarrollo de Sistemas II - UPDS

Licencia
Proyecto academico - Universidad Privada Domingo Savio (UPDS)