import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * /api/wp-setup — WP REST API 직접 호출로 블로그 초기 설정
 * GitHub Actions 없이 즉시 실행: 메뉴, 페이지, 카테고리, 타이틀, CSS, Sample 삭제
 */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

async function verifyAuth(request) {
  const authHeader = request.headers.get('authorization');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  if (authHeader?.startsWith('Bearer ')) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
    return user || null;
  }
  return null;
}

function wpHeaders(username, appPassword) {
  const cred = Buffer.from(`${username}:${appPassword}`).toString('base64');
  return { 'Authorization': `Basic ${cred}`, 'Content-Type': 'application/json' };
}

async function wpGet(url, headers) {
  const r = await fetch(url, { headers, cache: 'no-store' });
  if (!r.ok) return null;
  return r.json();
}

async function wpPost(url, headers, body) {
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

async function wpDelete(url, headers) {
  const r = await fetch(url, { method: 'DELETE', headers });
  return { ok: r.ok, status: r.status };
}

// ── 니치 slug → 카테고리 한글명 매핑 ──
const NICHE_TO_CATEGORY = {
  'ai-tools': 'AI 활용 & 생산성',
  'tech': 'IT & 테크 리뷰',
  'smart-home': '스마트홈 & IoT',
  'pet': '반려동물',
  'health': '건강 & 웰니스',
  'finance': '재테크 & 투자',
  'beauty': '뷰티 & 패션',
  'baby': '육아 & 유아',
  'appliance': '생활가전',
  'fitness': '운동 & 피트니스',
  'education': '교육 & 자기계발',
  'gov-support': '정부지원 & 보조금',
  'tax-guide': '세무 & 절세',
  'travel': '여행 & 라이프',
  'agency': '기관 정보',
  'event': '행사 & 트렌드',
  'niche-promo': '니치 홍보',
  'brand': '브랜드 콘텐츠',
  'compare-land': '비교 & 리뷰',
  'news-sbs': 'SBS 뉴스',
  'news-kbs': 'KBS 뉴스',
  'news-jtbc': 'JTBC 뉴스',
  'sns-trend': 'SNS 트렌드',
  'top10-corp': '대기업 분석',
  's-semi': '반도체',
  's-ai': 'AI & 인공지능',
  's-defense': '방산',
  's-pharma': '제약 & 바이오',
  's-robot': '로봇',
  's-ev': '전기차 & 2차전지',
  's-space': '우주 & 항공',
  'side-income': '부업 & 수익화',
  'life-economy': '생활 경제',
  'insurance-finance': '보험 & 금융',
  'tax-saving': '절세 & 세금',
};

export async function POST(request) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { siteId, actions, blogName, blogOwner, blogDesc, contactEmail, niches } = await request.json();
  if (!siteId) return NextResponse.json({ error: 'siteId 필수' }, { status: 400 });

  // 사이트 인증정보 조회
  const supabase = getSupabase();
  const { data: siteData } = await supabase.from('sites').select('wp_url, domain, config').eq('id', siteId).single();
  if (!siteData?.config?.wp_app_password) {
    return NextResponse.json({ error: '사이트 인증정보가 없습니다. 먼저 사이트를 연결해주세요.' }, { status: 400 });
  }

  const wpUrl = siteData.wp_url || `https://${siteData.domain}`;
  const BASE = `${wpUrl}/wp-json/wp/v2`;
  const H = wpHeaders(siteData.config.wp_username, siteData.config.wp_app_password);

  const results = {};
  const actionSet = new Set(actions || []);

  // ═══════════════════════════════
  // 1. 사이트 타이틀 변경
  // ═══════════════════════════════
  if (actionSet.has('set-title') && blogName) {
    const r = await wpPost(`${BASE}/settings`, H, { title: blogName });
    results['set-title'] = r.ok ? { status: 'success', title: blogName } : { status: 'failed', error: `HTTP ${r.status}` };
  }

  // ═══════════════════════════════
  // 2. Sample Page 삭제
  // ═══════════════════════════════
  if (actionSet.has('delete-sample')) {
    const pages = await wpGet(`${BASE}/pages?per_page=50&status=publish,draft`, H);
    let deleted = 0;
    if (pages) {
      for (const p of pages) {
        const slug = (p.slug || '').toLowerCase();
        const title = (p.title?.rendered || '').toLowerCase();
        if (slug.includes('sample') || title.includes('sample')) {
          const dr = await wpDelete(`${BASE}/pages/${p.id}?force=true`, H);
          if (dr.ok) deleted++;
        }
      }
    }
    results['delete-sample'] = { status: 'success', deleted };
  }

  // ═══════════════════════════════
  // 3. 필수 페이지 4개 생성
  // ═══════════════════════════════
  if (actionSet.has('setup-pages')) {
    const owner = blogOwner || '블로그 운영자';
    const desc = blogDesc || '유용한 정보를 공유하는 블로그입니다.';
    const email = contactEmail || 'contact@example.com';
    const name = blogName || siteData.domain;

    const PAGES = [
      { title: '소개', slug: 'about', content: `<h2>${name}에 오신 것을 환영합니다</h2><p>${name}는 ${desc}</p><p>검증된 공식 자료와 실제 경험을 바탕으로 글을 작성합니다.</p><p>궁금한 점이나 다뤄주셨으면 하는 주제가 있다면 언제든 연락해주세요.</p>` },
      { title: '개인정보처리방침', slug: 'privacy-policy', content: `<h2>개인정보처리방침</h2><p><strong>${name}</strong>는 방문자의 개인정보를 중요시하며, 관련 법률을 준수합니다.</p><h3>1. 수집하는 개인정보</h3><p>사이트는 별도의 회원가입을 요구하지 않으며, 댓글 작성 시 이름과 이메일을 수집할 수 있습니다.</p><h3>2. 쿠키</h3><p>방문자 경험 개선과 트래픽 분석을 위해 쿠키를 사용합니다.</p><h3>3. 제3자 서비스</h3><ul><li><strong>Google Analytics</strong> — 트래픽 분석</li><li><strong>Google AdSense</strong> — 맞춤형 광고 제공</li></ul><h3>4. 문의</h3><p>개인정보 관련 문의: <strong>${email}</strong></p>` },
      { title: '면책 조항', slug: 'disclaimer', content: `<h2>면책 조항</h2><p><strong>${name}</strong>의 모든 콘텐츠는 정보 제공 목적으로 작성되었습니다.</p><p>투자 관련 정보는 <strong>투자 권유가 아닙니다</strong>. 세금·법률 관련 내용은 <strong>전문가 상담을 대체하지 않습니다</strong>.</p><p>일부 콘텐츠에는 제휴 링크가 포함될 수 있으며, 콘텐츠의 객관성에 영향을 미치지 않습니다.</p>` },
      { title: '문의하기', slug: 'contact', content: `<h2>문의하기</h2><p>${name}에 대한 문의사항이 있으시면 아래로 연락해주세요.</p><h3>이메일</h3><p><strong>${email}</strong></p><h3>문의 가능 사항</h3><ul><li>콘텐츠 관련 질문 및 정정 요청</li><li>다뤄주셨으면 하는 주제 제안</li><li>광고 및 협업 관련 문의</li></ul>` },
    ];

    const pageResults = [];
    for (const pg of PAGES) {
      // 이미 존재하는지 확인
      const existing = await wpGet(`${BASE}/pages?slug=${pg.slug}&status=publish`, H);
      if (existing && existing.length > 0) {
        pageResults.push({ slug: pg.slug, id: existing[0].id, status: 'exists' });
        continue;
      }
      const r = await wpPost(`${BASE}/pages`, H, { title: pg.title, slug: pg.slug, content: pg.content, status: 'publish' });
      pageResults.push({ slug: pg.slug, id: r.data?.id, status: r.ok ? 'created' : 'failed' });
    }
    results['setup-pages'] = { status: 'success', pages: pageResults };
  }

  // ═══════════════════════════════
  // 4. 니치 기반 카테고리 생성
  // ═══════════════════════════════
  if (actionSet.has('setup-categories') && niches?.length) {
    const catResults = [];
    for (const niche of niches) {
      const catName = NICHE_TO_CATEGORY[niche] || niche;
      // 이미 존재하는지 확인
      const existing = await wpGet(`${BASE}/categories?search=${encodeURIComponent(catName)}&per_page=5`, H);
      const found = existing?.find(c => c.name === catName);
      if (found) {
        catResults.push({ niche, category: catName, id: found.id, status: 'exists' });
        continue;
      }
      const slug = niche.replace(/[^a-z0-9-]/g, '-');
      const r = await wpPost(`${BASE}/categories`, H, { name: catName, slug });
      catResults.push({ niche, category: catName, id: r.data?.id, status: r.ok ? 'created' : 'failed' });
    }
    results['setup-categories'] = { status: 'success', categories: catResults };
  }

  // ═══════════════════════════════
  // 5. 메뉴 생성 (Navigation 블록 — 블록 테마 호환)
  // ═══════════════════════════════
  if (actionSet.has('setup-menu')) {
    // 페이지 ID 조회
    const allPages = await wpGet(`${BASE}/pages?per_page=50&status=publish`, H) || [];
    const pageMap = {};
    for (const p of allPages) pageMap[p.slug] = { id: p.id, link: p.link };

    // Navigation 블록 확인 (Twenty Twenty-Five 등 블록 테마)
    const navs = await wpGet(`${BASE}/navigation?per_page=5`, H);
    let menuResult = { type: 'unknown' };

    if (navs !== null) {
      // 블록 테마 — Navigation 블록 업데이트
      const navLinks = [
        `<!-- wp:navigation-link {"label":"홈","url":"${wpUrl}/","kind":"custom","isTopLevelLink":true} /-->`,
        pageMap['about'] ? `<!-- wp:navigation-link {"label":"소개","url":"${wpUrl}/about/","kind":"custom","isTopLevelLink":true} /-->` : '',
        pageMap['contact'] ? `<!-- wp:navigation-link {"label":"문의하기","url":"${wpUrl}/contact/","kind":"custom","isTopLevelLink":true} /-->` : '',
      ].filter(Boolean).join('\n');

      if (navs.length > 0) {
        // 기존 Navigation 업데이트
        const r = await wpPost(`${BASE}/navigation/${navs[0].id}`, H, { content: navLinks, status: 'publish' });
        menuResult = { type: 'navigation-block', id: navs[0].id, status: r.ok ? 'updated' : 'failed' };
      } else {
        // 새 Navigation 생성
        const r = await wpPost(`${BASE}/navigation`, H, { title: 'Main Menu', content: navLinks, status: 'publish' });
        menuResult = { type: 'navigation-block', id: r.data?.id, status: r.ok ? 'created' : 'failed' };
      }
    }

    // 클래식 메뉴도 시도 (GeneratePress 등)
    const classicMenus = await wpGet(`${BASE}/menus`, H);
    if (classicMenus !== null) {
      let menuId = classicMenus?.[0]?.id;
      if (!menuId) {
        const r = await wpPost(`${BASE}/menus`, H, { name: 'Main Menu' });
        if (r.ok) menuId = r.data?.id;
      }
      if (menuId) {
        // 기존 아이템 삭제
        const oldItems = await wpGet(`${BASE}/menu-items?menus=${menuId}&per_page=50`, H) || [];
        for (const item of oldItems) await wpDelete(`${BASE}/menu-items/${item.id}?force=true`, H);

        // 아이템 추가
        const items = [
          { title: '홈', url: `${wpUrl}/`, type: 'custom', object: 'custom' },
          ...(pageMap['about'] ? [{ title: '소개', type: 'post_type', object: 'page', object_id: pageMap['about'].id }] : []),
          ...(pageMap['contact'] ? [{ title: '문의하기', type: 'post_type', object: 'page', object_id: pageMap['contact'].id }] : []),
        ];
        for (let i = 0; i < items.length; i++) {
          await wpPost(`${BASE}/menu-items`, H, { menus: menuId, title: items[i].title, status: 'publish', menu_order: i + 1, type: items[i].type, object: items[i].object, ...(items[i].url ? { url: items[i].url } : {}), ...(items[i].object_id ? { object_id: items[i].object_id } : {}) });
        }

        // primary 위치 할당 시도
        try { await fetch(`${BASE}/menu-locations/primary`, { method: 'PUT', headers: H, body: JSON.stringify({ menus: menuId }) }); } catch {}

        if (menuResult.type === 'unknown') {
          menuResult = { type: 'classic-menu', id: menuId, status: 'created' };
        } else {
          menuResult.classicMenu = { id: menuId, status: 'created' };
        }
      }
    }
    results['setup-menu'] = { status: 'success', ...menuResult };
  }

  return NextResponse.json({ success: true, results });
}
