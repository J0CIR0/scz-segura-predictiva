import os
os.environ['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'testing_secret_123')

from database.db import db
conn = db.get_connection()
cursor = conn.cursor()
# set manual session token for superadmin
cursor.execute("UPDATE usuarios SET active_session_token = %s, activo = TRUE WHERE email = %s", ('manualtoken123', 'super@test.com'))
conn.commit()
cursor.close()
conn.close()

from backend.utils.auth_utils import AuthService
auth = AuthService()
print(auth.create_full_token(user_id=4, email='super@test.com', rol='superadmin', session_token='manualtoken123'))
