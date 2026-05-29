from database.db import db
from datetime import datetime
import json

def registrar_log(usuario_id, accion, tabla_afectada=None, registro_id=None, datos_anteriores=None, datos_nuevos=None, ip_address=None, user_agent=None):
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        insert into logs_sistema (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent)
        values (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        usuario_id, accion, tabla_afectada, registro_id,
        json.dumps(datos_anteriores) if datos_anteriores else None,
        json.dumps(datos_nuevos) if datos_nuevos else None,
        ip_address, user_agent
    ))
    
    conn.commit()
    cursor.close()
    conn.close()