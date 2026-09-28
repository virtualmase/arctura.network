const deskSchema = 'https://arctura.network/schemas/media-evidence-desk/v1/schema.json';
const storageKey = 'arctura_media_evidence_desk_v1';
const controlDefinitions = [
  ['owner', 'Named owner'], ['purpose', 'Declared purpose'], ['allowedActions', 'Allowed actions'],
  ['prohibitedActions', 'Prohibited actions'], ['dataBoundaries', 'Data boundaries'],
  ['credentialHandling', 'Credential handling'], ['humanApproval', 'Human approval'],
  ['escalation', 'Escalation path'], ['refusal', 'Refusal behavior'],
  ['acceptanceTests', 'Acceptance tests'], ['auditEvidence', 'Audit evidence'],
  ['revisionPolicy', 'Revision policy']
];
const fieldIds = [
  'study-title', 'hypothesis', 'why-now', 'study-owner', 'study-contact', 'study-audience',
  'target-sample', 'methodology', 'limitations', 'reviewer-name', 'reviewer-affiliation',
  'review-date', 'reporter-name', 'reporter-outlet', 'reporter-beat', 'embargo-date',
  'pitch-relevance', 'pitch-output', 'incident-source', 'incident-known', 'incident-unknown',
  'incident-control'
];
const checkIds = [
  'review-approved', 'asset-dataset', 'asset-method', 'asset-charts', 'asset-press',
  'asset-spokesperson', 'incident-verified'
];
const fields = Object.fromEntries(fieldIds.map((id) => [id, document.getElementById(id)]));
const checks = Object.fromEntries(checkIds.map((id) => [id, document.getElementById(id)]));
let samples = [];
let started = false;
let currentStatus = 'define-story';

const track = (name, properties = {}) => { try { window.zaraz?.track(name, properties); } catch { /* Analytics never interrupts the desk. */ } };
const value = (id) => fields[id].value.trim();
const isChecked = (id) => checks[id].checked;
const targetSample = () => Math.min(500, Math.max(10, Number(fields['target-sample'].value) || 50));
const words = (text) => text.trim() ? text.trim().split(/\s+/).length : 0;
const today = () => new Date().toISOString().slice(0, 10);

function controlRates() {
  return Object.fromEntries(controlDefinitions.map(([key]) => {
    const documented = samples.filter((record) => record.controls[key]).length;
    return [key, { documented, total: samples.length, percent: samples.length ? Math.round((documented / samples.length) * 100) : 0 }];
  }));
}

function leadFinding() {
  if (!samples.length) return 'No quantitative finding is available yet.';
  const rates = controlRates();
  const [key, label] = [...controlDefinitions].sort((a, b) => rates[a[0]].percent - rates[b[0]].percent)[0];
  const rate = rates[key];
  const qualifier = samples.length < targetSample() ? 'In the current exploratory sample' : 'In the completed documented sample';
  return `${qualifier} of ${samples.length} public records, ${rate.documented} (${rate.percent}%) documented ${label.toLowerCase()}. Absence in a public source does not prove the control is absent in practice.`;
}

function pitchReady() {
  return value('reporter-name') && value('reporter-outlet') && value('reporter-beat') &&
    value('pitch-relevance').length >= 30 && value('pitch-output') && words(value('pitch-output')) <= 150;
}

function readiness() {
  const target = targetSample();
  const gates = [
    { label: 'Story', pass: Boolean(value('study-title') && value('hypothesis').length >= 30 && value('why-now').length >= 30 && value('study-owner')) },
    { label: 'Sample', pass: samples.length >= target },
    { label: 'Method', pass: value('methodology').length >= 80 && value('limitations').length >= 50 },
    { label: 'Review', pass: Boolean(value('reviewer-name') && value('reviewer-affiliation') && value('review-date') && isChecked('review-approved')) },
    { label: 'Assets', pass: ['asset-dataset', 'asset-method', 'asset-charts', 'asset-press', 'asset-spokesperson'].every(isChecked) },
    { label: 'Finding', pass: samples.length >= target && leadFinding() !== 'No quantitative finding is available yet.' },
    { label: 'Relevance', pass: Boolean(pitchReady()) },
    { label: 'Response', pass: Boolean(value('incident-source') && value('incident-known').length >= 30 && value('incident-unknown').length >= 20 && value('incident-control').length >= 30 && isChecked('incident-verified')) }
  ];
  const passed = gates.filter((gate) => gate.pass).length;
  let status = 'define-story';
  let message = 'Define the story before collecting evidence.';
  if (gates[0].pass) { status = 'evidence-building'; message = 'Build the cited sample and disclose the method.'; }
  if (gates[0].pass && gates[1].pass && gates[2].pass) { status = 'briefing-ready'; message = 'The research is briefing-ready; independent review and press assets remain.'; }
  if (gates.slice(0, 6).every((gate) => gate.pass)) { status = 'embargo-ready'; message = 'Evidence is ready for a targeted embargo conversation.'; }
  if (gates.every((gate) => gate.pass)) { status = 'launch-ready'; message = 'All preparation gates pass. Recheck every claim before publication.'; }
  return { gates, passed, status, message };
}

function campaignRecord() {
  const readinessState = readiness();
  return {
    schema: deskSchema,
    status: readinessState.status,
    story: {
      title: value('study-title'), hypothesis: value('hypothesis'), whyNow: value('why-now'),
      owner: value('study-owner'), contact: value('study-contact') || null,
      audience: value('study-audience') || null
    },
    research: {
      targetSample: targetSample(), sampleStatus: samples.length >= targetSample() ? 'target-met' : 'exploratory',
      methodology: value('methodology'), limitations: value('limitations'), records: samples,
      controlRates: controlRates(), generatedLeadFinding: leadFinding()
    },
    review: {
      reviewer: value('reviewer-name') || null, affiliation: value('reviewer-affiliation') || null,
      reviewDate: value('review-date') || null, approved: isChecked('review-approved')
    },
    press: {
      rawDatasetReady: isChecked('asset-dataset'), methodologyPageReady: isChecked('asset-method'),
      chartsReady: isChecked('asset-charts'), pressPageReady: isChecked('asset-press'),
      spokespersonReady: isChecked('asset-spokesperson')
    },
    outreach: {
      reporter: value('reporter-name') || null, outlet: value('reporter-outlet') || null,
      beat: value('reporter-beat') || null, relevance: value('pitch-relevance') || null,
      embargoDate: value('embargo-date') || null, draftPitch: value('pitch-output') || null,
      wordCount: words(value('pitch-output'))
    },
    rapidResponse: {
      primarySource: value('incident-source') || null, confirmedFacts: value('incident-known') || null,
      unknowns: value('incident-unknown') || null, applicableControl: value('incident-control') || null,
      humanApproved: isChecked('incident-verified')
    },
    readiness: { passed: readinessState.passed, total: readinessState.gates.length, gates: Object.fromEntries(readinessState.gates.map((gate) => [gate.label, gate.pass])) },
    updated: today()
  };
}

function save(silent = true) {
  localStorage.setItem(storageKey, JSON.stringify({
    values: Object.fromEntries(fieldIds.map((id) => [id, fields[id].value])),
    checks: Object.fromEntries(checkIds.map((id) => [id, checks[id].checked])), samples
  }));
  if (!silent) document.getElementById('desk-message').textContent = 'Workspace saved in this browser.';
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return;
    for (const [id, savedValue] of Object.entries(saved.values || {})) if (fields[id]) fields[id].value = savedValue;
    for (const [id, savedValue] of Object.entries(saved.checks || {})) if (checks[id]) checks[id].checked = Boolean(savedValue);
    samples = Array.isArray(saved.samples) ? saved.samples.slice(0, 500) : [];
  } catch { localStorage.removeItem(storageKey); }
}

function renderSamples() {
  const body = document.getElementById('sample-rows');
  body.replaceChildren();
  if (!samples.length) {
    const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 4; cell.textContent = 'No records yet. Add the first public source above.';
  } else samples.forEach((record) => {
    const row = body.insertRow();
    row.insertCell().textContent = record.name;
    row.insertCell().textContent = `${Object.values(record.controls).filter(Boolean).length}/12`;
    const sourceCell = row.insertCell(); const source = document.createElement('a'); source.href = record.sourceUrl; source.target = '_blank'; source.rel = 'noopener'; source.textContent = 'Inspect source ↗'; sourceCell.append(source);
    const actionCell = row.insertCell(); const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-record'; remove.dataset.recordId = record.id; remove.textContent = 'Remove'; actionCell.append(remove);
  });
  const target = targetSample();
  document.getElementById('sample-count').textContent = samples.length;
  document.getElementById('sample-target').textContent = target;
  document.getElementById('sample-progress').textContent = `${Math.min(100, Math.round((samples.length / target) * 100))}%`;
}

function renderFindings() {
  const container = document.getElementById('findings-grid');
  container.replaceChildren();
  const rates = controlRates();
  for (const [key, label] of controlDefinitions) {
    const article = document.createElement('article'); article.className = 'finding-stat';
    const rate = rates[key];
    const strong = document.createElement('strong'); strong.textContent = `${rate.percent}%`;
    const span = document.createElement('span'); span.textContent = label;
    const small = document.createElement('small'); small.textContent = `${rate.documented} of ${rate.total} public records`;
    article.append(strong, span, small); container.append(article);
  }
  const targetMet = samples.length >= targetSample();
  const banner = document.getElementById('finding-banner');
  banner.classList.toggle('ready', targetMet);
  banner.querySelector('strong').textContent = targetMet ? `Documented sample · Target of ${targetSample()} met` : `Exploratory · ${samples.length} of ${targetSample()} records`;
  banner.querySelector('p').textContent = targetMet ? 'The declared sample target is complete. Independent review is still required before publication.' : 'Do not present these percentages as completed-study findings.';
  document.getElementById('lead-finding').textContent = leadFinding();
}

function renderReadiness() {
  const state = readiness();
  currentStatus = state.status;
  document.getElementById('desk-score').textContent = `${state.passed}/8`;
  document.getElementById('desk-progress').value = state.passed;
  document.getElementById('desk-band').textContent = state.message;
  const list = document.getElementById('gate-list'); list.replaceChildren(...state.gates.map((gate) => {
    const item = document.createElement('li'); item.textContent = gate.label; item.classList.toggle('passed', gate.pass); return item;
  }));
  const pitch = value('pitch-output');
  document.getElementById('pitch-count').textContent = `${words(pitch)} words${words(pitch) > 150 ? ' · shorten' : ''}`;
}

function render() { renderSamples(); renderFindings(); renderReadiness(); }
function download(name, contents, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}
function csvCell(input) { const text = String(input ?? ''); return `"${text.replaceAll('"', '""')}"`; }
function datasetCsv() {
  const headers = ['record', 'source_url', 'source_note', 'accessed', ...controlDefinitions.map(([key]) => key)];
  const rows = samples.map((record) => [record.name, record.sourceUrl, record.sourceNote || '', record.accessed, ...controlDefinitions.map(([key]) => record.controls[key] ? 'documented' : 'not_documented')]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}
async function copy(text, statusId, success) {
  try { await navigator.clipboard.writeText(text); document.getElementById(statusId).textContent = success; }
  catch { document.getElementById(statusId).textContent = 'Copy was blocked. Select the text or download the record instead.'; }
}

document.getElementById('audit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const form = event.currentTarget;
  const controls = Object.fromEntries(controlDefinitions.map(([key]) => [key, form.querySelector(`[data-control="${key}"]`).checked]));
  samples.push({ id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${samples.length}`, name: form.elements.recordName.value.trim(), sourceUrl: form.elements.sourceUrl.value.trim(), sourceNote: form.elements.sourceNote.value.trim() || null, accessed: today(), controls });
  form.reset(); save(); render(); track('media_desk_record_added');
  document.getElementById('audit-status').textContent = 'Cited record added to the local sample.';
});
document.getElementById('sample-rows').addEventListener('click', (event) => {
  const button = event.target.closest('[data-record-id]'); if (!button) return;
  samples = samples.filter((record) => record.id !== button.dataset.recordId); save(); render();
  document.getElementById('audit-status').textContent = 'Record removed from the local sample.';
});
document.querySelector('.desk-layout').addEventListener('input', () => { if (!started) { started = true; track('media_desk_start'); } save(); render(); });
document.querySelector('.desk-layout').addEventListener('change', () => { save(); render(); });
document.getElementById('generate-pitch').addEventListener('click', () => {
  const state = readiness();
  if (!state.gates[0].pass || !state.gates[1].pass || !state.gates[2].pass) {
    document.getElementById('pitch-status').textContent = 'Pitch blocked: complete the story, target sample, methodology, and limitations first.'; return;
  }
  if (!value('reporter-name') || !value('reporter-outlet') || !value('reporter-beat') || value('pitch-relevance').length < 30) {
    document.getElementById('pitch-status').textContent = 'Pitch blocked: name the reporter, outlet, beat, and specific audience relevance.'; return;
  }
  const embargo = value('embargo-date') ? ` We can provide the complete materials under embargo until ${value('embargo-date')}.` : '';
  fields['pitch-output'].value = `Subject: New data on AI-agent accountability documentation\n\nHi ${value('reporter-name')},\n\nBecause you cover ${value('reporter-beat')}, this may be relevant to ${value('reporter-outlet')}: ${value('pitch-relevance')}\n\n${leadFinding()} Arctura is publishing the raw dataset, scoring method, and limitations so the result can be checked.${embargo}\n\nWould the evidence or a short on-record briefing be useful?\n\n${value('study-owner')}${value('study-contact') ? `\n${value('study-contact')}` : ''}`;
  save(); render(); track('media_desk_pitch_generated'); document.getElementById('pitch-status').textContent = 'Draft generated from the completed evidence fields. Human review is still required.';
});
document.getElementById('copy-pitch').addEventListener('click', () => copy(value('pitch-output'), 'pitch-status', 'Pitch copied.'));
document.getElementById('copy-finding').addEventListener('click', () => copy(leadFinding(), 'desk-message', 'Finding copied with its evidence boundary.'));
document.getElementById('save-desk').addEventListener('click', () => { save(false); track('media_desk_saved', { band: currentStatus }); });
document.getElementById('download-record').addEventListener('click', () => { download('arctura-media-evidence-record.json', JSON.stringify(campaignRecord(), null, 2), 'application/json'); track('media_desk_export', { method: 'json' }); });
document.getElementById('download-dataset').addEventListener('click', () => { download('arctura-accountability-audit.csv', datasetCsv(), 'text/csv;charset=utf-8'); track('media_desk_export', { method: 'csv' }); });
document.getElementById('reset-desk').addEventListener('click', () => {
  if (!window.confirm('Reset this browser workspace? Download anything you need first.')) return;
  localStorage.removeItem(storageKey); window.location.reload();
});

load(); render(); track('media_desk_view');
