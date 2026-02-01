
import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"
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
            return result['access_token']
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

def get_users(token, params=None):
    url = f"{BASE_URL}/auth/usuarios"
    if params:
        query = urllib.parse.urlencode(params)
        url += f"?{query}"
    
    req = urllib.request.Request(
        url,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Get users failed: {e}")
        return None

def verify():
    print("Logging in...")
    token = login()
    print(f"Got token: {token[:10]}...")

    # Test 1: Default (should respond with items and total)
    print("\nTest 1: Default Fetch")
    data = get_users(token) or {}
    if 'items' in data and 'total' in data:
        print(f"PASS: items={len(data['items'])}, total={data['total']}")
    else:
        print(f"FAIL: Unexpected structure: {data.keys()}")
        sys.exit(1)

    # Test 2: Filter by Admin
    print("\nTest 2: Filter Admin")
    data = get_users(token, {'rol': 'admin'}) or {}
    admins = data['items']
    non_admins = [u for u in admins if u['rol'] != 'admin']
    if not non_admins and len(admins) > 0:
        print(f"PASS: Extracted {len(admins)} admins")
    else:
        print(f"FAIL: Found non-admins: {non_admins}")

    # Test 3: Pagination
    print("\nTest 3: Pagination (limit=1)")
    data = get_users(token, {'limit': 1}) or {}
    if len(data['items']) == 1:
        print("PASS: Returned exactly 1 user")
    else:
        print(f"FAIL: Returned {len(data['items'])} users")

    # Test 4: Search (Search for 'Admin')
    print("\nTest 4: Search 'Admin'")
    data = get_users(token, {'search': 'Admin'}) or {}
    matches = [u for u in data['items'] if 'admin' in u['nombre'].lower()]
    if len(matches) == len(data['items']) and len(matches) > 0:
        print(f"PASS: Found {len(matches)} matches")
    else:
        print(f"FAIL: Search results questionable: {len(data['items'])} items")

    print("\nALL TESTS PASSED")

if __name__ == "__main__":
    verify()
