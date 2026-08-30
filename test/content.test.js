const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), "utf8");

test("homepage preserves the bounded testnet record and links to evidence", () => {
  const home = read("index.html");
  assert.match(home, /href="\/documentation\/netuid-505\/">Read the Netuid 505 record/);
  assert.match(home, /href="\/evidence\/netuid-505\/">Review the evidence/);
  assert.match(home, /No mainnet netuid has been published\./);
  assert.match(home, /href="\/participate\/">Contribute<\/a>/);
  assert.doesNotMatch(home, /live quorum|live Finney|staking available/i);
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
  assert.equal(authority.delegations[0].provider, "ARM Agency");
  assert.equal(authority.delegations[0].contact, "ops@arm-agency.com");
  assert.match(authority.delegations[0].commercial_status, /no current payment rail/i);
  const authorityPage = read("authority", "index.html");
  assert.match(authorityPage, /ARM Agency/);
  assert.match(authorityPage, /possible mechanisms, not current commitments/i);
});

test("Netuid 505 documentation cites the primary run record and preserves the bounded-run boundary", () => {
  const documentation = read("documentation", "netuid-505", "index.html");
  assert.match(documentation, /TESTNET_RUN_PLAN\.md/);
  assert.match(documentation, /miner was not running concurrently/i);
  assert.match(documentation, /No Finney netuid, emissions state, or mainnet availability is claimed/i);
  assert.match(documentation, /aria-current="page">Launch record/);
});

test("community guidance and launch note preserve testnet-only contribution boundaries", () => {
  const participation = read("participate", "index.html");
  const launchNote = read("updates", "netuid-505-launch", "index.html");
  assert.match(participation, /No public Finney netuid, validator enrollment, stake instruction, or emissions availability is published/i);
  assert.match(participation, /CONTRIBUTING\.md/);
  assert.match(launchNote, /No Finney netuid, emissions state, validator enrollment, or mainnet availability is published/i);
  assert.match(launchNote, /TESTNET_RUN_PLAN\.md/);
});

test("Agent Work Order prototype exposes bounded work and proof fields", () => {
  const home = read("index.html");
  const tool = read("tools", "work-order", "index.html");
  const script = read("js", "work-order.js");
  assert.match(home, /href="\/tools\/work-order\/">Create a work order/);
  for (const field of ["expectedResult", "approvedInputs", "allowedActions", "acceptanceChecks", "evidenceToKeep", "reviewStatus"]) {
    assert.match(script, new RegExp(field));
  }
  assert.match(tool, /never your answers or exported JSON/i);
  assert.doesNotMatch(tool, /fetch\(|XMLHttpRequest/);
});

test("Work Order exports identify the public versioned schema", () => {
  const script = read("js/work-order.js");
  const schema = JSON.parse(read("schemas/work-order/v1/schema.json"));
  const example = JSON.parse(read("examples/work-orders/support-response-review.json"));
  const schemaUrl = "https://arctura.network/schemas/work-order/v1/schema.json";
  assert.match(script, new RegExp(schemaUrl.replace(/[.]/g, "\\.")));
  assert.equal(schema.$id, schemaUrl);
  assert.equal(example.schema, schemaUrl);
});

test("monthly operating record publishes an honest adoption baseline and evaluation path", () => {
  const record = read("records/2026-08/index.html");
  const metrics = JSON.parse(read("records/2026-08/metrics.json"));
  const evaluation = JSON.parse(read("examples/evaluations/work-order-evaluation-template.json"));
  assert.equal(metrics.observed.repository_unique_cloners, 49);
  assert.equal(metrics.observed.stars, 0);
  assert.ok(metrics.unknown.includes("arctura.network visitors"));
  assert.match(record, /curiosity, <em>not adoption yet/i);
  assert.match(record, /privacy-respecting aggregate analytics/i);
  assert.equal(evaluation.result.status, "not-run");
  assert.match(evaluation.limitations, /cannot establish/i);
});

test("Work Order v1 release is reproducible and legacy claims remain non-indexable", () => {
  const release = read("updates/work-order-v1/index.html");
  const headers = read("_headers");
  assert.match(release, /npm run validate:work-order/);
  assert.match(release, /No hosted execution service, certification, payment rail, or production-agent guarantee/);
  for (const route of ["archive", "architecture", "base", "compare", "onboarding", "operon", "patrons", "which-tier"]) {
    assert.match(headers, new RegExp(`/${route}/\\*\\n  X-Robots-Tag: noindex, noarchive`));
  }
});

test("Work Order evaluation conversion is structured, measurable, and privacy-safe", () => {
  const issueForm = read(".github/ISSUE_TEMPLATE/work-order-evaluation.yml");
  const tool = read("tools/work-order/index.html");
  const contributing = read("CONTRIBUTING.md");
  assert.match(issueForm, /labels: \[evaluation\]/);
  assert.match(issueForm, /no credentials, wallet material, private customer data, personal information/);
  assert.match(issueForm, /does not certify the agent, model, work order, or result/);
  assert.match(tool, /template=work-order-evaluation\.yml/);
  assert.match(contributing, /verified use can be counted without embedding telemetry/i);
});

test("Work Order analytics emit fixed, content-free Cloudflare Zaraz events", () => {
  const script = read("js/work-order.js");
  assert.match(script, /window\.zaraz\?\.track/);
  assert.match(script, /track\('work_order_builder_view'\)/);
  assert.match(script, /track\('work_order_builder_start'\)/);
  assert.match(script, /track\('work_order_export', \{ method: 'copy' \}\)/);
  assert.match(script, /track\('work_order_export', \{ method: 'download' \}\)/);
  assert.doesNotMatch(script, /track\([^\n]*(values|latest|FormData)/);
});

test("Work Standard publishes a bounded hub and 16 connected organic articles", () => {
  const hub = read("work-standard", "index.html");
  assert.match(hub, /Published methodology/);
  assert.match(hub, /not (?:a claim|evidence) of (?:a DAO|decentralized governance)/i);
  assert.match(hub, /href="\/work-standard\/what-counts-as-work\/"/);
  const directories = fs.readdirSync(path.join(root, "work-standard"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
  assert.equal(directories.length, 16);
  for (const entry of directories) {
    const article = read("work-standard", entry.name, "index.html");
    assert.match(article, /Published methodology, version 0\.1/);
    assert.match(article, /Create a work order/);
    assert.match(article, /application\/ld\+json/);
  }
});

test("Agent Field Guide publishes one bounded hub and seven connected practice routes", () => {
  const hub = read("agents", "index.html");
  const source = JSON.parse(read("content", "agent-field-guide", "guides.json"));
  assert.equal(source.length, 7);
  assert.match(hub, /Learn the system\. Grow through evaluation/);
  assert.match(hub, /educational methodology/i);
  assert.match(hub, /arctura-agent-practice-loop\.webp/);
  for (const verb of ["learn", "grow", "build", "scale", "sweep", "expand", "contribute"]) {
    assert.match(hub, new RegExp(`href="/agents/${verb}/"`));
    const page = read("agents", verb, "index.html");
    assert.match(page, /Published educational methodology/);
    assert.match(page, /Create a Work Order/);
    assert.match(page, /Keep the proof/);
    assert.match(page, /application\/ld\+json/);
  }
});

test("FAQ replaces legacy claims with current evidence-safe answers", () => {
  const faq = read("faq", "index.html");
  assert.match(faq, /No active DAO, token offer, investment, payment rail/i);
  assert.match(faq, /No Finney mainnet netuid, public staking path/i);
  assert.match(faq, /never form answers or exported JSON/i);
  assert.doesNotMatch(faq, /Resonance BFT|Truth Ledger|28% average reduction|net-negative/i);
});
