import fs from 'node:fs';
import path from 'node:path';

const origin = 'https://arctura.network';
const errors = [];
const read = file => fs.readFileSync(file, 'utf8');
const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const titles = new Set();
const descriptions = new Set();
const pages = new Map();
const links = new Map();
const fail = (url, message) => errors.push(`${url}: ${message}`);
if (new Set(urls).size !== urls.length) errors.push('Duplicate sitemap URL');
for (const url of urls) {
  if (!url.startsWith(`${origin}/`) || !url.endsWith('/')) { fail(url, 'noncanonical sitemap URL'); continue; }
  const route = new URL(url).pathname;
  const file = path.join('.', route, 'index.html');
  if (!fs.existsSync(file)) { fail(url, 'missing page'); continue; }
  const html = read(file);
  pages.set(route, html);
  if (/name="robots"[^>]*content="[^"]*noindex/i.test(html)) fail(url, 'noindex page in sitemap');
  if (!html.includes(`rel="canonical" href="${url}"`)) fail(url, 'canonical differs from sitemap');
  if ((html.match(/<h1\b/gi) || []).length !== 1) fail(url, 'expected one h1');
  for (const [label, pattern, seen] of [
    ['title', /<title>([^<]+)<\/title>/i, titles],
    ['description', /name="description" content="([^"]+)"/i, descriptions],
  ]) {
    const value = pattern.exec(html)?.[1];
    if (!value) fail(url, `missing ${label}`);
    else if (seen.has(value)) fail(url, `duplicate ${label}`);
    else seen.add(value);
  }
  const schemas = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!schemas.length) fail(url, 'missing structured data');
  for (const [, json] of schemas) {
    try {
      const data = JSON.parse(json);
      if (data['@context'] !== 'https://schema.org') fail(url, 'unexpected schema context');
      for (const entity of data['@graph'] || [data]) if (!entity['@type']) fail(url, 'missing schema type');
    } catch { fail(url, 'invalid structured data JSON'); }
  }
  const destinations = [];
  for (const [, href] of html.matchAll(/\bhref="(\/[^"\s]*)"/g)) {
    if (href.startsWith('//')) continue;
    const target = new URL(href, origin);
    const relative = decodeURIComponent(target.pathname).slice(1);
    const file = path.join('.', relative || '.', target.pathname.endsWith('/') ? 'index.html' : '');
    if (!fs.existsSync(file)) fail(url, `broken local link ${href}`);
    destinations.push(target.pathname);
  }
  links.set(route, destinations);
}
const reachable = new Set();
const queue = ['/'];
while (queue.length) {
  const route = queue.shift();
  if (reachable.has(route)) continue;
  reachable.add(route);
  queue.push(...(links.get(route) || []).filter(route => pages.has(route) && !reachable.has(route)));
}
for (const route of pages.keys()) if (!reachable.has(route)) fail(route, 'unreachable from homepage');
const robots = read('robots.txt');
for (const route of ['archive', 'architecture', 'base', 'compare', 'onboarding', 'operon', 'patrons', 'which-tier']) {
  if (robots.includes(`Disallow: /${route}/`)) fail(route, 'crawl block hides noindex');
  const html = read(`${route}/index.html`);
  if (!/name="robots"[^>]*content="[^"]*noindex/i.test(html)) fail(route, 'legacy page missing portable noindex');
}
for (const item of JSON.parse(read('resources/index.json')).resources) {
  const url = new URL(item.url);
  if (url.origin !== origin || !fs.existsSync(`.${url.pathname}`)) fail(item.url, 'resource missing');
  if (item.mediaType.includes('json')) JSON.parse(read(`.${url.pathname}`));
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`SEO checks passed: ${pages.size} canonical pages, metadata, JSON-LD, local links, homepage reachability, crawl rules, and resource index.`);
