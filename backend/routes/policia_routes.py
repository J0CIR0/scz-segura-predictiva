from fastapi import APIRouter, HTTPException, Depends
from backend.utils.auth_utils import auth_service
from backend.utils.log_utils import registrar_log
from database.db import db
from datetime import datetime, timedelta
from typing import Optional
import json

router = APIRouter()


def _asegurar_tabla_patrullajes(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS patrullajes_policia (
            id INT AUTO_INCREMENT PRIMARY KEY,
            policia_id INT NOT NULL,
            fecha DATE NOT NULL,
            hora_inicio TIME NOT NULL,
            hora_fin TIME NOT NULL,
            zona VARCHAR(120) NOT NULL,
            probabilidad DECIMAL(5,2) NULL,
            factores TEXT NULL,
            estado VARCHAR(30) DEFAULT 'programado',
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

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


@router.get("/policia/incidentes-resueltos")
def incidentes_resueltos(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    tipo: Optional[str] = None,
    current_user: dict = Depends(auth_service.get_current_user),
):
    verificar_rol_policia(current_user)

    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT i.id, i.tipo_delito, i.descripcion,
               i.latitud, i.longitud, i.direccion, i.imagenes,
               i.estado, i.creado_en,
               a.fecha_resolucion, a.observaciones,
               u.nombre as vecino_nombre, u.apellido as vecino_apellido, u.telefono as vecino_telefono
        FROM asignaciones_policiales a
        JOIN incidentes i ON a.incidente_id = i.id
        JOIN usuarios u ON i.usuario_id = u.id
        WHERE a.policia_id = %s AND a.estado = 'resuelto'
    """
    params = [current_user["id"]]

    if fecha_desde:
        query += " AND a.fecha_resolucion >= %s"
        params.append(datetime.strptime(fecha_desde, "%Y-%m-%d"))
    if fecha_hasta:
        query += " AND a.fecha_resolucion < %s"
        params.append(datetime.strptime(fecha_hasta, "%Y-%m-%d") + timedelta(days=1))
    if tipo:
        query += " AND i.tipo_delito = %s"
        params.append(tipo)

    query += " ORDER BY a.fecha_resolucion DESC"

    cursor.execute(query, tuple(params))
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

    registrar_log(
        current_user["id"],
        "asignar_incidente",
        tabla_afectada="incidentes",
        registro_id=incidente_id,
        datos_anteriores={"estado": "pendiente"},
        datos_nuevos={"estado": "en_proceso"},
    )
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

    registrar_log(
        current_user["id"],
        "resolver_incidente",
        tabla_afectada="incidentes",
        registro_id=incidente_id,
        datos_nuevos={"estado": "resuelto", "observaciones": observaciones},
    )
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

    registrar_log(
        current_user["id"],
        "rechazar_incidente",
        tabla_afectada="incidentes",
        registro_id=incidente_id,
        datos_nuevos={"estado": "rechazado", "motivo": motivo},
    )
    cursor.close()
    conn.close()
    
    return {"mensaje": "incidente rechazado exitosamente"}


@router.get("/policia/recomendar-patrullaje")
def recomendar_patrullaje(
    fecha: str,
    hora_inicio: str,
    hora_fin: str,
    current_user: dict = Depends(auth_service.get_current_user),
):
    verificar_rol_policia(current_user)

    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT COALESCE(b.nombre, 'Centro') AS zona, COUNT(*) AS total
            FROM incidentes i
            LEFT JOIN barrios b ON LOWER(COALESCE(i.direccion, '')) LIKE CONCAT('%', LOWER(b.nombre), '%')
            WHERE i.creado_en >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            GROUP BY COALESCE(b.nombre, 'Centro')
            ORDER BY total DESC
            LIMIT 1
            """
        )
        row = cursor.fetchone() or {"zona": "Centro", "total": 0}
        zona = row["zona"]
        total = int(row["total"] or 0)
        probabilidad = min(95.0, round(35.0 + (total * 7.5), 2))
        factores = f"{total} incidentes recientes detectados en la zona."

        return {
            "zona_recomendada": zona,
            "probabilidad": probabilidad,
            "factores": factores,
        }
    finally:
        cursor.close()
        conn.close()


@router.post("/policia/guardar-patrullaje")
def guardar_patrullaje(payload: dict, current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_policia(current_user)

    fecha = payload.get("fecha")
    hora_inicio = payload.get("hora_inicio")
    hora_fin = payload.get("hora_fin")
    zona = payload.get("zona")

    if not all([fecha, hora_inicio, hora_fin, zona]):
        raise HTTPException(status_code=400, detail="faltan datos del patrullaje")

    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        _asegurar_tabla_patrullajes(cursor)
        cursor.execute(
            """
            INSERT INTO patrullajes_policia (policia_id, fecha, hora_inicio, hora_fin, zona, estado)
            VALUES (%s, %s, %s, %s, %s, 'programado')
            """,
            (current_user["id"], fecha, hora_inicio, hora_fin, zona),
        )
        conn.commit()

        registrar_log(
            current_user["id"],
            "guardar_patrullaje",
            tabla_afectada="patrullajes_policia",
            datos_nuevos={"fecha": fecha, "hora_inicio": hora_inicio, "hora_fin": hora_fin, "zona": zona},
        )

        return {"mensaje": "patrullaje guardado exitosamente"}
    finally:
        cursor.close()
        conn.close()


@router.get("/policia/mis-patrullajes")
def mis_patrullajes(current_user: dict = Depends(auth_service.get_current_user)):
    verificar_rol_policia(current_user)

    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        _asegurar_tabla_patrullajes(cursor)
        cursor.execute(
            """
            SELECT fecha, hora_inicio, hora_fin, zona, estado, creado_en
            FROM patrullajes_policia
            WHERE policia_id = %s
            ORDER BY creado_en DESC
            """,
            (current_user["id"],),
        )
        return {"patrullajes": cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()