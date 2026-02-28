import requests

base = "http://localhost:8000"
endpoints = [
    ("GET", "/health"),
    ("GET", "/api/v1/papers"),
    ("GET", "/api/v1/matrix"),
    ("GET", "/api/v1/graph"),
    ("GET", "/api/v1/credibility/summary"),
    ("GET", "/api/v1/field/health"),
    ("GET", "/api/v1/gaps"),
]

all_ok = True
for method, path in endpoints:
    try:
        resp = requests.get(f"{base}{path}", timeout=10)
        status = resp.status_code
        ok = "✅" if status == 200 else "⚠️ "
        if status != 200:
            all_ok = False
        print(f"{ok} {method} {path} → {status}")
    except Exception as e:
        all_ok = False
        print(f"❌ {method} {path} → ERROR: {e}")

print()
if all_ok:
    print("All endpoints healthy.")
else:
    print("Some endpoints have issues — check above.")
