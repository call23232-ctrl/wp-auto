'use client';
import { useState } from 'react';
import { Card, SectionTitle, Badge } from '@/components/ui';

// ── Data ──

const REQUIRED_SECRETS = [
  {
    name: 'WP_URL',
    desc: 'WordPress 사이트 주소',
    example: 'https://myblog.com',
    how: '본인 호스팅 주소 그대로 입력',
  },
  {
    name: 'WP_USERNAME',
    desc: 'WordPress 관리자 아이디',
    example: 'admin',
    how: 'WP 설치 시 설정한 로그인 ID',
  },
  {
    name: 'WP_APP_PASSWORD',
    desc: 'WordPress Application Password',
    example: 'ABCD 1234 EFGH 5678',
    how: '아래 2번 섹션 참고',
  },
];

const AI_MODEL_SECRETS = [
  {
    name: 'GEMINI_API_KEY',
    desc: 'Google Gemini',
    cost: '무료 (일 1,000건)',
    link: 'https://aistudio.google.com/apikey',
    linkLabel: 'API 키 발급',
    recommended: true,
  },
  {
    name: 'GROK_API_KEY',
    desc: 'xAI Grok',
    cost: '무료 크레딧 $25',
    link: 'https://console.x.ai',
    linkLabel: 'API 키 발급',
  },
  {
    name: 'DEEPSEEK_API_KEY',
    desc: 'DeepSeek',
    cost: '$0.07/MTok',
    link: 'https://platform.deepseek.com/api_keys',
    linkLabel: 'API 키 발급',
  },
  {
    name: 'CLAUDE_API_KEY',
    desc: 'Anthropic Claude (폴리싱용)',
    cost: '$1/MTok',
    link: 'https://console.anthropic.com/settings/keys',
    linkLabel: 'API 키 발급',
  },
];

const IMAGE_SECRETS = [
  {
    name: 'UNSPLASH_ACCESS_KEY',
    desc: 'Unsplash',
    cost: '무료 (월 50건)',
    link: 'https://unsplash.com/oauth/applications',
    linkLabel: '앱 생성',
  },
  {
    name: 'PEXELS_API_KEY',
    desc: 'Pexels',
    cost: '무료 (월 200건)',
    link: 'https://www.pexels.com/api/new/',
    linkLabel: 'API 키 발급',
  },
  {
    name: 'PIXABAY_API_KEY',
    desc: 'Pixabay',
    cost: '무료',
    link: 'https://pixabay.com/api/docs/',
    linkLabel: 'API 키 발급',
  },
];

const DASHBOARD_SECRETS = [
  {
    name: 'SUPABASE_URL',
    desc: 'Supabase 프로젝트 URL',
    how: 'Settings > API > Project URL',
    link: 'https://supabase.com/dashboard/project/_/settings/api',
    linkLabel: 'Supabase 열기',
  },
  {
    name: 'SUPABASE_KEY',
    desc: 'Supabase service_role key',
    how: 'Settings > API > service_role',
    link: 'https://supabase.com/dashboard/project/_/settings/api',
    linkLabel: 'Supabase 열기',
  },
];

const SECTIONS = [
  { id: 'secrets', label: 'GitHub Secrets', icon: '1' },
  { id: 'wp-password', label: 'WP 앱 비밀번호', icon: '2' },
  { id: 'actions', label: 'Actions 권한', icon: '3' },
  { id: 'keywords', label: '키워드 설정', icon: '4' },
  { id: 'summary', label: '최소 구성 요약', icon: '!' },
];

// ── Page ──

export default function SetupGuidePage() {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Fork 셋업 가이드
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 6 }}>
          Fork 후 자동 발행을 위해 설정해야 하는 항목들 — 각 항목의 버튼을 클릭하면 해당 사이트로 이동합니다
        </p>
      </div>

      {/* Quick Summary Banner */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(59,130,246,0.06))', border: '1px solid rgba(124,58,237,0.15)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 28 }}>{'4'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              최소 4개 Secret만 등록하면 자동 발행 시작
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              WP_URL + WP_USERNAME + WP_APP_PASSWORD + GEMINI_API_KEY = 비용 0원
            </div>
          </div>
          <LinkBtn href="https://aistudio.google.com/apikey" label="Gemini 키 발급" />
        </div>
      </Card>

      {/* Section Navigation */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {SECTIONS.map(sec => (
          <a key={sec.id} href={`#${sec.id}`} style={S.navPill}>
            <span style={{ marginRight: 6, opacity: 0.5 }}>{sec.icon}</span>
            {sec.label}
          </a>
        ))}
      </div>

      {/* ══════════ Section 1: GitHub Secrets ══════════ */}
      <div id="secrets" style={{ scrollMarginTop: 80 }}>
        <SectionTitle>
          <span>1. GitHub Secrets 설정</span>
        </SectionTitle>

        {/* Direct link to GitHub Secrets page */}
        <Card style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>GitHub Secrets 설정 페이지로 이동</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Fork한 저장소 {'>'} Settings {'>'} Secrets and variables {'>'} Actions
            </div>
          </div>
          <LinkBtn href="https://github.com/settings/tokens?type=beta" label="GitHub Tokens" />
        </Card>

        {/* ─ Required ─ */}
        <div style={S.groupHeader}>
          <Badge text="필수" color="red" />
          <span style={S.groupLabel}>이것 없으면 동작 안 함</span>
        </div>
        <Card style={{ marginBottom: 16 }}>
          {REQUIRED_SECRETS.map((s, i) => (
            <div key={s.name} style={{ ...S.row, borderBottom: i < REQUIRED_SECRETS.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <SecretName name={s.name} onCopy={copyText} copied={copiedKey === s.name} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  예: <code style={S.code}>{s.example}</code> | {s.how}
                </div>
              </div>
            </div>
          ))}
        </Card>

        {/* ─ AI Models ─ */}
        <div style={S.groupHeader}>
          <Badge text="AI 모델" color="green" />
          <span style={S.groupLabel}>최소 1개 필수 — 무료로 시작하려면 Gemini 추천</span>
        </div>
        <Card style={{ marginBottom: 16 }}>
          {AI_MODEL_SECRETS.map((s, i) => (
            <div key={s.name} style={{ ...S.row, borderBottom: i < AI_MODEL_SECRETS.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <SecretName name={s.name} onCopy={copyText} copied={copiedKey === s.name} />
                  {s.recommended && <Badge text="추천" color="purple" />}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{s.cost}</div>
              </div>
              <LinkBtn href={s.link} label={s.linkLabel} />
            </div>
          ))}
          <div style={S.tipBox}>
            엔진이 <strong>Grok {'>'} Gemini {'>'} DeepSeek {'>'} Claude</strong> 순으로 자동 폴백합니다.
            Gemini 하나만 등록해도 충분합니다.
          </div>
        </Card>

        {/* ─ Image APIs ─ */}
        <div style={S.groupHeader}>
          <Badge text="이미지 API" color="blue" />
          <span style={S.groupLabel}>선택 — 없으면 이미지 없이 발행</span>
        </div>
        <Card style={{ marginBottom: 16 }}>
          {IMAGE_SECRETS.map((s, i) => (
            <div key={s.name} style={{ ...S.row, borderBottom: i < IMAGE_SECRETS.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <SecretName name={s.name} onCopy={copyText} copied={copiedKey === s.name} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc} <span style={{ color: 'var(--text-dim)' }}>({s.cost})</span></div>
              </div>
              <LinkBtn href={s.link} label={s.linkLabel} />
            </div>
          ))}
        </Card>

        {/* ─ Dashboard ─ */}
        <div style={S.groupHeader}>
          <Badge text="대시보드 연동" color="purple" />
          <span style={S.groupLabel}>선택 — 발행 기록 조회 시 필요</span>
        </div>
        <Card style={{ marginBottom: 28 }}>
          {DASHBOARD_SECRETS.map((s, i) => (
            <div key={s.name} style={{ ...S.row, borderBottom: i < DASHBOARD_SECRETS.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <SecretName name={s.name} onCopy={copyText} copied={copiedKey === s.name} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{s.how}</div>
              </div>
              <LinkBtn href={s.link} label={s.linkLabel} />
            </div>
          ))}
        </Card>
      </div>

      {/* ══════════ Section 2: WP App Password ══════════ */}
      <div id="wp-password" style={{ scrollMarginTop: 80 }}>
        <SectionTitle>
          <span>2. WordPress Application Password 생성</span>
        </SectionTitle>
        <Card style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              WP 관리자 패널에서 앱 비밀번호를 생성합니다
            </div>
            <LinkBtn href="https://wordpress.org/documentation/article/application-passwords/" label="WP 공식 문서" />
          </div>

          <ol style={S.ol}>
            <li style={S.olLi}>
              <code style={S.codeInline}>https://내사이트.com/wp-admin</code> 접속 후 로그인
            </li>
            <li style={S.olLi}>
              좌측 <strong>Users</strong> {'>'} <strong>Profile</strong> 클릭
            </li>
            <li style={S.olLi}>
              맨 아래 <strong>Application Passwords</strong> 섹션으로 스크롤
            </li>
            <li style={S.olLi}>
              이름: <code style={S.codeInline}>AutoBot</code> 입력 {'>'} <strong>Add New Application Password</strong> 클릭
            </li>
            <li style={S.olLi}>
              생성된 비밀번호 <strong style={{ color: 'var(--red)' }}>즉시 복사</strong> (다시 볼 수 없음!)
            </li>
            <li style={S.olLi}>
              이 값을 GitHub Secrets의 <code style={S.codeInline}>WP_APP_PASSWORD</code>에 등록
            </li>
          </ol>

          <div style={S.warnBox}>
            <strong>공백 포함해서 그대로 붙여넣으세요!</strong>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-dim)' }}>
              형식: <code style={S.code}>ABCD 1234 EFGH 5678 IJKL 9012</code>
            </div>
          </div>

          <div style={{ ...S.tipBox, marginTop: 12 }}>
            <strong>앱 비밀번호가 안 보인다면?</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 12 }}>
              <li>WordPress 5.6 이상인지 확인</li>
              <li>HTTPS가 적용되어 있는지 확인 (http에서는 앱 비밀번호 미지원)</li>
              <li>보안 플러그인(Wordfence 등)이 비활성화하고 있지 않은지 확인</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* ══════════ Section 3: GitHub Actions Permission ══════════ */}
      <div id="actions" style={{ scrollMarginTop: 80 }}>
        <SectionTitle>
          <span>3. GitHub Actions 권한 설정</span>
        </SectionTitle>
        <Card style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Actions가 키워드 기록을 커밋할 수 있도록 쓰기 권한이 필요합니다
            </div>
            <LinkBtn href="https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#configuring-the-default-github_token-permissions" label="GitHub 공식 문서" />
          </div>

          <ol style={S.ol}>
            <li style={S.olLi}>
              Fork한 저장소 {'>'} <strong>Settings</strong> 탭
            </li>
            <li style={S.olLi}>
              좌측 <strong>Actions</strong> {'>'} <strong>General</strong>
            </li>
            <li style={S.olLi}>
              <strong>Workflow permissions</strong> 섹션에서{' '}
              <Badge text="Read and write permissions" color="green" /> 선택
            </li>
            <li style={S.olLi}>
              <strong>Save</strong> 클릭
            </li>
          </ol>

          <div style={S.warnBox}>
            <strong>이 설정을 안 하면?</strong>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-dim)' }}>
              키워드 사용 기록(<code style={S.code}>data/used_keywords.json</code>)을
              자동 커밋할 때 <strong>403 에러</strong>가 발생합니다.
              발행 자체는 되지만, 같은 키워드로 중복 발행될 수 있습니다.
            </div>
          </div>
        </Card>
      </div>

      {/* ══════════ Section 4: Keywords ══════════ */}
      <div id="keywords" style={{ scrollMarginTop: 80 }}>
        <SectionTitle>
          <span>4. 키워드 설정</span>
        </SectionTitle>
        <Card style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <code style={S.codeInline}>data/keywords.json</code> 파일을 편집해서 본인 니치에 맞는 키워드를 추가합니다
              </div>
            </div>
            <LinkBtn href="https://github.com/planxs-ai/wp-auto/edit/main/data/keywords.json" label="GitHub에서 편집" />
          </div>

          <div style={S.codeBlock}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>data/keywords.json 형식</div>
            <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6, overflowX: 'auto' }}>{`{
  "keywords": [
    {
      "keyword": "AI 글쓰기 도구 추천",
      "type": "traffic",
      "pipeline": "autoblog",
      "category": "ai-tools"
    },
    {
      "keyword": "가성비 공기청정기 비교",
      "type": "conversion",
      "pipeline": "autoblog",
      "category": "smart-home"
    }
  ]
}`}</pre>
          </div>

          <div style={{ marginTop: 16 }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>필드</th>
                  <th style={S.th}>값</th>
                  <th style={S.th}>설명</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ ...S.td, fontWeight: 600 }}>type</td><td style={S.td}><code style={S.code}>traffic</code></td><td style={S.td}>검색량 높은 정보성 키워드</td></tr>
                <tr><td style={{ ...S.td, fontWeight: 600 }}>type</td><td style={S.td}><code style={S.code}>conversion</code></td><td style={S.td}>구매 의도 높은 전환 키워드</td></tr>
                <tr><td style={{ ...S.td, fontWeight: 600 }}>type</td><td style={S.td}><code style={S.code}>high_cpa</code></td><td style={S.td}>CPA 단가 높은 금융/보험 키워드</td></tr>
                <tr><td style={{ ...S.td, fontWeight: 600 }}>pipeline</td><td style={S.td}><code style={S.code}>autoblog</code></td><td style={S.td}>기본 발행 파이프라인</td></tr>
              </tbody>
            </table>
          </div>

          <div style={S.tipBox}>
            <strong>키워드가 없어도 발행됩니다.</strong>
            <div style={{ marginTop: 4, fontSize: 12 }}>
              키워드가 부족하면 AI가 선택한 니치를 기반으로 자동 생성합니다.
              하지만 본인이 직접 추가한 키워드가 SEO에 더 유리합니다.
            </div>
          </div>
        </Card>
      </div>

      {/* ══════════ Section 5: Summary ══════════ */}
      <div id="summary" style={{ scrollMarginTop: 80 }}>
        <SectionTitle>
          <span>최소 구성 요약</span>
        </SectionTitle>

        <Card style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(59,130,246,0.06))',
          border: '1px solid rgba(16,185,129,0.15)',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            0원으로 자동 발행 시작하기
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StepRow
              num="1"
              title="GitHub Secrets 4개 등록"
              desc="WP_URL + WP_USERNAME + WP_APP_PASSWORD + GEMINI_API_KEY"
              linkHref="https://aistudio.google.com/apikey"
              linkLabel="Gemini 키 받기"
            />
            <StepRow
              num="2"
              title="Actions 쓰기 권한 활성화"
              desc="Settings > Actions > General > Read and write"
              linkHref="https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository"
              linkLabel="GitHub 문서"
            />
            <StepRow
              num="3"
              title="Actions 탭에서 수동 실행"
              desc='Auto Publish 워크플로우 > "Run workflow" 클릭'
              linkHref="https://github.com/planxs-ai/wp-auto/actions"
              linkLabel="Actions 열기"
            />
          </div>

          <div style={{
            marginTop: 20, padding: '14px 16px', borderRadius: 10,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              이 3단계면 AI가 자동으로 글을 쓰고 워드프레스에 발행합니다.
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              이후 대시보드 연동(Supabase), 이미지 API, 추가 AI 모델은 필요할 때 하나씩 추가하세요.
            </div>
          </div>
        </Card>

        {/* Full Checklist */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
            전체 셋업 체크리스트
          </div>
          <CheckGroup title="필수 (발행 동작에 필요)" color="var(--red)" items={[
            { label: 'WP_URL — WordPress 사이트 주소' },
            { label: 'WP_USERNAME — WordPress 관리자 ID' },
            { label: 'WP_APP_PASSWORD — 앱 비밀번호', link: 'https://wordpress.org/documentation/article/application-passwords/', linkText: 'WP 문서' },
            { label: 'AI API 키 최소 1개 (GEMINI 추천)', link: 'https://aistudio.google.com/apikey', linkText: '발급' },
            { label: 'Actions 쓰기 권한 활성화' },
          ]} />
          <CheckGroup title="권장 (대시보드 연동)" color="var(--accent)" items={[
            { label: 'SUPABASE_URL — 발행 기록 저장', link: 'https://supabase.com/dashboard', linkText: 'Supabase' },
            { label: 'SUPABASE_KEY — 서비스 역할 키', link: 'https://supabase.com/dashboard', linkText: 'Supabase' },
          ]} />
          <CheckGroup title="선택 (품질 향상)" color="var(--blue)" items={[
            { label: 'PEXELS_API_KEY — 이미지 자동 삽입', link: 'https://www.pexels.com/api/new/', linkText: '발급' },
            { label: 'UNSPLASH_ACCESS_KEY — 이미지', link: 'https://unsplash.com/oauth/applications', linkText: '발급' },
            { label: 'PIXABAY_API_KEY — 이미지', link: 'https://pixabay.com/api/docs/', linkText: '발급' },
            { label: 'TELEGRAM_BOT_TOKEN — 발행 알림', link: 'https://core.telegram.org/bots#botfather', linkText: 'BotFather' },
          ]} />
        </Card>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px 0 0', fontSize: 12, color: 'var(--text-dim)' }}>
        설정 중 막히는 부분이 있으면 <strong>planxsol@gmail.com</strong>으로 문의하세요.
      </div>
    </div>
  );
}

// ── Sub-components ──

function LinkBtn({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 8,
        background: 'var(--accent)', color: '#fff',
        fontSize: 12, fontWeight: 600, textDecoration: 'none',
        whiteSpace: 'nowrap', transition: 'opacity 0.15s',
        flexShrink: 0,
      }}
    >
      {label}
      <span style={{ fontSize: 14 }}>{'\u2197'}</span>
    </a>
  );
}

function SecretName({ name, onCopy, copied }) {
  return (
    <button
      onClick={() => onCopy(name)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'var(--input-bg)', border: '1px solid var(--border-light)',
        borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
        fontSize: 12, fontFamily: 'monospace', fontWeight: 600,
        color: 'var(--text)', transition: 'all 0.15s',
      }}
      title="클릭하여 복사"
    >
      {name}
      <span style={{ fontSize: 10, opacity: 0.5 }}>{copied ? '\u2713' : '\u2398'}</span>
    </button>
  );
}

function StepRow({ num, title, desc, linkHref, linkLabel }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 10,
      background: 'rgba(255,255,255,0.6)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700,
      }}>
        {num}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{desc}</div>
      </div>
      {linkHref && (
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 6,
            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)',
            color: 'var(--accent)', fontSize: 11, fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {linkLabel} {'\u2197'}
        </a>
      )}
    </div>
  );
}

function CheckGroup({ title, color, items }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color, marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        {title}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)',
        }}>
          <span style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--border-light)', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '3px 10px', borderRadius: 6,
              background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.1)',
              fontSize: 11, fontWeight: 600, color: 'var(--accent)',
              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {item.linkText || '발급'} {'\u2197'}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Styles ──

const S = {
  navPill: {
    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: 'var(--card)', border: '1px solid var(--card-border)',
    color: 'var(--text-secondary)', textDecoration: 'none',
    transition: 'all 0.15s',
  },
  groupHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  groupLabel: {
    fontSize: 12, color: 'var(--text-dim)', fontWeight: 500,
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 0', flexWrap: 'wrap',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
  },
  th: {
    padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)',
    textAlign: 'left', borderBottom: '1px solid var(--card-border)',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  td: {
    padding: '10px 12px', borderBottom: '1px solid var(--card-border)',
    verticalAlign: 'top', fontSize: 13, color: 'var(--text-secondary)',
  },
  code: {
    background: 'var(--input-bg)', padding: '2px 6px', borderRadius: 4,
    fontFamily: 'monospace', fontSize: 11,
  },
  codeInline: {
    background: 'var(--input-bg)', padding: '2px 8px', borderRadius: 4,
    fontFamily: 'monospace', fontSize: 12, border: '1px solid var(--border-light)',
  },
  codeBlock: {
    background: 'var(--input-bg)', padding: '14px 16px', borderRadius: 10,
    border: '1px solid var(--border-light)', fontFamily: 'monospace',
  },
  ol: {
    margin: 0, paddingLeft: 20, lineHeight: 2,
  },
  olLi: {
    fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4,
  },
  tipBox: {
    marginTop: 12, padding: '10px 14px', borderRadius: 8,
    background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)',
    fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
  },
  warnBox: {
    marginTop: 12, padding: '10px 14px', borderRadius: 8,
    background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
    fontSize: 12, color: 'var(--text)',
  },
};
