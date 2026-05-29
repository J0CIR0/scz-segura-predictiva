create database scz_segura_predictiva;
use scz_segura_predictiva;

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
    creado_en timestamp default current_timestamp,
    actualizado_en timestamp default current_timestamp on update current_timestamp
);

select * from usuarios;