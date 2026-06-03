import requests, json, os

BASE = os.environ.get('TEST_BASE', 'http://127.0.0.1:8001')

def pretty(o):
    print(json.dumps(o, ensure_ascii=False, indent=2))

def gen_token(email='super@test.com'):
    url = f"{BASE}/api/dev/generate-token"
    r = requests.post(url, json={"email": email}, timeout=30)
    print('\n== dev generate-token ==')
    print(r.status_code)
    try:
        pretty(r.json())
    except Exception:
        print(r.text)
    r.raise_for_status()
    return r.json().get('access_token')


def get_users(token):
    url = f"{BASE}/api/superadmin/usuarios"
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    print('\n== listar usuarios ==')
    print(r.status_code)
    pretty(r.json())
    r.raise_for_status()
    return r.json()


def change_role(token, user_id, nuevo_rol):
    url = f"{BASE}/api/superadmin/usuarios/{user_id}/rol"
    r = requests.put(url, headers={"Authorization": f"Bearer {token}"}, json={"rol": nuevo_rol}, timeout=30)
    print(f'\n== cambiar rol {user_id} -> {nuevo_rol} ==')
    print(r.status_code)
    try:
        pretty(r.json())
    except Exception:
        print(r.text)
    r.raise_for_status()


def update_user(token, user_id, payload):
    url = f"{BASE}/api/superadmin/usuarios/{user_id}"
    r = requests.put(url, headers={"Authorization": f"Bearer {token}"}, json=payload, timeout=30)
    print(f'\n== actualizar usuario {user_id} ==')
    print(r.status_code)
    try:
        pretty(r.json())
    except Exception:
        print(r.text)
    r.raise_for_status()


def crear_respaldo(token):
    url = f"{BASE}/api/superadmin/respaldo-manual"
    r = requests.post(url, headers={"Authorization": f"Bearer {token}"}, timeout=60)
    print('\n== crear respaldo ==')
    print(r.status_code)
    try:
        pretty(r.json())
    except Exception:
        print(r.text)
    r.raise_for_status()
    return r.json().get('archivo')


def listar_respaldos(token):
    url = f"{BASE}/api/superadmin/respaldos"
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    print('\n== listar respaldos ==')
    print(r.status_code)
    pretty(r.json())
    r.raise_for_status()
    return r.json()


def descargar_respaldo(token, archivo, dest='downloads'):
    url = f"{BASE}/api/superadmin/descargar-respaldo?archivo={archivo}"
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, stream=True, timeout=60)
    print('\n== descargar respaldo ==')
    print(r.status_code)
    if r.status_code == 200:
        os.makedirs(dest, exist_ok=True)
        path = os.path.join(dest, archivo)
        with open(path, 'wb') as f:
            for chunk in r.iter_content(1024):
                f.write(chunk)
        print('guardado en', path)
        return path
    else:
        print(r.text)
        r.raise_for_status()


def reentrenar_ia(token):
    url = f"{BASE}/api/superadmin/reentrenar-ia"
    r = requests.post(url, headers={"Authorization": f"Bearer {token}"}, timeout=60)
    print('\n== reentrenar IA ==')
    print(r.status_code)
    pretty(r.json())
    r.raise_for_status()


def monitoreo(token):
    url = f"{BASE}/api/superadmin/monitoreo"
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    print('\n== monitoreo ==')
    print(r.status_code)
    pretty(r.json())
    r.raise_for_status()


def police_flows():
    print('\n== police flows ==')
    base = BASE
    police_token = gen_token('luis@test.com')

    r = requests.get(f"{base}/api/policia/incidentes-resueltos", headers={"Authorization": f"Bearer {police_token}"}, timeout=30)
    print('incidentes-resueltos', r.status_code)
    pretty(r.json())
    r.raise_for_status()

    r = requests.get(f"{base}/api/policia/recomendar-patrullaje?fecha=2026-06-01&hora_inicio=08:00&hora_fin=12:00", headers={"Authorization": f"Bearer {police_token}"}, timeout=30)
    print('recomendar-patrullaje', r.status_code)
    pretty(r.json())
    r.raise_for_status()

    r = requests.post(
        f"{base}/api/policia/guardar-patrullaje",
        headers={"Authorization": f"Bearer {police_token}"},
        json={"fecha": "2026-06-02", "hora_inicio": "08:00", "hora_fin": "12:00", "zona": "Centro"},
        timeout=30,
    )
    print('guardar-patrullaje', r.status_code)
    pretty(r.json())
    r.raise_for_status()

    r = requests.get(f"{base}/api/policia/mis-patrullajes", headers={"Authorization": f"Bearer {police_token}"}, timeout=30)
    print('mis-patrullajes', r.status_code)
    pretty(r.json())
    r.raise_for_status()


def listar_logs(token):
    url = f"{BASE}/api/superadmin/logs"
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    print('\n== listar logs ==')
    print(r.status_code)
    pretty(r.json())
    r.raise_for_status()


if __name__ == '__main__':
    try:
        token = gen_token()
        if not token:
            raise SystemExit('No token')
        get_users(token)
        # cambiar rol user id 1 -> policia -> vecino (revertir)
        change_role(token, 1, 'policia')
        change_role(token, 1, 'vecino')
        # actualizar telefono usuario 1
        update_user(token, 1, {'telefono': '79999999'})
        archivo = crear_respaldo(token)
        listar_respaldos(token)
        if archivo:
            descargar_respaldo(token, archivo)
        reentrenar_ia(token)
        monitoreo(token)
        listar_logs(token)
        police_flows()
        print('\n== tests completed successfully ==')
    except Exception as e:
        print('\n== error during tests ==')
        print(str(e))
