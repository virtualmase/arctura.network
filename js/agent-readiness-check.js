const checklist = document.querySelector('#readiness-form');
const result = document.querySelector('#readiness-result');
const score = document.querySelector('#readiness-score');
const label = document.querySelector('#readiness-label');
const gaps = document.querySelector('#readiness-gaps');
let started = false;
const trackReadiness = (name, properties = {}) => { try { window.zaraz?.track(name, properties); } catch { /* Analytics never interrupts the check. */ } };
const questions = [...checklist.querySelectorAll('input[type="checkbox"]')];
function evaluate(announce = false) {
  const checked = questions.filter((item) => item.checked);
  const total = checked.length;
  const percent = Math.round((total / questions.length) * 100);
  const band = total <= 4 ? 'Define before deployment' : total <= 8 ? 'Bounded, with gaps' : 'Ready for a documented review';
  score.textContent = `${percent}%`;
  label.textContent = band;
  const missing = questions.filter((item) => !item.checked).slice(0, 4).map((item) => item.dataset.gap);
  gaps.replaceChildren(...missing.map((text) => { const li = document.createElement('li'); li.textContent = text; return li; }));
  document.querySelector('#readiness-progress').value = total;
  document.querySelector('#readiness-count').textContent = `${total}/${questions.length}`;
  result.dataset.band = total <= 4 ? 'early' : total <= 8 ? 'forming' : 'review';
  if (announce) { result.focus(); trackReadiness('agent_readiness_result', {band:result.dataset.band}); }
}
checklist.addEventListener('change', () => { if (!started) { started = true; trackReadiness('agent_readiness_start'); } evaluate(); });
checklist.addEventListener('submit', (event) => { event.preventDefault(); evaluate(true); });
trackReadiness('agent_readiness_view');
evaluate();
