from database.db import db
from datetime import datetime
import json

def registrar_log(usuario_id, accion, tabla_afectada=None, registro_id=None, datos_anteriores=None, datos_nuevos=None, ip_address=None, user_agent=None):
    conn = db.get_connection()
    cursor = conn.cursor()
    
    datos_anteriores_json = json.dumps(datos_anteriores) if datos_anteriores else None
    datos_nuevos_json = json.dumps(datos_nuevos) if datos_nuevos else None
    
    cursor.execute("""
        insert into logs_sistema (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent)
        values (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        usuario_id, accion, tabla_afectada, registro_id,
        datos_anteriores_json, datos_nuevos_json,
        ip_address, user_agent
    ))
    
    conn.commit()
    cursor.close()
    conn.close()