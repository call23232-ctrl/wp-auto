#!/usr/bin/env python3
"""
기존 WordPress 글에서 인라인 <style> 블록 일괄 제거
— AdSense 승인 대비: 본문 내 CSS 오염 제거

사용법:
  # Dry run (변경 없이 대상만 확인)
  WP_URL=https://planx-ai.com WP_USERNAME=admin WP_APP_PASSWORD="xxxx" python scripts/remove_inline_css.py

  # 실제 제거
  WP_URL=https://planx-ai.com WP_USERNAME=admin WP_APP_PASSWORD="xxxx" python scripts/remove_inline_css.py --live

  # sinjum-ai.com에도 적용 가능
  WP_URL=https://sinjum-ai.com WP_USERNAME=admin WP_APP_PASSWORD="xxxx" python scripts/remove_inline_css.py --live
"""
import os, sys, base64, re

WP_URL = os.environ.get("WP_URL", "").rstrip("/")
WP_USER = os.environ.get("WP_USERNAME", "")
WP_PASS = os.environ.get("WP_APP_PASSWORD", "")
LIVE_MODE = "--live" in sys.argv

if not all([WP_URL, WP_USER, WP_PASS]):
    print("ERROR: WP_URL, WP_USERNAME, WP_APP_PASSWORD 환경변수 필요")
    sys.exit(1)

import requests

cred = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode()).decode()
HEADERS = {
    "Authorization": f"Basic {cred}",
    "Content-Type": "application/json",
    "User-Agent": "AutoBlog-CSSCleanup/1.0",
}
API = f"{WP_URL}/wp-json/wp/v2"

# AutoBlog이 주입하는 <style>...</style> 블록 패턴
STYLE_PATTERN = re.compile(
    r'\s*<style>\s*/\*\s*AutoBlog\s.*?\*/.*?</style>\s*',
    re.DOTALL | re.IGNORECASE
)

# 추가: 일반적인 <style> 블록도 캐치 (본문 상단 200자 내)
GENERIC_STYLE_PATTERN = re.compile(
    r'^\s*<style[^>]*>.*?</style>\s*',
    re.DOTALL | re.IGNORECASE
)


def fetch_all_posts():
    """모든 published 글 조회"""
    posts = []
    page = 1
    while True:
        resp = requests.get(
            f"{API}/posts",
            params={"per_page": 100, "page": page, "status": "publish"},
            headers=HEADERS, timeout=15
        )
        if resp.status_code != 200:
            break
        batch = resp.json()
        if not batch:
            break
        posts.extend(batch)
        total_pages = int(resp.headers.get("X-WP-TotalPages", 1))
        if page >= total_pages:
            break
        page += 1
    return posts


def main():
    mode = "LIVE — 실제 제거" if LIVE_MODE else "DRY RUN — 미리보기"
    domain = WP_URL.replace("https://", "").replace("http://", "")
    print(f"{'=' * 60}")
    print(f"인라인 CSS 제거 [{mode}]")
    print(f"대상: {domain}")
    print(f"{'=' * 60}\n")

    posts = fetch_all_posts()
    print(f"총 {len(posts)}개 글 스캔\n")

    cleaned = 0
    skipped = 0

    for post in posts:
        title = post.get("title", {}).get("rendered", "")[:50]
        post_id = post["id"]

        # Raw content 가져오기
        raw_resp = requests.get(
            f"{API}/posts/{post_id}?context=edit",
            headers=HEADERS, timeout=10
        )
        if raw_resp.status_code != 200:
            print(f"  [{post_id}] SKIP — raw content 접근 실패")
            continue

        raw_content = raw_resp.json().get("content", {}).get("raw", "")

        # <style> 태그 존재 여부 확인
        if "<style" not in raw_content[:500]:
            skipped += 1
            continue

        # AutoBlog <style> 블록 제거
        new_content = STYLE_PATTERN.sub('', raw_content)

        # 그래도 상단에 <style>이 남아있으면 일반 패턴으로도 제거
        if new_content.lstrip().startswith('<style'):
            new_content = GENERIC_STYLE_PATTERN.sub('', new_content, count=1)

        new_content = new_content.lstrip('\n')

        if new_content == raw_content:
            skipped += 1
            continue

        # 제거된 CSS 크기
        removed_bytes = len(raw_content) - len(new_content)

        if LIVE_MODE:
            resp = requests.post(
                f"{API}/posts/{post_id}",
                headers=HEADERS,
                json={"content": new_content},
                timeout=15
            )
            if resp.status_code == 200:
                print(f"  ✅ [{post_id}] CLEANED — {title} (-{removed_bytes}B)")
                cleaned += 1
            else:
                print(f"  ❌ [{post_id}] FAILED — {resp.status_code}")
        else:
            print(f"  🔍 [{post_id}] WOULD CLEAN — {title} (-{removed_bytes}B)")
            cleaned += 1

    print(f"\n{'=' * 60}")
    print(f"결과: {cleaned}개 {'제거 완료' if LIVE_MODE else '제거 대상'}, {skipped}개 스킵")
    if not LIVE_MODE and cleaned > 0:
        print(f"\n실제 제거하려면: --live 플래그 추가")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
