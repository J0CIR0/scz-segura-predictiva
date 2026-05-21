from pydantic import BaseModel, EmailStr

class RegistroUsuario(BaseModel):
    ci: str
    nombre: str
    apellido: str
    email: EmailStr
    telefono: str
    contrasena: str

class LoginUsuario(BaseModel):
    email: EmailStr
    contrasena: str

class VerificarCodigo(BaseModel):
    email: EmailStr
    codigo: str

class SolicitarRecuperacion(BaseModel):
    email: EmailStr

class CambioContrasena(BaseModel):
    email: EmailStr
    codigo: str
    nueva_contrasena: str