const encoder = new TextEncoder();
const jsonHeaders = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...headers } });
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const allowedTypes = new Set(['person', 'agent', 'organization']);
const reportTargets = new Set(['profile', 'connection', 'evidence']);
const reportReasons = new Set(['impersonation', 'harassment', 'spam', 'false-claim', 'unsafe-content', 'other']);
const handlePattern = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
function randomToken(size = 32) { const bytes = new Uint8Array(size); crypto.getRandomValues(bytes); return base64url(bytes); }
async function sha256(value) { return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))); }
function cookie(name, value, maxAge) { return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`; }
function clearCookie(name) { return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }
function requestOrigin(request) { try { return new URL(request.url).origin; } catch { return ''; } }
function mutationAllowed(request) { const origin = request.headers.get('origin'); return !origin || origin === requestOrigin(request); }
function clean(value, max = 500) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function cookies(request) { return Object.fromEntries((request.headers.get('cookie') || '').split(';').map(v => v.trim().split('=').map(decodeURIComponent)).filter(v => v.length === 2)); }

async function enforceRequestLimit(request, env, action, maximum, windowSeconds) {
  const address = request.headers.get('cf-connecting-ip') || 'unknown';
  const keyHash = await sha256(`${env.RATE_LIMIT_SALT || 'development-only'}:${action}:${address}`);
  const epoch = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(epoch / windowSeconds) * windowSeconds;
  await env.DB.prepare(`INSERT INTO request_limits (key_hash, window_start, request_count, expires_at) VALUES (?, ?, 1, ?)
    ON CONFLICT(key_hash, window_start) DO UPDATE SET request_count = request_count + 1`)
    .bind(keyHash, windowStart, windowStart + windowSeconds).run();
  const record = await env.DB.prepare('SELECT request_count FROM request_limits WHERE key_hash = ? AND window_start = ?').bind(keyHash, windowStart).first();
  if (record.request_count <= maximum) return null;
  const retryAfter = Math.max(1, windowStart + windowSeconds - epoch);
  return json({ error: 'too_many_requests', retryAfter }, 429, { 'retry-after': String(retryAfter) });
}

async function body(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('content_type');
  return request.json();
}

async function sessionAccount(request, env) {
  const token = cookies(request).arctura_session;
  if (!token) return null;
  const tokenHash = await sha256(token);
  return env.DB.prepare(`SELECT accounts.id, accounts.github_login, accounts.email, accounts.email_verified
    FROM sessions JOIN accounts ON accounts.id = sessions.account_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND accounts.status = 'active'`)
    .bind(tokenHash, now()).first();
}

async function ownedProfile(env, accountId, profileId) {
  return env.DB.prepare(`SELECT profiles.* FROM profiles JOIN profile_owners ON profiles.id = profile_owners.profile_id
    WHERE profiles.id = ? AND profile_owners.account_id = ? AND profile_owners.role IN ('owner','administrator')`)
    .bind(profileId, accountId).first();
}

async function audit(env, accountId, action, targetType, targetId, metadata = {}) {
  await env.DB.prepare('INSERT INTO audit_events (id, account_id, action, target_type, target_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id(), accountId, action, targetType, targetId, JSON.stringify(metadata), now()).run();
}

function validateProfile(input) {
  const profileType = clean(input.profileType, 20);
  const handle = clean(input.handle, 30).toLowerCase();
  const name = clean(input.name, 80);
  const headline = clean(input.headline, 140);
  const accountableOwner = clean(input.accountableOwner, 100) || null;
  const authorityLimits = clean(input.authorityLimits, 500) || null;
  if (!allowedTypes.has(profileType)) return { error: 'invalid_profile_type' };
  if (!handlePattern.test(handle)) return { error: 'invalid_handle' };
  if (!name || !headline) return { error: 'name_and_headline_required' };
  if (profileType === 'agent' && (!accountableOwner || !authorityLimits)) return { error: 'agent_boundary_required' };
  return { profileType, handle, name, headline, introduction: clean(input.introduction), locationMode: clean(input.locationMode, 20) || 'not-stated', availability: clean(input.availability, 20) || 'not-stated', visibility: clean(input.visibility, 20) || 'draft', accountableOwner, authorityLimits, capabilities: Array.isArray(input.capabilities) ? input.capabilities.map(v => clean(v, 60)).filter(Boolean).slice(0, 12) : [] };
}

async function githubStart(request, env) {
  if (!env.GITHUB_CLIENT_ID) return json({ error: 'identity_not_configured' }, 503);
  const state = randomToken();
  const redirect = `${requestOrigin(request)}/api/auth/github/callback`;
  const location = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(env.GITHUB_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirect)}&scope=read:user%20user:email&state=${state}`;
  return new Response(null, { status: 302, headers: { location, 'set-cookie': cookie('arctura_oauth_state', state, 600), 'cache-control': 'no-store' } });
}

async function githubCallback(request, env) {
  const url = new URL(request.url); const code = url.searchParams.get('code'); const state = url.searchParams.get('state');
  if (!code || !state || state !== cookies(request).arctura_oauth_state) return json({ error: 'invalid_oauth_state' }, 400, { 'set-cookie': clearCookie('arctura_oauth_state') });
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }) });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) return json({ error: 'identity_exchange_failed' }, 502);
  const ghHeaders = { authorization: `Bearer ${tokenData.access_token}`, accept: 'application/vnd.github+json', 'user-agent': 'arctura-network' };
  const [userResponse, emailsResponse] = await Promise.all([fetch('https://api.github.com/user', { headers: ghHeaders }), fetch('https://api.github.com/user/emails', { headers: ghHeaders })]);
  if (!userResponse.ok) return json({ error: 'identity_lookup_failed' }, 502);
  const user = await userResponse.json(); const emails = emailsResponse.ok ? await emailsResponse.json() : [];
  const verified = emails.find(item => item.primary && item.verified) || emails.find(item => item.verified);
  const timestamp = now(); const accountId = id();
  await env.DB.prepare(`INSERT INTO accounts (id, github_id, github_login, email, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(github_id) DO UPDATE SET github_login=excluded.github_login, email=excluded.email, email_verified=excluded.email_verified, updated_at=excluded.updated_at`)
    .bind(accountId, String(user.id), user.login, verified?.email || null, verified ? 1 : 0, timestamp, timestamp).run();
  const account = await env.DB.prepare('SELECT id FROM accounts WHERE github_id = ?').bind(String(user.id)).first();
  const sessionToken = randomToken(); const expires = new Date(Date.now() + 30 * 86400000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token_hash, account_id, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(await sha256(sessionToken), account.id, expires, timestamp).run();
  await audit(env, account.id, 'session.created', 'account', account.id, { provider: 'github' });
  return new Response(null, { status: 302, headers: { location: '/join/?signed-in=1', 'set-cookie': [cookie('arctura_session', sessionToken, 2592000), clearCookie('arctura_oauth_state')].join(', '), 'cache-control': 'no-store' } });
}

async function listProfiles(request, env) {
  const url = new URL(request.url); const query = `%${clean(url.searchParams.get('q'), 80)}%`; const type = clean(url.searchParams.get('type'), 20);
  const result = await env.DB.prepare(`SELECT profiles.id, handle, profile_type, name, headline, introduction, location_mode, availability, accountable_owner, authority_limits, updated_at,
    GROUP_CONCAT(capabilities.label, '|') AS capabilities FROM profiles LEFT JOIN capabilities ON capabilities.profile_id = profiles.id
    WHERE visibility = 'public' AND (? = '' OR profile_type = ?) AND (? = '%%' OR name LIKE ? OR headline LIKE ? OR capabilities.label LIKE ?)
    GROUP BY profiles.id ORDER BY updated_at DESC LIMIT 50`).bind(type, type, query, query, query, query).all();
  return json({ profiles: result.results.map(row => ({ ...row, capabilities: row.capabilities ? row.capabilities.split('|') : [] })) }, 200, { 'cache-control': 'public, max-age=30' });
}

async function createProfile(request, env, account) {
  const input = validateProfile(await body(request)); if (input.error) return json({ error: input.error }, 400);
  const timestamp = now(); const profileId = id();
  try {
    const statements = [env.DB.prepare(`INSERT INTO profiles (id, handle, profile_type, name, headline, introduction, location_mode, availability, visibility, accountable_owner, authority_limits, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(profileId, input.handle, input.profileType, input.name, input.headline, input.introduction, input.locationMode, input.availability, input.visibility, input.accountableOwner, input.authorityLimits, timestamp, timestamp),
      env.DB.prepare('INSERT INTO profile_owners (profile_id, account_id, role, created_at) VALUES (?, ?, ?, ?)').bind(profileId, account.id, 'owner', timestamp),
      ...input.capabilities.map(label => env.DB.prepare('INSERT INTO capabilities (id, profile_id, label, kind, created_at) VALUES (?, ?, ?, ?, ?)').bind(id(), profileId, label, 'offers', timestamp))];
    await env.DB.batch(statements); await audit(env, account.id, 'profile.created', 'profile', profileId, { profileType: input.profileType });
    return json({ id: profileId, handle: input.handle, status: input.visibility }, 201);
  } catch (error) { return json({ error: String(error).includes('UNIQUE') ? 'handle_unavailable' : 'profile_create_failed' }, 409); }
}

async function addEvidence(request, env, account, profileId) {
  if (!await ownedProfile(env, account.id, profileId)) return json({ error: 'not_found' }, 404);
  const input = await body(request); const label = clean(input.label, 100); const claim = clean(input.claim, 500); const url = clean(input.url, 1000);
  try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); } catch { return json({ error: 'invalid_evidence_url' }, 400); }
  if (!label || !claim) return json({ error: 'label_and_claim_required' }, 400);
  const evidenceId = id(); const timestamp = now();
  await env.DB.prepare('INSERT INTO evidence_links (id, profile_id, label, url, claim, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(evidenceId, profileId, label, url, claim, account.id, timestamp, timestamp).run();
  await audit(env, account.id, 'evidence.created', 'evidence', evidenceId, { profileId }); return json({ id: evidenceId, reviewStatus: 'member-submitted' }, 201);
}

async function requestConnection(request, env, account) {
  const input = await body(request); const from = clean(input.requesterProfileId, 50); const to = clean(input.recipientProfileId, 50); const reason = clean(input.reason, 280);
  if (!reason) return json({ error: 'reason_required' }, 400);
  if (!await ownedProfile(env, account.id, from)) return json({ error: 'not_found' }, 404);
  const recipient = await env.DB.prepare("SELECT id FROM profiles WHERE id = ? AND visibility = 'public'").bind(to).first(); if (!recipient) return json({ error: 'recipient_not_found' }, 404);
  const connectionId = id(); const timestamp = now();
  try { await env.DB.prepare('INSERT INTO connections (id, requester_profile_id, recipient_profile_id, reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(connectionId, from, to, reason, timestamp, timestamp).run(); }
  catch { return json({ error: 'connection_exists' }, 409); }
  await audit(env, account.id, 'connection.requested', 'connection', connectionId); return json({ id: connectionId, status: 'pending' }, 201);
}

async function getProfile(env, handle) {
  const profile = await env.DB.prepare(`SELECT id, handle, profile_type, name, headline, introduction, location_mode, availability, accountable_owner, authority_limits, updated_at
    FROM profiles WHERE handle = ? AND visibility = 'public'`).bind(handle).first();
  if (!profile) return json({ error: 'not_found' }, 404);
  const [capabilities, evidence] = await Promise.all([
    env.DB.prepare('SELECT id, label, kind FROM capabilities WHERE profile_id = ? ORDER BY kind, label').bind(profile.id).all(),
    env.DB.prepare("SELECT id, label, url, claim, review_status, updated_at FROM evidence_links WHERE profile_id = ? AND review_status != 'removed' ORDER BY updated_at DESC").bind(profile.id).all()
  ]);
  return json({ profile: { ...profile, capabilities: capabilities.results, evidence: evidence.results } }, 200, { 'cache-control': 'public, max-age=30' });
}

async function updateProfile(request, env, account, profileId) {
  const current = await ownedProfile(env, account.id, profileId); if (!current) return json({ error: 'not_found' }, 404);
  const input = validateProfile(await body(request)); if (input.error) return json({ error: input.error }, 400);
  const timestamp = now();
  try {
    const oldCapabilities = await env.DB.prepare('SELECT id FROM capabilities WHERE profile_id = ?').bind(profileId).all();
    const statements = [
      env.DB.prepare(`UPDATE profiles SET handle=?, profile_type=?, name=?, headline=?, introduction=?, location_mode=?, availability=?, visibility=?, accountable_owner=?, authority_limits=?, updated_at=? WHERE id=?`)
        .bind(input.handle, input.profileType, input.name, input.headline, input.introduction, input.locationMode, input.availability, input.visibility, input.accountableOwner, input.authorityLimits, timestamp, profileId),
      ...oldCapabilities.results.map((item) => env.DB.prepare('DELETE FROM capabilities WHERE id = ?').bind(item.id)),
      ...input.capabilities.map((label) => env.DB.prepare('INSERT INTO capabilities (id, profile_id, label, kind, created_at) VALUES (?, ?, ?, ?, ?)').bind(id(), profileId, label, 'offers', timestamp))
    ];
    await env.DB.batch(statements); await audit(env, account.id, 'profile.updated', 'profile', profileId, { visibility: input.visibility });
    return json({ id: profileId, handle: input.handle, status: input.visibility });
  } catch (error) { return json({ error: String(error).includes('UNIQUE') ? 'handle_unavailable' : 'profile_update_failed' }, 409); }
}

async function listConnections(env, account) {
  const result = await env.DB.prepare(`SELECT connections.id, connections.reason, connections.status, connections.created_at, connections.updated_at,
    requester.id AS requester_id, requester.handle AS requester_handle, requester.name AS requester_name,
    recipient.id AS recipient_id, recipient.handle AS recipient_handle, recipient.name AS recipient_name
    FROM connections
    JOIN profiles requester ON requester.id = connections.requester_profile_id
    JOIN profiles recipient ON recipient.id = connections.recipient_profile_id
    WHERE EXISTS (SELECT 1 FROM profile_owners owner WHERE owner.account_id = ? AND owner.profile_id IN (requester.id, recipient.id))
    ORDER BY connections.updated_at DESC LIMIT 100`).bind(account.id).all();
  return json({ connections: result.results });
}

async function listOwnedProfiles(env, account) {
  const result = await env.DB.prepare(`SELECT profiles.id, profiles.handle, profiles.profile_type, profiles.name, profiles.headline, profiles.introduction,
    profiles.location_mode, profiles.availability, profiles.visibility, profiles.accountable_owner, profiles.authority_limits, profiles.updated_at,
    profile_owners.role, GROUP_CONCAT(capabilities.label, '|') AS capabilities,
    (SELECT COUNT(*) FROM evidence_links WHERE evidence_links.profile_id = profiles.id AND evidence_links.review_status != 'removed') AS evidence_count
    FROM profile_owners JOIN profiles ON profiles.id = profile_owners.profile_id
    LEFT JOIN capabilities ON capabilities.profile_id = profiles.id
    WHERE profile_owners.account_id = ? GROUP BY profiles.id ORDER BY profiles.updated_at DESC`).bind(account.id).all();
  return json({ profiles: result.results.map((profile) => ({ ...profile, capabilities: profile.capabilities ? profile.capabilities.split('|') : [] })) });
}

async function listOwnedEvidence(env, account, profileId) {
  if (!await ownedProfile(env, account.id, profileId)) return json({ error: 'not_found' }, 404);
  const result = await env.DB.prepare(`SELECT id, label, url, claim, review_status, created_at, updated_at
    FROM evidence_links WHERE profile_id = ? AND review_status != 'removed' ORDER BY updated_at DESC`).bind(profileId).all();
  return json({ evidence: result.results });
}

async function updateConnection(request, env, account, connectionId) {
  const input = await body(request); const nextStatus = clean(input.status, 20);
  const connection = await env.DB.prepare(`SELECT connections.*, requester_owner.account_id AS requester_account, recipient_owner.account_id AS recipient_account
    FROM connections
    LEFT JOIN profile_owners requester_owner ON requester_owner.profile_id = connections.requester_profile_id AND requester_owner.account_id = ?
    LEFT JOIN profile_owners recipient_owner ON recipient_owner.profile_id = connections.recipient_profile_id AND recipient_owner.account_id = ?
    WHERE connections.id = ?`).bind(account.id, account.id, connectionId).first();
  if (!connection) return json({ error: 'not_found' }, 404);
  const recipientActions = new Set(['accepted', 'declined', 'blocked']);
  const requesterActions = new Set(['withdrawn', 'blocked']);
  const allowed = (connection.recipient_account && recipientActions.has(nextStatus)) || (connection.requester_account && requesterActions.has(nextStatus));
  if (!allowed || (connection.status !== 'pending' && nextStatus !== 'blocked')) return json({ error: 'status_change_not_allowed' }, 409);
  const timestamp = now();
  await env.DB.prepare('UPDATE connections SET status = ?, updated_at = ? WHERE id = ?').bind(nextStatus, timestamp, connectionId).run();
  await audit(env, account.id, `connection.${nextStatus}`, 'connection', connectionId);
  return json({ id: connectionId, status: nextStatus, updatedAt: timestamp });
}

async function createReport(request, env, account) {
  const input = await body(request);
  const targetType = clean(input.targetType, 20);
  const targetId = clean(input.targetId, 50);
  const reason = clean(input.reason, 30);
  const details = clean(input.details, 1000);
  if (!reportTargets.has(targetType) || !targetId || !reportReasons.has(reason)) return json({ error: 'invalid_report' }, 400);
  const table = targetType === 'profile' ? 'profiles' : targetType === 'connection' ? 'connections' : 'evidence_links';
  const target = await env.DB.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(targetId).first();
  if (!target) return json({ error: 'target_not_found' }, 404);
  const reportId = id(); const timestamp = now();
  try {
    await env.DB.prepare('INSERT INTO reports (id, reporter_account_id, target_type, target_id, reason, details, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(reportId, account.id, targetType, targetId, reason, details, timestamp, timestamp).run();
  } catch (error) {
    if (String(error).includes('UNIQUE')) return json({ error: 'report_already_received' }, 409);
    throw error;
  }
  await audit(env, account.id, 'report.created', 'report', reportId, { targetType, targetId });
  return json({ id: reportId, status: 'open' }, 201);
}

async function deleteAccount(request, env, account) {
  const input = await body(request);
  if (input.confirmation !== 'DELETE') return json({ error: 'confirmation_required' }, 400);
  const solelyOwned = `SELECT owner.profile_id FROM profile_owners owner WHERE owner.account_id = ?
    AND NOT EXISTS (SELECT 1 FROM profile_owners other WHERE other.profile_id = owner.profile_id AND other.account_id != ?)`;
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM profiles WHERE id IN (${solelyOwned})`).bind(account.id, account.id),
    env.DB.prepare('DELETE FROM evidence_links WHERE created_by = ?').bind(account.id),
    env.DB.prepare('DELETE FROM reports WHERE reporter_account_id = ?').bind(account.id),
    env.DB.prepare('DELETE FROM audit_events WHERE account_id = ?').bind(account.id),
    env.DB.prepare('DELETE FROM profile_owners WHERE account_id = ?').bind(account.id),
    env.DB.prepare('DELETE FROM sessions WHERE account_id = ?').bind(account.id),
    env.DB.prepare('DELETE FROM accounts WHERE id = ?').bind(account.id)
  ]);
  return json({ deleted: true }, 200, { 'set-cookie': clearCookie('arctura_session') });
}

async function route(request, env) {
  const url = new URL(request.url); const path = url.pathname;
  if (path === '/api/auth/github/start' && request.method === 'GET') {
    const limited = await enforceRequestLimit(request, env, 'github-start', 10, 3600); if (limited) return limited;
    return githubStart(request, env);
  }
  if (path === '/api/auth/github/callback' && request.method === 'GET') return githubCallback(request, env);
  if (path === '/api/profiles' && request.method === 'GET') return listProfiles(request, env);
  const publicProfileMatch = path.match(/^\/api\/profiles\/handle\/([a-z0-9-]+)$/); if (publicProfileMatch && request.method === 'GET') return getProfile(env, publicProfileMatch[1]);
  if (!mutationAllowed(request)) return json({ error: 'origin_mismatch' }, 403);
  const account = await sessionAccount(request, env); if (!account) return json({ error: 'authentication_required' }, 401);
  if (['POST', 'PATCH', 'DELETE'].includes(request.method)) {
    const settings = path === '/api/reports' ? ['reports', 10, 3600] : path === '/api/connections' ? ['connections', 20, 3600] : ['member-writes', 60, 600];
    const limited = await enforceRequestLimit(request, env, settings[0], settings[1], settings[2]); if (limited) return limited;
  }
  if (path === '/api/session' && request.method === 'GET') return json({ account });
  if (path === '/api/me/profiles' && request.method === 'GET') return listOwnedProfiles(env, account);
  if (path === '/api/profiles' && request.method === 'POST') return createProfile(request, env, account);
  const profileMatch = path.match(/^\/api\/profiles\/([^/]+)$/); if (profileMatch && request.method === 'PATCH') return updateProfile(request, env, account, profileMatch[1]);
  const evidenceMatch = path.match(/^\/api\/profiles\/([^/]+)\/evidence$/);
  if (evidenceMatch && request.method === 'GET') return listOwnedEvidence(env, account, evidenceMatch[1]);
  if (evidenceMatch && request.method === 'POST') return addEvidence(request, env, account, evidenceMatch[1]);
  if (path === '/api/connections' && request.method === 'POST') return requestConnection(request, env, account);
  if (path === '/api/connections' && request.method === 'GET') return listConnections(env, account);
  const connectionMatch = path.match(/^\/api\/connections\/([^/]+)$/); if (connectionMatch && request.method === 'PATCH') return updateConnection(request, env, account, connectionMatch[1]);
  if (path === '/api/reports' && request.method === 'POST') return createReport(request, env, account);
  if (path === '/api/account' && request.method === 'DELETE') return deleteAccount(request, env, account);
  if (path === '/api/auth/logout' && request.method === 'POST') { const token = cookies(request).arctura_session; if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run(); return json({ ok: true }, 200, { 'set-cookie': clearCookie('arctura_session') }); }
  return json({ error: 'not_found' }, 404);
}

export default { async fetch(request, env) { try { return await route(request, env); } catch (error) { console.error(error); return json({ error: error.message === 'content_type' ? 'json_required' : 'internal_error' }, error.message === 'content_type' ? 415 : 500); } } };
