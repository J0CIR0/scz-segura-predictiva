# SCZ Segura Predictiva

Sistema de seguridad ciudadana con inteligencia artificial predictiva para Santa Cruz de la Sierra.

## Descripción

SCZ Segura Predictiva es una plataforma web que permite a los vecinos reportar incidentes de seguridad en tiempo real, recibir alertas predictivas y ayudar a las autoridades a planificar patrullajes preventivos basados en datos.

## Problemática

- Alertas de seguridad se pierden en grupos de WhatsApp
- No hay registro estructurado de incidentes por barrio, horario o tipo de delito
- Falsas alarmas generan pánico innecesario
- Policía no tiene datos para patrullajes preventivos
- Adultos mayores no pueden usar aplicaciones complejas

## Solución

Plataforma web que permite:
- Reportar incidentes en menos de 30 segundos
- Verificación por correo electrónico
- Autenticación segura con JWT
- Roles diferenciados (vecino, admin junta, policía, superadmin)
- (Futuro) IA predictiva con 70% de precisión
- (Futuro) Alertas por WhatsApp y Telegram

## Tecnologías

### Backend
- Python 3.14
- FastAPI
- JWT para autenticación
- Bcrypt para hash de contraseñas
- MySQL

### Frontend
- HTML5
- CSS3
- JavaScript ES6

### Herramientas
- Git
- MySQL Workbench
- Ngrok (para pruebas)
