import requests, base64, os
url = os.environ["WP_URL"]
user = os.environ["WP_USERNAME"]
pw = os.environ["WP_APP_PASSWORD"]
cred = base64.b64encode(f"{user}:{pw}".encode()).decode()
h = {"Authorization": f"Basic {cred}"}
r = requests.delete(f"{url}/wp-json/wp/v2/categories/219", headers=h, params={"force": True})
print(r.status_code, r.text[:100])
