# Arctura content publishing standard

Updated: 2026-08-30

Arctura publishes connected evidence and utility, not disconnected keyword silos. A new page must help a defined reader complete a decision, use a tool, inspect evidence, or contribute a bounded improvement.

## Required publishing path

Every new content cluster begins with one canonical source set and one reusable renderer or page pattern. It must include:

1. a hub that states the reader, purpose, status, and scope;
2. focused pages that answer distinct questions without duplicating one another;
3. an internal path to a useful artifact, example, evidence record, and next action;
4. canonical metadata, structured data, sitemap discovery, and machine-readable discovery;
5. a claim boundary separating methodology, proposal, tested implementation, and verified outcome;
6. regression coverage that counts the expected pages and checks their status and CTA contract.

## Claim states

- **Methodology:** a published way of framing or reviewing work; not evidence that a capability is deployed.
- **Proposed:** an intended mechanism without a completed public operating record.
- **Tested:** exercised within the exact conditions named by its evidence.
- **Operational:** currently available and supported by a dated status source.
- **Verified outcome:** a result tied to inspectable evidence and its limitations.

Never convert one state into another through promotional wording.

## CTA contract

Each page must provide a relevant continuation. Prefer this sequence:

`understand → inspect an example → create a Work Order → evaluate the result → contribute a lesson`

Generic “learn more” and “take part” links are insufficient when a more concrete action exists.

## Work Standard workflow

The canonical source is `content/work-standard/`. Run `npm run publish:work-standard` after editing it. The publisher generates the 16 article routes and synchronizes sitemap and `llms.txt` discovery. The hand-authored hub remains `work-standard/index.html`.

Do not hand-copy the Work Standard into a new silo. Extend the source, renderer, validation, and internal-link model already present.
