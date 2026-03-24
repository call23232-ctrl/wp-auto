import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'mymiryu-commits/wp-auto';

export async function POST(request) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const count = String(body.count || 1);
  const pipeline = body.pipeline || 'autoblog';
  const dryRun = body.dry_run ? 'true' : 'false';
  const niche = body.niche || '';

  const [owner, repo] = GITHUB_REPO.split('/');

  const resp = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/publish.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { count, dry_run: dryRun, pipeline, niche },
      }),
    }
  );

  if (resp.status === 204) {
    return NextResponse.json({ success: true, message: '발행 트리거 완료' });
  }

  const error = await resp.text();
  return NextResponse.json(
    { error: `GitHub API 실패: ${resp.status}`, detail: error },
    { status: resp.status }
  );
}
