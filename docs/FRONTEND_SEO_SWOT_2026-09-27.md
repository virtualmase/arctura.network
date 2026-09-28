# Frontend and content review — 27 September 2026

Scope: `virtualmase/arctura.network`, local main at `34a77bb`, plus direct HTTP inspection of production. Existing uncommitted Media Evidence Desk changes were preserved. This review does not establish search traffic, rankings, conversions, Core Web Vitals, or adoption; no Search Console or field-performance dataset was available.

## SWOT

| Area | Finding | Implication |
| --- | --- | --- |
| Strength | Free task-oriented tools, portable JSON schemas, a connected Work Standard and Agent Field Guide. | Visitors can leave with a useful artifact rather than only a marketing promise. |
| Strength | Source-backed authority and testnet records explicitly distinguish examples, methodology, and observed implementation. | This is a credible editorial foundation; preserve evidence boundaries. |
| Weakness | Homepage largely assumes an agent builder; citizens and people inspecting an AI decision have no explicit entry path. | Add plain-language questions and routes based on visitor needs. |
| Weakness | Schema and example discovery is spread across tools and technical records. | Publish one human-readable and machine-readable resource index. |
| Weakness | Legacy routes are blocked from crawling despite carrying noindex; publishing checks cover fewer pages than the sitemap. | Let crawlers read noindex and check the complete sitemap in CI. |
| Weakness | Navigation and positioning vary across older pages; the live audit still expects an obsolete homepage headline. | Establish a shared publishing/navigation contract and maintain checks alongside content. |
| Opportunity | Explain ownership, permitted actions, evidence, and human review through concrete visitor questions. | Reach people who need to evaluate agents, not only build them. |
| Opportunity | Publish permissioned, anonymized evaluations with method, failed checks, and limitations. | Original evidence would add more value than more abstract articles. |
| Opportunity | Connect schemas to complete examples and evaluation templates. | Reduce integration work for agents and developers. |
| Threat | Testnet evidence or illustrative examples may be mistaken for production validation. | Carry status and limitations into summaries and exports. |
| Threat | Formal-sounding citizenship, governance, or certification claims could outrun the actual service. | Describe participation without inventing membership rights or authority. |
| Threat | Local and production content drift can invalidate SEO conclusions. | Treat deployment and post-deployment parity as explicit release steps. |

## Implemented locally

- `/start/`: starting paths for people/citizens, teams, and agents; five accountability questions; definitions and correction guidance.
- `/resources/` and `/resources/index.json`: linked schema, evidence, and example directory. Explicitly discovery metadata, not an execution protocol.
- Homepage: direct explanation of the tools and audience entry links, preserving existing content and Media Evidence Desk work.
- New pages: canonical and social metadata, WebPage/CollectionPage, BreadcrumbList, and resource ItemList JSON-LD matching visible content.
- Sitemap: new routes and a modification date for the changed homepage; untouched page dates retained.
- Robots: removed legacy public-page disallows so existing HTML noindex can be read; preserved crawler-specific policies and private-path exclusions.
- `validate:seo`: full sitemap checks for canonical pages, unique metadata, one h1, parseable typed JSON-LD, local link targets, homepage reachability, legacy noindex, and JSON resource destinations. Added to quality CI.
- Live audit: corrected obsolete homepage expectation.

## Next priorities

1. Release this reviewed change set separately from a production parity claim. Resolve ownership of pre-existing Media Evidence Desk work before selecting a deploy artifact. After deployment, fetch the new pages, JSON, sitemap, and robots; inspect canonical URLs and response headers.
2. Inspect Search Console indexing, queries, and landing pages; submit the updated sitemap after publication. Select future topics from actual visitor questions. No ranking uplift is predicted from markup alone.
3. Publish one observed, privacy-safe evaluation with named methodology, inputs, checks, outcome, and limitations. Keep the fictional example labeled fictional.
4. Consolidate shared navigation and metadata into maintainable static publishing templates. Preserve page-specific context and avoid an unrelated framework migration.
5. Measure mobile LCP, INP, and CLS before optimizing images/fonts. Do not report synthetic checks as real-user performance.
6. Review the current participation/contact and privacy guidance against actual workflows. Link corrections to a responsible recipient without promising an appeals process for external agents.

## Evidence and technical references

Production homepage, robots, and sitemap fetched directly during review. Robots matched the initial local file; homepage and sitemap differed. Existing 16-route live audit passed after repairing the stale headline assertion. Production has not been changed by this task.

- https://developers.google.com/search/docs/crawling-indexing/block-indexing — crawling must be allowed for noindex to be read.
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap — accurate significant-change lastmod; priority and changefreq ignored by Google.
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies — structured data must represent the visible page; no rich-result guarantee.

The local SEO check is a structural regression check, not a full schema.org validator, accessibility audit, or search-engine indexing test.
