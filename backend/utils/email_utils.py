import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

class EmailService:
    def __init__(self):
        self.smtp_email = os.getenv("SMTP_EMAIL")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
    
    def generar_codigo(self):
        return ''.join(random.choices(string.digits, k=6))
    
    def enviar_email(self, to_email, subject, body):
        msg = MIMEMultipart()
        msg["From"] = self.smtp_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(self.smtp_email, self.smtp_password)
        server.send_message(msg)
        server.quit()