import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 587
        self.smtp_email = os.getenv("SMTP_EMAIL")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        
    def generar_codigo(self):
        return ''.join(random.choices(string.digits, k=6))
    
    def enviar_email(self, to_email, subject, body):
        try:
            msg = MIMEMultipart()
            msg["From"] = self.smtp_email
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "html"))
            
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_email, self.smtp_password)
            server.send_message(msg)
            server.quit()
            return True
        except smtplib.SMTPAuthenticationError:
            print("Error de autenticacion con Gmail. Verifica tu contraseña de aplicacion")
            raise
        except Exception as e:
            print(f"Error enviando email: {e}")
            raise

email_service = EmailService()