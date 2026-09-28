export function publishedArticles(records) {
  if (!Array.isArray(records)) throw new Error('Editorial records must be an array');
  const slugs = new Set();
  return records.filter(record => record.status === 'published').map(record => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug) || slugs.has(record.slug)) throw new Error('Invalid or duplicate article slug');
    slugs.add(record.slug);
    for (const field of ['title','description','topic','author']) if (typeof record[field] !== 'string' || !record[field].trim()) throw new Error(`Missing article ${field}`);
    if (!['Briefing','Guide'].includes(record.kind)) throw new Error('Unknown article kind');
    const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
    if (!validDate(record.published) || !validDate(record.modified) || record.modified < record.published) throw new Error('Invalid article dates');
    if (!Array.isArray(record.sections) || !record.sections.length) throw new Error('Article needs sections');
    const ids = new Set();
    for (const section of record.sections) {
      if (!/^[a-z0-9-]+$/.test(section.id) || ids.has(section.id)) throw new Error('Invalid or duplicate section id');
      ids.add(section.id);
      if (!section.title || !Array.isArray(section.paragraphs) || !section.paragraphs.length || !Array.isArray(section.bullets)) throw new Error('Invalid article section');
      if (![...section.paragraphs,...section.bullets].every(text=>typeof text==='string' && text.trim())) throw new Error('Empty article content');
    }
    if (!record.action?.label || !/^\/(?!\/)/.test(record.action.url)) throw new Error('Article needs a local next step');
    if (!Array.isArray(record.sources) || (record.kind==='Briefing' && !record.sources.length)) throw new Error('Briefing needs a primary source');
    for (const source of record.sources) {
      if (!source.name || !validDate(source.checked) || source.checked > record.modified) throw new Error('Invalid source review date');
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username) throw new Error('Source needs an HTTPS URL');
    }
    return record;
  });
}
