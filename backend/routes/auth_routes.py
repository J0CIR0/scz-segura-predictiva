from fastapi import APIRouter, HTTPException
from backend.schemas.auth_schemas import registro_usuario, login_usuario, verificar_codigo, solicitar_recuperacion, cambiar_contrasena
from backend.utils.auth_utils import auth_service
from backend.utils.email_utils import email_service
from database.db import db
from datetime import datetime, timedelta

router = APIRouter()

@router.post("/registro")
def registrar_usuario(usuario: registro_usuario):
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("select id from usuarios where email = %s or ci = %s", (usuario.email, usuario.ci))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="email o ci ya registrado")
    
    password_hash = auth_service.hash_pass(usuario.password)
    codigo = email_service.generar_codigo()
    
    cursor.execute("""
        insert into usuarios (ci, nombre, apellido, email, telefono, contra, rol, codigo_verificacion)
        values (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (usuario.ci, usuario.nombre, usuario.apellido, usuario.email, usuario.telefono, password_hash, "vecino", codigo))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    email_service.enviar_email(usuario.email, "verifica tu cuenta - scz segura predictiva", f"""
    <h2>bienvenido a scz segura predictiva</h2>
    <p>tu codigo de verificacion es: <strong>{codigo}</strong></p>
    <p>este codigo expira en 15 minutos.</p>
    """)
    
    return {"mensaje": "usuario registrado. revisa tu correo"}

@router.post("/verificar-codigo")
def verificar_codigo(data: verificar_codigo):
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("select id, codigo_verificacion from usuarios where email = %s", (data.email,))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="usuario no encontrado")
    
    if usuario["codigo_verificacion"] != data.codigo:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="codigo incorrecto")
    
    cursor.execute("update usuarios set esta_verificado = true, codigo_verificacion = null where id = %s", (usuario["id"],))
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"mensaje": "cuenta verificada exitosamente"}

@router.post("/login")
def login(data: login_usuario):
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("select id, contra, esta_verificado, rol from usuarios where email = %s", (data.email,))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="credenciales incorrectas")
    
    if not auth_service.verify_pass(data.password, usuario["contra"]):
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="credenciales incorrectas")
    
    if not usuario["esta_verificado"]:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="verifica tu cuenta primero")
    
    token = auth_service.create_token({
        "sub": data.email, 
        "id": usuario["id"], 
        "rol": usuario["rol"]
    })
    
    cursor.close()
    conn.close()
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "rol": usuario["rol"],
        "nombre": usuario.get("nombre", "Usuario")
    }

@router.post("/solicitar-recuperacion")
def solicitar_recuperacion(data: solicitar_recuperacion):
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("select id from usuarios where email = %s", (data.email,))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="email no registrado")
    
    codigo = email_service.generar_codigo()
    expiracion = datetime.now() + timedelta(minutes=15)
    
    cursor.execute("update usuarios set token_recuperacion = %s, token_recuperacion_expiracion = %s where id = %s", (codigo, expiracion, usuario["id"]))
    conn.commit()
    cursor.close()
    conn.close()
    
    email_service.enviar_email(data.email, "recupera tu contraseña - scz segura predictiva", f"""
    <h2>recuperacion de contraseña</h2>
    <p>tu codigo de recuperacion es: <strong>{codigo}</strong></p>
    <p>este codigo expira en 15 minutos.</p>
    """)
    
    return {"mensaje": "codigo de recuperacion enviado a tu correo"}

@router.post("/cambiar-contrasena")
def cambiar_contrasena(data: cambiar_contrasena):
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("select id, token_recuperacion, token_recuperacion_expiracion from usuarios where email = %s", (data.email,))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="usuario no encontrado")
    
    if usuario["token_recuperacion"] != data.codigo:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="codigo incorrecto")
    
    if datetime.now() > usuario["token_recuperacion_expiracion"]:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="codigo expirado")
    
    nueva_password_hash = auth_service.hash_pass(data.nueva_password)
    
    cursor.execute("update usuarios set contra = %s, token_recuperacion = null, token_recuperacion_expiracion = null where id = %s", (nueva_password_hash, usuario["id"]))
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"mensaje": "contraseña actualizada exitosamente"}