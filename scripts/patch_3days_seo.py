"""
patch_3days_seo.py — 3days 리포트 포스트 SEO 일괄 패치
  - 카테고리: "재테크 & 투자" (id=53) 강제 설정
  - Rank Math: focus_keyword / title / description 설정
  - 태그: ETF, 3days 전략리포트 등 추가

Usage:
  python scripts/patch_3days_seo.py           # 실제 패치
  python scripts/patch_3days_seo.py --dry-run # 미리보기만

Environment:
  WP_URL          = https://your-site.com
  WP_USERNAME     = mymiryu@gmail.com
  WP_APP_PASSWORD = (WordPress 앱 비밀번호)
"""

import os
import sys
import base64
import logging
import re
import requests
import html
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S")
log = logging.getLogger(__name__)

DRY_RUN = "--dry-run" in sys.argv

WP_URL      = os.environ.get("WP_URL", "").rstrip("/")
WP_USER     = os.environ.get("WP_USERNAME", "")
WP_PASS     = os.environ.get("WP_APP_PASSWORD", "")

if not all([WP_URL, WP_USER, WP_PASS]):
    raise SystemExit("❌ WP_URL / WP_USERNAME / WP_APP_PASSWORD 환경변수 필요")

cred = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode()).decode()
HEADERS = {
    "Authorization": f"Basic {cred}",
    "Content-Type":  "application/json",
}

# 재테크 & 투자 카테고리 ID (migrate_categories.py 실행 후 확정된 ID)
FINANCE_CAT_ID = 53

# 필수 태그
BASE_TAGS = ["ETF", "ETF 시장분석", "재테크", "섹터분석", "퀀트전략", "3days 전략리포트"]


# ── 태그 ID 확보 ─────────────────────────────────────────────
def get_or_create_tag(name: str) -> int | None:
    resp = requests.get(f"{WP_URL}/wp-json/wp/v2/tags",
                        headers=HEADERS, params={"search": name[:30]}, timeout=10)
    if resp.ok:
        for t in resp.json():
            if html.unescape(t["name"]).strip().lower() == name.strip().lower():
                return t["id"]
    if DRY_RUN:
        return None
    resp2 = requests.post(f"{WP_URL}/wp-json/wp/v2/tags",
                          headers=HEADERS, json={"name": name}, timeout=10)
    if resp2.ok:
        return resp2.json().get("id")
    return None


# ── 날짜 추출 from title ──────────────────────────────────────
def extract_date_from_title(title: str) -> str:
    m = re.search(r"(\d{4}-\d{2}-\d{2})", title)
    if m:
        return m.group(1)
    return datetime.now().strftime("%Y-%m-%d")


# ── 3days 포스트 목록 조회 ────────────────────────────────────
def fetch_3days_posts() -> list:
    posts = []
    page = 1
    while True:
        resp = requests.get(
            f"{WP_URL}/wp-json/wp/v2/posts",
            headers=HEADERS,
            params={"search": "3DAYS", "per_page": 100, "page": page, "status": "publish"},
            timeout=15,
        )
        if not resp.ok or not resp.json():
            break
        batch = resp.json()
        posts.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    log.info(f"총 {len(posts)}개 3DAYS 포스트 발견")
    return posts


# ── 카테고리 확인 ────────────────────────────────────────────
def needs_category_fix(post: dict) -> bool:
    cats = post.get("categories", [])
    return FINANCE_CAT_ID not in cats


# ── 메인 패치 ────────────────────────────────────────────────
def patch_post(post: dict, tag_ids: list):
    pid  = post["id"]
    raw_title = html.unescape(post.get("title", {}).get("rendered", ""))
    date = extract_date_from_title(raw_title)

    focus_kw = "3days 전략리포트"
    seo_title = f"{focus_kw} {date} | PlanX AI"
    seo_desc  = (
        f"{date} {focus_kw} — 주도섹터 수급 분석, ETF 매수신호, "
        "퀀트 모멘텀 스코어링 종합. 한국 주식시장 장 개장 전 필수 확인."
    )

    # 현재 카테고리에 FINANCE_CAT_ID 추가 (기존 카테고리 유지하면서)
    current_cats = post.get("categories", [])
    # Uncategorized(id=1)는 제거, finance-invest(53) 추가
    new_cats = [c for c in current_cats if c != 1] + (
        [FINANCE_CAT_ID] if FINANCE_CAT_ID not in current_cats else []
    )
    if not new_cats:
        new_cats = [FINANCE_CAT_ID]

    patch_data = {
        "categories": new_cats,
        "tags": tag_ids,
        "meta": {
            "rank_math_focus_keyword": focus_kw,
            "rank_math_title":         seo_title,
            "rank_math_description":   seo_desc,
        },
    }

    if DRY_RUN:
        log.info(f"[DRY] id={pid} | cats={new_cats} | keyword='{focus_kw}' | title='{seo_title}'")
        return True

    resp = requests.post(
        f"{WP_URL}/wp-json/wp/v2/posts/{pid}",
        headers=HEADERS,
        json=patch_data,
        timeout=15,
    )
    if resp.ok:
        log.info(f"  ✅ id={pid} | {date} | cats={new_cats}")
        return True
    else:
        log.error(f"  ❌ id={pid} | {resp.status_code} | {resp.text[:200]}")
        return False


# ── 실행 ─────────────────────────────────────────────────────
def main():
    log.info("=" * 60)
    log.info(f"3days SEO 패치 시작 ({WP_URL}) | Dry Run: {DRY_RUN}")
    log.info("=" * 60)

    # 태그 ID 사전 준비
    log.info("[Step 1] 태그 ID 확보...")
    tag_ids = []
    for name in BASE_TAGS:
        tid = get_or_create_tag(name)
        if tid:
            tag_ids.append(tid)
            log.info(f"  태그: {name} → id={tid}")

    # 포스트 목록
    log.info("\n[Step 2] 3DAYS 포스트 조회...")
    posts = fetch_3days_posts()

    # 패치 실행
    log.info(f"\n[Step 3] 패치 실행 ({len(posts)}개)...")
    ok = err = 0
    for p in posts:
        title = html.unescape(p.get("title", {}).get("rendered", ""))
        if "[3DAYS]" not in title and "3DAYS" not in title and "3days" not in title.lower():
            log.info(f"  SKIP (3days 아님): {title[:50]}")
            continue
        if patch_post(p, tag_ids):
            ok += 1
        else:
            err += 1

    log.info("\n" + "=" * 60)
    log.info(f"완료: 성공 {ok}개 / 실패 {err}개")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
