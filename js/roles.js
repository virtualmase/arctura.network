const floor = document.querySelector('#position-floor');
const inspector = document.querySelector('#position-inspector');
const errorState = document.querySelector('#roles-error');
const search = document.querySelector('#role-search');
const count = document.querySelector('#role-count');
const priorityButtons = [...document.querySelectorAll('[data-priority]')];
let source;
let positions = [];
let selectedId = '';
let activePriority = 'all';
let activeTeam = 'all';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);
const assignmentFor = (id) => source.assignments.find((assignment) => assignment.positionId === id);
const statusFor = (position) => assignmentFor(position.id)?.status || 'open';
const statusLabel = (status) => ({ open: 'Open', review: 'In review', assigned: 'Assigned', active: 'Active' })[status] || 'Open';

function visiblePositions() {
  const query = search.value.trim().toLowerCase();
  return positions.filter((position) => {
    const matchesPriority = activePriority === 'all' || position.priority === activePriority;
    const matchesTeam = activeTeam === 'all' || position.teamId === activeTeam;
    const text = `${position.title} ${position.responsibility} ${position.skills.join(' ')} ${position.requirements.join(' ')} ${position.proof} ${position.teamName}`.toLowerCase();
    return matchesPriority && matchesTeam && (!query || text.includes(query));
  });
}

function renderInspector() {
  const position = positions.find((item) => item.id === selectedId);
  if (!position) {
    inspector.innerHTML = '<div class="inspector-empty"><span>Choose a position</span><h2>See the work before you step in.</h2><p>Select any opening to review its responsibilities, skills, requirements, and result checks.</p></div>';
    return;
  }
  const assignment = assignmentFor(position.id);
  const status = statusFor(position);
  inspector.innerHTML = `<div class="inspector-heading"><div><span class="inspector-team">${escapeHtml(position.teamName)}</span><h2>${escapeHtml(position.title)}</h2></div><span class="position-state ${escapeHtml(status)}">${statusLabel(status)}</span></div>
    <section><h3>What you would do</h3><p>${escapeHtml(position.responsibility)}</p></section>
    <div class="inspector-columns"><section><h3>Skills needed</h3><ul>${position.skills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join('')}</ul></section><section><h3>Requirements</h3><ul>${position.requirements.map((requirement) => `<li>${escapeHtml(requirement)}</li>`).join('')}</ul></section></div>
    <section class="result-check"><h3>How results are checked</h3><p>${escapeHtml(position.proof)}</p></section>
    ${assignment ? `<section><h3>Filled by</h3><p>${escapeHtml(assignment.displayName)}</p></section>` : `<div class="opening-action"><p>This position has no recorded owner.</p><a class="button" href="/join/?position=${encodeURIComponent(position.id)}">Draft a profile for this position</a></div>`}`;
}

function render() {
  const visible = visiblePositions();
  const filled = source.assignments.filter((assignment) => ['assigned', 'active'].includes(assignment.status)).length;
  count.textContent = `${visible.length} ${visible.length === 1 ? 'position' : 'positions'} shown · ${filled} filled`;
  if (!visible.length) {
    floor.innerHTML = '<div class="floor-empty"><strong>No matching opening.</strong><span>Try a different skill or show all openings.</span><button type="button" id="reset-openings">Reset filters</button></div>';
    document.querySelector('#reset-openings').addEventListener('click', resetFilters);
  } else {
    floor.innerHTML = visible.map((position) => {
      const state = statusFor(position);
      return `<button type="button" class="position-tile${position.id === selectedId ? ' selected' : ''}" data-position="${escapeHtml(position.id)}" aria-pressed="${position.id === selectedId}"><span class="tile-top"><i class="state-dot ${escapeHtml(state)}"></i><small>${statusLabel(state)}</small><b>${position.priority === 'foundation' ? 'Build now' : 'Add later'}</b></span><strong>${escapeHtml(position.title)}</strong><span>${escapeHtml(position.teamName)}</span></button>`;
    }).join('');
    floor.querySelectorAll('[data-position]').forEach((button) => button.addEventListener('click', () => {
      selectedId = button.dataset.position;
      history.replaceState(null, '', `#${selectedId}`);
      render();
      if (matchMedia('(max-width: 820px)').matches) inspector.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }
  renderInspector();
}

function resetFilters() {
  activePriority = 'all'; activeTeam = 'all'; search.value = '';
  priorityButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.priority === 'all')));
  document.querySelectorAll('[data-team]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.team === 'all')));
  render();
}

function setup(result) {
  source = result;
  positions = result.teams.flatMap((team) => team.roles.map((position) => ({ ...position, teamId: team.id, teamName: team.name })));
  const filled = result.assignments.filter((assignment) => ['assigned', 'active'].includes(assignment.status)).length;
  document.querySelector('#metric-open').textContent = String(positions.length - filled);
  document.querySelector('#metric-filled').textContent = String(filled);
  document.querySelector('#metric-now').textContent = String(positions.filter((position) => position.priority === 'foundation').length);
  document.querySelector('#metric-teams').textContent = String(result.teams.length);
  document.querySelector('#source-status').textContent = 'Showing current source record';
  const updated = new Date(`${result.updated}T00:00:00`);
  document.querySelector('#source-updated').dateTime = result.updated;
  document.querySelector('#source-updated').textContent = `Source updated ${updated.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`;
  const teamNav = document.querySelector('#house-nav');
  teamNav.innerHTML = `<button type="button" data-team="all" aria-pressed="true">All teams</button>${result.teams.map((team) => `<button type="button" data-team="${escapeHtml(team.id)}" aria-pressed="false">${escapeHtml(team.name)}</button>`).join('')}`;
  teamNav.querySelectorAll('[data-team]').forEach((button) => button.addEventListener('click', () => {
    activeTeam = button.dataset.team;
    teamNav.querySelectorAll('[data-team]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    render();
  }));
  const hash = location.hash.slice(1);
  selectedId = positions.some((position) => position.id === hash) ? hash : positions[0].id;
  render();
}

fetch('/content/network/roles.json', { headers: { accept: 'application/json' } })
  .then((response) => { if (!response.ok) throw new Error('load_failed'); return response.json(); })
  .then(setup)
  .catch(() => {
    document.querySelector('#roles-root').hidden = true;
    errorState.hidden = false;
    count.textContent = 'Openings unavailable';
    document.querySelector('#source-status').textContent = 'Source record unavailable';
  });

search.addEventListener('input', render);
priorityButtons.forEach((button) => button.addEventListener('click', () => {
  activePriority = button.dataset.priority;
  priorityButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  render();
}));
