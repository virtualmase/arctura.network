# Arctura Network

**Practical accountability for software agents doing real work.**

[arctura.network](https://arctura.network/) builds open tools, operating methods, and public records for teams that need software agents to do useful work without losing track of ownership, authority, handoffs, checks, or evidence.

The core idea is simple:

> A capable agent is not enough. Someone still needs to define the job, bound the authority, decide what counts as proof, and remain responsible for the result.

Arctura turns those responsibilities into things people can inspect and use.

## What Arctura does

Arctura helps a team answer five practical questions before and after an agent is given meaningful work:

1. **Who owns the agent?**
2. **What is it allowed to do?**
3. **What must it refuse or hand back to a person?**
4. **How will the result be checked?**
5. **What record should remain after the work is complete?**

The project is built around small, portable artifacts rather than a closed control plane. A team can use one tool, adopt the Work Order schema, study the operating standard, or inspect the full example without committing to a proprietary platform.

## Start here

### [AI Agent Readiness Check](https://arctura.network/tools/agent-readiness-check/)

A private, local-first review built around 12 concrete questions covering ownership, authority, handoffs, evaluation, and evidence.

Use it to find the gaps before giving an agent more responsibility.

### [Agent Accountability Card](https://arctura.network/tools/agent-accountability-card/)

A portable record of an agent's responsible owner, standing authority, prohibited actions, handoff conditions, checks, and evidence expectations.

The builder produces open JSON that can travel with the project instead of living only inside a vendor dashboard.

### [Agent Work Order](https://arctura.network/tools/work-order/)

A bounded assignment for one piece of work.

A Work Order defines the expected result, permitted inputs, allowed actions, exclusions, accountable owner, human-review points, acceptance checks, and evidence required to close the task.

The versioned schema is published at:

```text
https://arctura.network/schemas/work-order/v1/schema.json
```

Validate a Work Order locally with:

```bash
npm run validate:work-order -- path/to/work-order.json
```

### [Complete support-review example](https://arctura.network/examples/agents/support-review/)

A worked example showing the artifacts together:

```text
owner
  ↓
accountability card
  ↓
work order
  ↓
refusal test
  ↓
human handoff
  ↓
evaluation
  ↓
reviewable record
```

The example matters because the method should be inspectable as a complete piece of work, not only described in principle.

## The Work Standard

Arctura publishes a [16-part Work Standard](https://arctura.network/work-standard/) for accountable work between people and software.

It moves through the full lifecycle of a consequential task:

```text
question
→ mandate
→ authority
→ execution
→ evidence
→ handoff
→ decision
→ record
→ maintenance
```

The standard covers problem framing, decision rights, execution boundaries, evidence, interoperability, human review, record stewardship, and correction.

It is not a certification scheme. It is a working method that teams can inspect, adapt, and test against their own systems.

Canonical source lives in:

```text
content/work-standard/
```

Published pages are generated from that source:

```bash
npm run publish:work-standard
```

## Who this is for

Arctura is useful when software can do more than produce text.

Typical cases include agents that can:

- read internal material
- use external tools
- create or update records
- prepare customer communications
- change live systems
- coordinate work across services
- make recommendations that affect money, schedules, access, or people
- operate repeatedly without someone watching every step

The more meaningful the action, the more important it becomes to separate **capability** from **authority**.

Arctura provides the records needed to make that distinction visible.

## The operating model

Arctura uses three words throughout the project:

### Work

Name the actual result.

Define the approved inputs, allowed actions, exclusions, owner, and handoff points before execution begins.

### Proof

Decide how the result will be evaluated.

State the acceptance checks, refusal conditions, evidence requirements, and known limits before success is claimed.

### Stewardship

Keep the work understandable after execution.

Preserve the outcome, human decisions, corrections, open questions, and next review so another person can reconstruct what happened.

**Work. Proof. Stewardship.**

## Current implementation

Arctura has a documented Bittensor testnet implementation called **Arctura Base**.

The recorded run used:

| Field | Recorded state |
|---|---|
| Network | Bittensor testnet |
| Netuid | `505` |
| Evidence | Public documentation and evidence record |
| Mainnet status | No Finney mainnet netuid claimed |
| Public staking | Not claimed |
| Emissions | Not claimed |
| Live quorum feed | Not claimed |

Inspect the records directly:

- [Netuid 505 documentation](https://arctura.network/documentation/netuid-505/)
- [Netuid 505 evidence](https://arctura.network/evidence/netuid-505/)
- [Authority record](https://arctura.network/authority/)
- [Participation guidance](https://arctura.network/participate/)

The testnet implementation is evidence that the work has been exercised in a real technical environment. It should not be read as evidence of mainnet launch, adoption, staking activity, commercial performance, or production reliability.

## Public records

Arctura publishes records because a technical claim is more useful when another person can inspect what supports it.

The public site includes:

- implementation records
- evidence boundaries
- authority records
- release notes
- Work Order examples
- evaluation records
- Field Notes
- monthly Work / Proof / Stewardship records

Unknowns are kept visible rather than converted into stronger claims.

## Repository structure

This repository contains the public site, tools, schemas, standards, examples, validators, and operating records behind Arctura Network.

```text
agents/                 agent field guides and practice material
architecture/           system architecture material
authority/              published authority records
content/                canonical editorial source
docs/                   operating and publishing documentation
examples/               worked examples and Work Orders
evidence/               public evidence records
records/                recurring Work / Proof / Stewardship records
schemas/                versioned machine-readable contracts
scripts/                publishing, validation, and audit utilities
tools/                  public local-first tools
work-standard/          generated Work Standard pages
```

The exact public record should be judged by the source currently in the repository, not by this summary alone.

## Run locally

Arctura uses a small Express development server around a largely static public property.

Requirements:

```text
Node.js 22+
```

Install and run:

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

## Validate the repository

Run the core checks before publishing:

```bash
npm test
npm run validate:publishing
npm run validate:edge
npm run validate:work-order -- examples/work-orders/support-response-review.json
npm run publish:work-standard
```

The checks cover different failure surfaces:

- `npm test` runs the repository test suite
- `validate:publishing` checks routes, canonical metadata, structured data, crawl paths, and sitemap coverage
- `validate:edge` checks health, readiness, security headers, and host behavior for portable static hosting
- `validate:work-order` checks a Work Order against the published contract
- `publish:work-standard` regenerates the public standard from canonical source

Read [`docs/CONTENT_PUBLISHING_STANDARD.md`](docs/CONTENT_PUBLISHING_STANDARD.md) before creating a new content cluster.

Read [`VALIDATION.md`](VALIDATION.md) for recorded validation work and known boundaries.

## Engineering principles

Arctura is maintained with a few explicit rules:

- capability does not imply permission
- access does not imply authority
- automation does not remove accountability
- evidence should be inspectable
- unknowns should remain unknown until measured
- consequential work needs a named owner
- important actions need a handoff or interruption path
- claims should stay inside the evidence that supports them
- portable records are preferable to hidden state
- reversal should be designed before it is needed

These rules matter more than any particular model, framework, chain, or vendor.

## Contributing

Useful contributions include:

- correcting a public record
- improving a validator or test
- adding a privacy-safe Work Order example
- improving accessibility or documentation
- proposing a bounded prototype with a named user and acceptance checks
- providing reproducible evidence that strengthens or corrects an existing claim

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

Do not publish secrets, wallet keys, credentials, private customer material, personal data, or unverifiable production claims.

Security concerns should follow [`SECURITY.md`](SECURITY.md).

## Evidence boundary

Arctura is public about what exists and equally public about what has not been demonstrated.

A schema does not prove that an agent followed it.

A validator does not certify a deployment.

A testnet run does not establish mainnet operation.

A public record does not make the underlying claim true by itself.

The purpose of the system is narrower and more useful: make the work, authority, evidence, and responsibility easier for another person to inspect.

## About Arctura Network

Arctura Network is a public engineering project focused on accountable work between people and software agents.

The project develops practical tools, schemas, operating methods, examples, and reference implementations that help teams move from:

```text
"the agent can do this"
```

to:

```text
"this is the job,
this is who owns it,
this is what it may do,
this is when a person takes over,
and this is how we check what happened."
```

That is the standard Arctura is trying to make ordinary.

---

**Arctura Network**

*Do the work. Check the work. Improve the system.*