from fastapi import APIRouter, HTTPException, Depends, Request
from backend.schemas.incidente_schemas import reporte_incidente, incidente_response
from backend.utils.auth_utils import auth_service, security
from backend.utils.log_utils import registrar_log
from database.db import db
from typing import List
import json
from math import radians, sin, cos, sqrt, atan2

router = APIRouter()

def calcular_distancia(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

@router.post("/reportar-incidente")
def reportar_incidente(
    incidente: reporte_incidente, 
    request: Request,
    token_data: dict = Depends(security)
):
    usuario_id = token_data.get("id")
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent")
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        insert into incidentes (usuario_id, tipo_delito, descripcion, latitud, longitud, direccion, imagenes, ip_address)
        values (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (usuario_id, incidente.tipo_delito, incidente.descripcion, 
          incidente.latitud, incidente.longitud, incidente.direccion,
          json.dumps(incidente.imagenes) if incidente.imagenes else None,
          ip_address))
    
    conn.commit()
    incidente_id = cursor.lastrowid
    
    registrar_log(
        usuario_id=usuario_id,
        accion="CREAR_INCIDENTE",
        tabla_afectada="incidentes",
        registro_id=incidente_id,
        datos_nuevos={"tipo_delito": incidente.tipo_delito, "latitud": incidente.latitud, "longitud": incidente.longitud},
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    cursor.close()
    conn.close()
    
    return {"mensaje": "incidente reportado exitosamente", "incidente_id": incidente_id}

@router.get("/incidentes", response_model=List[incidente_response])
def listar_incidentes(token_data: dict = Depends(security)):
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select i.id, i.usuario_id, i.tipo_delito, i.descripcion, 
               i.latitud, i.longitud, i.direccion, i.imagenes, i.ubicacion_valida,
               i.estado, i.creado_en,
               u.nombre as vecino_nombre, u.apellido as vecino_apellido
        from incidentes i
        join usuarios u on i.usuario_id = u.id
        order by i.creado_en desc
        limit 50
    """)
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    for inc in incidentes:
        if inc.get("imagenes"):
            try:
                inc["imagenes"] = json.loads(inc["imagenes"])
            except:
                pass
    
    return incidentes

@router.get("/incidentes-cercanos")
def incidentes_cercanos(lat: float, lon: float, radio_km: float = 1, token_data: dict = Depends(security)):
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select id, tipo_delito, descripcion, latitud, longitud, direccion, creado_en
        from incidentes
        where estado = 'validado'
        order by creado_en desc
        limit 100
    """)
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    cercanos = []
    for inc in incidentes:
        distancia = calcular_distancia(lat, lon, inc["latitud"], inc["longitud"])
        if distancia <= radio_km:
            inc["distancia_km"] = round(distancia, 2)
            cercanos.append(inc)
    
    return {"incidentes": cercanos, "total": len(cercanos)}

@router.get("/mis-incidentes", response_model=List[incidente_response])
def mis_incidentes(token_data: dict = Depends(security)):
    usuario_id = token_data.get("id")
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select id, usuario_id, tipo_delito, descripcion, 
               latitud, longitud, direccion, imagenes, ubicacion_valida,
               estado, creado_en
        from incidentes
        where usuario_id = %s
        order by creado_en desc
    """, (usuario_id,))
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return incidentes