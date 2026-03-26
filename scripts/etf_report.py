#!/usr/bin/env python3
"""
ETF 블로그 리포트 발행 모듈
=============================
ETF Dashboard API → 리포트 JSON fetch → AI 전문가 톤 블로그 글 생성 → WordPress 발행

사용:
  python scripts/etf_report.py                    # 일간 리포트 발행
  python scripts/etf_report.py --dry-run           # 테스트 (발행 안 함)
  python scripts/etf_report.py --report-type daily  # daily/rotation/performance/full
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path

# 경로 설정
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("etf-report")

KST = timezone(timedelta(hours=9))

# 환경변수
ETF_API_URL = os.environ.get("ETF_API_URL", "https://etfs-production.up.railway.app")
WP_URL = os.environ.get("WP_URL", "")
WP_USER = os.environ.get("WP_USERNAME", "")
WP_PASS = os.environ.get("WP_APP_PASSWORD", "")
DEEPSEEK_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
CLAUDE_KEY = os.environ.get("CLAUDE_API_KEY", "")
GROK_KEY = os.environ.get("GROK_API_KEY", "")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
SITE_ID = os.environ.get("SITE_ID", "site-1")


# ═══════════════════════════════════════════════════════
# 1. ETF Dashboard API 연동
# ═══════════════════════════════════════════════════════

def fetch_etf_report(report_type: str = "blog-ready") -> dict:
    """ETF Dashboard에서 리포트 JSON 가져오기"""
    import requests

    endpoint_map = {
        "daily": "/api/v1/reports/daily",
        "rotation": "/api/v1/reports/rotation",
        "performance": "/api/v1/reports/performance",
        "blog-ready": "/api/v1/reports/blog-ready",
    }

    endpoint = endpoint_map.get(report_type, endpoint_map["blog-ready"])
    url = f"{ETF_API_URL}{endpoint}"

    log.info(f"ETF 리포트 가져오는 중: {url}")

    try:
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        log.info(f"리포트 수신 완료 ({len(json.dumps(data))} bytes)")
        return data
    except Exception as e:
        log.error(f"ETF 리포트 fetch 실패: {e}")
        return {}


# ═══════════════════════════════════════════════════════
# 2. ETF 리포트 전용 프롬프트
# ═══════════════════════════════════════════════════════

def build_etf_blog_prompt(report: dict) -> str:
    """ETF 리포트 JSON → AI 글 생성 프롬프트"""
    daily = report.get("daily", {})
    rotation = report.get("rotation", {})
    performance = report.get("performance", {})

    today = daily.get("date", datetime.now(KST).strftime("%Y-%m-%d"))
    briefing = daily.get("market_briefing", "")
    market = daily.get("market_summary", {})
    rankings = daily.get("sector_rankings", [])
    signals = daily.get("signals_summary", {})
    featured = daily.get("featured_stocks", [])
    leading = daily.get("leading_sectors", [])
    freq_top5 = rotation.get("frequency_top5", [])
    cycle = rotation.get("rotation_cycle", {})
    perf_summary = performance.get("summary", {})
    active_positions = performance.get("active_positions", [])

    # 섹터 순위 텍스트
    ranking_text = ""
    for r in rankings[:10]:
        ranking_text += (
            f"  {r['rank']}위 {r['sector']} ({r['grade']}등급): "
            f"{r['change_rate']:+.2f}%, 주도점수 {r['leadership_score']}, "
            f"상승비율 {r['breadth_ratio']:.0f}%"
            f"{' ★주도섹터' if r.get('is_leading') else ''}\n"
        )

    # 주도섹터 텍스트
    leading_text = ""
    for s in leading:
        leading_text += (
            f"  - {s['sector']} ({s['etf_name']}): "
            f"{s['change_rate']:+.2f}%, 점수 {s['leadership_score']}\n"
        )

    # 신호 텍스트
    buy_total = signals.get("buy", 0) + signals.get("strong_buy", 0)
    signal_text = (
        f"  매수 신호: {buy_total}건 (적극매수 {signals.get('strong_buy', 0)} + 매수 {signals.get('buy', 0)})\n"
        f"  매도 신호: {signals.get('sell', 0)}건\n"
        f"  관망: {signals.get('hold', 0)}건\n"
    )
    for d in signals.get("details", []):
        signal_text += f"  → {d['etf_name']}: {d['signal']} (신뢰도 {d['confidence']}%)\n"

    # 특징주 텍스트
    featured_text = ""
    for f in featured[:6]:
        featured_text += (
            f"  - [{f['sector']}] {f['stock_name']}: {f['change_rate']:+.2f}% (비중 {f['weight']:.1f}%)\n"
        )

    # 순환 분석 텍스트
    rotation_text = f"  평균 TOP3 유지일수: {cycle.get('avg_cycle_days', 0)}일\n"
    for ft in freq_top5:
        rotation_text += (
            f"  {ft['rank']}위 {ft['sector']}: "
            f"{ft['entry_count']}회 등장, 총 {ft['total_days']}일, "
            f"평균수익 {ft['avg_peak_return']:+.1f}%\n"
        )

    # 수익률 텍스트
    perf_text = (
        f"  활성 추적: {perf_summary.get('active_count', 0)}건\n"
        f"  평균 수익률: {perf_summary.get('avg_return', 0):+.2f}%\n"
        f"  승률: {perf_summary.get('win_rate', 0):.0f}%\n"
    )
    for p in active_positions[:5]:
        perf_text += (
            f"  → {p['etf_name']} ({p['sector']}): "
            f"누적 {p['cumulative_return_pct']:+.2f}%, {p['consecutive_days']}일째\n"
        )

    prompt = f"""당신은 한국 ETF 시장 전문 애널리스트입니다.
아래 데이터를 바탕으로 블로그 리포트를 작성하세요.

## 작성 규칙
1. 증권 애널리스트 리포트 톤 — 데이터 기반, 근거 명시
2. 두괄식: 결론(오늘의 핵심) → 데이터 분석 → 전망 순서
3. HTML 형식 (<h2>, <h3>, <p>, <table>, <blockquote>, <div class="key-point">, <div class="tip-box">)
4. <h1> 태그 사용 금지 (WordPress가 자동 생성)
5. 1,500~2,500자 분량
6. 투자 권유 아닌 분석 관점
7. "본 리포트는 투자 참고용이며, 투자 판단의 책임은 본인에게 있습니다." 면책 포함

## 필수 섹션
- 오늘의 시황 요약 (KOSPI/KOSDAQ + 시장 분위기)
- 섹터 순위 & 등급 변화 (S/A/B/C/D 등급 표기)
- 주도섹터 분석 (왜 강세인지, 수급 근거)
- 오늘의 특징주 (구성종목 상승률 TOP)
- 섹터 순환 분석 (어떤 섹터가 얼마나 자주, 얼마나 오래 TOP3에 있는지)
- 수익률 추적 (진입 후 현재 수익률)
- 향후 전망 (데이터 기반 전망, 주의점)

## 오늘의 데이터 ({today})

### 시황 브리핑
{briefing}

### 시장 지수
  KOSPI: {market.get('kospi', {}).get('price', 0):,.0f} ({market.get('kospi', {}).get('change_rate', 0):+.2f}%)
  KOSDAQ: {market.get('kosdaq', {}).get('price', 0):,.0f} ({market.get('kosdaq', {}).get('change_rate', 0):+.2f}%)

### 섹터 순위 (전체)
{ranking_text}

### 주도섹터 TOP3
{leading_text}

### 종합 신호 분포
{signal_text}

### 오늘의 특징주 (주도섹터 구성종목 상승률 TOP)
{featured_text}

### 섹터 순환 분석 (최근 90일)
{rotation_text}

### TOP3 수익률 추적
{perf_text}

위 데이터를 분석하여 전문가 톤의 블로그 리포트를 HTML로 작성하세요.
제목은 첫 줄에 <h2>로 시작하세요. 예: <h2>[{today}] ETF 시장 리포트: 핵심 키워드</h2>
"""
    return prompt


# ═══════════════════════════════════════════════════════
# 3. AI 글 생성 (기존 ContentGenerator 재활용)
# ═══════════════════════════════════════════════════════

def generate_blog_content(prompt: str) -> tuple:
    """AI로 블로그 글 생성 — Grok → Gemini → DeepSeek 폴체인 + Claude 폴리싱"""
    import requests

    content = None
    model_used = None

    # 1순위: Grok
    if GROK_KEY and not content:
        try:
            log.info("Grok으로 ETF 리포트 생성 중...")
            resp = requests.post(
                "https://api.x.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROK_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "grok-3-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 5000,
                },
                timeout=180,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            model_used = "grok-3-mini"
            log.info(f"Grok 생성 완료 ({len(content)}자)")
        except Exception as e:
            log.warning(f"Grok 실패: {e}")

    # 2순위: Gemini
    if GEMINI_KEY and not content:
        try:
            log.info("Gemini로 ETF 리포트 생성 중...")
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 5000},
                },
                timeout=180,
            )
            resp.raise_for_status()
            content = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            model_used = "gemini-2.0-flash"
            log.info(f"Gemini 생성 완료 ({len(content)}자)")
        except Exception as e:
            log.warning(f"Gemini 실패: {e}")

    # 3순위: DeepSeek
    if DEEPSEEK_KEY and not content:
        try:
            log.info("DeepSeek로 ETF 리포트 생성 중...")
            resp = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {DEEPSEEK_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 5000,
                },
                timeout=180,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            model_used = "deepseek-chat"
            log.info(f"DeepSeek 생성 완료 ({len(content)}자)")
        except Exception as e:
            log.warning(f"DeepSeek 실패: {e}")

    if not content:
        log.error("모든 AI 모델 실패")
        return None, None

    # Claude 폴리싱 (선택)
    if CLAUDE_KEY:
        try:
            polish_prompt = f"""아래 ETF 시장 분석 블로그 글을 다듬어주세요.
규칙:
- 어색한 표현 수정, 문단 흐름 개선
- 데이터 정확성 유지 (수치 변경 금지)
- HTML 구조 유지
- 1,500~2,500자 유지
- 면책 문구 유지

원문:
{content}"""
            log.info("Claude 폴리싱 중...")
            resp = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": CLAUDE_KEY,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 6000,
                    "messages": [{"role": "user", "content": polish_prompt}],
                },
                timeout=180,
            )
            resp.raise_for_status()
            polished = resp.json()["content"][0]["text"]
            log.info(f"폴리싱 완료 ({len(polished)}자)")
            return polished, model_used + "+claude"
        except Exception as e:
            log.warning(f"Claude 폴리싱 실패 (원문 사용): {e}")

    return content, model_used


# ═══════════════════════════════════════════════════════
# 4. 제목 추출
# ═══════════════════════════════════════════════════════

def extract_title(content: str) -> tuple:
    """HTML에서 첫 h2 태그를 제목으로 추출"""
    import re

    match = re.search(r"<h2[^>]*>(.*?)</h2>", content, re.DOTALL)
    if match:
        title = re.sub(r"<[^>]+>", "", match.group(1)).strip()
        content = content[: match.start()] + content[match.end() :]
        return title, content.strip()

    # h2가 없으면 첫 줄을 제목으로
    lines = content.strip().split("\n")
    title = re.sub(r"<[^>]+>", "", lines[0]).strip()[:100]
    return title, "\n".join(lines[1:]).strip()


# ═══════════════════════════════════════════════════════
# 5. WordPress 발행
# ═══════════════════════════════════════════════════════

def publish_to_wordpress(title: str, content: str, category: str = "ETF 시장분석") -> dict:
    """WordPress REST API로 발행"""
    import base64
    import requests

    url = WP_URL.rstrip("/")
    if url.endswith("/wp-json/wp/v2"):
        url = url[: -len("/wp-json/wp/v2")]

    cred = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode()).decode()
    headers = {
        "Authorization": f"Basic {cred}",
        "Content-Type": "application/json",
    }

    # 카테고리 조회/생성
    cat_id = None
    try:
        resp = requests.get(
            f"{url}/wp-json/wp/v2/categories",
            headers=headers,
            params={"search": category, "per_page": 5},
            timeout=10,
        )
        cats = resp.json()
        for c in cats:
            import html as _html
            if _html.unescape(c["name"]).lower() == category.lower():
                cat_id = c["id"]
                break
        if not cat_id:
            resp = requests.post(
                f"{url}/wp-json/wp/v2/categories",
                headers=headers,
                json={"name": category},
                timeout=10,
            )
            cat_id = resp.json().get("id")
    except Exception as e:
        log.warning(f"카테고리 처리 실패: {e}")

    today = datetime.now(KST).strftime("%Y-%m-%d")
    post_data = {
        "title": title,
        "content": content,
        "status": "publish",
        "categories": [cat_id] if cat_id else [],
        "tags": [],
        "meta": {
            "rank_math_focus_keyword": f"ETF 시장분석 {today}",
            "rank_math_title": f"{title} | PlanX AI",
            "rank_math_description": f"{today} ETF 섹터 순위, 주도섹터, 시장 신호 종합 분석 리포트",
        },
    }

    try:
        resp = requests.post(
            f"{url}/wp-json/wp/v2/posts",
            headers=headers,
            json=post_data,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "status": "published",
            "id": data["id"],
            "url": data.get("link", ""),
            "title": data.get("title", {}).get("rendered", title),
        }
    except Exception as e:
        log.error(f"WordPress 발행 실패: {e}")
        return {"status": "failed", "error": str(e)}


# ═══════════════════════════════════════════════════════
# 6. Supabase 로깅
# ═══════════════════════════════════════════════════════

def log_to_supabase(result: dict, model_used: str, report_type: str):
    """발행 결과를 Supabase에 기록"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return

    import requests

    try:
        requests.post(
            f"{SUPABASE_URL}/rest/v1/publish_logs",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            json={
                "site_id": SITE_ID,
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "keyword": f"etf-report-{report_type}",
                "pipeline": "etf-report",
                "status": result.get("status", "unknown"),
                "quality_score": 90,
                "content_length": 0,
                "has_image": False,
                "created_at": datetime.now(KST).isoformat(),
            },
            timeout=10,
        )
        log.info("Supabase 로깅 완료")
    except Exception as e:
        log.warning(f"Supabase 로깅 실패 (무시): {e}")


# ═══════════════════════════════════════════════════════
# 7. 메인 파이프라인
# ═══════════════════════════════════════════════════════

def run_etf_report(report_type: str = "blog-ready", dry_run: bool = False):
    """ETF 리포트 파이프라인 실행"""
    log.info("=" * 60)
    log.info(f"ETF Report Pipeline — {report_type}")
    log.info(f"  API: {ETF_API_URL}")
    log.info(f"  WP: {WP_URL}")
    log.info(f"  Dry Run: {dry_run}")
    log.info("=" * 60)

    # Step 1: ETF Dashboard에서 리포트 fetch
    report = fetch_etf_report(report_type)
    if not report:
        log.error("리포트 데이터 없음 — 종료")
        return

    # blog-ready가 아닌 경우 daily를 기본으로 래핑
    if report_type != "blog-ready" and "daily" not in report:
        report = {"daily": report, "rotation": {}, "performance": {}}

    # Step 2: AI 프롬프트 생성 + 글 생성
    prompt = build_etf_blog_prompt(report)
    content, model_used = generate_blog_content(prompt)
    if not content:
        log.error("AI 글 생성 실패 — 종료")
        return

    # Step 3: 제목 추출
    title, content = extract_title(content)
    log.info(f"제목: {title}")
    log.info(f"본문: {len(content)}자 ({model_used})")

    # Step 4: 발행
    if dry_run:
        log.info("[DRY RUN] 발행 스킵")
        log.info(f"제목: {title}")
        log.info(f"본문 미리보기:\n{content[:500]}...")
        return

    if not WP_URL or not WP_USER or not WP_PASS:
        log.error("WordPress 인증 정보 없음 (WP_URL, WP_USERNAME, WP_APP_PASSWORD)")
        return

    result = publish_to_wordpress(title, content)

    if result["status"] == "published":
        log.info(f"발행 성공: {result.get('url', '')}")
        log_to_supabase(result, model_used, report_type)
    else:
        log.error(f"발행 실패: {result.get('error', '')}")
        log_to_supabase(result, model_used, report_type)

    log.info("=" * 60)
    log.info("ETF Report Pipeline 완료")
    log.info("=" * 60)


# ═══════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="ETF Blog Report Publisher")
    parser.add_argument(
        "--report-type",
        default="blog-ready",
        choices=["daily", "rotation", "performance", "blog-ready"],
        help="리포트 유형",
    )
    parser.add_argument("--dry-run", action="store_true", help="발행 없이 테스트")
    parser.add_argument("--etf-api-url", default="", help="ETF Dashboard API URL 오버라이드")
    args = parser.parse_args()

    if args.etf_api_url:
        global ETF_API_URL
        ETF_API_URL = args.etf_api_url

    run_etf_report(report_type=args.report_type, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
