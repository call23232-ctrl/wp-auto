'use client';
import { useState } from 'react';

const STEPS = [
  { id: 'overview', title: '전체 구조 이해', icon: '0', subtitle: '내 손으로 운영하는 AI 블로그 시스템', content: OverviewStep },
  { id: 'cloudways', title: 'Cloudways + 워드프레스', icon: '1', subtitle: '호스팅 가입부터 WP 설치까지', content: CloudwaysStep },
  { id: 'domain', title: '도메인 연결', icon: '2', subtitle: '내 도메인을 워드프레스에 연결', content: DomainStep },
  { id: 'github', title: 'GitHub Fork', icon: '3', subtitle: '발행 엔진을 내 GitHub로 복제', content: GitHubStep },
  { id: 'gemini', title: 'Gemini API 키 발급', icon: '4', subtitle: 'AI 글쓰기 엔진 연결', content: GeminiStep },
  { id: 'supabase', title: 'Supabase 프로젝트', icon: '5', subtitle: '데이터베이스 + 인증 셋업', content: SupabaseStep },
  { id: 'vercel', title: 'Vercel 배포', icon: '6', subtitle: '대시보드를 내 도메인에 배포', content: VercelStep },
  { id: 'secrets', title: 'GitHub Secrets 설정', icon: '7', subtitle: '자동 발행을 위한 환경변수', content: SecretsStep },
  { id: 'first-run', title: '첫 발행 테스트', icon: '8', subtitle: '모든 것이 잘 되는지 확인', content: FirstRunStep },
  { id: 'daily', title: '운영 가이드', icon: '9', subtitle: '매일 자동 발행 + 수익화 로드맵', content: DailyStep },
  { id: 'faq', title: 'FAQ', icon: '?', subtitle: '자주 묻는 질문', content: FaqStep },
];

export default function ManualPage() {
  const [activeStep, setActiveStep] = useState('overview');
  const currentStep = STEPS.find(s => s.id === activeStep);
  const CurrentContent = currentStep?.content;

  return (
    <div style={layout.page}>
      {/* Header */}
      <header style={layout.header}>
        <div style={layout.headerInner}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', letterSpacing: -0.5 }}>AutoBlog</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>셀프 호스팅 설치 매뉴얼</div>
          </div>
          <a href="/login" style={layout.loginBtn}>
            로그인
          </a>
        </div>
      </header>

      <div style={layout.body}>
        {/* Step Navigation - Sidebar on desktop, horizontal on mobile */}
        <aside className="manual-sidebar" style={layout.sidebar}>
          <div style={{ padding: '16px 12px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
              Setup Guide
            </div>
          </div>
          <nav style={{ padding: '8px', flex: 1, overflowY: 'auto' }}>
            {STEPS.map((step, i) => {
              const isActive = step.id === activeStep;
              const stepIdx = STEPS.findIndex(s => s.id === activeStep);
              const isDone = i < stepIdx;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: isActive ? 'rgba(124,58,237,0.08)' : 'transparent',
                    marginBottom: 2, textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                    flexShrink: 0,
                    background: isActive ? '#7c3aed' : isDone ? '#10b981' : '#f1f5f9',
                    color: isActive || isDone ? '#fff' : '#94a3b8',
                  }}>
                    {isDone ? '\u2713' : step.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#7c3aed' : '#1a1a2e',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{step.title}</div>
                  </div>
                </button>
              );
            })}
          </nav>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8' }}>
            소요시간: 약 30~40분
          </div>
        </aside>

        {/* Mobile Step Nav */}
        <div className="manual-mobile-nav" style={layout.mobileNav}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 16px' }}>
            {STEPS.map((step, i) => {
              const isActive = step.id === activeStep;
              const stepIdx = STEPS.findIndex(s => s.id === activeStep);
              const isDone = i < stepIdx;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap',
                    background: isActive ? '#7c3aed' : isDone ? '#10b981' : '#f1f5f9',
                    color: isActive || isDone ? '#fff' : '#64748b',
                  }}
                >
                  {step.icon}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <main className="manual-main" style={layout.main}>
          <div style={layout.contentCard}>
            {CurrentContent && <CurrentContent />}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
              {STEPS.findIndex(st => st.id === activeStep) > 0 ? (
                <button
                  onClick={() => {
                    const idx = STEPS.findIndex(st => st.id === activeStep);
                    setActiveStep(STEPS[idx - 1].id);
                  }}
                  style={s.navBtn}
                >
                  {'\u2190'} 이전
                </button>
              ) : <div />}
              {STEPS.findIndex(st => st.id === activeStep) < STEPS.length - 1 ? (
                <button
                  onClick={() => {
                    const idx = STEPS.findIndex(st => st.id === activeStep);
                    setActiveStep(STEPS[idx + 1].id);
                  }}
                  style={{ ...s.navBtn, ...s.navBtnPrimary }}
                >
                  다음 {'\u2192'}
                </button>
              ) : <div />}
            </div>
          </div>

          <div style={s.contactBox}>
            설치 중 막히는 부분이 있으신가요? <strong>planxsol@gmail.com</strong>으로 문의주세요.
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Step Content Components ─── */

function OverviewStep() {
  return (
    <div>
      <h2 style={s.h2}>AutoBlog 셀프 호스팅이란?</h2>
      <p style={s.p}>
        비유하면 프랜차이즈 매장을 여는 것과 같습니다.
        본사(AutoBlog)가 레시피(코드)를 제공하고, 여러분이 자기 매장(서버)에서 직접 운영합니다.
        매출은 100% 여러분 것입니다.
      </p>

      <h3 style={s.h3}>어떻게 동작하나요?</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
        {[
          { icon: 'WP', color: '#21759b', title: 'Cloudways + WordPress', desc: '블로그가 돌아갈 서버 + CMS' },
          { icon: 'GH', color: '#24292e', title: 'GitHub (내 계정)', desc: 'AI 발행 엔진이 매일 자동 실행' },
          { icon: 'AI', color: '#4285f4', title: 'Gemini API', desc: 'AI가 글을 작성하는 두뇌' },
          { icon: 'DB', color: '#3ecf8e', title: 'Supabase', desc: '발행 기록, 수익, 설정 저장' },
          { icon: 'VL', color: '#000', title: 'Vercel', desc: '대시보드를 인터넷에 배포' },
        ].map(item => (
          <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#f8f9fc', borderRadius: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: item.color,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, flexShrink: 0,
            }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={s.h3}>준비물 체크리스트</h3>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>항목</th>
            <th style={s.th}>비용</th>
            <th style={s.th}>비고</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={s.td}>Cloudways 호스팅</td><td style={s.td}>$11/월 (~15,000원)</td><td style={s.td}>3일 무료 체험, 1GB 서버</td></tr>
          <tr><td style={s.td}>도메인</td><td style={s.td}>연 1~2만원</td><td style={s.td}>이미 구매했다면 OK</td></tr>
          <tr><td style={s.td}>Gemini API</td><td style={s.td}>무료 (일 1,500회)</td><td style={s.td}>Google AI Studio에서 발급</td></tr>
          <tr><td style={s.td}>GitHub 계정</td><td style={s.td}>무료</td><td style={s.td}>Actions 2,000분/월 무료</td></tr>
          <tr><td style={s.td}>Supabase</td><td style={s.td}>무료</td><td style={s.td}>50,000행, 500MB 스토리지</td></tr>
          <tr><td style={s.td}>Vercel</td><td style={s.td}>무료</td><td style={s.td}>취미 플랜으로 충분</td></tr>
        </tbody>
      </table>

      <div style={s.tipBox}>
        <div style={s.tipTitle}>월 총 비용: 약 15,000원 (호스팅비만)</div>
        <p style={s.tipText}>
          Gemini API, GitHub, Supabase, Vercel 모두 무료 티어로 충분합니다.
          실질적으로 Cloudways 호스팅비($11)만 필요합니다.
          $11 플랜(1GB)은 블로그 1개 운영에 최적입니다.
        </p>
      </div>

      <h3 style={s.h3}>소요 시간</h3>
      <p style={s.p}>
        이 매뉴얼을 따라하면 <strong>약 30~40분</strong>이면 모든 설정이 완료됩니다.
        이후에는 AI가 매일 자동으로 글을 발행합니다.
      </p>
    </div>
  );
}

function CloudwaysStep() {
  return (
    <div>
      <h2 style={s.h2}>Cloudways 호스팅 + 워드프레스 설치</h2>
      <p style={s.p}>
        비유하면 블로그의 "건물"을 짓는 단계입니다.
        Cloudways는 서버 관리를 자동으로 해주기 때문에 기술 지식 없이도 운영할 수 있습니다.
      </p>

      <h3 style={s.h3}>1. Cloudways 가입</h3>
      <StepList steps={[
        'Cloudways 사이트에 접속합니다',
        '"Start Free" 버튼을 클릭합니다',
        '이름, 이메일, 비밀번호를 입력하고 가입합니다',
        '이메일 인증을 완료합니다',
      ]} />
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '-8px 0 12px' }}>
        * 3일 무료 체험 가능, 신용카드 불필요
      </p>

      <h3 style={s.h3}>2. 서버 생성</h3>
      <StepList steps={[
        '로그인 후 "Add Server" 클릭',
        'Application: WordPress (Lightning Stack) 선택',
        'Server Provider: DigitalOcean 선택',
        'Server Size: 1GB ($11/월) — 블로그 1개 운영에 충분합니다',
        'Location: Singapore 선택 (한국에서 가장 빠름)',
        '"Launch Now" 클릭 → 2~3분 후 서버 완성!',
      ]} />

      <div style={s.tipBox}>
        <div style={s.tipTitle}>왜 Lightning Stack인가요?</div>
        <p style={s.tipText}>
          Lightning Stack은 Nginx + Varnish + Memcached 조합으로, 일반 스택보다 페이지 로딩이 2~3배 빠릅니다.
          1GB 서버에서도 충분한 성능을 내려면 Lightning Stack이 필수입니다.
          $11 플랜은 블로그 1개 전용으로 사용하세요.
        </p>
      </div>

      <div style={s.warnBox}>
        <strong>이 정보를 메모하세요!</strong>
        <p style={{ margin: '6px 0 0', fontSize: 13 }}>
          서버 생성 완료 후 나오는 정보:
        </p>
        <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 13 }}>
          <li><strong>Application URL</strong> (예: wordpress-123456.cloudways.com)</li>
          <li><strong>Admin Panel URL</strong></li>
          <li><strong>Username / Password</strong></li>
        </ul>
      </div>

      <h3 style={s.h3}>3. 워드프레스 관리자 접속</h3>
      <StepList steps={[
        'Cloudways 대시보드 → Application → 해당 앱 클릭',
        '"Admin Panel" URL을 클릭 (또는 내도메인.com/wp-admin)',
        'Username / Password로 로그인',
        '대시보드가 보이면 성공!',
      ]} />

      <h3 style={s.h3}>4. 워드프레스 기본 설정</h3>
      <StepList steps={[
        '설정 → 일반: 사이트 제목을 내 블로그 이름으로 변경',
        '설정 → 읽기: "검색 엔진이 이 사이트를 색인하지 않도록" 체크 해제',
        '설정 → 고유주소: "글 이름" 선택 → 변경사항 저장',
      ]} />

      <div style={s.tipBox}>
        <div style={s.tipTitle}>왜 "글 이름" 고유주소?</div>
        <p style={s.tipText}>
          URL이 myblog.com/ai-tools-review 처럼 깔끔해져서 SEO에 유리합니다.
        </p>
      </div>

      <h3 style={s.h3}>5. 앱 비밀번호 생성</h3>
      <p style={s.p}>
        AutoBlog이 워드프레스에 글을 발행하려면 "앱 비밀번호"가 필요합니다.
        집 열쇠(로그인 비밀번호)와 택배함 열쇠(앱 비밀번호)의 차이입니다.
      </p>
      <StepList steps={[
        '워드프레스 관리자 → 사용자 → 프로필',
        '페이지 맨 아래 "앱 비밀번호(Application Passwords)" 섹션',
        '이름에 AutoBlog 입력 → "새 앱 비밀번호 추가" 클릭',
        '생성된 비밀번호를 반드시 복사하여 메모!',
      ]} />
      <div style={s.codeBlock}>
        형식 예시: ABCD 1234 EFGH 5678 IJKL 9012
      </div>
      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
        * 이 화면에서만 한 번 보여집니다. 닫으면 다시 볼 수 없습니다.
      </p>

      <h3 style={s.h3}>6. 필수 플러그인 설치</h3>
      <p style={s.p}>워드프레스 관리자 → 플러그인 → 새로 추가:</p>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>플러그인</th>
            <th style={s.th}>용도</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={s.td}>Yoast SEO</td><td style={s.td}>검색엔진 최적화 (강력 추천)</td></tr>
          <tr><td style={s.td}>Site Kit by Google</td><td style={s.td}>애드센스/GA 연동</td></tr>
          <tr><td style={s.td}>WP Super Cache</td><td style={s.td}>사이트 속도 향상</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function DomainStep() {
  return (
    <div>
      <h2 style={s.h2}>도메인 연결하기</h2>
      <p style={s.p}>
        이미 도메인을 구매하셨다면 Cloudways 워드프레스에 연결합니다.
      </p>

      <h3 style={s.h3}>1. Cloudways에서 도메인 추가</h3>
      <StepList steps={[
        'Cloudways 콘솔 → Application → 해당 앱 선택',
        '"Domain Management" 메뉴 클릭',
        '"Add Domain" 클릭 → 내 도메인 입력 (예: myblog.com)',
        '"Make Primary" 클릭하여 기본 도메인으로 설정',
      ]} />

      <h3 style={s.h3}>2. DNS 설정 (도메인 업체에서)</h3>
      <p style={s.p}>도메인을 구매한 곳(가비아, 카페24, Namecheap 등)에서 DNS를 설정합니다.</p>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>타입</th>
            <th style={s.th}>호스트</th>
            <th style={s.th}>값</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={s.td}>A 레코드</td><td style={s.td}>@</td><td style={s.td}>Cloudways 서버 IP (콘솔에서 확인)</td></tr>
          <tr><td style={s.td}>CNAME</td><td style={s.td}>www</td><td style={s.td}>myblog.com</td></tr>
        </tbody>
      </table>

      <div style={s.tipBox}>
        <div style={s.tipTitle}>DNS 반영 시간</div>
        <p style={s.tipText}>
          DNS 변경은 보통 10분~24시간이 걸립니다. 대부분 30분 이내에 반영됩니다.
        </p>
      </div>

      <h3 style={s.h3}>3. SSL 인증서 설치</h3>
      <StepList steps={[
        'Cloudways → Application → SSL Certificate',
        '"Let\'s Encrypt" 선택',
        '이메일 입력 + 도메인 확인',
        '"Install Certificate" 클릭',
        '"Force HTTPS" 활성화',
      ]} />

      <div style={s.warnBox}>
        <strong>HTTPS 필수!</strong>
        <p style={{ margin: '6px 0 0', fontSize: 13 }}>
          SSL 없이(http://) 운영하면 애드센스 승인이 거부되고, 앱 비밀번호도 작동하지 않습니다.
        </p>
      </div>
    </div>
  );
}

function GitHubStep() {
  return (
    <div>
      <h2 style={s.h2}>GitHub Fork — 발행 엔진 복제</h2>
      <p style={s.p}>
        비유하면 요리 레시피북을 복사하는 것입니다.
        원본 레시피(AutoBlog 코드)를 내 주방(GitHub)으로 가져와서 내 재료(API 키, 도메인)로 요리합니다.
      </p>

      <h3 style={s.h3}>1. GitHub 계정 만들기</h3>
      <p style={s.p}>이미 있다면 건너뛰세요.</p>
      <StepList steps={[
        'github.com 접속 → "Sign up" 클릭',
        '이메일, 비밀번호, 사용자명 입력',
        '이메일 인증 완료',
      ]} />

      <h3 style={s.h3}>2. AutoBlog 저장소 Fork</h3>
      <StepList steps={[
        'GitHub 로그인 상태에서 AutoBlog 저장소 페이지 접속',
        '우측 상단 "Fork" 버튼 클릭',
        '"Create fork" 클릭 — 내 계정에 복사본이 생성됩니다',
      ]} />

      <div style={s.tipBox}>
        <div style={s.tipTitle}>Fork란?</div>
        <p style={s.tipText}>
          원본 코드를 내 계정으로 완전히 복사하는 것입니다.
          내 Fork에서 설정을 바꿔도 원본에는 영향이 없습니다.
          원본이 업데이트되면 "Sync fork" 버튼으로 최신 버전을 받을 수 있습니다.
        </p>
      </div>

      <h3 style={s.h3}>3. GitHub Actions 활성화</h3>
      <p style={s.p}>Fork한 저장소에서 자동 발행이 실행되려면 Actions를 켜야 합니다.</p>
      <StepList steps={[
        'Fork한 저장소 페이지에서 "Actions" 탭 클릭',
        '"I understand my workflows, go ahead and enable them" 버튼 클릭',
        '이제 매일 자동으로 글이 발행됩니다! (환경변수 설정 후)',
      ]} />

      <div style={s.warnBox}>
        <strong>Actions가 반드시 활성화되어야 합니다!</strong>
        <p style={{ margin: '6px 0 0', fontSize: 13 }}>
          Fork 직후에는 Actions가 비활성화 상태입니다. 위 단계를 건너뛰면 자동 발행이 작동하지 않습니다.
        </p>
      </div>

      <h3 style={s.h3}>4. Fork 최신 유지 (선택)</h3>
      <p style={s.p}>AutoBlog이 업데이트되면 내 Fork에도 반영하는 방법:</p>
      <StepList steps={[
        'Fork한 저장소 메인 페이지에서 "Sync fork" 버튼 확인',
        '"Update branch" 클릭하면 최신 코드 반영',
      ]} />
    </div>
  );
}

function GeminiStep() {
  return (
    <div>
      <h2 style={s.h2}>Gemini API 키 발급</h2>
      <p style={s.p}>
        Gemini는 Google의 AI 모델입니다. 블로그 글을 작성하는 "두뇌" 역할을 합니다.
        무료 티어로 하루 1,500회 요청이 가능하므로 블로그 운영에 충분합니다.
      </p>

      <h3 style={s.h3}>1. Google AI Studio 접속</h3>
      <StepList steps={[
        'Google 계정으로 aistudio.google.com 접속',
        '좌측 메뉴에서 "Get API key" 클릭',
        '"Create API key" 버튼 클릭',
        '프로젝트 선택 (기본 프로젝트 사용 OK)',
        '생성된 API 키를 복사하여 메모!',
      ]} />

      <div style={s.codeBlock}>
        API 키 형식 예시: AIzaSyA-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
      </div>

      <div style={s.warnBox}>
        <strong>API 키를 안전하게 보관하세요!</strong>
        <p style={{ margin: '6px 0 0', fontSize: 13 }}>
          이 키는 비밀번호와 같습니다. 블로그 글, 채팅, SNS에 절대 공유하지 마세요.
          GitHub Secrets에만 저장합니다 (뒤에서 설정).
        </p>
      </div>

      <h3 style={s.h3}>Gemini 무료 티어 한도</h3>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>항목</th>
            <th style={s.th}>무료 한도</th>
            <th style={s.th}>블로그 기준</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={s.td}>일일 요청</td><td style={s.td}>1,500회</td><td style={s.td}>하루 10편도 여유</td></tr>
          <tr><td style={s.td}>분당 요청</td><td style={s.td}>15회</td><td style={s.td}>충분</td></tr>
          <tr><td style={s.td}>월 비용</td><td style={s.td}>$0</td><td style={s.td}>완전 무료</td></tr>
        </tbody>
      </table>

      <div style={s.tipBox}>
        <div style={s.tipTitle}>왜 Gemini인가요?</div>
        <p style={s.tipText}>
          무료 한도가 넉넉하고, 한국어 글 품질이 좋습니다.
          다른 모델(DeepSeek, Claude, GPT)은 유료이거나 한도가 적습니다.
          Gemini 하나로 충분히 운영 가능합니다.
        </p>
      </div>
    </div>
  );
}

function SupabaseStep() {
  return (
    <div>
      <h2 style={s.h2}>Supabase 프로젝트 생성</h2>
      <p style={s.p}>
        Supabase는 발행 기록, 수익 데이터, 사용자 인증을 저장하는 데이터베이스입니다.
        비유하면 블로그의 "서류 캐비닛"입니다.
      </p>

      <h3 style={s.h3}>1. Supabase 가입 + 프로젝트 생성</h3>
      <StepList steps={[
        'supabase.com 접속 → "Start your project" 클릭',
        'GitHub 계정으로 로그인 (가장 편리)',
        '"New project" 클릭',
        'Organization: 기본 조직 선택',
        'Project name: my-autoblog (원하는 이름)',
        'Database Password: 강력한 비밀번호 입력 → 메모!',
        'Region: Northeast Asia (ap-northeast-1) 선택',
        '"Create new project" 클릭 → 2분 후 완료',
      ]} />

      <h3 style={s.h3}>2. API 키 확인</h3>
      <StepList steps={[
        '프로젝트 대시보드 → Settings → API',
        '다음 두 값을 메모합니다:',
      ]} />
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>항목</th>
            <th style={s.th}>위치</th>
            <th style={s.th}>용도</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={s.td}>Project URL</td><td style={s.td}>API Settings 상단</td><td style={s.td}>데이터베이스 주소</td></tr>
          <tr><td style={s.td}>anon/public key</td><td style={s.td}>Project API keys</td><td style={s.td}>프론트엔드 접근 키</td></tr>
          <tr><td style={s.td}>service_role key</td><td style={s.td}>Project API keys</td><td style={s.td}>백엔드 접근 키 (비밀)</td></tr>
        </tbody>
      </table>

      <div style={s.warnBox}>
        <strong>service_role key는 절대 프론트엔드에 노출하지 마세요!</strong>
        <p style={{ margin: '6px 0 0', fontSize: 13 }}>
          이 키는 데이터베이스 전체 접근 권한이 있습니다. GitHub Secrets에만 저장합니다.
        </p>
      </div>

      <h3 style={s.h3}>3. 데이터베이스 테이블 생성</h3>
      <p style={s.p}>Fork한 저장소의 <code style={s.code}>migrations/</code> 폴더에 SQL 파일이 있습니다. Supabase SQL Editor에서 실행합니다.</p>
      <StepList steps={[
        'Supabase 대시보드 → SQL Editor 클릭',
        'Fork한 저장소에서 migrations/ 폴더의 SQL 파일을 순서대로 복사',
        'SQL Editor에 붙여넣기 → "Run" 클릭',
        '모든 SQL 파일을 순서대로 실행 (001, 002, ...)',
      ]} />

      <div style={s.tipBox}>
        <div style={s.tipTitle}>테이블이 잘 생성되었는지 확인</div>
        <p style={s.tipText}>
          Supabase → Table Editor에서 sites, publish_logs, user_profiles 등의 테이블이 보이면 성공입니다.
        </p>
      </div>

      <h3 style={s.h3}>4. 인증 설정</h3>
      <StepList steps={[
        'Authentication → Providers → Email 활성화 (기본값)',
        'Authentication → URL Configuration → Site URL: 내 Vercel 도메인 입력 (나중에 설정 가능)',
      ]} />
    </div>
  );
}

function VercelStep() {
  return (
    <div>
      <h2 style={s.h2}>Vercel에 대시보드 배포</h2>
      <p style={s.p}>
        Vercel은 대시보드 웹사이트를 인터넷에 공개하는 서비스입니다.
        비유하면 가게의 "간판"을 거는 것입니다. GitHub에 코드를 올리면 자동으로 배포됩니다.
      </p>

      <h3 style={s.h3}>1. Vercel 가입</h3>
      <StepList steps={[
        'vercel.com 접속 → "Sign Up" 클릭',
        '"Continue with GitHub" 선택 (GitHub 계정 연동)',
        '권한 승인',
      ]} />

      <h3 style={s.h3}>2. 프로젝트 Import</h3>
      <StepList steps={[
        'Vercel 대시보드 → "Add New..." → "Project"',
        '"Import Git Repository"에서 Fork한 저장소 선택',
        'Framework Preset: Next.js (자동 감지됨)',
        '"Environment Variables" 섹션에서 아래 변수 추가:',
      ]} />

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Key</th>
            <th style={s.th}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={s.td}>NEXT_PUBLIC_SUPABASE_URL</td><td style={s.td}>Supabase Project URL</td></tr>
          <tr><td style={s.td}>NEXT_PUBLIC_SUPABASE_ANON_KEY</td><td style={s.td}>Supabase anon key</td></tr>
        </tbody>
      </table>

      <StepList steps={[
        '"Deploy" 클릭 → 1~2분 후 배포 완료!',
        '배포된 URL 확인 (예: my-autoblog.vercel.app)',
      ]} />

      <h3 style={s.h3}>3. 커스텀 도메인 연결 (선택)</h3>
      <p style={s.p}>대시보드에 내 도메인을 연결하고 싶다면:</p>
      <StepList steps={[
        'Vercel → Settings → Domains',
        '도메인 입력 (예: admin.myblog.com 또는 별도 도메인)',
        'DNS에 Vercel CNAME 레코드 추가',
        'SSL 자동 발급 확인',
      ]} />

      <div style={s.tipBox}>
        <div style={s.tipTitle}>자동 배포</div>
        <p style={s.tipText}>
          이후 GitHub에 코드를 Push하면 Vercel이 자동으로 재배포합니다.
          "Sync fork"로 AutoBlog을 업데이트하면 대시보드도 자동 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}

function SecretsStep() {
  return (
    <div>
      <h2 style={s.h2}>GitHub Secrets 설정</h2>
      <p style={s.p}>
        GitHub Actions가 자동 발행을 실행하려면 API 키와 비밀번호를 안전하게 저장해야 합니다.
        비유하면 자판기에 동전을 넣는 것입니다 — Secrets에 값을 넣어야 발행 엔진이 작동합니다.
      </p>

      <h3 style={s.h3}>설정 방법</h3>
      <StepList steps={[
        'Fork한 저장소 → Settings 탭',
        '좌측 메뉴 → Secrets and variables → Actions',
        '"New repository secret" 클릭',
        '아래 표의 각 항목을 하나씩 추가',
      ]} />

      <h3 style={s.h3}>필수 Secrets 목록</h3>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Name</th>
            <th style={s.th}>Value (어디서 얻나?)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...s.td, fontWeight: 600 }}>WP_URL</td>
            <td style={s.td}>워드프레스 주소 (예: https://myblog.com)</td>
          </tr>
          <tr>
            <td style={{ ...s.td, fontWeight: 600 }}>WP_USERNAME</td>
            <td style={s.td}>워드프레스 로그인 ID</td>
          </tr>
          <tr>
            <td style={{ ...s.td, fontWeight: 600 }}>WP_APP_PASSWORD</td>
            <td style={s.td}>STEP 1에서 생성한 앱 비밀번호</td>
          </tr>
          <tr>
            <td style={{ ...s.td, fontWeight: 600 }}>GEMINI_API_KEY</td>
            <td style={s.td}>Google AI Studio에서 발급한 API 키</td>
          </tr>
          <tr>
            <td style={{ ...s.td, fontWeight: 600 }}>SUPABASE_URL</td>
            <td style={s.td}>Supabase Project URL</td>
          </tr>
          <tr>
            <td style={{ ...s.td, fontWeight: 600 }}>SUPABASE_KEY</td>
            <td style={s.td}>Supabase service_role key</td>
          </tr>
          <tr>
            <td style={{ ...s.td, fontWeight: 600 }}>SITE_ID</td>
            <td style={s.td}>Supabase sites 테이블의 내 사이트 ID</td>
          </tr>
        </tbody>
      </table>

      <div style={s.tipBox}>
        <div style={s.tipTitle}>SITE_ID는 어디서 확인하나요?</div>
        <p style={s.tipText}>
          Supabase → Table Editor → sites 테이블에서 내 사이트의 id 컬럼 값을 확인합니다.
          아직 사이트가 없다면 다음 단계(첫 발행 테스트)에서 자동 생성됩니다.
        </p>
      </div>

      <h3 style={s.h3}>선택 Secrets (나중에 추가 가능)</h3>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Name</th>
            <th style={s.th}>용도</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={s.td}>UNSPLASH_ACCESS_KEY</td><td style={s.td}>무료 이미지 자동 삽입</td></tr>
          <tr><td style={s.td}>CLAUDE_API_KEY</td><td style={s.td}>AI 폴리싱 (선택, 유료)</td></tr>
          <tr><td style={s.td}>TELEGRAM_BOT_TOKEN</td><td style={s.td}>발행 알림 받기</td></tr>
          <tr><td style={s.td}>TELEGRAM_CHAT_ID</td><td style={s.td}>텔레그램 채팅방 ID</td></tr>
        </tbody>
      </table>

      <div style={s.warnBox}>
        <strong>Secrets는 한 번 저장하면 값을 다시 볼 수 없습니다.</strong>
        <p style={{ margin: '6px 0 0', fontSize: 13 }}>
          잘못 입력했다면 "Update" 버튼으로 덮어쓰기만 가능합니다.
          입력 전에 값을 다시 한번 확인하세요.
        </p>
      </div>
    </div>
  );
}

function FirstRunStep() {
  return (
    <div>
      <h2 style={s.h2}>첫 발행 테스트</h2>
      <p style={s.p}>
        모든 설정이 완료되었습니다! 이제 실제로 글이 발행되는지 테스트합니다.
      </p>

      <h3 style={s.h3}>수동 테스트 실행</h3>
      <StepList steps={[
        'Fork한 저장소 → Actions 탭',
        '좌측에서 "Auto Publish" (또는 publish) 워크플로우 선택',
        '"Run workflow" 드롭다운 클릭',
        '"Run workflow" 버튼 클릭',
        '실행이 시작되면 노란 원이 표시됩니다',
        '3~5분 후 초록 체크가 나오면 성공!',
      ]} />

      <div style={s.tipBox}>
        <div style={s.tipTitle}>성공 확인 방법</div>
        <p style={s.tipText}>
          워드프레스 관리자(wp-admin) → 글 목록에서 새 글이 보이면 성공입니다.
          Supabase → Table Editor → publish_logs에서도 기록을 확인할 수 있습니다.
        </p>
      </div>

      <h3 style={s.h3}>실패 시 체크리스트</h3>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>증상</th>
            <th style={s.th}>원인</th>
            <th style={s.th}>해결</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={s.td}>Actions 빨간 X</td>
            <td style={s.td}>Secrets 누락 또는 오타</td>
            <td style={s.td}>Settings → Secrets에서 값 재확인</td>
          </tr>
          <tr>
            <td style={s.td}>WP 연결 실패</td>
            <td style={s.td}>앱 비밀번호 오류</td>
            <td style={s.td}>WP_APP_PASSWORD 공백 포함 확인</td>
          </tr>
          <tr>
            <td style={s.td}>Gemini API 에러</td>
            <td style={s.td}>API 키 오류/미활성</td>
            <td style={s.td}>Google AI Studio에서 키 재생성</td>
          </tr>
          <tr>
            <td style={s.td}>글은 성공인데 DB 저장 실패</td>
            <td style={s.td}>Supabase 키 오류</td>
            <td style={s.td}>SUPABASE_URL, SUPABASE_KEY 확인</td>
          </tr>
        </tbody>
      </table>

      <h3 style={s.h3}>에러 로그 확인</h3>
      <StepList steps={[
        'Actions → 실패한 워크플로우 클릭',
        '빨간 X가 표시된 단계 클릭',
        '로그에서 에러 메시지 확인',
        '에러 내용을 planxsol@gmail.com으로 보내주시면 도움드립니다',
      ]} />
    </div>
  );
}

function DailyStep() {
  return (
    <div>
      <h2 style={s.h2}>운영 가이드 + 수익화 로드맵</h2>
      <p style={s.p}>
        설정 완료! 이제 GitHub Actions가 <strong>매일 자동으로 글을 발행</strong>합니다.
      </p>

      <h3 style={s.h3}>자동 발행 스케줄</h3>
      <p style={s.p}>
        기본 설정으로 하루 4회 (KST 07:00 / 12:00 / 17:00 / 22:00) 발행됩니다.
        변경하려면 <code style={s.code}>.github/workflows/publish.yml</code>에서 cron 스케줄을 수정하세요.
      </p>

      <h3 style={s.h3}>대시보드 사용법</h3>
      <p style={s.p}>배포한 Vercel URL로 접속하여 대시보드를 사용합니다.</p>
      <ul style={s.ul}>
        <li><strong>홈</strong> — 발행 현황, 수익, 건강 점수 한눈에</li>
        <li><strong>내 블로그</strong> — 발행된 글 목록, 품질 점수</li>
        <li><strong>수익</strong> — 월별 수익 추이, 채널별 비교</li>
        <li><strong>설정</strong> — 카테고리, 스케줄, 초기 세팅(메뉴/CSS/발행)</li>
      </ul>

      <h3 style={s.h3}>수익화 3단계</h3>
      <div style={stageCard('#3b82f6')}>
        <div style={stageHeader}>
          <span style={stageBadge('#3b82f6')}>1단계</span>
          <strong>콘텐츠 축적 (1~2주)</strong>
        </div>
        <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: '#4a5568', lineHeight: 1.8 }}>
          <li>매일 자동 발행으로 20편 이상 축적</li>
          <li>설정에서 메뉴/CSS 세팅 실행 (필수 페이지 자동 생성)</li>
          <li>20편 이상 쌓이면 구글 애드센스 신청</li>
        </ul>
      </div>

      <div style={stageCard('#f59e0b')}>
        <div style={stageHeader}>
          <span style={stageBadge('#f59e0b')}>2단계</span>
          <strong>수익 시작 (2~4주)</strong>
        </div>
        <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: '#4a5568', lineHeight: 1.8 }}>
          <li>애드센스 승인 → 자동 광고 삽입</li>
          <li>텐핑 가입 → 보험/카드 CPA (건당 3,000~8,000원)</li>
          <li>쿠팡 파트너스 → 수동 링크 삽입</li>
        </ul>
      </div>

      <div style={stageCard('#10b981')}>
        <div style={stageHeader}>
          <span style={stageBadge('#10b981')}>3단계</span>
          <strong>수익 극대화 (1개월+)</strong>
        </div>
        <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: '#4a5568', lineHeight: 1.8 }}>
          <li>쿠팡 API 자동화 (매출 15만원 달성 후 신청)</li>
          <li>고RPM 카테고리 비중 확대 (재테크, AI)</li>
          <li>목표: 월 30만원+ 자동 수익</li>
        </ul>
      </div>

      <div style={s.tipBox}>
        <div style={s.tipTitle}>현실적인 수익 기대치</div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 13, color: '#4a5568' }}>
          <li><strong>1개월:</strong> 애드센스 승인 + 월 1~3만원</li>
          <li><strong>2개월:</strong> 텐핑/쿠팡 추가 → 월 5~15만원</li>
          <li><strong>3개월+:</strong> 자동화 안정 → 월 20~50만원</li>
        </ul>
      </div>
    </div>
  );
}

function FaqStep() {
  const faqs = [
    {
      q: '코딩을 전혀 모르는데 가능한가요?',
      a: '이 매뉴얼의 모든 단계는 클릭과 복사-붙여넣기만으로 완료됩니다. 코딩 지식이 필요 없습니다. 막히는 부분이 있으면 이메일로 문의주세요.',
    },
    {
      q: '월 비용이 얼마인가요?',
      a: 'Cloudways 호스팅비 약 15,000원($11)/월이 전부입니다. Gemini API, GitHub, Supabase, Vercel 모두 무료입니다.',
    },
    {
      q: '글 품질은 어떤가요?',
      a: 'Gemini가 작성하는 한국어 글은 자연스럽고 SEO에 최적화되어 있습니다. 품질 점수 90점 이상이 대부분입니다.',
    },
    {
      q: 'Fork 후 업데이트는 어떻게 받나요?',
      a: 'GitHub에서 "Sync fork" → "Update branch" 클릭 한 번으로 최신 버전을 받을 수 있습니다. Vercel이 자동 재배포합니다.',
    },
    {
      q: '여러 블로그를 운영할 수 있나요?',
      a: '네. Fork를 여러 개 만들거나, 하나의 Fork에서 환경변수를 바꿔가며 운영할 수 있습니다.',
    },
    {
      q: 'GitHub Actions 무료 한도가 걱정됩니다.',
      a: '무료 계정은 월 2,000분입니다. 하루 4회 발행(회당 약 5분) = 월 600분이므로 여유롭습니다.',
    },
    {
      q: '애드센스 승인이 안 됩니다.',
      a: '20편 이상 + 필수 페이지(소개/개인정보/연락처) 확인 + HTTPS 적용 + "검색엔진 색인" 허용을 확인하세요. 설정에서 메뉴 세팅을 실행하면 필수 페이지가 자동 생성됩니다.',
    },
    {
      q: '워드프레스 연결이 안 됩니다.',
      a: '1) URL에 https:// 포함 확인 2) "앱 비밀번호"를 사용했는지 확인 (일반 비밀번호 아님!) 3) WP 버전 5.6 이상 확인 4) 보안 플러그인이 REST API를 차단하지 않는지 확인',
    },
    {
      q: 'Cloudways 대신 다른 호스팅도 되나요?',
      a: '자체 호스팅 WordPress면 모두 가능합니다. 카페24, 가비아, AWS 등 어디든 OK. 단, wordpress.com 무료 플랜은 REST API 제한이 있어 사용 불가합니다.',
    },
    {
      q: '발행된 글을 수정할 수 있나요?',
      a: '네. 워드프레스 관리자(wp-admin) → 글 목록에서 직접 수정 가능합니다.',
    },
  ];

  return (
    <div>
      <h2 style={s.h2}>자주 묻는 질문</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {faqs.map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>
    </div>
  );
}

/* ─── Reusable Sub-components ─── */

function StepList({ steps }) {
  return (
    <ol style={s.ol}>
      {steps.map((step, i) => (
        <li key={i} style={s.olLi}>{step}</li>
      ))}
    </ol>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden',
      background: open ? '#fff' : 'transparent',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '14px 16px', border: 'none', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 14, fontWeight: 600, color: '#1a1a2e', textAlign: 'left',
        }}
      >
        <span>{q}</span>
        <span style={{ fontSize: 12, color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          {'\u25BC'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#4a5568', lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── Layout Styles ─── */

const layout = {
  page: {
    minHeight: '100vh',
    background: '#f8f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 30,
    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #e2e8f0',
  },
  headerInner: {
    maxWidth: 1200, margin: '0 auto', padding: '12px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  loginBtn: {
    padding: '8px 20px', borderRadius: 8,
    background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600,
    textDecoration: 'none',
  },
  body: {
    maxWidth: 1200, margin: '0 auto', display: 'flex', minHeight: 'calc(100vh - 60px)',
  },
  sidebar: {
    width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #e2e8f0',
    display: 'flex', flexDirection: 'column', position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
  },
  mobileNav: {
    display: 'none',
  },
  main: {
    flex: 1, padding: 32, maxWidth: 780,
  },
  contentCard: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
};

/* ─── Stage Card Styles (used in DailyStep) ─── */

const stageCard = (color) => ({
  border: `1px solid ${color}30`,
  borderLeft: `4px solid ${color}`,
  borderRadius: 10, padding: 16, margin: '12px 0',
  background: `${color}08`,
});

const stageHeader = {
  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
  fontSize: 15, color: '#1a1a2e',
};

const stageBadge = (color) => ({
  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
  background: color, color: '#fff', fontSize: 11, fontWeight: 700,
});

/* ─── Content Styles ─── */

const s = {
  h2: { fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: '0 0 12px' },
  h3: { fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: '24px 0 10px' },
  p: { fontSize: 13, color: '#4a5568', lineHeight: 1.7, margin: '0 0 12px' },
  ul: { paddingLeft: 20, margin: '0 0 12px', fontSize: 13, color: '#4a5568', lineHeight: 1.8 },
  ol: { paddingLeft: 20, margin: '0 0 12px', fontSize: 13, color: '#4a5568', lineHeight: 1.8 },
  olLi: { marginBottom: 6 },

  navBtn: {
    padding: '10px 24px', borderRadius: 8, border: '1px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    color: '#4a5568',
  },
  navBtnPrimary: {
    background: '#7c3aed', color: '#fff', border: 'none',
  },
  contactBox: {
    marginTop: 24, padding: '16px 20px', borderRadius: 10,
    background: '#fff', border: '1px solid #e2e8f0',
    fontSize: 13, color: '#4a5568', textAlign: 'center',
  },

  tipBox: {
    background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: 10, padding: '14px 16px', margin: '16px 0',
  },
  tipTitle: { fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 4 },
  tipText: { fontSize: 13, color: '#4a5568', margin: 0, lineHeight: 1.6 },

  warnBox: {
    background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 10, padding: '14px 16px', margin: '16px 0',
    fontSize: 13, color: '#1a1a2e',
  },

  codeBlock: {
    background: '#f1f5f9', padding: '10px 14px', borderRadius: 8,
    fontFamily: 'monospace', fontSize: 13, marginTop: 8,
    border: '1px solid #e2e8f0', color: '#1a1a2e',
  },
  code: {
    background: '#f1f5f9', padding: '2px 6px', borderRadius: 4,
    fontFamily: 'monospace', fontSize: 12,
  },

  table: {
    width: '100%', borderCollapse: 'collapse', margin: '12px 0',
    fontSize: 13, borderRadius: 8, overflow: 'hidden',
  },
  th: {
    padding: '10px 14px', background: 'rgba(59,130,246,0.08)',
    fontWeight: 600, color: '#1a1a2e', textAlign: 'left',
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '10px 14px', borderBottom: '1px solid #e2e8f0',
    color: '#4a5568',
  },
};
