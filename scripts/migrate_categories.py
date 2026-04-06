#!/usr/bin/env python3
"""
migrate_categories.py — WordPress 카테고리 통합 마이그레이션
==============================================================
30개+ 카테고리 → 3개로 통합

대상 카테고리:
  재테크 & 투자  (slug: finance-invest)
  AI 활용 & 도구 (slug: ai-tools)
  부업 & 수익화  (slug: side-hustle)

사용:
  python scripts/migrate_categories.py           # 실제 실행
  python scripts/migrate_categories.py --dry-run # 테스트
"""

import os, sys, base64, logging, argparse
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S")
log = logging.getLogger("migrate-cat")

try:
    import requests
except ImportError:
    sys.exit("pip install requests")

WP_URL  = os.environ.get("WP_URL", "").rstrip("/")
WP_USER = os.environ.get("WP_USERNAME", "")
WP_PASS = os.environ.get("WP_APP_PASSWORD", "")

# ─────────────────────────────────────────────
# 통합 매핑 — 원본 카테고리명 → 타겟 카테고리명
# ─────────────────────────────────────────────
MERGE_MAP = {
    # ── AI 활용 & 도구 ──────────────────────
    "AI 개발":              "AI 활용 & 도구",
    "AI 교육":              "AI 활용 & 도구",
    "AI 글쓰기":            "AI 활용 & 도구",
    "AI 기술 동향 분석":    "AI 활용 & 도구",
    "AI 도구 & 생산성":     "AI 활용 & 도구",
    "AI 도구 활용":         "AI 활용 & 도구",
    "AI 도구 활용법":       "AI 활용 & 도구",
    "AI 마케팅":            "AI 활용 & 도구",
    "AI 마케팅 도구":       "AI 활용 & 도구",
    "AI 영상 편집":         "AI 활용 & 도구",
    "AI 이미지 생성":       "AI 활용 & 도구",
    "AI 코딩":              "AI 활용 & 도구",
    "AI 투자 분석":         "AI 활용 & 도구",
    "AI 툴 비교":           "AI 활용 & 도구",
    "AI 툴 활용":           "AI 활용 & 도구",
    "AI 튜토리얼":          "AI 활용 & 도구",
    "AI 협업":              "AI 활용 & 도구",
    "AI 활용":              "AI 활용 & 도구",
    "AI 활용 가계 관리":    "AI 활용 & 도구",
    "AI 활용 가이드":       "AI 활용 & 도구",
    "AI 활용 사례":         "AI 활용 & 도구",
    "AI 활용 팁":           "AI 활용 & 도구",
    "AI 활용/마케팅":       "AI 활용 & 도구",
    "AI 활용/콘텐츠 제작":  "AI 활용 & 도구",
    "AI 활용법":            "AI 활용 & 도구",
    "AI 활용팁":            "AI 활용 & 도구",
    "기업용 AI":            "AI 활용 & 도구",
    "IT팁":                 "AI 활용 & 도구",
    "교육 & 생산성":        "AI 활용 & 도구",
    "업무 생산성":          "AI 활용 & 도구",
    "IT & 테크 리뷰":       "AI 활용 & 도구",
    "글쓰기/출판":          "AI 활용 & 도구",

    # ── 재테크 & 투자 ───────────────────────
    "재테크":               "재테크 & 투자",
    "투자":                 "재테크 & 투자",
    "ETF 시장분석":         "재테크 & 투자",
    "생활 경제":            "재테크 & 투자",
    "대출":                 "재테크 & 투자",
    "정부지원 & 절세":      "재테크 & 투자",
    "제품 리뷰":            "재테크 & 투자",
    "취업":                 "재테크 & 투자",
    "핫 뉴스":              "재테크 & 투자",
    "행사 & 컨퍼런스":      "재테크 & 투자",
    "육아":                 "재테크 & 투자",

    # ── 부업 & 수익화 ───────────────────────
    "부업/창업":            "부업 & 수익화",
    "마케팅":               "부업 & 수익화",
    "네트워킹":             "부업 & 수익화",
}

# 타겟 카테고리 slug 맵
TARGET_SLUG = {
    "재테크 & 투자":  "finance-invest",
    "AI 활용 & 도구": "ai-tools",
    "부업 & 수익화":  "side-hustle",
}

# 유지할 카테고리 (통합 대상 아님)
KEEP = {"재테크 & 투자", "AI 활용 & 도구", "부업 & 수익화", "Uncategorized"}


def headers():
    cred = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode()).decode()
    return {"Authorization": f"Basic {cred}", "Content-Type": "application/json"}


def get_all_categories() -> dict:
    """id → {name, slug, count} 딕셔너리 (HTML 엔티티 디코딩 포함)"""
    import html as _html
    cats = {}
    page = 1
    while True:
        r = requests.get(f"{WP_URL}/wp-json/wp/v2/categories",
                         headers=headers(),
                         params={"per_page": 100, "page": page},
                         timeout=15)
        if not r.ok:
            break
        batch = r.json()
        if not batch:
            break
        for c in batch:
            # WordPress는 &amp; 등 HTML 엔티티로 반환 → 디코딩 필수
            cats[c["id"]] = {
                "name": _html.unescape(c["name"]),
                "slug": c["slug"],
                "count": c["count"],
            }
        if page >= int(r.headers.get("X-WP-TotalPages", 1)):
            break
        page += 1
    return cats


def get_or_create_category(name: str, all_cats: dict = None) -> int | None:
    """카테고리 조회 우선순위: slug → 전체목록 name 매칭 → API 검색 → 신규 생성"""
    import html as _html
    slug = TARGET_SLUG.get(name)
    name_lower = _html.unescape(name).lower()

    # 0순위: 전달받은 전체 카테고리 목록에서 name 정확 매칭
    if all_cats:
        for cat_id, info in all_cats.items():
            if _html.unescape(info["name"]).lower() == name_lower:
                # 영문 slug 교정
                if slug and info.get("slug", "").startswith("%"):
                    requests.post(f"{WP_URL}/wp-json/wp/v2/categories/{cat_id}",
                                  headers=headers(), json={"slug": slug}, timeout=10)
                    log.info(f"카테고리 slug 교정: {name} → {slug}")
                log.info(f"카테고리 확인 (전체목록): {name} → id={cat_id}")
                return cat_id

    # 1순위: slug 기반 조회
    if slug:
        r = requests.get(f"{WP_URL}/wp-json/wp/v2/categories",
                         headers=headers(), params={"slug": slug}, timeout=10)
        if r.ok and r.json():
            log.info(f"카테고리 확인 (slug): {name} → id={r.json()[0]['id']}")
            return r.json()[0]["id"]

    # 2순위: name 검색 API
    r = requests.get(f"{WP_URL}/wp-json/wp/v2/categories",
                     headers=headers(), params={"search": name, "per_page": 20}, timeout=10)
    if r.ok:
        for c in r.json():
            if _html.unescape(c["name"]).lower() == name_lower:
                if slug and c.get("slug", "").startswith("%"):
                    requests.post(f"{WP_URL}/wp-json/wp/v2/categories/{c['id']}",
                                  headers=headers(), json={"slug": slug}, timeout=10)
                log.info(f"카테고리 확인 (name검색): {name} → id={c['id']}")
                return c["id"]

    # 3순위: 신규 생성
    payload = {"name": name}
    if slug:
        payload["slug"] = slug
    r = requests.post(f"{WP_URL}/wp-json/wp/v2/categories",
                      headers=headers(), json=payload, timeout=10)
    if r.ok:
        cat_id = r.json().get("id")
        log.info(f"카테고리 생성: {name} (slug={slug}) → id={cat_id}")
        return cat_id
    log.error(f"카테고리 생성 실패: {r.status_code} {r.text[:200]}")
    return None


def get_posts_by_category(cat_id: int) -> list:
    posts = []
    page = 1
    while True:
        r = requests.get(f"{WP_URL}/wp-json/wp/v2/posts",
                         headers=headers(),
                         params={"categories": cat_id, "per_page": 100,
                                 "page": page, "status": "any",
                                 "_fields": "id,title,categories"},
                         timeout=15)
        if not r.ok:
            break
        batch = r.json()
        if not batch:
            break
        posts.extend(batch)
        if page >= int(r.headers.get("X-WP-TotalPages", 1)):
            break
        page += 1
    return posts


def update_post_categories(post_id: int, new_cats: list) -> bool:
    r = requests.post(f"{WP_URL}/wp-json/wp/v2/posts/{post_id}",
                      headers=headers(), json={"categories": new_cats}, timeout=15)
    return r.ok


def delete_category(cat_id: int) -> bool:
    r = requests.delete(f"{WP_URL}/wp-json/wp/v2/categories/{cat_id}",
                        headers=headers(), params={"force": True}, timeout=10)
    return r.ok


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not WP_URL or not WP_USER or not WP_PASS:
        sys.exit("환경변수 필요: WP_URL, WP_USERNAME, WP_APP_PASSWORD")

    log.info("=" * 60)
    log.info(f"카테고리 마이그레이션 시작 ({WP_URL})")
    log.info(f"Dry Run: {args.dry_run}")
    log.info("=" * 60)

    # Step 1: 전체 카테고리 목록 먼저 수집 (name 기반 매칭에 사용)
    log.info("\n[Step 1] 전체 카테고리 목록 수집...")
    all_cats = get_all_categories()
    log.info(f"  총 {len(all_cats)}개 카테고리")

    # Step 1-B: 타겟 카테고리 ID 확보 (전체 목록 전달로 중복 생성 방지)
    log.info("\n[Step 1-B] 타겟 카테고리 ID 확보...")
    target_ids = {}
    for name in TARGET_SLUG:
        cat_id = get_or_create_category(name, all_cats=all_cats)
        if not cat_id:
            sys.exit(f"타겟 카테고리 생성 실패: {name}")
        target_ids[name] = cat_id
        log.info(f"  {name} → id={cat_id}")

    # name → id 역매핑
    name_to_id = {v["name"]: k for k, v in all_cats.items()}

    # Step 3: 포스트 재배정
    log.info("\n[Step 3] 포스트 카테고리 재배정...")
    total_moved = 0
    move_stats = {}

    for src_name, tgt_name in MERGE_MAP.items():
        src_id = name_to_id.get(src_name)
        if not src_id:
            continue  # WordPress에 없는 카테고리
        cat_info = all_cats.get(src_id, {})
        if cat_info.get("count", 0) == 0:
            log.info(f"  SKIP (글 없음): {src_name}")
            continue

        tgt_id = target_ids[tgt_name]
        posts = get_posts_by_category(src_id)
        log.info(f"  {src_name} ({len(posts)}개) → {tgt_name}")

        for p in posts:
            old_cats = p.get("categories", [])
            # src 제거 + tgt 추가 (기존 카테고리 중 KEEP 목록에 있는 것은 유지)
            keep_cats = [c for c in old_cats
                         if all_cats.get(c, {}).get("name", "") in KEEP and c != src_id]
            new_cats = list(set(keep_cats + [tgt_id]))

            if src_id not in old_cats:
                continue
            if args.dry_run:
                log.info(f"    [DRY] id={p['id']} cats: {old_cats} → {new_cats}")
            else:
                ok = update_post_categories(p["id"], new_cats)
                status = "✅" if ok else "❌"
                log.info(f"    {status} id={p['id']}")
                if ok:
                    total_moved += 1

        move_stats[src_name] = len(posts)

    # Step 4: 빈 카테고리 삭제
    log.info("\n[Step 4] 빈 카테고리 삭제...")
    # 업데이트 후 카테고리 목록 재조회
    if not args.dry_run:
        all_cats = get_all_categories()

    # 타겟 카테고리 보호 — id 또는 name 둘 다 체크
    keep_ids   = set(target_ids.values())
    keep_names = {k.lower() for k in TARGET_SLUG.keys()}

    deleted = 0
    for cat_id, info in all_cats.items():
        name = info["name"]
        # id 또는 name이 타겟이면 보호
        if cat_id in keep_ids or name.lower() in keep_names:
            continue
        if name.lower() == "uncategorized":
            continue
        count = info.get("count", 0)
        if args.dry_run:
            log.info(f"  [DRY] 삭제 예정: {name} (현재 {count}개 글)")
        else:
            if count == 0:
                ok = delete_category(cat_id)
                status = "✅ 삭제" if ok else "❌ 실패"
                log.info(f"  {status}: {name}")
                if ok:
                    deleted += 1
            else:
                log.warning(f"  SKIP (글 {count}개 남음): {name}")

    # 결과
    log.info("\n" + "=" * 60)
    if args.dry_run:
        log.info("[DRY RUN] 실제 변경 없음")
        log.info(f"재배정 예정: {sum(move_stats.values())}개 포스트")
        log.info(f"삭제 예정:   {len([n for n in move_stats if n not in KEEP])}개 카테고리")
    else:
        log.info(f"포스트 재배정: {total_moved}개")
        log.info(f"카테고리 삭제: {deleted}개")
        log.info("남은 카테고리: 재테크 & 투자 / AI 활용 & 도구 / 부업 & 수익화")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
