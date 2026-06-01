from pydantic import BaseModel, EmailStr
from typing import Optional

class registro_usuario(BaseModel):
    ci: str
    nombre: str
    apellido: str
    email: EmailStr
    telefono: str
    password: str
    numero_placa: Optional[str] = None
    ubicacion_vivienda: Optional[str] = None
    telefono_emergencia: Optional[str] = None
    direccion_puesto: Optional[str] = None

class login_usuario(BaseModel):
    email: EmailStr
    password: str

class force_login_request(BaseModel):
    email: EmailStr
    password: str
    
class verificar_codigo(BaseModel):
    email: EmailStr
    codigo: str

class solicitar_recuperacion(BaseModel):
    email: EmailStr

class cambiar_contrasena(BaseModel):
    email: EmailStr
    codigo: str
    nueva_password: str

class actualizar_perfil(BaseModel):
    telefono: Optional[str] = None
    numero_placa: Optional[str] = None
    ubicacion_vivienda: Optional[str] = None
    telefono_emergencia: Optional[str] = None
    direccion_puesto: Optional[str] = None
    nueva_password: Optional[str] = None