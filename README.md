# Arctura Network

**A network for useful work.**

Arctura explores how people and software can contribute useful work, check results, keep a public record, and improve the system they share.

## What exists today

- A public network and evidence site at [arctura.network](https://arctura.network/).
- A documented local Bittensor testnet run for Arctura Base on netuid 505.
- An [Agent Work Order builder](https://arctura.network/tools/work-order/) for defining bounded, checkable agent work.
- [Field Notes](https://arctura.network/insights/) that explain decisions and operating methods in ordinary language.
- A monthly [Work / Proof / Stewardship record](https://arctura.network/records/2026-08/) that publishes adoption evidence, unknowns, and next commitments.

No Finney mainnet netuid, public staking path, emissions state, or live quorum feed is claimed.

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Validate

```bash
npm test
npm run validate:publishing
npm run validate:edge
npm run validate:work-order -- examples/work-orders/support-response-review.json
```

The publishing validator checks canonical routes, metadata, structured data, crawl paths, and sitemap coverage. The edge validator checks that health, readiness, security headers, and the canonical host redirect remain portable to static edge hosting. The Work Order validator checks examples against the published v1 contract.

## Contribute and report

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing work or evidence.
- Use the structured issue forms for record corrections and Work Order examples.
- Report vulnerabilities privately according to [SECURITY.md](SECURITY.md).

## Public record

- [Netuid 505 documentation](https://arctura.network/documentation/netuid-505/)
- [Evidence boundary](https://arctura.network/evidence/netuid-505/)
- [Authority record](https://arctura.network/authority/)
- [Contribution and operator guidance](https://arctura.network/participate/)

## Working doctrine

Do the work. Check the work. Improve the system.

Work. Proof. Stewardship.
