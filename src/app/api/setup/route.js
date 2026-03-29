import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'mymiryu-commits/wp-auto';

const ALLOWED_WORKFLOWS = {
  'setup-menu': 'setup-menu.yml',
  'inject-css': 'inject-css.yml',
  'publish': 'publish.yml',
};

async function verifyAuth(request) {
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  // Try Bearer token first, then cookie session
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return user;
  }

  // Fallback: check access_token from cookie or body
  return null;
}

export async function POST(request) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 });
  }

  // Auth check
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, inputs } = await request.json();

  const workflow = ALLOWED_WORKFLOWS[action];
  if (!workflow) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

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
      body: JSON.stringify({ ref: 'main', inputs: inputs || {} }),
    }
  );

  if (resp.status === 204) {
    return NextResponse.json({ success: true, action, message: `${action} triggered` });
  }

  const error = await resp.text();
  return NextResponse.json({ error: `GitHub API failed: ${resp.status}`, detail: error }, { status: resp.status });
}
