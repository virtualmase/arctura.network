const assert = require("node:assert/strict");
const test = require("node:test");

const app = require("../server");

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("health and agent discovery are machine readable", async () => {
  await withServer(async (origin) => {
    const health = await fetch(`${origin}/health`);
    assert.equal(health.status, 200);
    assert.match(health.headers.get("content-type"), /application\/json/);
    const agent = await fetch(`${origin}/.well-known/agent.json`);
    assert.equal(agent.status, 200);
    assert.equal((await agent.json()).name, "Arctura Network");
  });
});

test("missing API and page routes return real 404 responses", async () => {
  await withServer(async (origin) => {
    const api = await fetch(`${origin}/api/missing`);
    assert.equal(api.status, 404);
    assert.deepEqual(await api.json(), { error: "not_found" });
    assert.equal((await fetch(`${origin}/missing-page`)).status, 404);
  });
});

test("faq resolves to the actual directory page", async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/faq`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /FAQ|Frequently/i);
  });
});

test("public evidence and authority records are served as canonical static pages", async () => {
  await withServer(async (origin) => {
    const evidence = await fetch(`${origin}/evidence/netuid-505/`);
    assert.equal(evidence.status, 200);
    assert.match(await evidence.text(), /Testnet evidence,/i);

    const authority = await fetch(`${origin}/authority/`);
    assert.equal(authority.status, 200);
    assert.match(await authority.text(), /Three surfaces\./i);

    const record = await fetch(`${origin}/evidence/netuid-505/status.json`);
    assert.equal(record.status, 200);
    assert.equal((await record.json()).network.netuid, 505);
  });
});

test("www requests permanently redirect to the canonical apex host", async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/evidence/netuid-505/?from=test`, {
      redirect: "manual",
      headers: { "x-forwarded-host": "www.arctura.network" },
    });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), "https://arctura.network/evidence/netuid-505/?from=test");
  });
});
