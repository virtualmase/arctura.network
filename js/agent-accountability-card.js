const form = document.querySelector('#card-form');
const output = document.querySelector('#card-output');
const status = document.querySelector('#card-status');
const schema = 'https://arctura.network/schemas/agent-accountability-card/v1/schema.json';
let started = false;
const track = (eventName, properties = {}) => { try { window.zaraz?.track(eventName, properties); } catch { /* Analytics must never interrupt the tool. */ } };
const lines = (name) => form.elements[name].value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 20);
const value = (name) => form.elements[name].value.trim();
const card = () => ({
  schema, status: 'draft',
  agent: { name: value('name'), purpose: value('purpose'), version: value('version') || null, agentCardUrl: value('agentCardUrl') || null },
  accountability: { owner: value('owner'), contact: value('contact') || null },
  authority: { allowed: lines('allowed'), prohibited: lines('prohibited') },
  handoff: lines('handoff'), checks: lines('checks'),
  evidence: value('evidenceUrl') ? [{ claim: value('evidenceClaim') || 'Source supplied without a claim', url: value('evidenceUrl'), reviewStatus: 'not-reviewed' }] : [],
  updated: new Date().toISOString().slice(0, 10)
});
function render() {
  const data = card();
  output.textContent = JSON.stringify(data, null, 2);
  const complete = [data.agent.name, data.agent.purpose, data.accountability.owner, data.authority.allowed.length, data.authority.prohibited.length, data.handoff.length, data.checks.length].filter(Boolean).length;
  document.querySelector('#card-progress').value = complete;
  document.querySelector('#card-progress-label').textContent = `${complete}/7 essentials`;
}
form.addEventListener('input', () => { if (!started) { track('accountability_card_start'); started = true; } render(); });
form.addEventListener('submit', (event) => { event.preventDefault(); if (!form.reportValidity()) return; localStorage.setItem('arctura_agent_accountability_card_v1', JSON.stringify(card())); status.textContent = 'Draft saved in this browser.'; });
document.querySelector('#copy-card').addEventListener('click', async () => { try { await navigator.clipboard.writeText(JSON.stringify(card(), null, 2)); track('accountability_card_export', {method:'copy'}); status.textContent = 'Card JSON copied.'; } catch { status.textContent = 'Copy was blocked. Download the JSON instead.'; } });
document.querySelector('#download-card').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(card(), null, 2)], {type:'application/json'})); const link = document.createElement('a'); link.href = url; link.download = 'agent-accountability-card.json'; link.click(); URL.revokeObjectURL(url); track('accountability_card_export', {method:'download'}); status.textContent = 'Card downloaded.'; });
track('accountability_card_view');
render();
