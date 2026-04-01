'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, signOut } from '@/lib/supabase';
import { useAuth, useCurrentUser, useUserSites, usePlanFeatures } from '@/lib/auth';
import { CONSUMER_CATEGORIES } from '@/lib/plan-features';
import { Card, SectionTitle, Badge, InputField, ActionButton, PillButton } from '@/components/ui';

// ── Constants ──

const SCHEDULE_PRESETS = [
  { id: 'daily2', label: '매일 2회', desc: '08:00, 18:00' },
  { id: 'daily4', label: '매일 4회', desc: '07/12/17/22시' },
  { id: 'weekday', label: '평일만', desc: '평일 08:00' },
  { id: 'custom', label: '직접 설정', desc: 'Premium 전용' },
];

const SETUP_ACTIONS = [
  { id: 'setup-menu', step: 1, label: '메뉴 자동 설정',
    desc: 'About, Privacy, Contact 등 필수 페이지 + 네비게이션 메뉴 생성',
    icon: '\uD83D\uDCCC', successMsg: '메뉴 설정 완료!' },
  { id: 'inject-css', step: 2, label: 'CSS 디자인 적용',
    desc: '블로그 테마에 맞춤 스타일링 자동 적용',
    icon: '\uD83C\uDFA8', successMsg: 'CSS 적용 완료!' },
  { id: 'publish', step: 3, label: '첫 글 발행 (3편)',
    desc: 'AI가 자동으로 3편의 글을 작성하여 발행',
    icon: '\uD83D\uDCDD', inputs: { count: '3' }, successMsg: '발행 시작!' },
];

const STEPS = [
  { id: 1, label: '사이트 연결', icon: '\uD83C\uDF10' },
  { id: 2, label: 'WordPress 설정', icon: '\u2699' },
  { id: 3, label: '콘텐츠 설정', icon: '\uD83D\uDCC2' },
];

// ── Page ──

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { displayName, planId } = useCurrentUser();
  const { plan, isPremiumOrAbove } = usePlanFeatures();
  const { sites, activeSite, setActiveSite, refreshSites } = useUserSites();
  const site = activeSite;

  // Config
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [nameEdit, setNameEdit] = useState(displayName);
  const [schedulePreset, setSchedulePreset] = useState('daily2');
  const [selectedCats, setSelectedCats] = useState([]);

  // Site registration / editing
  const [siteMode, setSiteMode] = useState('view'); // 'view' | 'edit' | 'register'
  const [wpUrl, setWpUrl] = useState('');
  const [wpUser, setWpUser] = useState('');
  const [wpPassword, setWpPassword] = useState('');
  const [siteTestResult, setSiteTestResult] = useState(null);
  const [savingSite, setSavingSite] = useState(false);

  // Setup actions (persistent)
  const [setupLog, setSetupLog] = useState([]);
  const [setupRunning, setSetupRunning] = useState({});

  // Load config + setup log
  useEffect(() => {
    if (!site?.id) return;
    supabase.from('dashboard_config').select('config').eq('site_id', site.id).single()
      .then(({ data }) => {
        if (data?.config) {
          setConfig(data.config);
          setSchedulePreset(data.config.schedule_preset || 'daily2');
          setSelectedCats(data.config.niches || []);
          setSetupLog(data.config.setup_log || []);
        } else {
          setConfig(null);
          setSchedulePreset('daily2');
          setSelectedCats([]);
          setSetupLog([]);
        }
      });
  }, [site?.id]);

  // Auto-enter register mode if no site
  useEffect(() => {
    if (!site && sites.length === 0) {
      setSiteMode('register');
    }
  }, [site, sites.length]);

  // ── Step completion ──
  const siteConnected = !!site;
  const completedSetupIds = useMemo(() => setupLog.map(l => l.action), [setupLog]);
  const wpSetupDone = SETUP_ACTIONS.every(a => completedSetupIds.includes(a.id));
  const contentConfigured = selectedCats.length >= 1 && schedulePreset;

  const currentStepComplete = (stepId) => {
    if (stepId === 1) return siteConnected;
    if (stepId === 2) return wpSetupDone;
    if (stepId === 3) return contentConfigured;
    return false;
  };

  // ── Site actions ──

  const normalizeUrl = (raw) => {
    let u = raw.trim().replace(/\/$/, '');
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return u;
  };

  const testConnection = async () => {
    setSiteTestResult('testing');
    try {
      const url = normalizeUrl(wpUrl);
      const res = await fetch(`${url}/wp-json/wp/v2/posts?per_page=1`, {
        headers: { Authorization: 'Basic ' + btoa(`${wpUser}:${wpPassword}`) },
      });
      setSiteTestResult(res.ok ? 'success' : 'failed');
    } catch {
      setSiteTestResult('failed');
    }
  };

  const registerSite = async () => {
    if (!user) return;
    setSavingSite(true);
    try {
      const siteUrl = normalizeUrl(wpUrl);
      const domain = new URL(siteUrl).hostname;

      // Check existing by domain
      const { data: existing } = await supabase
        .from('sites').select('*').eq('domain', domain).single();

      let newSite;
      if (existing) {
        await supabase.from('sites').update({
          owner_id: user.id, wp_url: siteUrl,
          config: { wp_username: wpUser, wp_app_password: wpPassword },
        }).eq('id', existing.id);
        newSite = existing;
      } else {
        const newId = `site-${Date.now()}`;
        const { data: created } = await supabase
          .from('sites')
          .insert({
            id: newId, name: domain, domain, wp_url: siteUrl,
            owner_id: user.id, status: 'active',
            config: { wp_username: wpUser, wp_app_password: wpPassword },
          })
          .select().single();
        newSite = created;
      }

      if (newSite) {
        await supabase.from('user_sites').upsert({
          user_id: user.id, site_id: newSite.id, role: 'owner',
        });
        setActiveSite(newSite.id);

        // Mark onboarding complete if first site
        await supabase.from('user_profiles').update({
          onboarding_completed: true,
          onboarding_step: 5,
        }).eq('id', user.id);
        refreshProfile();
      }

      await refreshSites();
      setSiteMode('view');
      resetSiteForm();
    } catch (err) {
      console.error('Register error:', err);
    }
    setSavingSite(false);
  };

  const updateSite = async () => {
    if (!user || !site?.id) return;
    setSavingSite(true);
    try {
      const siteUrl = normalizeUrl(wpUrl);
      const domain = new URL(siteUrl).hostname;

      await supabase.from('sites').update({
        wp_url: siteUrl, domain, name: domain,
        config: { wp_username: wpUser, wp_app_password: wpPassword },
      }).eq('id', site.id);

      await refreshSites();
      setSiteMode('view');
      resetSiteForm();
    } catch (err) {
      console.error('Update error:', err);
    }
    setSavingSite(false);
  };

  const startEdit = () => {
    setSiteMode('edit');
    setWpUrl(site?.wp_url || '');
    setWpUser(site?.config?.wp_username || '');
    setWpPassword(site?.config?.wp_app_password || '');
    setSiteTestResult(null);
  };

  const startRegister = () => {
    setSiteMode('register');
    resetSiteForm();
  };

  const resetSiteForm = () => {
    setWpUrl('');
    setWpUser('');
    setWpPassword('');
    setSiteTestResult(null);
  };

  // ── Setup actions ──

  const runSetupAction = async (action) => {
    setSetupRunning(prev => ({ ...prev, [action.id]: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ action: action.id, siteId: site?.id, inputs: action.inputs || {} }),
      });
      const data = await res.json();

      if (data.success) {
        const logEntry = {
          action: action.id, label: action.label,
          completed_at: new Date().toISOString(), status: 'success',
        };
        const updatedLog = [...setupLog.filter(l => l.action !== action.id), logEntry];
        setSetupLog(updatedLog);
        await persistSetupLog(updatedLog);
      } else {
        const logEntry = {
          action: action.id, label: action.label,
          completed_at: new Date().toISOString(), status: 'failed',
          error: data.error || '실패',
        };
        const updatedLog = [...setupLog.filter(l => l.action !== action.id), logEntry];
        setSetupLog(updatedLog);
        await persistSetupLog(updatedLog);
      }
    } catch {
      const logEntry = {
        action: action.id, label: action.label,
        completed_at: new Date().toISOString(), status: 'failed', error: '네트워크 오류',
      };
      const updatedLog = [...setupLog.filter(l => l.action !== action.id), logEntry];
      setSetupLog(updatedLog);
      await persistSetupLog(updatedLog);
    }
    setSetupRunning(prev => ({ ...prev, [action.id]: false }));
  };

  const persistSetupLog = async (log) => {
    if (!site?.id) return;
    const merged = { ...(config || {}), setup_log: log };
    setConfig(merged);
    await supabase.from('dashboard_config').upsert({
      site_id: site.id, config: merged,
    });
  };

  // ── Content settings ──

  const toggleCat = (slug) => {
    setSelectedCats(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const saveSettings = async () => {
    if (!user || !site?.id) return;
    setSaving(true);
    try {
      await Promise.all([
        supabase.from('user_profiles').update({ display_name: nameEdit }).eq('id', user.id),
        supabase.from('dashboard_config').upsert({
          site_id: site.id,
          config: { ...config, niches: selectedCats, schedule_preset: schedulePreset },
        }),
      ]);
      refreshProfile();
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  // ── Render ──

  const formReady = wpUrl && wpUser && wpPassword;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>설정</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge text={plan.name} color={planId === 'premium' ? 'purple' : planId === 'mama' ? 'yellow' : 'blue'} />
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{user?.email}</span>
        </div>
      </div>

      {/* ── Step Progress ── */}
      <Card style={{ marginBottom: 24, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((step, i) => {
            const done = currentStepComplete(step.id);
            const active = !done && (step.id === 1 || currentStepComplete(step.id - 1));
            return (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700,
                    background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border-light)',
                    color: done || active ? '#fff' : 'var(--text-dim)',
                    transition: 'all 0.3s',
                  }}>
                    {done ? '\u2713' : step.id}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 12, fontWeight: 600,
                      color: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--text-dim)',
                    }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      {done ? '완료' : active ? '진행 중' : '대기'}
                    </div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, margin: '0 12px',
                    background: done ? 'var(--green)' : 'var(--border-light)',
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── STEP 1: Site Connection ── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle action={
          site && siteMode === 'view' ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={startEdit}
                style={{ border: 'none', background: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                수정
              </button>
              {sites.length < (plan.maxSites === 999 ? 100 : plan.maxSites) && (
                <button onClick={startRegister}
                  style={{ border: 'none', background: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  + 추가
                </button>
              )}
            </div>
          ) : null
        }>
          STEP 1 &mdash; 사이트 연결
        </SectionTitle>

        {/* View mode */}
        {site && siteMode === 'view' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={st.iconCircle}>{'\uD83C\uDF10'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{site.domain || site.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {'\u2705'} 연결됨
                  {site.domain && (
                    <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer"
                      style={{ marginLeft: 8, color: 'var(--accent)', textDecoration: 'none' }}>
                      방문 {'\u2197'}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Site details table */}
            <div style={st.detailBox}>
              <DetailRow label="WordPress URL" value={site.wp_url || '-'} />
              <DetailRow label="도메인" value={site.domain || '-'} />
              <DetailRow label="사용자명" value={site.config?.wp_username || '-'} />
              <DetailRow label="앱 비밀번호" value={site.config?.wp_app_password ? '********' : '-'} />
              <DetailRow label="등록일" value={site.created_at ? new Date(site.created_at).toLocaleDateString('ko-KR') : '-'} last />
            </div>

            {/* Other linked sites */}
            {sites.length > 1 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>
                  내 사이트 ({sites.length}개)
                </div>
                {sites.map(s => (
                  <button key={s.id}
                    onClick={() => setActiveSite(s.id)}
                    style={{
                      ...st.siteListItem,
                      border: s.id === site.id ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                      background: s.id === site.id ? 'var(--accent-bg)' : 'var(--card)',
                    }}>
                    <span style={{ fontSize: 13, fontWeight: s.id === site.id ? 600 : 400, color: 'var(--text)' }}>
                      {s.domain || s.name}
                    </span>
                    {s.id === site.id && (
                      <Badge text="활성" color="purple" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Register / Edit mode */}
        {(siteMode === 'register' || siteMode === 'edit') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {siteMode === 'register' && (
              <div style={{ padding: 12, background: 'var(--accent-bg)', borderRadius: 10, fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                {'\uD83C\uDF10'} 새 WordPress 사이트를 연결합니다. 블로그 주소와 앱 비밀번호를 입력하세요.
              </div>
            )}
            <div>
              <label style={st.label}>WordPress URL</label>
              <InputField value={wpUrl} onChange={setWpUrl} placeholder="https://your-blog.com" />
            </div>
            <div>
              <label style={st.label}>사용자명</label>
              <InputField value={wpUser} onChange={setWpUser} placeholder="WordPress 사용자명" />
            </div>
            <div>
              <label style={st.label}>앱 비밀번호</label>
              <InputField value={wpPassword} onChange={setWpPassword} placeholder="WordPress 앱 비밀번호" type="password" />
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                WordPress 관리자 &rarr; 사용자 &rarr; 프로필 &rarr; 앱 비밀번호에서 생성
              </div>
            </div>

            {/* Test result */}
            {siteTestResult === 'success' && (
              <div style={{ ...st.testBanner, background: 'var(--green-bg)', color: 'var(--green)' }}>
                {'\u2705'} 연결 성공! WordPress API가 정상 응답합니다.
              </div>
            )}
            {siteTestResult === 'failed' && (
              <div style={{ ...st.testBanner, background: 'var(--red-bg)', color: 'var(--red)' }}>
                {'\u274C'} 연결 실패. URL, 사용자명, 앱 비밀번호를 확인해주세요.
              </div>
            )}
            {siteTestResult === 'testing' && (
              <div style={{ ...st.testBanner, background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                연결 테스트 중...
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <ActionButton variant="secondary" onClick={testConnection}
                disabled={!formReady} style={{ flex: 1 }}>
                연결 테스트
              </ActionButton>
              <ActionButton
                onClick={siteMode === 'register' ? registerSite : updateSite}
                disabled={!formReady || savingSite}
                style={{ flex: 1 }}>
                {savingSite ? '저장 중...' : siteMode === 'register' ? '사이트 등록' : '변경 저장'}
              </ActionButton>
              {(site || sites.length > 0) && (
                <ActionButton variant="ghost" onClick={() => { setSiteMode('view'); resetSiteForm(); }}
                  style={{ padding: '8px 14px' }}>
                  취소
                </ActionButton>
              )}
            </div>

            {siteMode === 'edit' && (
              <div style={{ padding: 10, background: 'var(--accent-bg)', borderRadius: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                {'\uD83D\uDCA1'} 블로그 주소를 변경하면 해당 블로그의 데이터로 전환됩니다.
              </div>
            )}
          </div>
        )}

        {/* No site, not in register mode */}
        {!site && siteMode === 'view' && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{'\uD83C\uDF10'}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
              사이트를 연결해주세요
            </div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>
              WordPress 사이트를 연결하면 자동 발행이 시작됩니다.
            </div>
            <ActionButton onClick={startRegister}>사이트 등록</ActionButton>
          </div>
        )}
      </Card>

      {/* ── STEP 2: WordPress Setup ── */}
      <Card style={{ marginBottom: 20, opacity: siteConnected ? 1 : 0.5, pointerEvents: siteConnected ? 'auto' : 'none' }}>
        <SectionTitle>STEP 2 &mdash; WordPress 초기 설정</SectionTitle>
        {!siteConnected && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
            {'\uD83D\uDD12'} STEP 1에서 사이트를 먼저 연결해주세요.
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
          순서대로 실행하세요: 메뉴 &rarr; CSS &rarr; 글 발행. 각 작업은 독립적으로 재실행할 수 있습니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SETUP_ACTIONS.map((action, idx) => {
            const logEntry = setupLog.find(l => l.action === action.id);
            const isDone = logEntry?.status === 'success';
            const isFailed = logEntry?.status === 'failed';
            const isRunning = setupRunning[action.id];
            // Previous step must be done (sequential)
            const prevDone = idx === 0 || setupLog.find(l => l.action === SETUP_ACTIONS[idx - 1].id)?.status === 'success';

            return (
              <div key={action.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderRadius: 12,
                border: isDone ? '1px solid var(--green)' : '1px solid var(--border-light)',
                background: isDone ? 'var(--green-bg)' : 'var(--card)',
                opacity: prevDone ? 1 : 0.5,
              }}>
                {/* Step number */}
                <div style={{
                  width: 28, height: 28, borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone ? 'var(--green)' : 'var(--border-light)',
                  color: isDone ? '#fff' : 'var(--text-dim)',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {isDone ? '\u2713' : action.step}
                </div>
                <div style={{ fontSize: 20, flexShrink: 0 }}>{action.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{action.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    {isDone && logEntry?.completed_at
                      ? `${action.successMsg} (${new Date(logEntry.completed_at).toLocaleString('ko-KR')})`
                      : isFailed
                        ? `\u274C ${logEntry?.error || '실패'}. 다시 시도해주세요.`
                        : action.desc}
                  </div>
                </div>
                <ActionButton
                  variant={isDone ? 'ghost' : 'secondary'}
                  disabled={isRunning || !prevDone}
                  onClick={() => runSetupAction(action)}
                  style={{ fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap' }}
                >
                  {isRunning ? '실행 중...' : isDone ? '재실행' : '실행'}
                </ActionButton>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── STEP 3: Content Settings ── */}
      <Card style={{ marginBottom: 20, opacity: siteConnected ? 1 : 0.5, pointerEvents: siteConnected ? 'auto' : 'none' }}>
        <SectionTitle>STEP 3 &mdash; 콘텐츠 설정</SectionTitle>

        {/* Schedule */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
            발행 스케줄
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SCHEDULE_PRESETS.map(preset => {
              const locked = preset.id === 'custom' && !isPremiumOrAbove;
              return (
                <button key={preset.id} onClick={() => !locked && setSchedulePreset(preset.id)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 10,
                  border: schedulePreset === preset.id ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                  background: schedulePreset === preset.id ? 'var(--accent-bg)' : 'var(--card)',
                  cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : 1,
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{preset.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{preset.desc}</div>
                  </div>
                  {locked && <Badge text="Premium" color="purple" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
            카테고리 (최소 2개)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {CONSUMER_CATEGORIES.map(group => (
              <div key={group.id}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {group.items.map(item => {
                    const locked = !item.plans.includes(planId);
                    return (
                      <PillButton key={item.slug} selected={selectedCats.includes(item.slug)}
                        onClick={() => !locked && toggleCat(item.slug)} disabled={locked}>
                        {item.icon} {item.ko}
                        {locked && ' \uD83D\uDD12'}
                      </PillButton>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10 }}>
            선택: {selectedCats.length}/{plan.maxCategories === 999 ? '무제한' : plan.maxCategories}개
          </div>
        </div>
      </Card>

      {/* ── Setup Log ── */}
      {setupLog.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <SectionTitle>설정 기록</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...setupLog].sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || '')).map((entry, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8,
                background: entry.status === 'success' ? 'var(--green-bg)' : 'var(--red-bg)',
              }}>
                <span style={{ fontSize: 14 }}>
                  {entry.status === 'success' ? '\u2705' : '\u274C'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                    {entry.label || entry.action}
                  </div>
                  {entry.error && (
                    <div style={{ fontSize: 11, color: 'var(--red)' }}>{entry.error}</div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                  {entry.completed_at ? new Date(entry.completed_at).toLocaleString('ko-KR') : ''}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Profile ── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>내 정보</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={st.label}>이름</label>
            <InputField value={nameEdit} onChange={setNameEdit} placeholder="표시 이름" />
          </div>
          <div>
            <label style={st.label}>이메일</label>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '10px 0' }}>
              {user?.email}
            </div>
          </div>
          <div>
            <label style={st.label}>플랜</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge text={plan.name} color={planId === 'premium' ? 'purple' : planId === 'mama' ? 'yellow' : 'blue'} />
              {planId === 'standard' && (
                <button onClick={() => router.push('/upgrade')}
                  style={{ border: 'none', background: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  업그레이드 &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
        <ActionButton onClick={saveSettings} disabled={saving || !site} style={{ flex: 1 }}>
          {saving ? '저장 중...' : '설정 저장'}
        </ActionButton>
        <ActionButton variant="ghost" onClick={handleSignOut} style={{ color: 'var(--red)' }}>
          로그아웃
        </ActionButton>
      </div>
    </div>
  );
}

// ── Sub-components ──

function DetailRow({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '8px 0',
      borderBottom: last ? 'none' : '1px solid var(--card-border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

// ── Styles ──

const st = {
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 10, background: 'var(--accent-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
  },
  detailBox: {
    padding: '4px 14px', background: 'var(--input-bg)', borderRadius: 10,
  },
  testBanner: {
    padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500,
  },
  siteListItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
    marginBottom: 4, background: 'var(--card)', transition: 'all 0.15s',
  },
};
