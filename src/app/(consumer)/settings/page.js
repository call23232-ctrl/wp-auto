'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, signOut } from '@/lib/supabase';
import { useAuth, useCurrentUser, useUserSites, usePlanFeatures } from '@/lib/auth';
import { CONSUMER_CATEGORIES } from '@/lib/plan-features';
import { Card, SectionTitle, Badge, InputField, ActionButton, PillButton, Toggle } from '@/components/ui';

const SCHEDULE_PRESETS = [
  { id: 'daily2', label: '매일 2회', desc: '08:00, 18:00' },
  { id: 'daily4', label: '매일 4회', desc: '07/12/17/22시' },
  { id: 'weekday', label: '평일만', desc: '평일 08:00' },
  { id: 'custom', label: '직접 설정', desc: 'Premium 전용' },
];

const SETUP_ACTIONS = [
  { id: 'setup-menu', label: '메뉴 자동 설정', desc: 'About, Privacy, Contact 등 필수 페이지 + 네비게이션 메뉴 생성',
    icon: '📌', successMsg: '메뉴 설정 완료! 1~2분 후 사이트에 반영됩니다.' },
  { id: 'inject-css', label: 'CSS 디자인 적용', desc: '블로그 테마에 맞춤 스타일링 자동 적용',
    icon: '🎨', successMsg: 'CSS 적용 완료! 1~2분 후 사이트에 반영됩니다.' },
  { id: 'publish', label: '첫 글 발행 (3편)', desc: 'AI가 자동으로 3편의 글을 작성하여 발행',
    icon: '📝', inputs: { count: '3' }, successMsg: '발행 시작! 5~10분 후 블로그에 글이 올라갑니다.' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { displayName, planId } = useCurrentUser();
  const { plan, isPremiumOrAbove } = usePlanFeatures();
  const { sites } = useUserSites();
  const site = sites[0];

  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [nameEdit, setNameEdit] = useState(displayName);
  const [schedulePreset, setSchedulePreset] = useState('daily2');
  const [selectedCats, setSelectedCats] = useState([]);
  const [setupStatus, setSetupStatus] = useState({});

  useEffect(() => {
    if (!site?.id) return;
    supabase.from('dashboard_config').select('config').eq('site_id', site.id).single()
      .then(({ data }) => {
        if (data?.config) {
          setConfig(data.config);
          setSchedulePreset(data.config.schedule_preset || 'daily2');
          setSelectedCats(data.config.niches || []);
        }
      });
  }, [site?.id]);

  const toggleCat = (slug) => {
    setSelectedCats(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
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

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>설정</h1>
      </div>

      {/* Profile */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>내 정보</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={styles.label}>이름</label>
            <InputField value={nameEdit} onChange={setNameEdit} placeholder="표시 이름" />
          </div>
          <div>
            <label style={styles.label}>이메일</label>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '10px 0' }}>
              {user?.email}
            </div>
          </div>
          <div>
            <label style={styles.label}>플랜</label>
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

      {/* Site */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>내 사이트</SectionTitle>
        {site ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>{'🌐'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{site.name || site.domain}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                {'✅'} 연결됨
                {site.domain && (
                  <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer"
                    style={{ marginLeft: 8, color: 'var(--accent)', textDecoration: 'none' }}>
                    방문 {'↗'}
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 13 }}>
            연결된 사이트가 없습니다
          </div>
        )}
        {isPremiumOrAbove && sites.length < plan.maxSites && (
          <div style={{ marginTop: 12 }}>
            <ActionButton variant="ghost" style={{ fontSize: 12 }}
              onClick={() => alert('사이트 추가 기능은 준비 중입니다. 곧 업데이트됩니다!')}>
              + 사이트 추가 (최대 {plan.maxSites === 999 ? '무제한' : plan.maxSites}개)
            </ActionButton>
          </div>
        )}
      </Card>

      {/* Schedule */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>발행 스케줄</SectionTitle>
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
      </Card>

      {/* Categories */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>카테고리</SectionTitle>
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
                      {locked && ' 🔒'}
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
      </Card>

      {/* Initial Setup */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>초기 설정</SectionTitle>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
          WordPress 사이트에 필수 페이지, 디자인, 첫 글을 자동으로 설정합니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SETUP_ACTIONS.map(action => {
            const status = setupStatus[action.id];
            const isLoading = status === 'loading';
            const isDone = status === 'done';
            const isFailed = status === 'failed';
            return (
              <div key={action.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderRadius: 12, border: isDone ? '1px solid var(--green)' : '1px solid var(--border-light)',
                background: isDone ? 'var(--green-bg)' : 'var(--card)',
              }}>
                <div style={{ fontSize: 24 }}>{action.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{action.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    {isDone ? action.successMsg : isFailed ? `❌ ${setupStatus[`${action.id}_error`] || '실패'}. 다시 시도해주세요.` : action.desc}
                  </div>
                </div>
                <ActionButton
                  variant={isDone ? 'ghost' : 'secondary'}
                  disabled={isLoading}
                  onClick={async () => {
                    setSetupStatus(prev => ({ ...prev, [action.id]: 'loading' }));
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const res = await fetch('/api/setup', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session?.access_token || ''}`,
                        },
                        body: JSON.stringify({ action: action.id, inputs: action.inputs || {} }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setSetupStatus(prev => ({ ...prev, [action.id]: 'done' }));
                      } else {
                        setSetupStatus(prev => ({ ...prev, [action.id]: 'failed', [`${action.id}_error`]: data.error || '실패' }));
                      }
                    } catch {
                      setSetupStatus(prev => ({ ...prev, [action.id]: 'failed' }));
                    }
                  }}
                  style={{ fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap' }}
                >
                  {isLoading ? '실행 중...' : isDone ? '✅ 완료' : '실행'}
                </ActionButton>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, padding: 10, background: 'var(--input-bg)', borderRadius: 8, fontSize: 11, color: 'var(--text-dim)' }}>
          {'💡'} 처음 설정 시 메뉴 → CSS → 글 발행 순서로 실행하는 것을 추천합니다.
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
        <ActionButton onClick={saveSettings} disabled={saving} style={{ flex: 1 }}>
          {saving ? '저장 중...' : '설정 저장'}
        </ActionButton>
        <ActionButton variant="ghost" onClick={handleSignOut} style={{ color: 'var(--red)' }}>
          로그아웃
        </ActionButton>
      </div>
    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },
};
