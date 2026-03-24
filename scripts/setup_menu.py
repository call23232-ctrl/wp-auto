#!/usr/bin/env python3
"""
WordPress 카테고리 + 네비게이션 메뉴 설정
"""
import os, json, sys, base64

WP_URL = os.environ.get("WP_URL", "").rstrip("/")
WP_USER = os.environ.get("WP_USERNAME", "")
WP_PASS = os.environ.get("WP_APP_PASSWORD", "")

if not all([WP_URL, WP_USER, WP_PASS]):
    print("ERROR: WP_URL, WP_USERNAME, WP_APP_PASSWORD 환경변수 필요")
    sys.exit(1)

import requests

cred = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode()).decode()
HEADERS = {
    "Authorization": f"Basic {cred}",
    "Content-Type": "application/json",
    "User-Agent": "AutoBlog/1.0",
}
API = f"{WP_URL}/wp-json/wp/v2"

# ── 1. 카테고리 확인/생성 ──
TARGET_CATEGORIES = [
    {"name": "AI 도구 & 활용", "slug": "ai-tools", "description": "AI 도구 리뷰, 활용법, 자동화 팁"},
    {"name": "정부지원 & 혜택", "slug": "gov-support", "description": "정부 보조금, 지원금, 숨은 혜택 정보"},
    {"name": "행사 & 컨퍼런스", "slug": "events", "description": "IT, 비즈니스, 산업별 행사 및 컨퍼런스"},
    {"name": "핫 뉴스", "slug": "hot-news", "description": "지금 알아야 할 핫한 뉴스와 트렌드"},
    {"name": "재테크 & 투자", "slug": "finance", "description": "돈 버는 법, 절세, 투자 전략, 부동산"},
    {"name": "교육 & 생산성", "slug": "education", "description": "자기계발, 생산성 도구, 온라인 교육"},
]

print("=== 카테고리 확인/생성 ===")
cat_ids = {}
for cat in TARGET_CATEGORIES:
    resp = requests.get(f"{API}/categories", params={"slug": cat["slug"]}, headers=HEADERS, timeout=10)
    existing = resp.json()
    if existing and len(existing) > 0:
        cat_ids[cat["slug"]] = existing[0]["id"]
        print(f"  [OK] {cat['name']} (id={existing[0]['id']})")
    else:
        resp = requests.post(f"{API}/categories", headers=HEADERS, json=cat, timeout=10)
        if resp.status_code == 201:
            cat_ids[cat["slug"]] = resp.json()["id"]
            print(f"  [NEW] {cat['name']} (id={resp.json()['id']})")
        else:
            print(f"  [ERR] {cat['name']}: {resp.status_code}")

# ── 2. 메뉴 확인 ──
print("\n=== 메뉴 확인 ===")
menus_resp = requests.get(f"{API}/menus", headers=HEADERS, timeout=10)
menu_id = None
if menus_resp.status_code == 200:
    menus = menus_resp.json()
    for m in menus:
        print(f"  메뉴: [{m['id']}] {m['name']}")
        if 'main' in m['name'].lower() or 'primary' in m['name'].lower() or menu_id is None:
            menu_id = m['id']

if not menu_id:
    print("  메뉴를 찾을 수 없습니다.")
    sys.exit(1)

print(f"  사용할 메뉴: ID={menu_id}")

# ── 3. 기존 메뉴 아이템 전부 삭제 ──
print(f"\n=== 기존 메뉴 아이템 삭제 (메뉴 {menu_id}) ===")
items_resp = requests.get(
    f"{API}/menu-items", params={"menus": menu_id, "per_page": 100},
    headers=HEADERS, timeout=10
)

if items_resp.status_code == 200:
    old_items = items_resp.json()
    print(f"  {len(old_items)}개 삭제 중...")
    for item in old_items:
        requests.delete(f"{API}/menu-items/{item['id']}?force=true", headers=HEADERS, timeout=10)
    print(f"  삭제 완료")
else:
    print(f"  조회 실패: {items_resp.status_code}")

# ── 4. 새 메뉴 아이템 생성 ──
print(f"\n=== 새 메뉴 생성 ===")

# 홈
resp = requests.post(f"{API}/menu-items", headers=HEADERS, json={
    "title": "홈",
    "url": WP_URL + "/",
    "status": "publish",
    "menus": menu_id,
    "type": "custom",
    "menu_order": 1,
}, timeout=10)
print(f"  [{'OK' if resp.status_code == 200 else 'ERR'}] 홈 (status={resp.status_code})")

# 카테고리 아이템
for i, cat in enumerate(TARGET_CATEGORIES, start=2):
    slug = cat["slug"]
    if slug not in cat_ids:
        continue

    # taxonomy 타입으로 시도
    item_data = {
        "title": cat["name"],
        "status": "publish",
        "menus": menu_id,
        "type": "taxonomy",
        "object": "category",
        "object_id": cat_ids[slug],
        "menu_order": i,
    }
    resp = requests.post(f"{API}/menu-items", headers=HEADERS, json=item_data, timeout=10)

    if resp.status_code != 200:
        # custom 링크로 폴백
        item_data = {
            "title": cat["name"],
            "url": f"{WP_URL}/category/{slug}/",
            "status": "publish",
            "menus": menu_id,
            "type": "custom",
            "menu_order": i,
        }
        resp = requests.post(f"{API}/menu-items", headers=HEADERS, json=item_data, timeout=10)

    print(f"  [{'OK' if resp.status_code == 200 else 'ERR'}] {cat['name']} (order={i})")

# ── 5. 최종 확인 ──
print(f"\n=== 최종 메뉴 (ID={menu_id}) ===")
final = requests.get(
    f"{API}/menu-items", params={"menus": menu_id, "per_page": 50},
    headers=HEADERS, timeout=10
)
if final.status_code == 200:
    items = sorted(final.json(), key=lambda x: x.get("menu_order", 0))
    for item in items:
        title = item.get("title", {}).get("rendered", "?")
        url = item.get("url", "")
        print(f"  [{item['menu_order']}] {title:25s} → {url}")
    print(f"\n총 {len(items)}개 메뉴 아이템")
else:
    print(f"  확인 실패: {final.status_code}")

# ── 6. WP 캐시 클리어 시도 ──
print("\n=== 캐시 클리어 ===")
# wp-json으로 접근 가능한 캐시 퍼지 (플러그인 의존적)
for endpoint in ["/wp-json/wp-super-cache/v1/cache", "/wp-json/wp/v2/settings"]:
    try:
        r = requests.get(f"{WP_URL}{endpoint}", headers=HEADERS, timeout=5)
        if r.status_code == 200:
            print(f"  {endpoint}: 접근 가능")
    except Exception:
        pass

# settings 엔드포인트에 더미 업데이트 (캐시 무효화 트리거)
try:
    r = requests.get(f"{API}/settings", headers=HEADERS, timeout=5)
    if r.status_code == 200:
        settings = r.json()
        # 동일 값으로 업데이트하면 캐시 무효화될 수 있음
        requests.post(f"{API}/settings", headers=HEADERS,
                     json={"title": settings.get("title", "")}, timeout=5)
        print("  설정 터치 (캐시 무효화 시도)")
except Exception:
    pass

print("\n완료! 사이트를 새로고침하세요.")
print("캐시가 남아있다면 WP Admin > 설정에서 캐시를 수동 퍼지하세요.")
