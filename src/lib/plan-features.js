// ═══════════════════════════════════════════
// Plan Definitions & Feature Flags
// ═══════════════════════════════════════════

export const PLANS = {
  standard: {
    id: 'standard',
    name: 'Standard',
    price: { monthly: 29000, yearly: 290000 },
    maxSites: 1,
    maxDailyPosts: 4,
    maxCategories: 6,
    features: {
      goldenMode: false,
      polishing: false,
      customSchedule: false,
      modelSelection: false,
      revenueSimulation: false,
      seoAnalysis: false,
      telegramAlerts: false,
      snsAutomation: false,
      marketingContent: false,
      newsResearch: false,
      sectorResearch: false,
    },
    draftModel: 'deepseek-chat',
    polishModel: 'none',
    color: '#3b82f6',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: { monthly: 79000, yearly: 790000 },
    maxSites: 3,
    maxDailyPosts: 20,
    maxCategories: 999,
    features: {
      goldenMode: true,
      polishing: true,
      customSchedule: true,
      modelSelection: true,
      revenueSimulation: true,
      seoAnalysis: true,
      telegramAlerts: true,
      snsAutomation: false,
      marketingContent: false,
      newsResearch: true,
      sectorResearch: true,
    },
    draftModel: null,
    polishModel: 'claude-sonnet-4-20250514',
    color: '#7c3aed',
  },
  mama: {
    id: 'mama',
    name: 'MaMa',
    price: { monthly: 199000, yearly: 1990000 },
    maxSites: 999,
    maxDailyPosts: 999,
    maxCategories: 999,
    features: {
      goldenMode: true,
      polishing: true,
      customSchedule: true,
      modelSelection: true,
      revenueSimulation: true,
      seoAnalysis: true,
      telegramAlerts: true,
      snsAutomation: true,
      marketingContent: true,
      newsResearch: true,
      sectorResearch: true,
    },
    draftModel: null,
    polishModel: 'claude-sonnet-4-20250514',
    color: '#f59e0b',
  },
};

export const MILESTONES = [
  { id: 'first_post', label: '첫 글 발행', icon: '📝', target: 1, metric: 'total_posts' },
  { id: 'posts_10', label: '10편 달성', icon: '📚', target: 10, metric: 'total_posts' },
  { id: 'posts_30', label: '30편 달성', icon: '🏆', target: 30, metric: 'total_posts' },
  { id: 'adsense_approved', label: 'AdSense 승인', icon: '✅', target: 1, metric: 'adsense_approved' },
  { id: 'first_revenue', label: '첫 수익 달성', icon: '💰', target: 1, metric: 'first_revenue' },
  { id: 'revenue_10k', label: '월 1만원 수익', icon: '🔥', target: 10000, metric: 'monthly_revenue' },
  { id: 'revenue_100k', label: '월 10만원 수익', icon: '🚀', target: 100000, metric: 'monthly_revenue' },
  { id: 'revenue_500k', label: '월 50만원 수익', icon: '⭐', target: 500000, metric: 'monthly_revenue' },
];

export const CONSUMER_CATEGORIES = [
  { id: 'product', label: '🛒 제품 리뷰/비교', items: [
    { slug: 'ai-tools', ko: 'AI 도구', icon: '🤖', plans: ['standard', 'premium', 'mama'] },
    { slug: 'tech', ko: 'IT/전자기기', icon: '💻', plans: ['standard', 'premium', 'mama'] },
    { slug: 'smart-home', ko: '스마트홈', icon: '🏠', plans: ['standard', 'premium', 'mama'] },
    { slug: 'pet', ko: '반려동물', icon: '🐾', plans: ['standard', 'premium', 'mama'] },
    { slug: 'health', ko: '건강/웰니스', icon: '💪', plans: ['standard', 'premium', 'mama'] },
    { slug: 'finance', ko: '재테크', icon: '💰', plans: ['standard', 'premium', 'mama'] },
    { slug: 'beauty', ko: '뷰티', icon: '💄', plans: ['standard', 'premium', 'mama'] },
    { slug: 'baby', ko: '육아/유아', icon: '👶', plans: ['standard', 'premium', 'mama'] },
    { slug: 'appliance', ko: '생활가전', icon: '🔌', plans: ['standard', 'premium', 'mama'] },
    { slug: 'fitness', ko: '운동기구', icon: '🏋️', plans: ['standard', 'premium', 'mama'] },
    { slug: 'education', ko: '교육/생산성', icon: '📚', plans: ['standard', 'premium', 'mama'] },
  ]},
  { id: 'info', label: '📋 정보 서비스', items: [
    { slug: 'gov-support', ko: '정부지원/보조금', icon: '🏛️', plans: ['standard', 'premium', 'mama'] },
    { slug: 'tax-guide', ko: '세무/절세', icon: '🧾', plans: ['standard', 'premium', 'mama'] },
    { slug: 'travel', ko: '여행 정보', icon: '✈️', plans: ['standard', 'premium', 'mama'] },
    { slug: 'agency', ko: '기관 정보', icon: '🏢', plans: ['standard', 'premium', 'mama'] },
    { slug: 'event', ko: '행사/컨퍼런스', icon: '🏪', plans: ['standard', 'premium', 'mama'] },
  ]},
  { id: 'promo', label: '📢 홍보/마케팅', items: [
    { slug: 'niche-promo', ko: '니치 홍보용', icon: '📣', plans: ['standard', 'premium', 'mama'] },
    { slug: 'brand', ko: '브랜드 콘텐츠', icon: '🏷️', plans: ['standard', 'premium', 'mama'] },
    { slug: 'compare-land', ko: '비교 랜딩', icon: '⚖️', plans: ['standard', 'premium', 'mama'] },
  ]},
  { id: 'news', label: '📰 뉴스/리서치', items: [
    { slug: 'news-sbs', ko: 'SBS 뉴스', icon: '📺', plans: ['premium', 'mama'] },
    { slug: 'news-kbs', ko: 'KBS 뉴스', icon: '📺', plans: ['premium', 'mama'] },
    { slug: 'news-jtbc', ko: 'JTBC 뉴스', icon: '📺', plans: ['premium', 'mama'] },
    { slug: 'sns-trend', ko: 'SNS 인기 이슈', icon: '🔥', plans: ['premium', 'mama'] },
    { slug: 'top10-corp', ko: '10대 대기업', icon: '🏢', plans: ['premium', 'mama'] },
  ]},
  { id: 'sector', label: '📊 섹터 리서치', items: [
    { slug: 's-semi', ko: '반도체', icon: '🔬', plans: ['premium', 'mama'] },
    { slug: 's-ai', ko: 'AI/인공지능', icon: '🤖', plans: ['premium', 'mama'] },
    { slug: 's-defense', ko: '방산', icon: '🛡️', plans: ['premium', 'mama'] },
    { slug: 's-pharma', ko: '제약/바이오', icon: '💊', plans: ['premium', 'mama'] },
    { slug: 's-robot', ko: '로봇', icon: '🦾', plans: ['premium', 'mama'] },
    { slug: 's-ev', ko: '전기차/2차전지', icon: '🔋', plans: ['premium', 'mama'] },
    { slug: 's-space', ko: '우주/항공', icon: '🚀', plans: ['premium', 'mama'] },
  ]},
];

export function getPlan(planId) {
  return PLANS[planId] || PLANS.standard;
}

export function hasFeature(planId, feature) {
  const plan = getPlan(planId);
  return plan.features[feature] === true;
}

export function canAccessCategory(planId, categorySlug) {
  for (const group of CONSUMER_CATEGORIES) {
    const item = group.items.find(i => i.slug === categorySlug);
    if (item) {
      return item.plans.includes(planId);
    }
  }
  return false;
}

export function getAvailableCategories(planId) {
  return CONSUMER_CATEGORIES.map(group => ({
    ...group,
    items: group.items.filter(item => item.plans.includes(planId)),
  })).filter(group => group.items.length > 0);
}
