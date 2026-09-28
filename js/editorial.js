(() => {
  const filterBar = document.querySelector('[data-filters]');
  if (filterBar) {
    filterBar.hidden = false;
    const items = [...document.querySelectorAll('[data-filter-item]')];
    const buttons = [...filterBar.querySelectorAll('button[data-topic]')];
    const status = document.querySelector('.filter-status');
    const empty = document.querySelector('.filter-empty');
    function apply(topic, updateURL = false) {
      // Unknown topic links remain meaningful: show the library instead of silently hiding it.
      const selected = buttons.some(b => b.dataset.topic === topic) ? topic : 'All';
      let count = 0;
      items.forEach(item => { item.hidden = selected !== 'All' && item.dataset.topic !== selected; if (!item.hidden) count++; });
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === selected)));
      status.textContent = `${count} ${count === 1 ? 'briefing' : 'briefings'}${selected === 'All' ? '' : ` about ${selected}`}`;
      empty.hidden = count !== 0;
      if (updateURL) {
        const url = new URL(location.href);
        if (selected === 'All') url.searchParams.delete('topic'); else url.searchParams.set('topic', selected);
        history.replaceState(null, '', url);
      }
    }
    buttons.forEach(button => button.addEventListener('click', () => apply(button.dataset.topic, true)));
    window.addEventListener('popstate', () => apply(new URL(location.href).searchParams.get('topic') || 'All'));
    apply(new URL(location.href).searchParams.get('topic') || 'All');
  }
  const form = document.querySelector('.search-form');
  if (form) {
    const input = form.querySelector('input');
    const items = [...document.querySelectorAll('[data-search-item]')];
    const status = document.querySelector('.search-status');
    const empty = document.querySelector('.search-empty');
    const searchable = items.map(item => ({item, text:item.textContent.toLocaleLowerCase()}));
    const run = () => {
      const terms = input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      let count = 0;
      searchable.forEach(({item,text}) => {item.hidden = !terms.every(term => text.includes(term)); if (!item.hidden) count++;});
      status.textContent = `${count} ${count === 1 ? 'page' : 'pages'}${terms.length ? ' matching your search' : ' in the library'}`;
      empty.hidden = count !== 0;
    };
    // Search stays in memory: no query URL, persistence, analytics, or network request.
    form.addEventListener('submit', event => {event.preventDefault();run();});
    input.addEventListener('input', run);
    run();
  }
})();
