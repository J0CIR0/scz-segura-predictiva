from fastapi import APIRouter, HTTPException, Depends
from backend.utils.auth_utils import auth_service
from database.db import db
from datetime import datetime

router = APIRouter()

def verificar_rol_superadmin(current_user: dict):
    rol = current_user.get("rol")
    if rol != "superadmin":
        raise HTTPException(status_code=403, detail="acceso denegado. se requiere rol superadmin")
    return True

def verificar_rol_admin_junta(current_user: dict):
    rol = current_user.get("rol")
    if rol != "admin_junta":
        raise HTTPException(status_code=403, detail="acceso denegado. se requiere rol admin_junta")
    return True

@router.get("/admin/incidentes-por-validar")
def incidentes_por_validar(current_user: dict = Depends(auth_service.get_current_user_with_session_check)):
    verificar_rol_admin_junta(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select i.id, i.usuario_id, i.tipo_delito, i.descripcion, 
               i.latitud, i.longitud, i.direccion, i.imagenes,
               i.estado, i.creado_en,
               u.nombre as vecino_nombre, u.apellido as vecino_apellido, u.telefono as vecino_telefono
        from incidentes i
        join usuarios u on i.usuario_id = u.id
        where i.estado = 'pendiente'
        order by i.creado_en desc
    """)
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"incidentes": incidentes}

@router.get("/admin/estadisticas-barrio")
def estadisticas_barrio(current_user: dict = Depends(auth_service.get_current_user_with_session_check)):
    verificar_rol_admin_junta(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select 
            count(*) as total_incidentes,
            sum(case when i.estado = 'pendiente' then 1 else 0 end) as pendientes,
            sum(case when i.estado = 'validado' then 1 else 0 end) as validados,
            sum(case when i.estado = 'rechazado' then 1 else 0 end) as rechazados,
            sum(case when i.estado = 'en_proceso' then 1 else 0 end) as en_proceso,
            sum(case when i.estado = 'resuelto' then 1 else 0 end) as resueltos
        from incidentes i
    """)
    totales = cursor.fetchone()
    
    cursor.execute("""
        select tipo_delito, count(*) as cantidad
        from incidentes
        group by tipo_delito
        order by cantidad desc
    """)
    por_tipo = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return {
        "totales": totales,
        "por_tipo": por_tipo
    }

@router.get("/admin/incidentes-validados")
def incidentes_validados(current_user: dict = Depends(auth_service.get_current_user_with_session_check)):
    verificar_rol_admin_junta(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select i.id, i.tipo_delito, i.descripcion, i.direccion, i.estado, i.creado_en,
               u.nombre as vecino_nombre, u.apellido as vecino_apellido,
               p.nombre as policia_nombre
        from incidentes i
        join usuarios u on i.usuario_id = u.id
        left join asignaciones_policiales a on i.id = a.incidente_id
        left join usuarios p on a.policia_id = p.id
        where i.estado in ('validado', 'en_proceso', 'resuelto', 'rechazado')
        order by i.creado_en desc
        limit 100
    """)
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"incidentes": incidentes}

@router.get("/superadmin/usuarios")
def listar_usuarios(current_user: dict = Depends(auth_service.get_current_user_with_session_check)):
    verificar_rol_superadmin(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select id, ci, nombre, apellido, email, telefono, rol, esta_verificado, creado_en,
               numero_placa, ubicacion_vivienda, telefono_emergencia, direccion_puesto
        from usuarios
        order by id desc
    """)
    
    usuarios = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"usuarios": usuarios}

@router.put("/superadmin/usuarios/{usuario_id}/rol")
def cambiar_rol_usuario(usuario_id: int, nuevo_rol: str, current_user: dict = Depends(auth_service.get_current_user_with_session_check)):
    verificar_rol_superadmin(current_user)
    
    if nuevo_rol not in ["vecino", "admin_junta", "policia", "superadmin"]:
        raise HTTPException(status_code=400, detail="rol invalido")
    
    if current_user["id"] == usuario_id:
        raise HTTPException(status_code=400, detail="no puedes cambiar tu propio rol")
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("update usuarios set rol = %s where id = %s", (nuevo_rol, usuario_id))
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return {"mensaje": "rol actualizado exitosamente"}

@router.delete("/superadmin/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int, current_user: dict = Depends(auth_service.get_current_user_with_session_check)):
    verificar_rol_superadmin(current_user)
    
    if current_user["id"] == usuario_id:
        raise HTTPException(status_code=400, detail="no puedes eliminarte a ti mismo")
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("delete from usuarios where id = %s", (usuario_id,))
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return {"mensaje": "usuario eliminado exitosamente"}