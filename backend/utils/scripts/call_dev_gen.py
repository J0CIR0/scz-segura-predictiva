import os, json
os.environ['ALLOW_DEV_TOKEN'] = '1'
from backend.routes import admin_routes
res = admin_routes.dev_generate_token('super@test.com')
print(json.dumps(res, ensure_ascii=False))
