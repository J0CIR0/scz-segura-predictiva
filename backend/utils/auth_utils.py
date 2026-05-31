from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
import secrets
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException, Depends
from database.db import db

security = HTTPBearer()
    
class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = os.getenv("SECRET_KEY")
        self.algorithm = "HS256"
    
    def hash_pass(self, password: str) -> str:  
        return self.pwd_context.hash(password)
    
    def verify_pass(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def generate_session_token(self) -> str:
        return secrets.token_urlsafe(32)
    
    def create_token(self, data: dict):
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=7)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def create_full_token(self, user_id: int, email: str, rol: str, session_token: str) -> str:
        payload = {
            "sub": email,
            "id": user_id,
            "rol": rol,
            "session_token": session_token
        }
        return self.create_token(payload)
    
    def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)):
        token = credentials.credentials
        
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id = payload.get("id")
            session_token_from_jwt = payload.get("session_token")
            
            if not user_id or not session_token_from_jwt:
                raise HTTPException(status_code=401, detail="Token mal formado")
            
            conn = db.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute(
                "SELECT id, rol, esta_verificado, activo, active_session_token FROM usuarios WHERE id = %s",
                (user_id,)
            )
            user = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not user:
                raise HTTPException(status_code=401, detail="Usuario no encontrado")
            
            if not user.get("esta_verificado"):
                raise HTTPException(status_code=401, detail="Cuenta no verificada")
            
            if not user.get("activo"):
                raise HTTPException(status_code=401, detail="Cuenta desactivada")
            
            active_token = user.get("active_session_token")
            
            if not active_token:
                raise HTTPException(status_code=401, detail="Sesion expirada. Inicia sesion nuevamente.")
            
            if active_token != session_token_from_jwt:
                raise HTTPException(status_code=401, detail="Tu sesion fue cerrada porque iniciaste sesion en otro dispositivo.")
            
            return payload
            
        except JWTError:
            raise HTTPException(status_code=401, detail="Token invalido o expirado")
    
    def get_current_user_optional(self, token: str = None):
        if not token:
            return None
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None
    
    def activate_session(self, user_id: int, session_token: str) -> bool:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE usuarios SET active_session_token = %s, activo = TRUE WHERE id = %s AND activo = FALSE",
            (session_token, user_id)
        )
        conn.commit()
        actualizado = cursor.rowcount > 0
        cursor.close()
        conn.close()
        
        return actualizado
    
    def deactivate_session(self, user_id: int) -> None:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE usuarios SET active_session_token = NULL, activo = FALSE WHERE id = %s",
            (user_id,)
        )
        conn.commit()
        cursor.close()
        conn.close()
    
    def is_session_active(self, user_id: int) -> bool:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT activo FROM usuarios WHERE id = %s", (user_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result[0] if result else False

auth_service = AuthService()