import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const origin = "https://arctura.network";
const standardRoot = path.join(root, "work-standard");
const standardRoutes = fs.readdirSync(standardRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(standardRoot, entry.name, "index.html")))
  .map((entry) => `/work-standard/${entry.name}/`).sort();
const published = ["/", "/faq/", "/insights/", "/insights/train-your-agent/", "/tools/work-order/", "/records/2026-08/", "/updates/work-order-v1/", "/work-standard/", ...standardRoutes];
const errors = [];

const fileFor = (route) => route === "/" ? "index.html" : path.join(route.slice(1), "index.html");
const htmlByRoute = new Map();

for (const route of published) {
  const file = path.join(root, fileFor(route));
  if (!fs.existsSync(file)) { errors.push(`${route}: file missing`); continue; }
  const html = fs.readFileSync(file, "utf8");
  htmlByRoute.set(route, html);
  const canonical = `${origin}${route}`;
  const checks = [
    [/<title>[^<]+<\/title>/i, "title"],
    [/<meta\s+name=["']description["'][^>]+content=["'][^"']+["']/i, "description"],
    [new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']${canonical.replaceAll("/", "\\/")}["']`, "i"), `canonical ${canonical}`],
    [/<h1\b/i, "h1"],
  ];
  for (const [pattern, label] of checks) if (!pattern.test(html)) errors.push(`${route}: missing ${label}`);
  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch { errors.push(`${route}: invalid JSON-LD`); }
  }
}

const localLinks = new Set();
for (const html of htmlByRoute.values()) {
  for (const match of html.matchAll(/<a\b[^>]*href=["'](\/[^"'#?]*)/gi)) {
    const href = match[1];
    if (href.endsWith(".txt") || href.endsWith(".xml")) continue;
    localLinks.add(href.endsWith("/") ? href : `${href}/`);
  }
}
for (const route of ["/faq/", "/insights/", "/insights/train-your-agent/", "/tools/work-order/", "/records/2026-08/", "/updates/work-order-v1/", "/work-standard/", ...standardRoutes]) if (!localLinks.has(route)) errors.push(`${route}: not reachable through a crawlable link`);

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const route of published) if (!sitemap.includes(`<loc>${origin}${route}</loc>`)) errors.push(`${route}: absent from sitemap`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${published.length} published routes, structured data, crawl paths, and sitemap parity.`);
