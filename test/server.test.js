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
