const form = document.querySelector('#work-order-form');
if (form) {
  const track = (eventName, properties = {}) => {
    if (window.zaraz?.track) window.zaraz.track(eventName, properties);
  };
  const steps = [...form.querySelectorAll('.work-step')];
  const next = document.querySelector('#next-step');
  const previous = document.querySelector('#previous-step');
  const build = document.querySelector('#build-order');
  const clear = document.querySelector('#clear-order');
  const output = document.querySelector('#work-order-output');
  const state = document.querySelector('#preview-state');
  const actions = document.querySelector('.preview-actions');
  let step = 0;
  let latest = null;
  let started = false;

  track('work_order_builder_view');

  const showStep = () => {
    steps.forEach((item, index) => { item.hidden = index !== step; });
    document.querySelector('#step-label').textContent = `Step ${step + 1} of ${steps.length}`;
    previous.hidden = step === 0;
    next.hidden = step === steps.length - 1;
    build.hidden = step !== steps.length - 1;
    steps[step].querySelector('input, textarea')?.focus();
  };
  const validStep = () => [...steps[step].querySelectorAll('[required]')].every((field) => field.reportValidity());
  next.addEventListener('click', () => {
    if (validStep()) {
      if (!started) { track('work_order_builder_start'); started = true; }
      step += 1;
      showStep();
    }
  });
  previous.addEventListener('click', () => { step -= 1; showStep(); });
  clear.addEventListener('click', () => { form.reset(); step = 0; latest = null; started = false; output.textContent = 'Complete the five steps to create a portable record.'; state.textContent = 'Draft'; actions.hidden = true; showStep(); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validStep()) return;
    const values = Object.fromEntries(new FormData(form));
    latest = { schema: 'https://arctura.network/schemas/work-order/v1/schema.json', id: `awo-${Date.now()}`, createdAt: new Date().toISOString(), status: 'proposed', work: { name: values.name, expectedResult: values.job }, boundaries: { approvedInputs: values.inputs, excludedInputs: values.excludedInputs || null, allowedActions: values.allowedActions, humanReviewRequiredBefore: values.humanReview }, proof: { acceptanceChecks: values.checks, failureAndRefusalCases: values.failureCases || null, evidenceToKeep: values.evidence }, stewardship: { owner: values.owner || null, reviewStatus: 'not-reviewed' } };
    output.textContent = JSON.stringify(latest, null, 2); state.textContent = 'Proposed'; actions.hidden = false;
  });
  document.querySelector('#copy-order').addEventListener('click', async (event) => { if (!latest) return; await navigator.clipboard.writeText(JSON.stringify(latest, null, 2)); track('work_order_export', { method: 'copy' }); event.currentTarget.textContent = 'Copied'; setTimeout(() => { event.currentTarget.textContent = 'Copy JSON'; }, 1500); });
  document.querySelector('#download-order').addEventListener('click', () => { if (!latest) return; const blob = new Blob([JSON.stringify(latest, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${latest.id}.json`; link.click(); URL.revokeObjectURL(link.href); track('work_order_export', { method: 'download' }); });
  showStep();
}
