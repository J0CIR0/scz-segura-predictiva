from fastapi import APIRouter, HTTPException, Depends
from backend.utils.auth_utils import auth_service
from database.db import db
from typing import List

router = APIRouter()

def verificar_rol_superadmin(current_user: dict):
    rol = current_user.get("rol")
    if rol != "superadmin":
        raise HTTPException(status_code=403, detail="acceso denegado. se requiere rol superadmin")
    return True

def verificar_rol_admin_o_superadmin(current_user: dict):
    rol = current_user.get("rol")
    if rol not in ["admin_junta", "superadmin"]:
        raise HTTPException(status_code=403, detail="acceso denegado")
    return True

@router.get("/admin/usuarios")
def listar_usuarios(current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_superadmin(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select id, ci, nombre, apellido, email, telefono, rol, esta_verificado, creado_en
        from usuarios
        order by id desc
    """)
    
    usuarios = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"usuarios": usuarios}

@router.put("/admin/usuarios/{usuario_id}/rol")
def cambiar_rol_usuario(usuario_id: int, nuevo_rol: str, current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_superadmin(current_user)
    
    if nuevo_rol not in ["vecino", "admin_junta", "policia", "superadmin"]:
        raise HTTPException(status_code=400, detail="rol invalido")
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("update usuarios set rol = %s where id = %s", (nuevo_rol, usuario_id))
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return {"mensaje": "rol actualizado exitosamente"}

@router.get("/admin/incidentes")
def listar_incidentes_admin(current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_admin_o_superadmin(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select i.id, i.usuario_id, i.tipo_delito, i.descripcion, 
               i.latitud, i.longitud, i.direccion, i.imagenes,
               i.estado, i.creado_en, i.ubicacion_valida,
               u.nombre as vecino_nombre, u.apellido as vecino_apellido, u.email as vecino_email
        from incidentes i
        join usuarios u on i.usuario_id = u.id
        order by i.creado_en desc
        limit 100
    """)
    
    incidentes = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return {"incidentes": incidentes}

@router.put("/admin/incidentes/{incidente_id}/validar")
def validar_incidente(incidente_id: int, es_valido: bool, current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_admin_o_superadmin(current_user)
    
    nuevo_estado = "validado" if es_valido else "rechazado"
    
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        update incidentes set estado = %s, ubicacion_valida = %s where id = %s
    """, (nuevo_estado, es_valido, incidente_id))
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return {"mensaje": f"incidente {nuevo_estado} exitosamente"}

@router.get("/admin/estadisticas")
def obtener_estadisticas(current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_admin_o_superadmin(current_user)
    
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select 
            count(*) as total_incidentes,
            sum(case when estado = 'pendiente' then 1 else 0 end) as pendientes,
            sum(case when estado = 'validado' then 1 else 0 end) as validados,
            sum(case when estado = 'rechazado' then 1 else 0 end) as rechazados
        from incidentes
    """)
    totales = cursor.fetchone()
    
    cursor.execute("""
        select tipo_delito, count(*) as cantidad
        from incidentes
        group by tipo_delito
        order by cantidad desc
    """)
    por_tipo = cursor.fetchall()
    
    cursor.execute("""
        select DATE(creado_en) as fecha, count(*) as cantidad
        from incidentes
        where creado_en >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        group by DATE(creado_en)
        order by fecha desc
    """)
    ultimos_7_dias = cursor.fetchall()
    
    cursor.execute("""
        select count(*) as total_usuarios,
               sum(case when esta_verificado = 1 then 1 else 0 end) as verificados
        from usuarios
    """)
    usuarios_stats = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    return {
        "incidentes": totales,
        "por_tipo": por_tipo,
        "ultimos_7_dias": ultimos_7_dias,
        "usuarios": usuarios_stats
    }