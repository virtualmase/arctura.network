const origin = process.env.ARCTURA_ORIGIN || "https://arctura.network";
const checks = [
  ["/", "A network for useful work."],
  ["/tools/work-order/", "Define the work before you train the agent."],
  ["/insights/train-your-agent/", "By Arctura Network"],
  ["/evidence/netuid-505/", "A real testnet subnet"],
  ["/documentation/netuid-505/", "Netuid 505"],
  ["/schemas/work-order/v1/schema.json", '"Arctura Agent Work Order"'],
  ["/examples/work-orders/support-response-review.json", '"awo-support-response-review-v1"']
];
const failures = [];
for (const [route, expected] of checks) {
  try {
    const response = await fetch(`${origin}${route}`, { signal: AbortSignal.timeout(10_000) });
    const body = await response.text();
    if (!response.ok) failures.push(`${route}: HTTP ${response.status}`);
    else if (!body.includes(expected)) failures.push(`${route}: expected content missing`);
  } catch (error) { failures.push(`${route}: ${error.message}`); }
}
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`Live audit passed for ${checks.length} Arctura routes at ${origin}.`);
