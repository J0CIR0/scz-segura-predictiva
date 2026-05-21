from fastapi import APIRouter, HTTPException
from backend.schemas.auth_schemas import RegistroUsuario, LoginUsuario, VerificarCodigo, SolicitarRecuperacion, CambioContrasena
from backend.utils.auth_utils import auth_service
from backend.utils.email_utils import EmailService
from database.db import db
from datetime import datetime, timedelta

router = APIRouter()
email_service = EmailService()

@router.post("/registro")
def registrar_usuario(usuario: RegistroUsuario):
    connection = db.get_connection()
    cursor = connection.cursor()
    
    cursor.execute("SELECT id FROM usuarios WHERE email = %s OR ci = %s", (usuario.email, usuario.ci))
    if cursor.fetchone():
        cursor.close()
        connection.close()
        raise HTTPException(status_code=400, detail="Email o CI ya registrado")
    
    contrasena_hash = auth_service.hash_password(usuario.contrasena)
    codigo = email_service.generar_codigo()
    codigo_expiracion = datetime.now() + timedelta(minutes=15)
    
    cursor.execute("""
        INSERT INTO usuarios (ci, nombre, apellido, email, telefono, contrasena_hash, rol, codigo_verificacion, codigo_expiracion)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (usuario.ci, usuario.nombre, usuario.apellido, usuario.email, usuario.telefono, contrasena_hash, "vecino", codigo, codigo_expiracion))
    
    connection.commit()
    cursor.close()
    connection.close()
    
    email_service.enviar_email(usuario.email, "Verifica tu cuenta - SCZ Segura Predictiva", f"""
    <h2>Bienvenido a SCZ Segura Predictiva</h2>
    <p>Tu codigo de verificacion es: <strong>{codigo}</strong></p>
    <p>Este codigo expira en 15 minutos.</p>
    """)
    
    return {"mensaje": "Usuario registrado. Revisa tu correo para el codigo de verificacion"}

@router.post("/verificar-codigo")
def verificar_codigo(verificacion: VerificarCodigo):
    connection = db.get_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute("SELECT id, codigo_verificacion, codigo_expiracion FROM usuarios WHERE email = %s", (verificacion.email,))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if usuario["codigo_verificacion"] != verificacion.codigo:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=400, detail="Codigo incorrecto")
    
    if datetime.now() > usuario["codigo_expiracion"]:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=400, detail="Codigo expirado")
    
    cursor.execute("UPDATE usuarios SET esta_verificado = TRUE, codigo_verificacion = NULL, codigo_expiracion = NULL WHERE id = %s", (usuario["id"],))
    connection.commit()
    cursor.close()
    connection.close()
    
    return {"mensaje": "Cuenta verificada exitosamente"}

@router.post("/login")
def login(login: LoginUsuario):
    connection = db.get_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute("SELECT id, contrasena_hash, esta_verificado, esta_habilitado, intentos_fallidos, bloqueado_hasta, rol FROM usuarios WHERE email = %s", (login.email,))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    if usuario["bloqueado_hasta"] and datetime.now() < usuario["bloqueado_hasta"]:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=401, detail="Cuenta bloqueada. Intenta mas tarde")
    
    if not auth_service.verify_password(login.contrasena, usuario["contrasena_hash"]):
        nuevos_intentos = usuario["intentos_fallidos"] + 1
        if nuevos_intentos >= 5:
            bloqueado_hasta = datetime.now() + timedelta(minutes=30)
            cursor.execute("UPDATE usuarios SET intentos_fallidos = %s, bloqueado_hasta = %s WHERE id = %s", (nuevos_intentos, bloqueado_hasta, usuario["id"]))
            connection.commit()
            cursor.close()
            connection.close()
            raise HTTPException(status_code=401, detail="Demasiados intentos. Cuenta bloqueada 30 minutos")
        else:
            cursor.execute("UPDATE usuarios SET intentos_fallidos = %s WHERE id = %s", (nuevos_intentos, usuario["id"]))
            connection.commit()
            cursor.close()
            connection.close()
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    cursor.execute("UPDATE usuarios SET intentos_fallidos = 0 WHERE id = %s", (usuario["id"],))
    connection.commit()
    
    if not usuario["esta_verificado"]:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=401, detail="Verifica tu cuenta primero. Revisa tu correo")
    
    if not usuario["esta_habilitado"]:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=401, detail="Cuenta deshabilitada")
    
    token = auth_service.create_token({"sub": login.email, "id": usuario["id"], "rol": usuario["rol"]})
    
    cursor.close()
    connection.close()
    
    return {"access_token": token, "token_type": "bearer", "rol": usuario["rol"]}

@router.post("/solicitar-recuperacion")
def solicitar_recuperacion(data: SolicitarRecuperacion):
    connection = db.get_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute("SELECT id FROM usuarios WHERE email = %s", (data.email,))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=404, detail="Email no registrado")
    
    codigo = email_service.generar_codigo()
    expiracion = datetime.now() + timedelta(minutes=15)
    
    cursor.execute("UPDATE usuarios SET token_recuperacion = %s, token_recuperacion_expiracion = %s WHERE id = %s", (codigo, expiracion, usuario["id"]))
    connection.commit()
    cursor.close()
    connection.close()
    
    email_service.enviar_email(data.email, "Recupera tu contraseña - SCZ Segura Predictiva", f"""
    <h2>Recuperacion de contraseña</h2>
    <p>Tu codigo de recuperacion es: <strong>{codigo}</strong></p>
    <p>Este codigo expira en 15 minutos.</p>
    """)
    
    return {"mensaje": "Codigo de recuperacion enviado a tu correo"}

@router.post("/cambiar-contrasena")
def cambiar_contrasena(data: CambioContrasena):
    connection = db.get_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute("SELECT id, token_recuperacion, token_recuperacion_expiracion FROM usuarios WHERE email = %s", (data.email,))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if usuario["token_recuperacion"] != data.codigo:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=400, detail="Codigo incorrecto")
    
    if datetime.now() > usuario["token_recuperacion_expiracion"]:
        cursor.close()
        connection.close()
        raise HTTPException(status_code=400, detail="Codigo expirado")
    
    nueva_contrasena_hash = auth_service.hash_password(data.nueva_contrasena)
    
    cursor.execute("UPDATE usuarios SET contrasena_hash = %s, token_recuperacion = NULL, token_recuperacion_expiracion = NULL WHERE id = %s", (nueva_contrasena_hash, usuario["id"]))
    connection.commit()
    cursor.close()
    connection.close()
    
    return {"mensaje": "Contraseña actualizada exitosamente"}