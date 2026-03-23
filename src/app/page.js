'use client';
import { useState } from 'react';
import { useSites, useTodayStats, useRecentPosts, useMonthlyRevenue, useMonthlyCosts, useAlerts, usePublishTrend } from '@/lib/hooks';
import { supabase, isConfigured } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

// ── 탭 목록 ──
const TABS = [
  { label: '개요', icon: '◎' },
  { label: '발행 로그', icon: '⊞' },
  { label: '수익', icon: '↗' },
  { label: '비용', icon: '◈' },
  { label: '알림', icon: '⚡' },
  { label: 'AI 모델', icon: '⚙' },
  { label: '설정', icon: '☰' },
];

// ── AI 모델 옵션 ──
const DRAFT_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek V3', costPer: 35, speed: '빠름', quality: '보통' },
  { id: 'grok-3', name: 'Grok 3', costPer: 120, speed: '보통', quality: '높음' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', costPer: 90, speed: '보통', quality: '높음' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', costPer: 25, speed: '매우 빠름', quality: '보통' },
  { id: 'gpt-5-mini', name: 'GPT-5 mini', costPer: 60, speed: '빠름', quality: '높음' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini', costPer: 45, speed: '빠름', quality: '보통' },
];

const POLISH_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', costPer: 80 },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', costPer: 30 },
  { id: 'none', name: '폴리싱 OFF', costPer: 0 },
];

// ── 공통 컴포넌트 ──
function Card({ children, style, hover }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--card-border)',
      borderRadius: 16,
      padding: 24,
      boxShadow: 'var(--card-shadow)',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      animation: 'fadeIn 0.3s ease',
      ...style
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <Card style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -8, right: -8, fontSize: 48, opacity: 0.04,
        fontWeight: 900, color: color || 'var(--text)'
      }}>{icon || '●'}</div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 500, letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--text)', letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

function Badge({ text, color }) {
  const colors = {
    green: { bg: 'var(--green-bg)', text: 'var(--green)' },
    red: { bg: 'var(--red-bg)', text: 'var(--red)' },
    yellow: { bg: 'var(--yellow-bg)', text: 'var(--yellow)' },
    blue: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
    purple: { bg: 'var(--accent-bg)', text: 'var(--accent)' },
  };
  const c = colors[color] || colors.blue;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 8,
      fontSize: 11, fontWeight: 600, background: c.bg, color: c.text
    }}>{text}</span>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{children}</h3>
      {action}
    </div>
  );
}

function fmt(n) { return (n || 0).toLocaleString('ko-KR'); }
function fmtKRW(n) { return '₩' + fmt(n); }

// ── 차트 공통 스타일 ──
const CHART_TOOLTIP = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid var(--border-light)',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontSize: 12
  }
};
const CHART_GRID = { strokeDasharray: '3 3', stroke: 'rgba(0,0,0,0.06)' };
const CHART_TICK = { fill: '#94a3b8', fontSize: 11 };

// ── 메인 ──
export default function Dashboard() {
  const [tab, setTab] = useState(0);
  const [selectedSite, setSelectedSite] = useState('site-1');
  const { sites } = useSites();

  if (!isConfigured) {
    return <SetupGuide />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* 헤더 */}
      <header style={{
        background: 'var(--header-gradient)',
        borderBottom: '1px solid var(--card-border)',
        padding: '24px 24px 0'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, color: 'var(--text)' }}>
                <span style={{ color: 'var(--accent)' }}>AutoBlog</span>{' '}
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Dashboard</span>
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                수익 자동화 통합 대시보드 · {sites.length}개 사이트 운영 중
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                style={{
                  background: 'var(--card)', border: '1px solid var(--border-light)',
                  borderRadius: 10, padding: '8px 14px', color: 'var(--text)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--green-bg)', padding: '6px 14px', borderRadius: 20
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--green)', animation: 'pulse 2s infinite'
                }} />
                <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>Realtime 연결됨</span>
              </div>
            </div>
          </div>

          {/* 탭 */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {TABS.map((t, i) => (
              <button key={t.label} onClick={() => setTab(i)} style={{
                padding: '10px 20px', border: 'none', borderRadius: '12px 12px 0 0',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                background: tab === i ? 'var(--card)' : 'transparent',
                color: tab === i ? 'var(--accent)' : 'var(--text-dim)',
                boxShadow: tab === i ? '0 -2px 8px rgba(0,0,0,0.03)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 48px' }}>
        {tab === 0 && <OverviewTab siteId={selectedSite} />}
        {tab === 1 && <PostsTab siteId={selectedSite} />}
        {tab === 2 && <RevenueTab siteId={selectedSite} />}
        {tab === 3 && <CostsTab siteId={selectedSite} />}
        {tab === 4 && <AlertsTab siteId={selectedSite} />}
        {tab === 5 && <AIModelTab siteId={selectedSite} />}
        {tab === 6 && <SettingsTab siteId={selectedSite} sites={sites} />}
      </main>
    </div>
  );
}

// ── 개요 탭 ──
function OverviewTab({ siteId }) {
  const { stats } = useTodayStats(siteId);
  const { total: rev } = useMonthlyRevenue(siteId);
  const { costs } = useMonthlyCosts(siteId);
  const { trend } = usePublishTrend(siteId, 7);
  const { alerts } = useAlerts(siteId);

  const unread = alerts.filter(a => !a.is_read).length;
  const profit = rev.krw - costs.total_krw;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard
          label="오늘 발행" icon="✎"
          value={`${stats.posts}편`}
          sub={stats.failures > 0 ? `${stats.failures}건 실패` : '전체 성공'}
          color="var(--accent)"
        />
        <StatCard
          label="이번 달 수익" icon="↗"
          value={fmtKRW(rev.krw)}
          sub={rev.usd > 0 ? `$${rev.usd.toFixed(2)}` : ''}
          color="var(--green)"
        />
        <StatCard
          label="이번 달 비용" icon="◈"
          value={fmtKRW(costs.total_krw)}
          color="var(--yellow)"
        />
        <StatCard
          label="순이익" icon="★"
          value={fmtKRW(profit)}
          sub={costs.total_krw > 0 ? `ROI ${((profit / costs.total_krw) * 100).toFixed(0)}%` : ''}
          color={profit >= 0 ? 'var(--green)' : 'var(--red)'}
        />
      </div>

      {/* 차트 + 알림 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <Card>
          <SectionTitle>7일 발행 추이</SectionTitle>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trend} barCategoryGap="20%">
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="date" tick={CHART_TICK} tickFormatter={d => d.slice(5)} />
                <YAxis tick={CHART_TICK} />
                <Tooltip {...CHART_TOOLTIP} />
                <Bar dataKey="published" fill="var(--accent)" radius={[6, 6, 0, 0]} name="발행" />
                <Bar dataKey="failed" fill="var(--red)" radius={[6, 6, 0, 0]} name="실패" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="데이터 수집 중... GitHub Actions 발행 후 자동 반영됩니다." />
          )}
        </Card>

        <Card>
          <SectionTitle action={unread > 0 ? <Badge text={`${unread}건 새 알림`} color="red" /> : null}>
            알림
          </SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {alerts.slice(0, 5).map(a => (
              <div key={a.id} style={{
                padding: '10px 12px', borderRadius: 10,
                background: a.is_read ? 'var(--bg)' : 'var(--accent-bg)',
                border: '1px solid var(--card-border)', fontSize: 12,
                transition: 'background 0.2s'
              }}>
                <div style={{ fontWeight: 600, color: a.severity === 'critical' ? 'var(--red)' : 'var(--text)' }}>
                  {a.title}
                </div>
                <div style={{ color: 'var(--text-dim)', marginTop: 3 }}>{a.message?.slice(0, 60)}</div>
              </div>
            ))}
            {alerts.length === 0 && <EmptyState text="알림 없음" small />}
          </div>
        </Card>
      </div>

      {/* 모델별 비용 파이 */}
      {Object.keys(costs.by_model).length > 0 && (
        <Card>
          <SectionTitle>모델별 비용 분포</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(costs.by_model).map(([name, value]) => ({ name, value }))}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={3} strokeWidth={0}
                >
                  {Object.keys(costs.by_model).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmtKRW(v)} {...CHART_TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(costs.by_model).sort((a, b) => b[1] - a[1]).map(([model, cost], i) => (
                <div key={model} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 140 }}>{model}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtKRW(cost)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

const PIE_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

// ── 발행 로그 탭 ──
function PostsTab({ siteId }) {
  const { posts, loading } = useRecentPosts(siteId, 50);

  return (
    <Card>
      <SectionTitle>최근 발행 ({posts.length}건)</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
              {['시간', '제목', '파이프라인', '키워드', '길이', '이미지', '쿠팡', 'SNS', '상태'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '12px 8px',
                  color: 'var(--text-dim)', fontWeight: 600, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: 0.5
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} style={{
                borderBottom: '1px solid var(--card-border)',
                transition: 'background 0.15s'
              }}>
                <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', color: 'var(--text-dim)' }}>
                  {new Date(p.published_at).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '12px 8px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener" style={{
                      color: 'var(--accent)', textDecoration: 'none', fontWeight: 500
                    }}>{p.title}</a>
                  ) : p.title}
                </td>
                <td style={{ padding: '12px 8px' }}><Badge text={p.pipeline} color="purple" /></td>
                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{p.keyword?.slice(0, 20)}</td>
                <td style={{ padding: '12px 8px', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.content_length)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>{p.has_image ? '●' : '—'}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>{p.has_coupang ? '●' : '—'}</td>
                <td style={{ padding: '12px 8px' }}>
                  {(p.sns_shared || []).map(s => <Badge key={s} text={s} color="blue" />)}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <Badge text={p.status} color={p.status === 'published' ? 'green' : p.status === 'failed' ? 'red' : 'yellow'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <LoadingState />}
        {!loading && posts.length === 0 && (
          <EmptyState text="발행 로그가 없습니다. GitHub Actions 발행 후 자동 기록됩니다." />
        )}
      </div>
    </Card>
  );
}

// ── 수익 탭 ──
function RevenueTab({ siteId }) {
  const { revenue, total } = useMonthlyRevenue(siteId);

  const byChannel = {};
  revenue.forEach(r => {
    if (!byChannel[r.channel]) byChannel[r.channel] = 0;
    byChannel[r.channel] += r.revenue_krw || 0;
  });

  const byDate = {};
  revenue.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = { date: r.date, total: 0 };
    byDate[r.date].total += r.revenue_krw || 0;
  });
  const dailyTrend = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  const CHANNEL_COLORS = {
    adsense: 'var(--green)', coupang_cps: 'var(--blue)',
    tenping_cpa: 'var(--yellow)', stibee: 'var(--red)', kmong: 'var(--accent)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="이번 달 총 수익" value={fmtKRW(total.krw)} color="var(--green)" icon="↗" />
        {Object.entries(byChannel).map(([ch, v]) => (
          <StatCard
            key={ch}
            label={ch.replace('_', ' ').toUpperCase()}
            value={fmtKRW(v)}
            color={CHANNEL_COLORS[ch] || 'var(--blue)'}
          />
        ))}
      </div>

      {dailyTrend.length > 0 && (
        <Card>
          <SectionTitle>일별 수익 추이</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyTrend}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--green)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="date" tick={CHART_TICK} tickFormatter={d => d.slice(5)} />
              <YAxis tick={CHART_TICK} tickFormatter={v => `₩${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmtKRW(v)} {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="total" stroke="var(--green)" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 3, fill: 'var(--green)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {revenue.length === 0 && (
        <Card>
          <EmptyState text="수익 데이터가 없습니다. report_agent.py가 수익을 수집하면 자동 반영됩니다." />
        </Card>
      )}
    </div>
  );
}

// ── 비용 탭 ──
function CostsTab({ siteId }) {
  const { costs } = useMonthlyCosts(siteId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatCard label="이번 달 API 비용" value={fmtKRW(costs.total_krw)} color="var(--yellow)" icon="◈" />

      <Card>
        <SectionTitle>모델별 비용</SectionTitle>
        {Object.entries(costs.by_model).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(costs.by_model).sort((a, b) => b[1] - a[1]).map(([model, cost], i) => {
              const pct = costs.total_krw > 0 ? (cost / costs.total_krw * 100) : 0;
              return (
                <div key={model}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{model}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      {fmtKRW(cost)} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'var(--input-bg)', borderRadius: 4 }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 4,
                      background: PIE_COLORS[i % PIE_COLORS.length],
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="비용 데이터 없음" />
        )}
      </Card>
    </div>
  );
}

// ── 알림 탭 ──
function AlertsTab({ siteId }) {
  const { alerts, markRead } = useAlerts(siteId);

  const severityStyle = {
    critical: { color: 'var(--red)', bg: 'var(--red-bg)', dot: '●' },
    warning: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', dot: '●' },
    info: { color: 'var(--green)', bg: 'var(--green-bg)', dot: '●' },
  };

  return (
    <Card>
      <SectionTitle>알림 ({alerts.length}건)</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.map(a => {
          const sev = severityStyle[a.severity] || severityStyle.info;
          return (
            <div key={a.id} style={{
              padding: '14px 16px', borderRadius: 12,
              background: a.is_read ? 'var(--bg)' : sev.bg,
              border: '1px solid var(--card-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              transition: 'background 0.2s'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: sev.color, fontSize: 10 }}>{sev.dot}</span>
                  {a.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{a.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                  {new Date(a.created_at).toLocaleString('ko-KR')}
                </div>
              </div>
              {!a.is_read && (
                <button onClick={() => markRead(a.id)} style={{
                  background: 'var(--accent-bg)', border: 'none', borderRadius: 8,
                  padding: '6px 14px', color: 'var(--accent)', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'background 0.15s'
                }}>읽음</button>
              )}
            </div>
          );
        })}
        {alerts.length === 0 && <EmptyState text="알림 없음" />}
      </div>
    </Card>
  );
}

// ── AI 모델 설정 탭 (NEW) ──
function AIModelTab({ siteId }) {
  const [draftModel, setDraftModel] = useState('deepseek-chat');
  const [polishModel, setPolishModel] = useState('claude-sonnet-4-20250514');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const draft = DRAFT_MODELS.find(m => m.id === draftModel) || DRAFT_MODELS[0];
  const polish = POLISH_MODELS.find(m => m.id === polishModel) || POLISH_MODELS[0];
  const totalCost = draft.costPer + polish.costPer;

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('sites').update({
      ai_config: { draft_model: draftModel, polish_model: polishModel },
      updated_at: new Date().toISOString()
    }).eq('id', siteId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      {/* 편당 비용 요약 */}
      <Card style={{ background: 'var(--header-gradient)', border: '1px solid var(--accent-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, marginBottom: 4 }}>예상 편당 비용</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--accent)', letterSpacing: -1 }}>
              {fmtKRW(totalCost)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              초안 {fmtKRW(draft.costPer)} + 폴리싱 {fmtKRW(polish.costPer)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>일 10편 기준 월 비용</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
              {fmtKRW(totalCost * 10 * 30)}
            </div>
          </div>
        </div>
      </Card>

      {/* 초안 모델 선택 */}
      <Card>
        <SectionTitle>초안 모델 (Draft)</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DRAFT_MODELS.map(m => (
            <label key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
              border: draftModel === m.id ? '2px solid var(--accent)' : '1px solid var(--card-border)',
              background: draftModel === m.id ? 'var(--accent-bg)' : 'var(--bg)',
              transition: 'all 0.15s ease'
            }}>
              <input
                type="radio" name="draft" value={m.id}
                checked={draftModel === m.id}
                onChange={() => setDraftModel(m.id)}
                style={{ display: 'none' }}
              />
              <div style={{
                width: 20, height: 20, borderRadius: '50%', border: '2px solid',
                borderColor: draftModel === m.id ? 'var(--accent)' : 'var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {draftModel === m.id && (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  속도: {m.speed} · 품질: {m.quality}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{fmtKRW(m.costPer)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>편당</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* 폴리싱 모델 선택 */}
      <Card>
        <SectionTitle>폴리싱 모델 (Polish)</SectionTitle>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, marginTop: -8 }}>
          초안을 Claude로 다듬어 문체와 SEO를 개선합니다. OFF 시 초안을 그대로 발행합니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {POLISH_MODELS.map(m => (
            <label key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
              border: polishModel === m.id ? '2px solid var(--accent)' : '1px solid var(--card-border)',
              background: polishModel === m.id ? 'var(--accent-bg)' : 'var(--bg)',
              transition: 'all 0.15s ease'
            }}>
              <input
                type="radio" name="polish" value={m.id}
                checked={polishModel === m.id}
                onChange={() => setPolishModel(m.id)}
                style={{ display: 'none' }}
              />
              <div style={{
                width: 20, height: 20, borderRadius: '50%', border: '2px solid',
                borderColor: polishModel === m.id ? 'var(--accent)' : 'var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {polishModel === m.id && (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {m.name}
                  {m.id === 'none' && <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}> (비용 절감)</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: m.costPer > 0 ? 'var(--accent)' : 'var(--green)' }}>
                  {m.costPer > 0 ? fmtKRW(m.costPer) : 'FREE'}
                </div>
                {m.costPer > 0 && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>편당</div>}
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* 저장 버튼 */}
      <button onClick={handleSave} disabled={saving} style={{
        background: saved ? 'var(--green)' : 'var(--accent)',
        border: 'none', borderRadius: 12, padding: '14px 24px',
        color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.2s', opacity: saving ? 0.6 : 1,
        boxShadow: '0 2px 8px rgba(124,58,237,0.25)'
      }}>
        {saving ? '저장 중...' : saved ? '저장 완료' : 'AI 모델 설정 저장'}
      </button>
    </div>
  );
}

// ── 설정 탭 ──
function SettingsTab({ siteId, sites }) {
  const site = sites.find(s => s.id === siteId);
  const [target, setTarget] = useState(site?.daily_target || 10);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from('sites').update({ daily_target: target, updated_at: new Date().toISOString() }).eq('id', siteId);
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
      <Card>
        <SectionTitle>사이트 설정</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SettingRow label="사이트 이름" value={site?.name || '-'} />
          <SettingRow label="도메인" value={site?.domain || '-'} />
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              일일 발행 목표
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="number" value={target} onChange={e => setTarget(Number(e.target.value))}
                style={{
                  background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: 10,
                  padding: '10px 14px', color: 'var(--text)', fontSize: 14, width: 100, fontWeight: 600
                }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>편/일</span>
              <button onClick={save} disabled={saving} style={{
                background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '10px 20px',
                color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                opacity: saving ? 0.6 : 1, transition: 'opacity 0.15s'
              }}>{saving ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>연동 상태</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'Supabase Realtime', status: true },
            { name: 'GitHub Actions', status: true },
            { name: 'WordPress API', status: !!site?.wp_url },
            { name: 'Google Search Console', status: false },
            { name: 'AdSense API', status: false },
          ].map(s => (
            <div key={s.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: 10, background: 'var(--bg)'
            }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
              <Badge text={s.status ? '연결됨' : '미연결'} color={s.status ? 'green' : 'yellow'} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── 헬퍼 컴포넌트 ──
function SettingRow({ label, value }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

function EmptyState({ text, small }) {
  return (
    <div style={{
      textAlign: 'center', padding: small ? 20 : 48,
      color: 'var(--text-dim)', fontSize: 13
    }}>{text}</div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)', fontSize: 13 }}>
      로딩 중...
    </div>
  );
}

// ── 초기 설정 가이드 ──
function SetupGuide() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: 'var(--header-gradient)'
    }}>
      <Card style={{ maxWidth: 600, width: '100%' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>
          <span style={{ color: 'var(--accent)' }}>AutoBlog</span> Dashboard 설정
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 28 }}>Supabase 연동이 필요합니다.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            {
              step: '1', title: 'Supabase SQL 스키마 실행',
              desc: 'Supabase Dashboard → SQL Editor → supabase_schema_final.sql 내용 붙여넣기 → Run'
            },
            {
              step: '2', title: '환경변수 설정',
              desc: 'Vercel: Settings → Environment Variables에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 추가',
              code: 'NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key'
            },
            {
              step: '3', title: '배포',
              desc: 'GitHub push → Vercel 자동 배포 → 대시보드 접속'
            }
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-bg)',
                color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0
              }}>{item.step}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.desc}</div>
                {item.code && (
                  <div style={{
                    background: 'var(--input-bg)', borderRadius: 10, padding: 14, fontSize: 12,
                    fontFamily: 'monospace', border: '1px solid var(--border-light)', marginTop: 8,
                    whiteSpace: 'pre-wrap', color: 'var(--text)', lineHeight: 1.8
                  }}>{item.code}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
