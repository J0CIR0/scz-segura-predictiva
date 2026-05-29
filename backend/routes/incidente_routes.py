from fastapi import APIRouter, HTTPException, Depends
from backend.schemas.incidente_schemas import reporte_incidente, incidente_response
from backend.utils.auth_utils import auth_service, security
from database.db import db
from typing import List

router = APIRouter()

@router.post("/reportar-incidente")
def reportar_incidente(incidente: reporte_incidente, token_data: dict = Depends(security)):
    usuario_id = token_data.get("id")
    rol = token_data.get("rol")
    
    if rol != "vecino":
        raise HTTPException(status_code=403, detail="Solo los vecinos pueden reportar incidentes")
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        insert into incidentes (usuario_id, tipo_delito, descripcion, latitud, longitud, direccion)
        values (%s, %s, %s, %s, %s, %s)
    """, (usuario_id, incidente.tipo_delito, incidente.descripcion, 
          incidente.latitud, incidente.longitud, incidente.direccion))
    
    conn.commit()
    incidente_id = cursor.lastrowid
    cursor.close()
    conn.close()
    
    return {"mensaje": "incidente reportado exitosamente", "incidente_id": incidente_id}

@router.get("/incidentes", response_model=List[incidente_response])
def listar_incidentes(token_data: dict = Depends(security)):
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select i.id, i.usuario_id, i.tipo_delito, i.descripcion, 
               i.latitud, i.longitud, i.direccion, i.estado, i.creado_en,
               u.nombre as vecino_nombre, u.apellido as vecino_apellido
        from incidentes i
        join usuarios u on i.usuario_id = u.id
        order by i.creado_en desc
        limit 50
    """)
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return incidentes

@router.get("/mis-incidentes", response_model=List[incidente_response])
def mis_incidentes(token_data: dict = Depends(security)):
    usuario_id = token_data.get("id")
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select id, usuario_id, tipo_delito, descripcion, 
               latitud, longitud, direccion, estado, creado_en
        from incidentes
        where usuario_id = %s
        order by creado_en desc
    """, (usuario_id,))
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return incidentes