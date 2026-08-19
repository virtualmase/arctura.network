const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), "utf8");

test("homepage labels quorum visualisation as non-live and links to evidence", () => {
  const home = read("index.html");
  assert.match(home, /Illustrative only\.<\/span> No source-backed live quorum feed is published\./);
  assert.match(home, /href="\/evidence\/netuid-505\/">Review testnet evidence/);
  assert.doesNotMatch(home, /watch consensus rounds settle in real time on the quorum meter/i);
});

test("public evidence record declares its proof boundary without a mainnet claim", () => {
  const status = JSON.parse(read("evidence", "netuid-505", "status.json"));
  assert.equal(status.network.netuid, 505);
  assert.equal(status.network.finney_netuid, null);
  assert.match(status.network.scope, /local testnet launch/i);
  assert.match(status.claims[0].assertion, /launched and exercised/i);
  assert.match(status.claims[0].boundary, /does not include an external explorer/i);
});

test("authority record distinguishes related Arctura surfaces and source precedence", () => {
  const authority = JSON.parse(read(".well-known", "arctura-authority.json"));
  assert.equal(authority.related_but_not_alternate_identities, true);
  assert.equal(authority.surfaces[0].url, "https://arctura.network/");
  assert.equal(authority.source_precedence[0], "dated Arctura Network evidence record");
});
