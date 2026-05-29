from pydantic import BaseModel, EmailStr

class registro_usuario(BaseModel):
    ci: str
    nombre: str
    apellido: str
    email: EmailStr
    telefono: str
    password: str

class login_usuario(BaseModel):
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