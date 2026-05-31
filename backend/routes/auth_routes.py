from fastapi import APIRouter, HTTPException, Depends
from backend.schemas.auth_schemas import registro_usuario, login_usuario, verificar_codigo, solicitar_recuperacion, cambiar_contrasena, actualizar_perfil
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
    
    if usuario.numero_placa:
        rol = "policia"
    elif usuario.ubicacion_vivienda:
        rol = "admin_junta"
    else:
        rol = "vecino"
    
    cursor.execute("""
        insert into usuarios (ci, nombre, apellido, email, telefono, contra, rol, codigo_verificacion,
                             numero_placa, ubicacion_vivienda, telefono_emergencia, direccion_puesto, activo)
        values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (usuario.ci, usuario.nombre, usuario.apellido, usuario.email, usuario.telefono, 
          password_hash, rol, codigo, usuario.numero_placa, usuario.ubicacion_vivienda,
          usuario.telefono_emergencia, usuario.direccion_puesto, False))
    
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
    
    cursor.execute("""
        select id, contra, esta_verificado, rol, nombre, apellido,
               numero_placa, ubicacion_vivienda, telefono_emergencia, direccion_puesto, activo
        from usuarios where email = %s
    """, (data.email,))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    if not auth_service.verify_pass(data.password, usuario["contra"]):
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    if not usuario["esta_verificado"]:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Verifica tu cuenta primero")
    
    user_id = usuario["id"]
    user_rol = usuario["rol"]
    user_nombre = usuario["nombre"]
    user_apellido = usuario["apellido"]
    
    cursor.close()
    conn.close()
    
    new_session_token = auth_service.generate_session_token()
    pudo_activar = auth_service.activate_session_if_available(user_id, new_session_token)

    if not pudo_activar:
        raise HTTPException(
            status_code=409,
            detail="Tu cuenta ya tiene una sesion activa en otro dispositivo. Cierra esa sesion primero para iniciar aqui."
        )
    
    token = auth_service.create_full_token(
        user_id=user_id,
        email=data.email,
        rol=user_rol,
        session_token=new_session_token
    )
    
    perfil_data = {}
    if user_rol == "policia":
        perfil_data = {
            "numero_placa": usuario.get("numero_placa"),
            "direccion_puesto": usuario.get("direccion_puesto"),
            "telefono_emergencia": usuario.get("telefono_emergencia")
        }
    elif user_rol == "admin_junta":
        perfil_data = {
            "ubicacion_vivienda": usuario.get("ubicacion_vivienda"),
            "telefono_emergencia": usuario.get("telefono_emergencia")
        }
    
    return {
        "status": "success",
        "access_token": token, 
        "token_type": "bearer", 
        "rol": user_rol,
        "nombre": user_nombre,
        "apellido": user_apellido,
        "perfil": perfil_data
    }

@router.post("/force-login")
async def force_login():
    raise HTTPException(
        status_code=403,
        detail="Inicio forzado deshabilitado: solo se permite una sesion activa por usuario."
    )

@router.post("/logout")
def logout(current_user: dict = Depends(auth_service.get_current_user_with_session_check)):
    auth_service.deactivate_session(current_user["id"])
    return {"mensaje": "Sesion cerrada exitosamente"}

@router.put("/perfil")
def actualizar_perfil_usuario(datos: actualizar_perfil, current_user: dict = Depends(auth_service.get_current_user_with_session_check)):
    conn = db.get_connection()
    cursor = conn.cursor()
    
    campos = []
    valores = []
    
    if datos.telefono:
        campos.append("telefono = %s")
        valores.append(datos.telefono)
    if datos.numero_placa:
        campos.append("numero_placa = %s")
        valores.append(datos.numero_placa)
    if datos.ubicacion_vivienda:
        campos.append("ubicacion_vivienda = %s")
        valores.append(datos.ubicacion_vivienda)
    if datos.telefono_emergencia:
        campos.append("telefono_emergencia = %s")
        valores.append(datos.telefono_emergencia)
    if datos.direccion_puesto:
        campos.append("direccion_puesto = %s")
        valores.append(datos.direccion_puesto)
    
    if not campos:
        cursor.close()
        conn.close()
        return {"mensaje": "no hay datos para actualizar"}
    
    valores.append(current_user["id"])
    query = f"update usuarios set {', '.join(campos)} where id = %s"
    cursor.execute(query, valores)
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return {"mensaje": "perfil actualizado exitosamente"}

@router.get("/perfil")
def obtener_perfil(current_user: dict = Depends(auth_service.get_current_user_with_session_check)):
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        select id, ci, nombre, apellido, email, telefono, rol,
               numero_placa, ubicacion_vivienda, telefono_emergencia, direccion_puesto,
               esta_verificado, creado_en
        from usuarios where id = %s
    """, (current_user["id"],))
    
    usuario = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return {"usuario": usuario}

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
async def cambiar_contrasena(data: cambiar_contrasena):
    conn = db.get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("select id, token_recuperacion, token_recuperacion_expiracion from usuarios where email = %s", (data.email,))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if usuario["token_recuperacion"] != data.codigo:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Codigo incorrecto")
    
    if datetime.now() > usuario["token_recuperacion_expiracion"]:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Codigo expirado")
    
    nueva_password_hash = auth_service.hash_pass(data.nueva_password)
    
    cursor.execute("""
        UPDATE usuarios 
        SET contra = %s, token_recuperacion = null, token_recuperacion_expiracion = null, active_session_token = null, activo = FALSE 
        WHERE id = %s
    """, (nueva_password_hash, usuario["id"]))
    
    conn.commit()
    
    await manager.broadcast_to_user(usuario["id"], "session_expired", {"message": "Tu contraseña fue cambiada. Tu sesion ha sido cerrada."})
    
    cursor.close()
    conn.close()
    
    return {"mensaje": "Contraseña actualizada exitosamente. Tu sesion ha sido cerrada."}