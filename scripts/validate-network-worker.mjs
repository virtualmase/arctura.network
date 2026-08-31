import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const state = await mkdtemp(join(tmpdir(), 'arctura-worker-'));
const port = 8791;
const origin = `http://127.0.0.1:${port}`;
const config = 'worker/wrangler.local.toml';
const token = 'local-integration-session';
const tokenHash = createHash('sha256').update(token).digest('base64url');
const timestamp = new Date().toISOString();
const expires = new Date(Date.now() + 3600000).toISOString();

function wrangler(args) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, XDG_CONFIG_HOME: join(state, 'config') } });
  if (result.status !== 0) throw new Error(`Wrangler exited with status ${result.status}, signal ${result.signal || 'none'}: ${result.error?.message || ''}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

function sql(statement) {
  return wrangler(['d1', 'execute', 'arctura-network', '--local', '--config', config, '--persist-to', state, '--command', statement]);
}

async function waitForWorker() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const response = await fetch(`${origin}/api/profiles`); if (response.ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Local Worker did not become ready.');
}

async function json(path, options = {}) {
  const response = await fetch(`${origin}${path}`, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

let worker;
try {
  wrangler(['d1', 'migrations', 'apply', 'arctura-network', '--local', '--config', config, '--persist-to', state]);
  sql(`INSERT INTO accounts (id, github_id, github_login, email, email_verified, created_at, updated_at) VALUES ('account-test', 'gh-test', 'local-member', 'member@example.test', 1, '${timestamp}', '${timestamp}')`);
  sql(`INSERT INTO sessions (token_hash, account_id, expires_at, created_at) VALUES ('${tokenHash}', 'account-test', '${expires}', '${timestamp}')`);
  sql(`INSERT INTO profiles (id, handle, profile_type, name, headline, introduction, visibility, created_at, updated_at) VALUES ('profile-recipient', 'recipient', 'person', 'Recipient Member', 'Open to useful collaboration', 'A seeded public profile.', 'public', '${timestamp}', '${timestamp}')`);

  worker = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--config', config, '--local', '--persist-to', state, '--port', String(port), '--ip', '127.0.0.1'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, XDG_CONFIG_HOME: join(state, 'config') } });
  let workerOutput = '';
  worker.stdout.on('data', (chunk) => { workerOutput += chunk; });
  worker.stderr.on('data', (chunk) => { workerOutput += chunk; });
  await waitForWorker().catch((error) => { throw new Error(`${error.message}\n${workerOutput}`); });

  const sessionHeaders = { cookie: `arctura_session=${token}`, origin, 'content-type': 'application/json' };
  const session = await json('/api/session', { headers: { cookie: sessionHeaders.cookie } });
  assert.equal(session.response.status, 200);
  assert.equal(session.data.account.github_login, 'local-member');

  const created = await json('/api/profiles', { method: 'POST', headers: sessionHeaders, body: JSON.stringify({ profileType: 'person', handle: 'local-builder', name: 'Local Builder', headline: 'Builds tested systems', introduction: 'Local integration profile.', visibility: 'public', capabilities: ['Systems testing'] }) });
  assert.equal(created.response.status, 201);

  const evidence = await json(`/api/profiles/${created.data.id}/evidence`, { method: 'POST', headers: sessionHeaders, body: JSON.stringify({ label: 'Test repository', url: 'https://example.com/source', claim: 'Shows the test implementation.' }) });
  assert.equal(evidence.response.status, 201);
  assert.equal(evidence.data.reviewStatus, 'member-submitted');

  const publicProfile = await json('/api/profiles/handle/local-builder');
  assert.equal(publicProfile.response.status, 200);
  assert.equal(publicProfile.data.profile.evidence.length, 1);

  const connection = await json('/api/connections', { method: 'POST', headers: sessionHeaders, body: JSON.stringify({ requesterProfileId: created.data.id, recipientProfileId: 'profile-recipient', reason: 'I would like to compare testing methods.' }) });
  assert.equal(connection.response.status, 201);
  assert.equal(connection.data.status, 'pending');

  const deleted = await json('/api/account', { method: 'DELETE', headers: sessionHeaders, body: JSON.stringify({ confirmation: 'DELETE' }) });
  assert.equal(deleted.response.status, 200);
  assert.equal(deleted.data.deleted, true);
  const afterDelete = await json('/api/session', { headers: { cookie: sessionHeaders.cookie } });
  assert.equal(afterDelete.response.status, 401);
  const removedProfile = await json('/api/profiles/handle/local-builder');
  assert.equal(removedProfile.response.status, 404);

  let limited;
  for (let request = 0; request < 11; request += 1) limited = await json('/api/auth/github/start', { redirect: 'manual' });
  assert.equal(limited.response.status, 429);
  assert.equal(limited.data.error, 'too_many_requests');

  console.log('Validated local D1 migrations, profile and evidence writes, connections, account deletion, and request limits.');
} finally {
  if (worker && !worker.killed) worker.kill('SIGTERM');
  await rm(state, { recursive: true, force: true });
}
