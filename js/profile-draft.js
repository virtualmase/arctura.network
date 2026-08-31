const form = document.querySelector('#profile-form');
const agentFields = document.querySelector('#agent-fields');
const agentStep = document.querySelector('#agent-step');
const status = document.querySelector('#form-status');
const storageKey = 'arctura_profile_draft_v1';
const schemaUrl = 'https://arctura.network/schemas/profile-draft/v1/schema.json';
const value = (name) => form.elements[name]?.value?.trim() || '';
const type = () => form.elements.profileType.value;
const list = (input) => input.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 12);
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'YN';
const safeHandle = (input) => input.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').slice(0, 30);

function draft() {
  const profileType = type();
  return { schema: schemaUrl, status: 'local-draft', selectedPosition: new URLSearchParams(location.search).get('position') || null, profileType, handle: value('handle'), name: value('name'), headline: value('headline'), introduction: value('introduction'), locationMode: value('locationMode'), availability: value('availability'), capabilities: list(value('capabilities')), seeking: value('seeking'), evidence: value('evidenceUrl') ? { claim: value('evidenceClaim'), url: value('evidenceUrl'), reviewStatus: 'not-reviewed' } : null, agentLimits: profileType === 'agent' ? { responsibleOwner: value('accountableOwner'), actionsAndLimits: value('authority') } : null };
}
function completeness(data) { const checks = [data.name, data.handle, data.headline, data.capabilities.length, data.introduction, data.seeking]; if (data.profileType === 'agent') checks.push(data.agentLimits.responsibleOwner, data.agentLimits.actionsAndLimits); return Math.round((checks.filter(Boolean).length / checks.length) * 100); }
function render() {
  const data = draft(); const isAgent = data.profileType === 'agent';
  agentFields.hidden = !isAgent; agentStep.hidden = !isAgent;
  for (const name of ['accountableOwner', 'authority']) form.elements[name].required = isAgent;
  document.querySelector('#preview-kind').textContent = `${data.profileType[0].toUpperCase()}${data.profileType.slice(1)} profile`;
  document.querySelector('#preview-avatar').textContent = initials(data.name);
  document.querySelector('#preview-title').textContent = data.name || 'Your name';
  document.querySelector('#preview-handle').textContent = `arctura.network/${data.handle || 'your-handle'}`;
  document.querySelector('#preview-headline').textContent = data.headline || 'Your professional headline will appear here.';
  document.querySelector('#preview-seeking').textContent = data.seeking || 'Not stated';
  document.querySelector('#headline-count').textContent = String(value('headline').length); document.querySelector('#intro-count').textContent = String(value('introduction').length);
  const items = data.capabilities.length ? data.capabilities : ['Add your first skill'];
  document.querySelector('#preview-capabilities').replaceChildren(...items.map((item) => { const li = document.createElement('li'); li.textContent = item; return li; }));
  document.querySelector('#preview-evidence').hidden = !data.evidence; document.querySelector('#preview-evidence-claim').textContent = data.evidence?.claim || 'Source added without a description';
  document.querySelector('#preview-agent-boundary').hidden = !isAgent; document.querySelector('#preview-owner').textContent = data.agentLimits?.responsibleOwner ? `Owner: ${data.agentLimits.responsibleOwner}` : 'Responsible owner not named'; document.querySelector('#preview-authority').textContent = data.agentLimits?.actionsAndLimits || 'Actions and limits not stated';
  const percent = completeness(data); document.querySelector('#completion-progress').value = percent; document.querySelector('#completion-progress').textContent = `${percent}%`; document.querySelector('#completion-label').textContent = `${percent}%`;
}
function restore() {
  try { const data = JSON.parse(localStorage.getItem(storageKey)); if (!data || data.status !== 'local-draft') return; for (const key of ['profileType','handle','name','headline','introduction','locationMode','availability','seeking']) if (form.elements[key] && data[key]) form.elements[key].value = data[key]; if (Array.isArray(data.capabilities)) form.elements.capabilities.value = data.capabilities.join(', '); if (data.evidence) { form.elements.evidenceClaim.value = data.evidence.claim || ''; form.elements.evidenceUrl.value = data.evidence.url || ''; } if (data.agentLimits) { form.elements.accountableOwner.value = data.agentLimits.responsibleOwner || ''; form.elements.authority.value = data.agentLimits.actionsAndLimits || ''; } } catch { localStorage.removeItem(storageKey); }
}
async function loadPosition() {
  const selected = new URLSearchParams(location.search).get('position'); if (!selected) return;
  try { const response = await fetch('/content/network/roles.json'); if (!response.ok) return; const source = await response.json(); const position = source.houses.flatMap((team) => team.roles).find((item) => item.id === selected); if (!position) return; document.querySelector('#position-name').textContent = position.title; document.querySelector('#position-context').hidden = false; if (!value('seeking')) form.elements.seeking.value = position.title; render(); } catch { /* Drafting still works without the position file. */ }
}
form.addEventListener('input', (event) => { if (event.target.name === 'handle') event.target.value = safeHandle(event.target.value); render(); });
form.addEventListener('submit', (event) => { event.preventDefault(); if (!form.reportValidity()) return; localStorage.setItem(storageKey, JSON.stringify(draft())); status.textContent = 'Draft saved in this browser.'; });
document.querySelector('#clear-draft').addEventListener('click', () => { form.reset(); localStorage.removeItem(storageKey); status.textContent = 'Draft cleared from this browser.'; render(); });
document.querySelector('#copy-draft').addEventListener('click', async () => { try { await navigator.clipboard.writeText(JSON.stringify(draft(), null, 2)); status.textContent = 'Draft JSON copied.'; } catch { status.textContent = 'Copy was blocked. Download the JSON instead.'; } });
document.querySelector('#download-draft').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(draft(), null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'arctura-profile-draft.json'; link.click(); URL.revokeObjectURL(url); status.textContent = 'Draft JSON downloaded.'; });
restore(); render(); loadPosition();
