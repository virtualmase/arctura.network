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

test("homepage gives social visitors a bounded path into the product", () => {
  const home = read("index.html");
  assert.match(home, /If you found Arctura through a field note or reel/);
  assert.match(home, /href="\/agents\/"><span>01 · Learn/);
  assert.match(home, /href="\/tools\/work-order\/"><span>02 · Make/);
  assert.match(home, /href="\/evidence\/netuid-505\/"><span>03 · Inspect/);
  assert.match(home, /https:\/\/www\.instagram\.com\/arctura\.network\//);
  assert.match(home, /https:\/\/x\.com\/ArcturaNetwork/);
  assert.match(home, /rel="me noopener"/);
  assert.match(home, /href="tel:\+17209529191"/);
  assert.match(home, /https:\/\/share\.google\/K0L9x8JHH3nojsPn9/);
});

test("official social channels remain human-operated and claim-bounded", () => {
  const channels = read("docs", "SOCIAL_CHANNELS.md");
  assert.match(channels, /@arctura\.network/);
  assert.match(channels, /@ArcturaNetwork/);
  assert.match(channels, /published manually/);
  assert.match(channels, /No automated posting agent/);
  assert.match(channels, /do not create a new technical claim/);
});

test("site footers render accessible official-channel icons", () => {
  const script = read("js", "site.js");
  const styles = read("css", "site.css");
  for (const channel of ["Instagram", "X", "LinkedIn", "GitHub", "Google"]) {
    assert.match(script, new RegExp(`name: '${channel}'`));
  }
  assert.match(script, /linkedin\.com\/company\/arctura-network/);
  assert.match(script, /aria-label="Arctura Network on \$\{name\}"/);
  assert.match(script, /<svg viewBox="0 0 24 24" aria-hidden="true"/);
  assert.match(styles, /\.social-link:focus-visible/);
});

test("repository publishes the Arctura voice rules", () => {
  const voice = read("docs", "VOICE_SYSTEM.md");
  const contributing = read("CONTRIBUTING.md");
  assert.match(voice, /High signal, low latency/);
  assert.match(voice, /No invention/);
  assert.match(voice, /Unknowns and evidence boundaries are visible/);
  assert.match(contributing, /docs\/VOICE_SYSTEM\.md/);
});

test("professional network direction has an explicit product and trust contract", () => {
  const contract = read("docs", "NETWORK_PRODUCT_CONTRACT.md");
  assert.match(contract, /professional network for the agentic age/);
  assert.match(contract, /people and accountable software agents find credible collaborators/);
  assert.match(contract, /Person/);
  assert.match(contract, /Agent/);
  assert.match(contract, /Organization/);
  assert.match(contract, /separates identity, claims, and evidence/);
  assert.match(contract, /will not include[\s\S]*algorithmic engagement feed/);
  assert.match(contract, /proof-backed professional connection/);
});

test("network preview publishes discoverable source-backed profiles", () => {
  const directory = read("network", "index.html");
  const directoryScript = read("js", "network-directory.js");
  const organization = read("network", "arctura-network", "index.html");
  const agent = read("network", "arctura-base", "index.html");
  assert.match(directory, /Only source-backed Arctura records appear today/);
  assert.match(directory, /data-type="organization"/);
  assert.match(directory, /data-type="agent"/);
  assert.match(organization, /Canonical record/);
  assert.match(agent, /No Finney mainnet netuid/);
  assert.match(agent, /Accountable owner named/);
  assert.doesNotMatch(directory, /verified member|active connections/i);
  assert.match(directoryScript, /loadLiveProfiles/);
  assert.match(directoryScript, /\/api\/profiles\/handle\//);
  assert.match(directoryScript, /Inspect source/);
  assert.match(directoryScript, /sendConnection/);
  assert.match(directoryScript, /Every request includes a professional reason/);
});

test("profile onboarding is local-first and exports a bounded draft", () => {
  const join = read("join", "index.html");
  const script = read("js", "profile-draft.js");
  const schema = JSON.parse(read("schemas", "profile-draft", "v1", "schema.json"));
  assert.match(join, /does not upload, publish, or receive anything you enter/);
  assert.match(join, /Responsible owner/);
  assert.match(join, /when must a person step in/);
  assert.match(join, /Draft completeness/);
  assert.match(join, /Profile handle/);
  assert.match(script, /localStorage/);
  assert.match(script, /status: 'local-draft'/);
  assert.match(script, /agentLimits/);
  assert.match(script, /selectedPosition/);
  assert.equal(schema.$id, "https://arctura.network/schemas/profile-draft/v1/schema.json");
  assert.doesNotMatch(script, /XMLHttpRequest/);
});

test("task force openings are complete, plain-language, and never shown as filled", () => {
  const data = JSON.parse(read("content", "network", "roles.json"));
  const page = read("network", "roles", "index.html");
  const script = read("js", "roles.js");
  const positions = data.teams.flatMap((group) => group.roles);
  assert.equal(data.teams.length, 8);
  assert.equal(positions.length, 25);
  for (const position of positions) {
    assert.ok(position.responsibility);
    assert.ok(position.skills.length >= 3);
    assert.ok(position.requirements.length >= 3);
    assert.ok(position.proof);
  }
  assert.match(page, /Task Force Openings/);
  assert.match(page, /These are not job offers/);
  assert.match(page, /25 open positions · 0 filled/);
  assert.match(script, /Skills needed/);
  assert.match(script, /How results are checked/);
  assert.doesNotMatch(`${page}\n${script}`, /mandate|proof owed|operating houses|scoped participation/i);
});

test("member area handles unavailable, signed-out, profile, and connection states", () => {
  const page = read("network", "me", "index.html");
  const script = read("js", "network-account.js");
  assert.match(page, /Accounts are not active yet/);
  assert.match(page, /Continue with GitHub/);
  assert.match(page, /Private draft found/);
  assert.match(page, /Requests with a reason/);
  assert.match(script, /\/api\/me\/profiles/);
  assert.match(script, /\/api\/connections/);
  assert.match(script, /Manage sources/);
  assert.match(script, /addEvidence/);
  assert.match(page, /Type <strong>DELETE<\/strong> to confirm/);
  assert.match(script, /\/api\/account/);
  for (const state of ["accepted", "declined", "withdrawn", "blocked"]) assert.match(script, new RegExp(state));
  assert.match(script, /It is still private/);
});

test("network worker covers profile ownership, evidence, and the connection lifecycle", () => {
  const worker = read("worker", "index.js");
  const migration = read("worker", "migrations", "0001_network.sql");
  const reportsMigration = read("worker", "migrations", "0002_reports.sql");
  const requestLimitsMigration = read("worker", "migrations", "0003_request_limits.sql");
  assert.match(worker, /githubCallback/);
  assert.match(worker, /listOwnedProfiles/);
  assert.match(worker, /updateProfile/);
  assert.match(worker, /addEvidence/);
  assert.match(worker, /listOwnedEvidence/);
  assert.match(worker, /requestConnection/);
  assert.match(worker, /updateConnection/);
  assert.match(worker, /createReport/);
  assert.match(worker, /\/api\/reports/);
  assert.match(worker, /enforceRequestLimit/);
  assert.match(worker, /deleteAccount/);
  assert.match(migration, /CREATE TABLE profiles/);
  assert.match(migration, /CREATE TABLE connections/);
  assert.match(migration, /CREATE TABLE evidence_links/);
  assert.match(reportsMigration, /CREATE TABLE reports/);
  assert.match(requestLimitsMigration, /CREATE TABLE request_limits/);
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
