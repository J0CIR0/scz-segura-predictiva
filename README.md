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
├── .env Variables de entorno
├── .gitignore Archivos ignorados por git
├── README.md Documentacion
├── backend/
│ ├── init.py
│ ├── main.py Punto de entrada de la API
│ ├── routes/
│ │ ├── init.py
│ │ ├── auth_routes.py Rutas de autenticacion
│ │ ├── incidente_routes.py Rutas de incidentes
│ │ ├── admin_routes.py Rutas de administracion
│ │ └── policia_routes.py Rutas para policia
│ ├── schemas/
│ │ ├── init.py
│ │ ├── auth_schemas.py Schemas de autenticacion
│ │ └── incidente_schemas.py Schemas de incidentes
│ ├── utils/
│ │ ├── init.py
│ │ ├── auth_utils.py JWT y bcrypt
│ │ ├── email_utils.py SMTP y codigos
│ │ └── log_utils.py Registro de logs
│ └── models/
│ └── init.py
├── database/
│ ├── init.py
│ └── db.py Conexion a MySQL
└── frontend/
├── index.html Interfaz principal
├── css/
│ ├── base.css Estilos base
│ ├── components.css Componentes UI
│ ├── auth.css Estilos de autenticacion
│ └── mapa.css Estilos de mapa
└── js/
├── config.js Configuracion
├── ui.js UI y modales
├── mapa.js Mapa y geolocalizacion
├── auth.js Autenticacion
├── incidentes.js CRUD incidentes
└── app.js Inicializacion


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