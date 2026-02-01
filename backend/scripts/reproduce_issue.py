import urllib.request
import urllib.parse
import urllib.error
import json
import sys
from datetime import date

BASE_URL = "http://127.0.0.1:8000/api"
# Credentials for admin user
EMAIL = "adam_admin@nutriorxata.com"
PASSWORD = "admin1234"

def login():
    url = f"{BASE_URL}/auth/login"
    data = {"email": EMAIL, "password": PASSWORD}
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"Login successful as {result['usuario']['nombre']}")
            return result['access_token'], result['usuario']
    except Exception as e:
        print(f"Login failed: {e}")
        read = getattr(e, "read", None)
        if callable(read):
            try:
                content = read()
                decode = getattr(content, "decode", None)
                if callable(decode):
                    print(decode())
                else:
                    print(content)
            except Exception:
                pass
        sys.exit(1)

def get_first_plato(token):
    url = f"{BASE_URL}/platos?limit=1"
    req = urllib.request.Request(
        url,
        headers={'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        # If it's a list, just return the first one
        if isinstance(data, list) and len(data) > 0:
            return data[0]
        # If it's a dict with items (paginated)
        if isinstance(data, dict) and 'items' in data and len(data['items']) > 0:
            return data['items'][0]
        return None

def create_planificacion(token, client_id, plato_id):
    url = f"{BASE_URL}/planificacion"
    payload = {
        "semana_inicio": date.today().isoformat(),
        "dia": "lunes",
        "momento": "comida",
        "plato_id": plato_id,
        "client_id": client_id,
        "notas": "Test notes"
    }
    
    print(f"Sending payload: {json.dumps(payload, indent=2)}")
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.status}")
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        print(e.read().decode())
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def main():
    print("1. Logging in...")
    token, user_info = login()
    
    print("\n2. Getting a dish...")
    plato = get_first_plato(token)
    if not plato:
        print("No dishes found. Cannot test.")
        sys.exit(1)
    print(f"Found dish: {plato['nombre']} (ID: {plato['id']})")
    
    client_id = user_info['id'] # Admin can plan for themselves or others. Let's try themselves first.
    
    print(f"\n3. Creating planificacion for client {client_id}...")
    result = create_planificacion(token, client_id, plato['id'])
    print("Success!")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
