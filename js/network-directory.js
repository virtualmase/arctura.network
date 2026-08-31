let cards = [...document.querySelectorAll('.profile-card')];
const search = document.querySelector('#directory-search');
const filters = [...document.querySelectorAll('[data-filter]')];
const count = document.querySelector('#directory-count');
const empty = document.querySelector('#directory-empty');
const grid = document.querySelector('#profile-grid');
const serviceNote = document.querySelector('#directory-service-note');
const dialog = document.querySelector('#profile-dialog');
const dialogContent = document.querySelector('#profile-dialog-content');
let activeFilter = 'all';
let liveProfiles = [];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);
const initials = (name) => String(name || '?').split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { accept: 'application/json', ...(options.body ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.error || 'request_failed'); error.status = response.status; throw error; }
  return data;
}

function updateDirectory() {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const matchesType = activeFilter === 'all' || card.dataset.type === activeFilter;
    const matchesQuery = !query || card.dataset.search.includes(query) || card.textContent.toLowerCase().includes(query);
    card.hidden = !(matchesType && matchesQuery);
    if (!card.hidden) visible += 1;
  });
  const liveCount = liveProfiles.length;
  count.textContent = liveCount ? `${visible} ${visible === 1 ? 'profile' : 'profiles'} · ${liveCount} member ${liveCount === 1 ? 'profile' : 'profiles'}` : `${visible} source-backed ${visible === 1 ? 'profile' : 'profiles'}`;
  empty.hidden = visible !== 0;
}

function memberCard(profile) {
  const capabilities = (profile.capabilities || []).slice(0, 4);
  const searchText = [profile.name, profile.headline, profile.profile_type, ...capabilities].join(' ').toLowerCase();
  return `<article class="profile-card member-profile-card" data-type="${escapeHtml(profile.profile_type)}" data-search="${escapeHtml(searchText)}"><div class="profile-card-head"><span class="profile-avatar ${profile.profile_type === 'agent' ? 'agent' : ''}">${escapeHtml(initials(profile.name))}</span><span class="profile-kind">${escapeHtml(profile.profile_type)}</span></div><h2>${escapeHtml(profile.name)}</h2><p class="profile-headline">${escapeHtml(profile.headline)}</p><ul class="capability-list">${capabilities.map((label) => `<li>${escapeHtml(label)}</li>`).join('')}</ul><div class="evidence-state"><span>Member profile</span><small>Claims are member supplied; open the profile to inspect attached sources.</small></div><button type="button" class="profile-open" data-live-handle="${escapeHtml(profile.handle)}">View profile <span aria-hidden="true">→</span></button></article>`;
}

async function loadLiveProfiles() {
  try {
    const result = await api('/api/profiles');
    liveProfiles = result.profiles || [];
    if (liveProfiles.length) {
      grid.insertAdjacentHTML('beforeend', liveProfiles.map(memberCard).join(''));
      cards = [...document.querySelectorAll('.profile-card')];
      document.querySelectorAll('[data-live-handle]').forEach((button) => button.addEventListener('click', () => openProfile(button.dataset.liveHandle)));
      document.querySelector('#network-footer-status').textContent = 'Professional network · Member profiles available';
    }
    serviceNote.hidden = true;
  } catch {
    serviceNote.textContent = 'Member profiles will appear here when the account service is active.';
    serviceNote.hidden = false;
  }
  updateDirectory();
}

function evidenceMarkup(items) {
  if (!items.length) return '<p class="profile-no-evidence">No sources attached to this profile yet.</p>';
  return items.map((item) => `<article class="dialog-evidence"><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.review_status.replaceAll('-', ' '))}</span></div><p>${escapeHtml(item.claim)}</p><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Inspect source ↗</a></article>`).join('');
}

async function connectionForm(profile) {
  try {
    await api('/api/session');
    const result = await api('/api/me/profiles');
    if (!result.profiles.length) return '<div class="connect-boundary"><p>Create a profile before requesting a connection.</p><a href="/join/">Create profile →</a></div>';
    return `<form id="connection-form" class="connection-form"><input type="hidden" name="recipientProfileId" value="${escapeHtml(profile.id)}"><label><span>Connect as</span><select name="requesterProfileId" required>${result.profiles.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select></label><label><span>Why do you want to connect?</span><textarea name="reason" required maxlength="280" rows="4" placeholder="I’d like to connect because…"></textarea></label><button type="submit">Send connection request</button><p id="connection-message" role="status" aria-live="polite"></p></form>`;
  } catch (error) {
    if (error.status === 401) return '<div class="connect-boundary"><p>Sign in before requesting a connection.</p><a href="/network/me/">Go to member area →</a></div>';
    return '<div class="connect-boundary"><p>Connection requests are not active yet.</p></div>';
  }
}

async function openProfile(handle) {
  dialogContent.innerHTML = '<p class="dialog-loading">Loading profile…</p>';
  dialog.showModal();
  try {
    const result = await api(`/api/profiles/handle/${encodeURIComponent(handle)}`);
    const profile = result.profile;
    const owner = profile.profile_type === 'agent' ? `<div class="agent-boundary"><strong>Responsible owner</strong><p>${escapeHtml(profile.accountable_owner)}</p><strong>What this agent may do</strong><p>${escapeHtml(profile.authority_limits)}</p></div>` : '';
    dialogContent.innerHTML = `<header class="dialog-profile-head"><span class="profile-avatar ${profile.profile_type === 'agent' ? 'agent' : ''}">${escapeHtml(initials(profile.name))}</span><div><p class="profile-kind">${escapeHtml(profile.profile_type)} · /${escapeHtml(profile.handle)}</p><h2>${escapeHtml(profile.name)}</h2><p>${escapeHtml(profile.headline)}</p></div></header><div class="dialog-profile-body"><section><h3>About</h3><p>${escapeHtml(profile.introduction || 'No introduction supplied.')}</p>${owner}<h3>Skills and interests</h3><ul class="capability-list">${profile.capabilities.map((item) => `<li>${escapeHtml(item.label)}</li>`).join('')}</ul><h3>Sources</h3>${evidenceMarkup(profile.evidence)}</section><aside><span>Availability</span><strong>${escapeHtml(profile.availability.replaceAll('-', ' '))}</strong><span>Work location</span><strong>${escapeHtml(profile.location_mode.replaceAll('-', ' '))}</strong><p>Profile statements come from the member. Source labels state what, if anything, was separately checked.</p></aside></div><section class="dialog-connect"><h3>Request a connection</h3><p>Every request includes a professional reason.</p><div id="connection-form-slot">Checking account…</div></section>`;
    document.querySelector('#connection-form-slot').innerHTML = await connectionForm(profile);
    document.querySelector('#connection-form')?.addEventListener('submit', sendConnection);
  } catch {
    dialogContent.innerHTML = '<div class="dialog-error"><h2>Profile unavailable</h2><p>This profile could not be loaded. Close this window and try again.</p></div>';
  }
}

async function sendConnection(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector('#connection-message');
  const payload = Object.fromEntries(new FormData(form));
  try {
    const result = await api('/api/connections', { method: 'POST', body: JSON.stringify(payload) });
    form.querySelector('button').disabled = true;
    message.textContent = result.status === 'pending' ? 'Connection request sent.' : 'Connection request saved.';
  } catch (error) {
    message.textContent = error.message === 'connection_exists' ? 'A connection request already exists between these profiles.' : 'The request could not be sent. Review it and try again.';
  }
}

search?.addEventListener('input', updateDirectory);
filters.forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  updateDirectory();
}));
document.querySelector('#close-profile').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
loadLiveProfiles();
