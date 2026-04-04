#!/usr/bin/env python3
"""
기존 WordPress 글에 모바일 CSS 인라인 주입
- 기본: <style> 태그 없는 글에만 신규 주입
- --force: 기존 <style> 태그를 최신 CSS로 교체
"""
import os, sys, base64, re

WP_URL = os.environ.get("WP_URL", "").rstrip("/")
WP_USER = os.environ.get("WP_USERNAME", "")
WP_PASS = os.environ.get("WP_APP_PASSWORD", "")
DRY_RUN = os.environ.get("DRY_RUN", "false").lower() == "true"
FORCE_UPDATE = "--force" in sys.argv

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

# main.py의 INLINE_MOBILE_CSS와 동일
INLINE_CSS = """<style>
/* AutoBlog Mobile Responsive */
.entry-content { max-width: 100% !important; padding: 0 !important; box-sizing: border-box; }
.entry-content img { max-width: 100% !important; height: auto !important; border-radius: 8px; }
.entry-content table { width: 100% !important; display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; border-collapse: collapse; font-size: 14px; }
.entry-content th, .entry-content td { padding: 10px 12px; border: 1px solid #e2e8f0; }
.entry-content th { font-weight: 700; }
.entry-content thead th { color: #fff !important; }
.entry-content table:not([style*="box-shadow"]) th { background: #f8fafc; color: #1a1a2e; }
.entry-content blockquote { margin: 16px 0; padding: 16px 20px; border-left: 4px solid #6366f1; background: #f8fafc; border-radius: 0 8px 8px 0; }
.entry-content .tip-box { padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; margin: 16px 0; }
.entry-content .key-point { padding: 16px; background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; margin: 16px 0; }
.entry-content ul, .entry-content ol { padding-left: 20px; }
.entry-content li { margin-bottom: 6px; }
.entry-content h2 { font-size: 22px; font-weight: 800; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
.entry-content h3 { font-size: 18px; font-weight: 700; margin: 24px 0 12px; }
.entry-content p { margin-bottom: 16px; line-height: 1.8; }
@media (max-width: 768px) {
  .entry-content h2 { font-size: 19px; margin: 24px 0 12px; }
  .entry-content h3 { font-size: 16px; }
  .entry-content p { font-size: 15px; line-height: 1.8; }
  .entry-content { font-size: 15px; }
  .site-main, .content-area, .inside-article { padding: 0 6px !important; }
  .grid-container { padding: 0 4px !important; }
}
@media (max-width: 480px) {
  .entry-content h2 { font-size: 17px; }
  .entry-content p { font-size: 14px; }
  .entry-content { font-size: 14px; }
}
</style>"""

# 기존 <style>...</style> 블록 매칭 (본문 상단)
OLD_STYLE_PATTERN = re.compile(
    r'^\s*<style>\s*/\*\s*AutoBlog\s.*?\*/.*?</style>\s*',
    re.DOTALL | re.IGNORECASE
)


def fetch_all_posts():
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
    force_label = " + FORCE UPDATE" if FORCE_UPDATE else ""
    mode = "DRY RUN" if DRY_RUN else "LIVE"
    domain = WP_URL.replace("https://", "").replace("http://", "")
    print(f"=== 모바일 CSS 인라인 주입 [{mode}{force_label}] — {domain} ===\n")

    posts = fetch_all_posts()
    print(f"총 {len(posts)}개 글\n")

    injected = 0
    updated = 0
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
        has_style = "<style>" in raw_content[:500]

        if has_style and not FORCE_UPDATE:
            skipped += 1
            continue

        if has_style:
            # --force: 기존 AutoBlog <style> 블록을 최신으로 교체
            new_content = OLD_STYLE_PATTERN.sub('', raw_content)
            new_content = INLINE_CSS + "\n" + new_content.lstrip()
            action = "WOULD UPDATE" if DRY_RUN else "UPDATED"
            counter = "updated"
        else:
            # 신규 주입
            new_content = INLINE_CSS + "\n" + raw_content
            action = "WOULD INJECT" if DRY_RUN else "INJECTED"
            counter = "injected"

        if DRY_RUN:
            print(f"  [{post_id}] {action} — {title}")
        else:
            resp = requests.post(
                f"{API}/posts/{post_id}",
                headers=HEADERS,
                json={"content": new_content},
                timeout=15
            )
            if resp.status_code == 200:
                print(f"  [{post_id}] {action} — {title}")
            else:
                print(f"  [{post_id}] FAILED — {resp.status_code}")
                continue

        if counter == "updated":
            updated += 1
        else:
            injected += 1

    print(f"\n=== 결과: {injected} 신규주입, {updated} 업데이트, {skipped} 스킵 ===")


if __name__ == "__main__":
    main()
