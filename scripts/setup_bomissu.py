"""
bomissu.com 초기 설정 스크립트
- 기존 AI 글 4편 → 비공개 처리 (니치 전환)
- 생활경제 카테고리 5개 생성
- 기존 카테고리 정리
- About/Contact/Privacy 페이지 확인

사용법:
  $env:WP_URL = "https://bomissu.com"
  $env:WP_USERNAME = "admin"
  $env:WP_APP_PASSWORD = "xxxx"
  python scripts/setup_bomissu.py
"""
import os
import sys
import base64
import requests

WP_URL = os.environ.get("WP_URL", "").rstrip("/")
WP_USER = os.environ.get("WP_USERNAME", "")
WP_PASS = os.environ.get("WP_APP_PASSWORD", "")

if not WP_URL or not WP_USER or not WP_PASS:
    print("ERROR: WP_URL, WP_USERNAME, WP_APP_PASSWORD 환경변수 필요")
    sys.exit(1)

API = f"{WP_URL}/wp-json/wp/v2"
cred = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode()).decode()
HEADERS = {
    "Authorization": f"Basic {cred}",
    "Content-Type": "application/json",
}

# ─── bomissu.com 생활경제 카테고리 (5개) ───
TARGET_CATEGORIES = [
    "정부지원·복지",       # 정부지원금, 보조금, 복지혜택
    "절세·세금",           # 연말정산, 종합소득세, 절세법
    "부업·수익화",         # 직장인 부업, 프리랜서 수익, 투잡
    "보험·금융",           # 실비보험, 신용점수, 대출, 카드
    "생활비·살림",         # 전월세, 생활비 절약, 가계부, 꿀팁
]

# ─── 필수 페이지 ───
REQUIRED_PAGES = {
    "소개 (About)": {
        "slug": "about",
        "content": """
<h2>bomissu.com 소개</h2>
<p>bomissu.com은 직장인, 주부, 소상공인, 프리랜서를 위한 <strong>생활경제 실용 가이드</strong>입니다.</p>
<p>정부지원금, 절세 전략, 보험 가이드, 부업 정보, 생활비 절약법 등 일상에서 바로 적용할 수 있는 경제 정보를 제공합니다.</p>
<h3>주요 콘텐츠</h3>
<ul>
<li><strong>정부지원·복지</strong> — 놓치기 쉬운 지원금·보조금 총정리</li>
<li><strong>절세·세금</strong> — 연말정산, 종합소득세 실전 가이드</li>
<li><strong>부업·수익화</strong> — 직장인/프리랜서 현실 부업 정보</li>
<li><strong>보험·금융</strong> — 실비보험, 신용관리, 대출 비교</li>
<li><strong>생활비·살림</strong> — 전월세, 가계부, 생활비 절약 꿀팁</li>
</ul>
<p>bomissu.com은 광고 없는 순수 정보 콘텐츠를 지향하며, 검증된 데이터와 실제 사례를 기반으로 작성합니다.</p>
""",
    },
    "연락처 (Contact)": {
        "slug": "contact",
        "content": """
<h2>연락처</h2>
<p>bomissu.com에 관한 문의, 제안, 정정 요청은 아래 이메일로 보내주세요.</p>
<p><strong>이메일:</strong> mymiryu@gmail.com</p>
<p>답변은 영업일 기준 1~2일 내에 드리겠습니다.</p>
""",
    },
    "개인정보처리방침 (Privacy Policy)": {
        "slug": "privacy-policy",
        "content": """
<h2>개인정보처리방침</h2>
<p><strong>최종 수정일:</strong> 2026년 4월 5일</p>
<h3>1. 수집하는 개인정보</h3>
<p>bomissu.com은 기본적으로 개인정보를 수집하지 않습니다. 다만, 웹사이트 이용 시 자동으로 생성되는 정보(IP 주소, 브라우저 정보, 방문 일시 등)가 서버 로그에 기록될 수 있습니다.</p>
<h3>2. 쿠키 사용</h3>
<p>본 사이트는 Google Analytics, Google AdSense 등 제3자 서비스를 통해 쿠키를 사용할 수 있습니다. 쿠키는 브라우저 설정에서 관리할 수 있습니다.</p>
<h3>3. 광고</h3>
<p>Google AdSense를 통해 맞춤형 광고가 표시될 수 있습니다. Google의 광고 설정에서 맞춤 광고를 관리할 수 있습니다.</p>
<h3>4. 문의</h3>
<p>개인정보 관련 문의: mymiryu@gmail.com</p>
""",
    },
}


def get_all_posts():
    """모든 발행 글 조회"""
    posts = []
    page = 1
    while True:
        resp = requests.get(
            f"{API}/posts?per_page=100&page={page}&status=publish&_fields=id,title,status",
            headers=HEADERS, timeout=30
        )
        if resp.status_code != 200:
            break
        data = resp.json()
        if not data:
            break
        posts.extend(data)
        if len(data) < 100:
            break
        page += 1
    return posts


def get_all_categories():
    """모든 카테고리 조회"""
    cats = {}
    page = 1
    while True:
        resp = requests.get(f"{API}/categories?per_page=100&page={page}", headers=HEADERS, timeout=15)
        data = resp.json()
        if not data:
            break
        for c in data:
            cats[c["name"]] = c["id"]
        if len(data) < 100:
            break
        page += 1
    return cats


def get_all_pages():
    """모든 페이지 조회"""
    pages = []
    page = 1
    while True:
        resp = requests.get(
            f"{API}/pages?per_page=100&page={page}&_fields=id,title,slug,status",
            headers=HEADERS, timeout=15
        )
        if resp.status_code != 200:
            break
        data = resp.json()
        if not data:
            break
        pages.extend(data)
        if len(data) < 100:
            break
        page += 1
    return pages


def main():
    print("=" * 60)
    print(f"bomissu.com 초기 설정 — {WP_URL}")
    print("=" * 60)

    # ── Step 1: 기존 AI 글 비공개 처리 ──
    print("\n[Step 1] 기존 AI 글 → 비공개 처리")
    posts = get_all_posts()
    draft_count = 0
    for p in posts:
        title = p["title"]["rendered"]
        resp = requests.post(
            f"{API}/posts/{p['id']}",
            headers=HEADERS,
            json={"status": "draft"},
            timeout=15,
        )
        if resp.status_code == 200:
            draft_count += 1
            print(f"  비공개: [{p['id']}] {title}")
        else:
            print(f"  실패: [{p['id']}] {title} — {resp.status_code}")
    print(f"  → {draft_count}편 비공개 완료")

    # ── Step 2: 카테고리 정리 ──
    print("\n[Step 2] 생활경제 카테고리 생성")
    cats = get_all_categories()
    for cat_name in TARGET_CATEGORIES:
        if cat_name in cats:
            print(f"  이미 존재: {cat_name} (ID: {cats[cat_name]})")
        else:
            resp = requests.post(
                f"{API}/categories",
                headers=HEADERS,
                json={"name": cat_name},
                timeout=15,
            )
            if resp.status_code in (200, 201):
                cat_id = resp.json()["id"]
                cats[cat_name] = cat_id
                print(f"  생성 완료: {cat_name} (ID: {cat_id})")
            else:
                print(f"  생성 실패: {cat_name} — {resp.status_code}")

    # 불필요한 기존 카테고리 삭제 (글이 0편인 것만)
    print("\n[Step 2b] 불필요 카테고리 정리")
    for cat_name, cat_id in list(cats.items()):
        if cat_name in TARGET_CATEGORIES or cat_name == "Uncategorized" or cat_name == "미분류":
            continue
        # 해당 카테고리 글 수 확인
        resp = requests.get(f"{API}/categories/{cat_id}", headers=HEADERS, timeout=15)
        if resp.status_code == 200:
            count = resp.json().get("count", 0)
            if count == 0:
                del_resp = requests.delete(
                    f"{API}/categories/{cat_id}?force=true",
                    headers=HEADERS, timeout=15
                )
                if del_resp.status_code == 200:
                    print(f"  삭제: {cat_name} (글 0편)")
                else:
                    print(f"  삭제 실패: {cat_name} — {del_resp.status_code}")
            else:
                print(f"  유지: {cat_name} (글 {count}편)")

    # ── Step 3: 필수 페이지 확인/생성 ──
    print("\n[Step 3] 필수 페이지 확인")
    existing_pages = get_all_pages()
    existing_slugs = {p["slug"] for p in existing_pages}

    for page_name, page_info in REQUIRED_PAGES.items():
        if page_info["slug"] in existing_slugs:
            print(f"  이미 존재: {page_name}")
        else:
            resp = requests.post(
                f"{API}/pages",
                headers=HEADERS,
                json={
                    "title": page_name.split(" (")[0],  # "소개", "연락처", etc.
                    "slug": page_info["slug"],
                    "content": page_info["content"],
                    "status": "publish",
                },
                timeout=15,
            )
            if resp.status_code in (200, 201):
                print(f"  생성 완료: {page_name}")
            else:
                print(f"  생성 실패: {page_name} — {resp.status_code}")

    # ── Summary ──
    print("\n" + "=" * 60)
    print("bomissu.com 초기 설정 완료!")
    print(f"  비공개 처리: {draft_count}편")
    print(f"  카테고리: {', '.join(TARGET_CATEGORIES)}")
    print(f"  필수 페이지: About, Contact, Privacy Policy")
    print("=" * 60)
    print("\n다음 단계:")
    print("  1. Supabase sites 테이블에 site-3 (bomissu.com) 등록")
    print("  2. GitHub Secrets에 BOMISSU_WP_URL, BOMISSU_WP_USERNAME, BOMISSU_WP_APP_PASSWORD 추가")
    print("  3. publish.yml workflow_dispatch로 첫 발행 테스트")


if __name__ == "__main__":
    main()
