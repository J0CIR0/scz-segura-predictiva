from fastapi import APIRouter, HTTPException, Depends
from backend.utils.auth_utils import auth_service
from database.db import db
from datetime import datetime

router = APIRouter()

def verificar_rol_policia(current_user: dict):
    rol = current_user.get("rol")
    if rol != "policia":
        raise HTTPException(status_code=403, detail="acceso denegado. se requiere rol policia")
    return True

@router.get("/policia/incidentes-asignados")
def incidentes_asignados(current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_policia(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select a.id as asignacion_id, i.id, i.tipo_delito, i.descripcion, 
               i.latitud, i.longitud, i.direccion, i.imagenes,
               i.estado, i.creado_en, a.estado as asignacion_estado,
               a.fecha_asignacion, a.observaciones,
               u.nombre as vecino_nombre, u.apellido as vecino_apellido, u.telefono as vecino_telefono
        from asignaciones_policiales a
        join incidentes i on a.incidente_id = i.id
        join usuarios u on i.usuario_id = u.id
        where a.policia_id = %s and a.estado != 'resuelto'
        order by a.fecha_asignacion desc
    """, (current_user["id"],))
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"incidentes": incidentes}

@router.get("/policia/incidentes-pendientes")
def incidentes_pendientes(current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_policia(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select i.id, i.tipo_delito, i.descripcion, 
               i.latitud, i.longitud, i.direccion, i.imagenes,
               i.estado, i.creado_en,
               u.nombre as vecino_nombre, u.apellido as vecino_apellido, u.telefono as vecino_telefono
        from incidentes i
        join usuarios u on i.usuario_id = u.id
        where i.estado = 'pendiente'
        and not exists (select 1 from asignaciones_policiales a where a.incidente_id = i.id)
        order by i.creado_en desc
    """)
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"incidentes": incidentes}

@router.post("/policia/asignar-incidente/{incidente_id}")
def asignar_incidente(incidente_id: int, current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_policia(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("select id, estado from incidentes where id = %s", (incidente_id,))
    incidente = cursor.fetchone()
    
    if not incidente:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="incidente no encontrado")
    
    if incidente["estado"] != "pendiente":
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="incidente ya no esta pendiente")
    
    cursor.execute("""
        insert into asignaciones_policiales (incidente_id, policia_id, estado)
        values (%s, %s, 'asignado')
    """, (incidente_id, current_user["id"]))
    
    cursor.execute("update incidentes set estado = 'en_proceso', actualizado_por = %s, actualizado_en = now() where id = %s", 
                   (current_user["id"], incidente_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"mensaje": "incidente asignado exitosamente"}

@router.put("/policia/resolver-incidente/{incidente_id}")
def resolver_incidente(incidente_id: int, observaciones: str = None, current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_policia(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        update asignaciones_policiales 
        set estado = 'resuelto', fecha_resolucion = now(), observaciones = %s
        where incidente_id = %s and policia_id = %s
    """, (observaciones, incidente_id, current_user["id"]))
    
    cursor.execute("update incidentes set estado = 'resuelto', actualizado_por = %s, actualizado_en = now() where id = %s", 
                   (current_user["id"], incidente_id))
    
    cursor.execute("""
        insert into seguimiento_incidentes (incidente_id, usuario_id, accion, comentario)
        values (%s, %s, 'RESUELTO', %s)
    """, (incidente_id, current_user["id"], observaciones))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"mensaje": "incidente resuelto exitosamente"}

@router.put("/policia/rechazar-incidente/{incidente_id}")
def rechazar_incidente(incidente_id: int, motivo: str, current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_policia(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("update incidentes set estado = 'rechazado', actualizado_por = %s, actualizado_en = now() where id = %s", 
                   (current_user["id"], incidente_id))
    
    cursor.execute("""
        insert into seguimiento_incidentes (incidente_id, usuario_id, accion, comentario)
        values (%s, %s, 'RECHAZADO', %s)
    """, (incidente_id, current_user["id"], motivo))
    
    cursor.execute("delete from asignaciones_policiales where incidente_id = %s", (incidente_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"mensaje": "incidente rechazado exitosamente"}