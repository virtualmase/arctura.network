import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

for (const [route, expected] of [
  ["health", { service: "arctura-network", status: "ok", delivery: "static" }],
  ["ready", { service: "arctura-network", ready: true, dependencies: "static" }],
]) {
  try {
    const body = JSON.parse(read(route));
    for (const [key, value] of Object.entries(expected)) {
      if (body[key] !== value) errors.push(`/${route}: expected ${key}=${JSON.stringify(value)}`);
    }
  } catch (error) {
    errors.push(`/${route}: invalid static JSON (${error.message})`);
  }
}

const headers = read("_headers");
for (const route of ["/health", "/ready"]) {
  const escaped = route.replaceAll("/", "\\/");
  const block = new RegExp(`^${escaped}\\n(?:  .+\\n?)+`, "m").exec(headers)?.[0] || "";
  if (!/Content-Type: application\/json/i.test(block)) errors.push(`${route}: static JSON content type missing from _headers`);
  if (!/Cache-Control: no-store/i.test(block)) errors.push(`${route}: no-store cache policy missing from _headers`);
}

const redirects = read("_redirects");
if (!redirects.includes("https://www.arctura.network/* https://arctura.network/:splat 301")) {
  errors.push("www-to-apex permanent redirect missing from _redirects");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validated static edge health, readiness, headers, and canonical redirect.");
