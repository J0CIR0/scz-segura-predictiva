# backend/routes/incidente_routes.py
from fastapi import APIRouter, HTTPException, Depends, Request
from backend.schemas.incidente_schemas import reporte_incidente
from backend.utils.auth_utils import auth_service
from database.db import db
import json
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
import re
import requests
import mysql.connector

router = APIRouter()


RADIO_DUPLICADOS_METROS = 50.0
VENTANA_DUPLICADOS_MINUTOS = 10


def _distancia_metros(lat1, lon1, lat2, lon2):
    radio_tierra = 6371000.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return radio_tierra * c


def _es_incidente_duplicado(cursor, incidente):
    ventana = datetime.now() - timedelta(minutes=VENTANA_DUPLICADOS_MINUTOS)
    cursor.execute(
        """
        SELECT id, usuario_id, tipo_delito, descripcion, latitud, longitud, creado_en
        FROM incidentes
        WHERE creado_en >= %s
          AND tipo_delito = %s
          AND estado <> 'rechazado'
        ORDER BY creado_en DESC
        """,
        (ventana, incidente.tipo_delito),
    )
    for fila in cursor.fetchall():
        if not isinstance(fila, dict):
            continue
        distancia = _distancia_metros(
            float(incidente.latitud),
            float(incidente.longitud),
            float(fila["latitud"]),
            float(fila["longitud"]),
        )
        if distancia <= RADIO_DUPLICADOS_METROS:
            return fila
    return None

def normalizar_imagenes_guardadas(valor):
    if not valor:
        return []

    if isinstance(valor, list):
        return [img for img in valor if isinstance(img, str) and img]

    if isinstance(valor, str):
        try:
            parsed = json.loads(valor)
            if isinstance(parsed, list):
                return [img for img in parsed if isinstance(img, str) and img]
        except Exception:
            if valor.startswith("data:image"):
                return [valor]
            coincidencias = re.findall(r"data:image/[^\"'\s]+", valor)
            if coincidencias:
                return coincidencias

    return []

@router.post("/reportar-incidente")
def reportar_incidente(
    incidente: reporte_incidente, 
    request: Request,
    current_user: dict = Depends(auth_service.get_current_user)
):
    usuario_id = current_user.get("id")
    
    if not usuario_id:
        raise HTTPException(status_code=401, detail="usuario no autenticado")
    
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("select id from usuarios where id = %s", (usuario_id,))
        existe = cursor.fetchone()
        
        if not existe:
            raise HTTPException(status_code=401, detail="usuario no encontrado")

        incidente_duplicado = _es_incidente_duplicado(cursor, incidente)
        if incidente_duplicado:
            raise HTTPException(
                status_code=409,
                detail="Incidente duplicado detectado cerca de otro reporte reciente. Verifica la ubicacion y vuelve a intentar.",
            )
        
        ip_address = request.client.host if request.client else None
        
        imagenes_json = None
        imagenes_guardadas = normalizar_imagenes_guardadas(incidente.imagenes)
        if imagenes_guardadas:
            imagenes_json = json.dumps(imagenes_guardadas, ensure_ascii=False)
        
        cursor.execute("""
            INSERT INTO incidentes (usuario_id, tipo_delito, descripcion, latitud, longitud, direccion, imagenes, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (usuario_id, incidente.tipo_delito, incidente.descripcion, 
              incidente.latitud, incidente.longitud, incidente.direccion,
              imagenes_json, ip_address))
        
        conn.commit()
        incidente_id = cursor.lastrowid
        
        return {"mensaje": "incidente reportado exitosamente", "incidente_id": incidente_id}
    
    except mysql.connector.Error as e:
        if conn:
            conn.rollback()
        print(f"Error de MySQL: {e}")
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {str(e)}")
    
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        db.safe_close(conn)

@router.get("/incidentes")
def listar_incidentes(current_user: dict = Depends(auth_service.get_current_user)):
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
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
        
        for inc in incidentes:
            inc["imagenes"] = normalizar_imagenes_guardadas(inc.get("imagenes"))
        
        return {"incidentes": incidentes}
    finally:
        cursor.close()
        db.safe_close(conn)

@router.get("/incidentes-publicos")
def listar_incidentes_publicos():
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            select i.id, i.usuario_id, i.tipo_delito, i.descripcion, 
                   i.latitud, i.longitud, i.direccion, i.imagenes, i.ubicacion_valida,
                   i.estado, i.creado_en,
                   u.nombre as vecino_nombre, u.apellido as vecino_apellido
            from incidentes i
            join usuarios u on i.usuario_id = u.id
            where i.estado = 'pendiente' or i.estado = 'en_proceso'
            order by i.creado_en desc
            limit 50
        """)
        
        incidentes = cursor.fetchall()
        
        for inc in incidentes:
            inc["imagenes"] = normalizar_imagenes_guardadas(inc.get("imagenes"))
        
        return {"incidentes": incidentes}
    finally:
        cursor.close()
        db.safe_close(conn)

@router.get("/mis-incidentes")
def mis_incidentes(current_user: dict = Depends(auth_service.get_current_user)):
    usuario_id = current_user.get("id")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="usuario no autenticado")
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            select id, usuario_id, tipo_delito, descripcion, 
                   latitud, longitud, direccion, imagenes, ubicacion_valida,
                   estado, creado_en
            from incidentes
            where usuario_id = %s
            order by creado_en desc
        """, (usuario_id,))
        
        incidentes = cursor.fetchall()
        
        for inc in incidentes:
            inc["imagenes"] = normalizar_imagenes_guardadas(inc.get("imagenes"))
        
        return incidentes
    finally:
        cursor.close()
        db.safe_close(conn)

@router.get("/geocodificar")
def geocodificar(lat: float, lon: float):
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
    
    try:
        response = requests.get(url, headers={"User-Agent": "SCZSeguraPredictiva/1.0"})
        data = response.json()
        
        direccion = ""
        if "address" in data:
            addr = data["address"]
            calle = addr.get("road", "")
            avenida = addr.get("avenue", "")
            barrio = addr.get("suburb", "")
            ciudad = addr.get("city", addr.get("town", addr.get("village", "")))
            
            if calle:
                direccion = calle
            if avenida:
                direccion = avenida if not direccion else direccion + " y " + avenida
            if barrio:
                direccion = direccion + ", " + barrio if direccion else barrio
            if ciudad:
                direccion = direccion + ", " + ciudad if direccion else ciudad
        
        if not direccion:
            direccion = data.get("display_name", "")
        
        return {"direccion": direccion}
    except:
        return {"direccion": ""}