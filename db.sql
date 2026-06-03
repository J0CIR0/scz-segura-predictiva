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
    activo boolean default false,
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
    imagenes longtext null,
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

use scz_segura_predictiva;
select * from usuarios;
select * from incidentes;
DELETE FROM usuarios WHERE id = 6;

SET GLOBAL max_allowed_packet = 268435456;
ALTER TABLE usuarios ADD COLUMN active_session_token VARCHAR(255) NULL;