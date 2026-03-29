'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, onAuthStateChange } from './supabase';
import { getPlan } from './plan-features';

// ═══════════════════════════════════════════
// Auth Context + Consumer Hooks
// ═══════════════════════════════════════════

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*, plans(*)')
      .eq('id', userId)
      .single();
    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const value = { user, profile, loading, refreshProfile: () => user && fetchProfile(user.id) };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ── Consumer-specific hooks ──

export function useCurrentUser() {
  const { user, profile, loading } = useAuth();
  return {
    user,
    profile,
    loading,
    displayName: profile?.display_name || user?.email?.split('@')[0] || '',
    planId: profile?.plan_id || 'standard',
    onboardingCompleted: profile?.onboarding_completed || false,
    onboardingStep: profile?.onboarding_step || 0,
    trialActive: profile?.trial_ends_at ? new Date(profile.trial_ends_at) > new Date() : false,
    monetizationStage: profile?.monetization_stage || 1,
    isAdmin: profile?.role === 'admin',
  };
}

export function usePlanFeatures() {
  const { planId, trialActive } = useCurrentUser();
  const effectivePlanId = (planId === 'standard' && trialActive) ? 'premium' : planId;
  const plan = getPlan(effectivePlanId);
  return {
    plan,
    planId: effectivePlanId,
    actualPlanId: planId,
    hasFeature: (feature) => plan.features[feature] === true,
    maxSites: plan.maxSites,
    maxDailyPosts: plan.maxDailyPosts,
    maxCategories: plan.maxCategories,
    isPremiumOrAbove: effectivePlanId === 'premium' || effectivePlanId === 'mama',
    isMama: effectivePlanId === 'mama',
    isTrial: planId === 'standard' && trialActive,
  };
}

export function useUserSites() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSites([]); setLoading(false); return; }

    async function fetch() {
      const { data } = await supabase
        .from('user_sites')
        .select('*, sites(*)')
        .eq('user_id', user.id);
      setSites((data || []).map(us => us.sites));
      setLoading(false);
    }
    fetch();
  }, [user]);

  return { sites, loading };
}

export function useMilestones() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setMilestones([]); setLoading(false); return; }

    async function fetch() {
      const { data } = await supabase
        .from('user_milestones')
        .select('*')
        .eq('user_id', user.id);
      setMilestones(data || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const isAchieved = useCallback(
    (milestoneId) => milestones.some(m => m.milestone_id === milestoneId),
    [milestones]
  );

  return { milestones, loading, isAchieved };
}
