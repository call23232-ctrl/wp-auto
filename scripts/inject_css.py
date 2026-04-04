#!/usr/bin/env python3
"""
WordPress 커스텀 CSS 주입
방법 1: Customizer API (wp_customize)
방법 2: 기존 custom_css 포스트 직접 수정 (wpdb)
방법 3: 수동 안내 + CSS 파일 생성
"""
import os, sys, base64, json

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

CUSTOM_CSS = """
/* AutoBlog Custom Theme — Mobile-First */

@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');

* { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }

body { background: #f8fafc !important; color: #1e293b; line-height: 1.7; }

/* 헤더 */
.site-header, header#masthead {
  background: #fff !important;
  border-bottom: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
}
.site-title, .site-title a {
  font-size: 22px !important; font-weight: 800 !important;
  color: #1a1a2e !important; text-decoration: none !important;
}
.site-description { font-size: 13px !important; color: #94a3b8 !important; }

/* 네비게이션 */
.main-navigation ul, .primary-navigation ul, .menu {
  display: flex !important; gap: 4px !important; list-style: none !important;
  padding: 0 !important; flex-wrap: wrap; justify-content: center;
}
.main-navigation li a, .primary-navigation li a, .wp-block-navigation-item a, .menu-item a {
  padding: 10px 18px !important; font-size: 14px !important; font-weight: 600 !important;
  color: #475569 !important; text-decoration: none !important;
  border-radius: 8px !important; transition: all 0.2s ease !important;
}
.main-navigation li a:hover, .primary-navigation li a:hover, .menu-item a:hover { background: #f1f5f9 !important; color: #6366f1 !important; }
.current-menu-item a { background: rgba(99,102,241,0.08) !important; color: #6366f1 !important; }

/* 콘텐츠 영역 */
.site-content, .content-area, main#main {
  max-width: 1200px !important; margin: 0 auto !important; padding: 32px 16px !important;
}
/* GeneratePress 컨테이너 너비 확장 */
.grid-container { max-width: 1200px !important; }
body:not(.sidebar) .grid-container { max-width: 1200px !important; }
.inside-article { max-width: 100% !important; }

/* 카드 레이아웃 */
.site-main > article, .hentry {
  background: #fff !important; border-radius: 16px !important;
  border: 1px solid #e2e8f0 !important; padding: 24px !important;
  margin-bottom: 20px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
  transition: all 0.2s ease !important;
}
.site-main > article:hover, .hentry:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
  transform: translateY(-2px);
}

/* 글 제목 */
.entry-title, .entry-title a {
  font-size: 20px !important; font-weight: 800 !important;
  color: #1a1a2e !important; text-decoration: none !important; line-height: 1.4 !important;
}
.entry-title a:hover { color: #6366f1 !important; }

/* 메타 */
.entry-meta, .entry-meta a, .posted-on, .byline { font-size: 13px !important; color: #94a3b8 !important; }
.entry-meta a { color: #6366f1 !important; text-decoration: none !important; font-weight: 600; }

/* 발췌 */
.entry-summary { font-size: 15px !important; color: #64748b !important; line-height: 1.7 !important; }

/* 카테고리 배지 */
.cat-links a {
  display: inline-block; padding: 3px 10px !important;
  background: rgba(99,102,241,0.08) !important; color: #6366f1 !important;
  border-radius: 6px !important; font-size: 11px !important; font-weight: 700 !important;
}

/* 더 읽기 */
.more-link {
  display: inline-block; padding: 8px 20px !important;
  background: #6366f1 !important; color: #fff !important;
  border-radius: 8px !important; font-size: 13px !important; font-weight: 700 !important;
  text-decoration: none !important; transition: all 0.2s ease !important;
}
.more-link:hover { background: #4f46e5 !important; }

/* 단일 글 본문 */
.single .grid-container { max-width: 1200px !important; }
.single .inside-article { max-width: 100% !important; padding: 32px 24px !important; }
.single .entry-content { max-width: 100% !important; margin: 0 auto !important; padding: 0 8px !important; }
.single .entry-title { font-size: 26px !important; }
.single .entry-meta { margin-bottom: 24px !important; }
.entry-content img { max-width: 100% !important; height: auto !important; border-radius: 8px !important; }
.entry-content table { width: 100% !important; border-collapse: collapse; font-size: 14px !important; }
.entry-content th, .entry-content td { padding: 10px 12px !important; border: 1px solid #e2e8f0 !important; }
.entry-content th { font-weight: 700 !important; }
.entry-content thead th { color: #fff !important; }
.entry-content table:not([style*="box-shadow"]) th { background: #f8fafc !important; color: #1a1a2e !important; }

/* 사이드바 위젯 */
.widget {
  background: #fff !important; border-radius: 12px !important;
  border: 1px solid #e2e8f0 !important; padding: 24px !important; margin-bottom: 16px !important;
}
.widget-title {
  font-size: 14px !important; font-weight: 800 !important; color: #1a1a2e !important;
  padding-bottom: 12px !important; border-bottom: 2px solid #f1f5f9 !important;
}

/* 푸터 */
.site-footer, footer#colophon {
  background: #1a1a2e !important; color: #94a3b8 !important;
  padding: 40px 20px !important; margin-top: 60px !important; text-align: center;
}
.site-footer a { color: #818cf8 !important; text-decoration: none !important; }

/* 페이지네이션 */
.nav-links { display: flex !important; justify-content: center !important; gap: 8px !important; margin: 40px 0 !important; }
.nav-links a, .nav-links span {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 40px; height: 40px; border-radius: 8px !important;
  font-size: 14px !important; font-weight: 600 !important; text-decoration: none !important;
}
.nav-links a { background: #fff !important; color: #475569 !important; border: 1px solid #e2e8f0 !important; }
.nav-links a:hover { background: #f1f5f9 !important; color: #6366f1 !important; }
.nav-links .current { background: #6366f1 !important; color: #fff !important; border: none !important; }

/* 검색 */
.search-field {
  padding: 10px 16px !important; border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important; font-size: 14px !important; width: 100% !important;
}
.search-field:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; }

/* ── 모바일: 태블릿 ── */
@media (max-width: 1024px) {
  .site-content, .content-area, main#main { padding: 20px 12px !important; }
}

/* ── 모바일: 768px ── */
@media (max-width: 768px) {
  body { margin: 0 !important; }
  .site-content, .content-area, main#main {
    padding: 10px 6px !important; max-width: 100% !important;
  }
  .site-main > article, .hentry {
    padding: 16px 12px !important; border-radius: 10px !important;
    margin: 0 0 10px 0 !important;
  }
  .entry-title, .entry-title a { font-size: 17px !important; }
  .single .entry-title { font-size: 21px !important; }
  .single .entry-content { padding: 0 4px !important; font-size: 15px !important; line-height: 1.8 !important; }
  .entry-content table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .main-navigation ul, .primary-navigation ul, .menu {
    flex-wrap: nowrap !important; overflow-x: auto !important;
    -webkit-overflow-scrolling: touch; gap: 2px !important; padding: 4px 6px !important;
  }
  .main-navigation li a, .primary-navigation li a, .menu-item a {
    padding: 8px 10px !important; font-size: 12px !important; white-space: nowrap !important;
  }
  .widget-area, #secondary { display: none !important; }
  .entry-summary { font-size: 14px !important; }
  .site-footer { padding: 20px 10px !important; margin-top: 24px !important; }
  .more-link { padding: 8px 14px !important; font-size: 12px !important; }

  /* GeneratePress 전용: 컨테이너 여백 제거 */
  .grid-container, .inside-article, .paging-navigation {
    padding-left: 6px !important; padding-right: 6px !important;
  }
  .site-header .inside-header { padding: 10px 8px !important; }
}

/* ── 모바일: 480px ── */
@media (max-width: 480px) {
  .site-content, .content-area, main#main { padding: 6px 2px !important; }
  .site-main > article, .hentry { padding: 12px 10px !important; border-radius: 8px !important; }
  .entry-title, .entry-title a { font-size: 15px !important; }
  .single .entry-title { font-size: 19px !important; }
  .single .entry-content { font-size: 14px !important; }
  .site-title, .site-title a { font-size: 18px !important; }
  .grid-container { padding-left: 2px !important; padding-right: 2px !important; }
}
""".strip()


def inject_css():
    """WordPress에 커스텀 CSS 주입"""
    api = f"{WP_URL}/wp-json/wp/v2"
    domain = WP_URL.replace("https://", "").replace("http://", "")
    print(f"=== CSS 주입 ({domain}) ===")

    # 테마 확인
    resp = requests.get(f"{api}/themes", headers=HEADERS, timeout=10)
    active_theme = ""
    if resp.status_code == 200:
        for t in resp.json():
            if t.get("status") == "active":
                active_theme = t.get("stylesheet", "")
                print(f"  활성 테마: {active_theme}")
                break

    # CSS 파일 저장 (항상)
    css_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "custom_theme.css")
    with open(css_file, "w", encoding="utf-8") as f:
        f.write(CUSTOM_CSS)

    # 방법: WordPress XML-RPC로 custom_css 업데이트
    print(f"\n  XML-RPC로 custom_css 업데이트 시도...")
    import xmlrpc.client
    try:
        wp = xmlrpc.client.ServerProxy(f"{WP_URL}/xmlrpc.php")

        # custom_css 포스트 검색
        posts = wp.wp.getPosts(0, WP_USER, WP_PASS, {
            "post_type": "custom_css",
            "number": 10,
        })

        css_post = None
        for p in posts:
            if p.get("post_name") == active_theme or p.get("post_type") == "custom_css":
                css_post = p
                break

        if css_post:
            # 업데이트
            result = wp.wp.editPost(0, WP_USER, WP_PASS, css_post["post_id"], {
                "post_content": CUSTOM_CSS,
                "post_status": "publish",
            })
            if result:
                print(f"  [OK] custom_css 업데이트 완료 (id={css_post['post_id']})")
                print(f"\n  CSS 크기: {len(CUSTOM_CSS)} bytes")
                return True
        else:
            # 새로 생성
            new_id = wp.wp.newPost(0, WP_USER, WP_PASS, {
                "post_type": "custom_css",
                "post_name": active_theme,
                "post_content": CUSTOM_CSS,
                "post_status": "publish",
                "post_title": active_theme,
            })
            if new_id:
                print(f"  [OK] custom_css 생성 완료 (id={new_id})")
                print(f"\n  CSS 크기: {len(CUSTOM_CSS)} bytes")
                return True

    except Exception as e:
        err = str(e)
        if "XML-RPC" in err or "403" in err:
            print(f"  XML-RPC 비활성화: {err[:100]}")
        else:
            print(f"  XML-RPC 실패: {err[:100]}")

    # 폴백: 안내
    print(f"\n  [수동 적용 필요]")
    print(f"  1. {WP_URL}/wp-admin/customize.php 접속")
    print(f"  2. '추가 CSS' 클릭")
    print(f"  3. custom_theme.css 내용 붙여넣기 ({len(CUSTOM_CSS)} bytes)")
    print(f"  CSS 파일: {css_file}")
    return False


if __name__ == "__main__":
    inject_css()
