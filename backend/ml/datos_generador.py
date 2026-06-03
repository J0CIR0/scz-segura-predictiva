import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
import os

class GeneradorDatosIncidentes:
    def __init__(self):
        self.tipos_delito = ['ROBO', 'ASALTO', 'PERSONA SOSPECHOSA', 'VIOLENCIA', 'OTROS']
        self.barrios = [
            'Plan 3000', 'Los Lotes', 'El Remanso', 'Villa 1° de Mayo', 
            'Palmar del Oratorio', 'Zona Sur', 'Centro', 'Equipetrol', 
            'Urbari', 'Santa Cruz'
        ]
        
        self.centros_zonas = {
            'Plan 3000': (-17.783333, -63.183333),
            'Los Lotes': (-17.800000, -63.200000),
            'El Remanso': (-17.790000, -63.190000),
            'Villa 1° de Mayo': (-17.810000, -63.210000),
            'Palmar del Oratorio': (-17.820000, -63.220000),
            'Zona Sur': (-17.850000, -63.250000),
            'Centro': (-17.783333, -63.182222),
            'Equipetrol': (-17.770000, -63.180000),
            'Urbari': (-17.760000, -63.200000),
            'Santa Cruz': (-17.789000, -63.190000)
        }
        
        self.matriz_riesgo = self._crear_matriz_riesgo()
    
    def _crear_matriz_riesgo(self):
        matriz = {}
        for barrio in self.barrios:
            matriz[barrio] = {
                'ROBO': random.uniform(0.3, 0.9),
                'ASALTO': random.uniform(0.2, 0.8),
                'PERSONA SOSPECHOSA': random.uniform(0.1, 0.6),
                'VIOLENCIA': random.uniform(0.1, 0.5),
                'OTROS': random.uniform(0.1, 0.4)
            }
        return matriz
    
    def _generar_coordenadas(self, barrio):
        centro_lat, centro_lon = self.centros_zonas[barrio]
        radio = 0.01
        lat = centro_lat + random.uniform(-radio, radio)
        lon = centro_lon + random.uniform(-radio, radio)
        return round(lat, 6), round(lon, 6)
    
    def _calcular_probabilidad_incidente(self, barrio, tipo_delito, hora, dia_semana):
        prob_base = self.matriz_riesgo[barrio][tipo_delito]
        
        factor_horario = 1.0
        if 20 <= hora <= 23 or 0 <= hora <= 5:
            factor_horario = 1.5
        elif 6 <= hora <= 8 or 17 <= hora <= 19:
            factor_horario = 1.2
        else:
            factor_horario = 0.7
        
        factor_dia = 1.0
        if dia_semana >= 5:
            factor_dia = 1.3
        else:
            factor_dia = 0.9
        
        probabilidad = prob_base * factor_horario * factor_dia
        return min(probabilidad, 0.95)
    
    def generar_incidente(self, fecha):
        barrio = random.choice(self.barrios)
        tipo_delito = random.choice(self.tipos_delito)
        hora = fecha.hour
        dia_semana = fecha.weekday()
        
        probabilidad = self._calcular_probabilidad_incidente(barrio, tipo_delito, hora, dia_semana)
        
        if random.random() <= probabilidad:
            lat, lon = self._generar_coordenadas(barrio)
            
            descripciones = {
                'ROBO': f'Robo en {barrio}, calle principal',
                'ASALTO': f'Asalto a transeúnte en {barrio}',
                'PERSONA SOSPECHOSA': f'Persona sospechosa merodeando en {barrio}',
                'VIOLENCIA': f'Pelea callejera en {barrio}',
                'OTROS': f'Incidente reportado en {barrio}'
            }
            
            return {
                'latitud': lat,
                'longitud': lon,
                'tipo_delito': tipo_delito,
                'descripcion': descripciones[tipo_delito],
                'barrio': barrio,
                'hora': hora,
                'dia_semana': dia_semana,
                'mes': fecha.month,
                'es_fin_semana': 1 if dia_semana >= 5 else 0,
                'es_noche': 1 if (hora >= 20 or hora <= 5) else 0,
                'es_hora_pico': 1 if (hora in [7,8,9,17,18,19]) else 0
            }
        return None
    
    def generar_dataset(self, num_dias=365, incidentes_por_dia_min=5, incidentes_por_dia_max=30):
        incidentes = []
        fecha_inicio = datetime.now() - timedelta(days=num_dias)
        
        for i in range(num_dias):
            fecha = fecha_inicio + timedelta(days=i)
            num_incidentes_dia = random.randint(incidentes_por_dia_min, incidentes_por_dia_max)
            
            for _ in range(num_incidentes_dia):
                hora = random.randint(0, 23)
                minuto = random.randint(0, 59)
                fecha_incidente = fecha.replace(hour=hora, minute=minuto)
                
                incidente = self.generar_incidente(fecha_incidente)
                if incidente:
                    incidente['fecha'] = fecha_incidente
                    incidentes.append(incidente)
        
        df = pd.DataFrame(incidentes)
        return df
    
    def guardar_dataset(self, df, filename='backend/ml/datos_historicos.csv'):
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        df.to_csv(filename, index=False)
        print(f"Dataset guardado en {filename}")
        print(f"Total de incidentes generados: {len(df)}")
        return filename

if __name__ == "__main__":
    generador = GeneradorDatosIncidentes()
    df = generador.generar_dataset(num_dias=730)
    generador.guardar_dataset(df)