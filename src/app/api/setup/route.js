import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'planxs-ai/wp-auto';

const ALLOWED_WORKFLOWS = {
  'setup-menu': 'setup-menu.yml',
  'setup-pages': 'setup-pages.yml',
  'inject-css': 'inject-css.yml',
  'inject-css-posts': 'inject-css-posts.yml',
  'publish': 'publish.yml',
};

function getSupabaseAdmin() {
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
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return user;
  }

  return null;
}

async function getSiteCredentials(siteId) {
  if (!siteId) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('sites')
    .select('wp_url, domain, config')
    .eq('id', siteId)
    .single();
  if (!data) return null;
  return {
    wp_url: data.wp_url,
    domain: data.domain,
    wp_username: data.config?.wp_username || '',
    wp_app_password: data.config?.wp_app_password || '',
  };
}

export async function POST(request) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 });
  }

  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, siteId, inputs } = await request.json();

  const workflow = ALLOWED_WORKFLOWS[action];
  if (!workflow) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  // Fetch site credentials from Supabase (NOT hardcoded secrets)
  const creds = await getSiteCredentials(siteId);
  if (!creds || !creds.wp_url) {
    return NextResponse.json({
      error: '사이트 인증정보를 찾을 수 없습니다. 설정에서 사이트를 먼저 연결해주세요.',
      siteId,
    }, { status: 400 });
  }

  // Pass site credentials as workflow inputs so scripts use the correct site
  const workflowInputs = {
    ...(inputs || {}),
    wp_url: creds.wp_url,
    wp_username: creds.wp_username,
    wp_app_password: creds.wp_app_password,
    wp_login_password: creds.wp_login_password || creds.wp_app_password,
    site_id: siteId || '',
  };

  const [owner, repo] = GITHUB_REPO.split('/');

  const resp = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main', inputs: workflowInputs }),
    }
  );

  if (resp.status === 204) {
    return NextResponse.json({
      success: true, action,
      message: `${action} triggered for ${creds.domain}`,
    });
  }

  const errorBody = await resp.text();
  return NextResponse.json({
    error: `GitHub API failed: ${resp.status}`,
    detail: errorBody,
    debug: { repo: GITHUB_REPO, workflow, site: creds.domain },
  }, { status: resp.status });
}
