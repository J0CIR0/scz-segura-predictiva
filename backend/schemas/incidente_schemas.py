from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class reporte_incidente(BaseModel):
    tipo_delito: str
    descripcion: str
    latitud: float
    longitud: float
    direccion: str

class incidente_response(BaseModel):
    id: int
    usuario_id: int
    tipo_delito: str
    descripcion: str
    latitud: float
    longitud: float
    direccion: str
    estado: str
    creado_en: datetime
    vecino_nombre: Optional[str] = None
    vecino_apellido: Optional[str] = None