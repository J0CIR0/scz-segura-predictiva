import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv
import pathlib

env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Database:
    def __init__(self):
        self.host = os.getenv("DB_HOST")
        self.user = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASSWORD")
        self.database = os.getenv("DB_NAME")
        self.pool = None
        self._create_pool()
    
    def _create_pool(self):
        try:
            self.pool = pooling.MySQLConnectionPool(
                pool_name="mypool",
                pool_size=10,
                pool_reset_session=True,
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                autocommit=False,
                use_pure=True
            )
            print(f"Pool de conexiones creado: host={self.host}, db={self.database}")
        except Exception as e:
            print(f"Error creando pool: {e}")
    
    def get_connection(self):
        if self.pool is None:
            self._create_pool()
        return self.pool.get_connection()

db = Database()