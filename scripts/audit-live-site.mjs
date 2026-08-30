const origin = process.env.ARCTURA_ORIGIN || "https://arctura.network";
const checks = [
  ["/", "Define the work."],
  ["/work-standard/", "One standard. Four movements."],
  ["/work-standard/before-an-agent-acts/", "Published methodology, version 0.1"],
  ["/faq/", "Questions deserve"],
  ["/participate/", "Two contribution lanes"],
  ["/tools/work-order/", "Define the work before you train the agent."],
  ["/insights/train-your-agent/", "By Arctura Network"],
  ["/evidence/netuid-505/", "A real testnet subnet"],
  ["/documentation/netuid-505/", "Netuid 505"],
  ["/records/2026-08/", "Work. Proof."],
  ["/records/2026-08/metrics.json", '"repository_unique_cloners": 49'],
  ["/updates/work-order-v1/", "Agent Work Order"],
  ["/health", '"status":"ok"'],
  ["/ready", '"ready":true'],
  ["/schemas/work-order/v1/schema.json", '"Arctura Agent Work Order"'],
  ["/examples/work-orders/support-response-review.json", '"awo-support-response-review-v1"']
];
const failures = [];
async function fetchWithRetry(route) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await fetch(`${origin}${route}`, {
        headers: { "user-agent": "arctura-release-audit/1.0" },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}
for (const [route, expected] of checks) {
  try {
    const response = await fetchWithRetry(route);
    const body = await response.text();
    if (!response.ok) failures.push(`${route}: HTTP ${response.status}`);
    else if (!body.includes(expected)) failures.push(`${route}: expected content missing`);
  } catch (error) { failures.push(`${route}: ${error.message}`); }
}
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`Live audit passed for ${checks.length} Arctura routes at ${origin}.`);
