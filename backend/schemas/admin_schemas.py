from pydantic import BaseModel
from typing import Optional


class cambiar_rol_solicitud(BaseModel):
    rol: str


class actualizar_usuario_solicitud(BaseModel):
    telefono: Optional[str] = None
    telefono_emergencia: Optional[str] = None
    numero_placa: Optional[str] = None
    ubicacion_vivienda: Optional[str] = None
    direccion_puesto: Optional[str] = None
    password: Optional[str] = None


class configuracion_solicitud(BaseModel):
    clave: str
    valor: str