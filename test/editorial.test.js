const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const records = JSON.parse(fs.readFileSync('content/editorial/articles.json','utf8'));

test('publication gate excludes candidates and drafts before validating public content', async () => {
  const {publishedArticles} = await import('../scripts/lib/editorial-validation.mjs');
  assert.equal(publishedArticles([...records,{status:'draft'},{status:'candidate'}]).length, records.length);
});

test('publication gate rejects unsourced briefings, unsafe paths, duplicate sections, and inconsistent dates', async () => {
  const {publishedArticles} = await import('../scripts/lib/editorial-validation.mjs');
  for (const change of [r=>r.sources=[],r=>r.slug='../escape',r=>r.modified='2020-01-01',r=>r.sections.push(r.sections[0]),r=>r.action.url='javascript:alert(1)',r=>r.sources[0].url='javascript:alert(1)']) {
    const record = structuredClone(records[0]);change(record);
    assert.throws(()=>publishedArticles([record]));
  }
  assert.throws(()=>publishedArticles([records[0],records[0]]));
});

test('HTML, JSON feed, and RSS contain the same published articles and original dates', () => {
  const feed=JSON.parse(fs.readFileSync('feed.json','utf8'));
  const rss=fs.readFileSync('feed.xml','utf8');
  assert.equal(feed.items.length,records.length);
  for(const record of records) {
    const route=`/${record.kind==='Guide'?'guides':'briefings'}/${record.slug}/`;
    const item=feed.items.find(i=>i.url===`https://arctura.network${route}`);
    assert.ok(item);
    assert.equal(item.date_published.slice(0,10),record.published);
    assert.ok(rss.includes(`<guid isPermaLink="true">${item.url}</guid>`));
    const html=fs.readFileSync(`.${route}index.html`,'utf8');
    assert.ok(html.includes(`href="${record.action.url}"`));
    for(const source of record.sources) assert.ok(html.includes(source.url));
  }
});

test('search index excludes private and noindex pages and uses canonical local paths', () => {
  const index=JSON.parse(fs.readFileSync('content/search-index.json','utf8'));
  assert.ok(index.length>50);
  for(const item of index) {
    assert.ok(item.url.startsWith('/') && item.url.endsWith('/'));
    assert.ok(!/^\/(search|network\/me|archive|private|base)\//.test(item.url));
  }
});

test('shared templates escape editorial strings and keep script data inert', async () => {
  const {esc,json} = await import('../scripts/lib/experience.mjs');
  assert.equal(esc('<img src="x">'),'&lt;img src=&quot;x&quot;&gt;');
  assert.ok(!json({title:'</script><script>alert(1)</script>'}).includes('</script>'));
});

test('withdrawing an article removes discovery and replaces its content; republishing restores it', () => {
  const os=require('node:os');
  const path=require('node:path');
  const {execFileSync}=require('node:child_process');
  const root=path.resolve(__dirname,'..');
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'arctura-publication-'));
  try {
    fs.cpSync(root,temporary,{recursive:true,filter:source=>!['node_modules','.git','__pycache__'].some(part=>path.relative(root,source).split(path.sep).includes(part))});
    const draft=structuredClone(records);
    draft[0].status='draft';
    fs.writeFileSync(path.join(temporary,'content/editorial/articles.json'),JSON.stringify(draft));
    execFileSync(process.execPath,['scripts/publish-experience.mjs'],{cwd:temporary,stdio:'pipe'});
    const route=`/briefings/${draft[0].slug}/`;
    const read=file=>fs.readFileSync(path.join(temporary,file),'utf8');
    assert.match(read(`${route.slice(1)}index.html`),/noindex,follow/);
    assert.ok(!read(`${route.slice(1)}index.html`).includes(draft[0].title));
    assert.ok(!read('sitemap.xml').includes(`https://arctura.network${route}`));
    assert.ok(!read('feed.json').includes(`https://arctura.network${route}`));
    assert.ok(!read('content/search-index.json').includes(route));
    fs.writeFileSync(path.join(temporary,'content/editorial/articles.json'),JSON.stringify(records));
    execFileSync(process.execPath,['scripts/publish-experience.mjs'],{cwd:temporary,stdio:'pipe'});
    assert.ok(read('sitemap.xml').includes(`https://arctura.network${route}`));
    assert.doesNotMatch(read(`${route.slice(1)}index.html`),/noindex,follow/);
  } finally {
    fs.rmSync(temporary,{recursive:true,force:true});
  }
});
