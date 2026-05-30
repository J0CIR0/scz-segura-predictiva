from fastapi import APIRouter, HTTPException, Depends, Request
from backend.schemas.incidente_schemas import reporte_incidente
from backend.utils.auth_utils import auth_service
from database.db import db
import json
import requests

router = APIRouter()

@router.post("/reportar-incidente")
def reportar_incidente(
    incidente: reporte_incidente, 
    request: Request,
    current_user: dict = Depends(auth_service.get_current_user)
):
    usuario_id = current_user.get("id")
    
    if not usuario_id:
        raise HTTPException(status_code=401, detail="usuario no autenticado")
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("select id from usuarios where id = %s", (usuario_id,))
    existe = cursor.fetchone()
    
    if not existe:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="usuario no encontrado")
    
    ip_address = request.client.host
    
    imagenes_json = None
    if incidente.imagenes and len(incidente.imagenes) > 0:
        imagenes_json = json.dumps(incidente.imagenes[:3])
    
    cursor.execute("""
        insert into incidentes (usuario_id, tipo_delito, descripcion, latitud, longitud, direccion, imagenes, ip_address)
        values (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (usuario_id, incidente.tipo_delito, incidente.descripcion, 
          incidente.latitud, incidente.longitud, incidente.direccion,
          imagenes_json, ip_address))
    
    conn.commit()
    incidente_id = cursor.lastrowid
    
    cursor.close()
    conn.close()
    
    return {"mensaje": "incidente reportado exitosamente", "incidente_id": incidente_id}

@router.get("/incidentes")
def listar_incidentes(current_user: dict = Depends(auth_service.get_current_user)):
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
        if inc.get("imagenes") and inc["imagenes"]:
            try:
                inc["imagenes"] = json.loads(inc["imagenes"])
            except:
                inc["imagenes"] = []
        else:
            inc["imagenes"] = []
    
    return {"incidentes": incidentes}

@router.get("/incidentes-publicos")
def listar_incidentes_publicos():
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select i.id, i.usuario_id, i.tipo_delito, i.descripcion, 
               i.latitud, i.longitud, i.direccion, i.imagenes, i.ubicacion_valida,
               i.estado, i.creado_en,
               u.nombre as vecino_nombre, u.apellido as vecino_apellido
        from incidentes i
        join usuarios u on i.usuario_id = u.id
        where i.estado = 'pendiente'
        order by i.creado_en desc
        limit 50
    """)
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    for inc in incidentes:
        if inc.get("imagenes") and inc["imagenes"]:
            try:
                inc["imagenes"] = json.loads(inc["imagenes"])
            except:
                inc["imagenes"] = []
        else:
            inc["imagenes"] = []
    
    return {"incidentes": incidentes}

@router.get("/mis-incidentes")
def mis_incidentes(current_user: dict = Depends(auth_service.get_current_user)):
    usuario_id = current_user.get("id")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="usuario no autenticado")
    
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
    
    for inc in incidentes:
        if inc.get("imagenes") and inc["imagenes"]:
            try:
                inc["imagenes"] = json.loads(inc["imagenes"])
            except:
                inc["imagenes"] = []
        else:
            inc["imagenes"] = []
    
    return incidentes

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