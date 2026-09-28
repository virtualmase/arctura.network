# Arctura: the 90-day website, built now

Design date: 27 September 2026. Review target: 26 December 2026.

## Position

Arctura is an accountability publication and toolkit for the agentic world. The public promise is to help visitors understand a change, inspect the evidence, and take a useful next step. The frontend does not claim future adoption, formal citizenship, an active social network, or a production agent service.

The existing professional-network product contract remains a proposed direction. This frontend pivot prioritizes useful public intelligence, tools, and evidence while keeping the network preview discoverable and explicitly bounded.

## The visitor experience

- People and citizens can ask who owns an AI decision, which inputs and checks support it, and how to request human review from its operator.
- Builders and teams can connect a readiness check, standing accountability card, task-specific work order, and evaluation.
- Agents and developers can discover schemas, source authority, examples, editorial feeds, and a page index without an account.
- Readers can browse briefings by topic, follow sources, search locally, and subscribe through RSS or JSON Feed.

The visual system uses an ivory field, forest-green ink, restrained ochre accents, editorial serif headings, system sans-serif body text, and small technical annotations. Original diagrams express the method without implying observed operational data. No font CDN, stock imagery, or client framework is required for the new experience.

## Information architecture

| Route | Visitor purpose |
| --- | --- |
| `/` | Understand the publication, choose a path, find a tool or source |
| `/start/` | Choose a path based on the question brought to the site |
| `/briefings/` | Read source-led analysis; filter by topic |
| `/guides/` | Learn a practical method and apply it |
| `/tools/` | Choose among the four existing browser tools |
| `/evidence/` | Distinguish actual records, examples, authority, and operating reports |
| `/resources/` | Find machine-readable resources and usage boundaries |
| `/search/` | Search public titles/descriptions locally; no query transmission |
| `/about/` | Understand purpose, actual capabilities, and responsibility |
| `/editorial-policy/` | Understand source standards, automation boundaries, and corrections |

Existing tool, guide, evidence, participation, and network routes keep their URLs. Shared navigation and footer are rendered into HTML, not injected as a prerequisite for crawling.

## Authoring and publishing

1. Edit `content/editorial/articles.json`. Records have stable slugs, kind, topic, original publication date, modification date, sections, sources, and one practical next step.
2. Only records with `status: published` enter the public build. A briefing requires a source URL and source-check date. Drafts and research candidates are excluded.
3. Run `npm run build` to render the experience, synchronize navigation, publish RSS/JSON Feed, update discovery, and validate SEO.
4. Run `npm run publish:content` when also rebuilding the original Work Standard and Agent Field Guide. This runs the experience publisher last so all pages keep the shared shell.
5. Run the release checks described below. Publishing to production is a separate release action.

The articles, homepage, feeds, and search index are generated. Edit source records and templates rather than changing those outputs by hand. Preserve original publication dates. Change modification dates for substantive corrections, and add a visible correction note where needed. Do not change source-review dates simply because a build ran.

Relevant implementation:

- `scripts/lib/experience.mjs`: shared metadata, navigation, footer, and editorial components.
- `scripts/publish-experience.mjs`: pages, source-linked articles, feeds, and discovery outputs.
- `scripts/lib/editorial-validation.mjs`: publication boundary and source/date validation.
- `css/experience.css`: shared design system and responsive layouts.
- `js/editorial.js`: progressive topic filtering and private, in-browser search.

## The dynamic research loop

`npm run collect:signals` reads the allowlisted sources in `content/editorial/sources.json`: MCP releases, NIST news, and arXiv AI research. It writes research candidates to `/tmp/arctura-signal-queue.json`, outside the public website. The first successful check returned nine relevant candidates and zero source errors. This count is a development observation, not a permanent site statistic.

The collector stores source dates separately from observation times; deduplicates canonical URLs; labels preprints; ranks title relevance using an explicit heuristic; and keeps prior candidates if a source fails. A failed fetch does not become a new publication or reset the last successful source check. The score is not keyword volume, factual confidence, or trend momentum.

`.github/workflows/editorial-signals.yml` defines a daily collection job with a downloadable research artifact. It has read-only repository permissions and never edits or publishes pages. This workflow will run only after the repository change is released to GitHub. A reviewer still selects a useful question, verifies the source, writes the analysis, and promotes the article through the normal publication process.

### Keyword, mention, and citation observations

The collector can also ingest authorized observations:

```bash
python3 scripts/collect-signals.py --offline --observations /tmp/observations.json
```

The file is a JSON array. Common fields are `kind`, `title`, `url`, `sourceName`, and `observedAt`.

- `keyword-demand` also requires `periodStart`, `periodEnd`, `clicks`, and `impressions`. Use actual authorized Search Console exports, not estimated values disguised as observations.
- `mention` identifies a source URL and observation date. A mention is not an endorsement.
- `ai-citation` also requires `engine`, `query`, and `evidenceUrl`. It records one observed response, not total AI visibility.

Observation inputs and the research queue remain outside the public website. The publisher has no path that converts them directly into published HTML. The importer is ready; authenticated Search Console, paid trend providers, and social/AI monitoring accounts are not connected by this change.

## Release and measurement

Run:

```bash
npm run build
npm run validate:publishing
npm run validate:edge
npm run validate:work-order -- examples/work-orders/support-response-review.json
npm test
python3 -m unittest discover -s test -p 'test_*.py'
```

The SEO validator covers all sitemap pages, canonical metadata, structured JSON, unique titles/descriptions, links, homepage reachability, resource files, and crawl/noindex consistency. It is not Google's rich-result validator or proof of indexing.

After publication, verify exact deployed artifacts, HTTP status and content types, canonical behavior, feeds, the sitemap, and the new audit contract. `npm run audit:live` now expects the redesigned site; it is intentionally expected to fail against the old production version until release.

Connect field measurements after deployment: Search Console query and page performance, real-user Core Web Vitals, and aggregate tool-completion signals where authorized. Do not invent a conversion baseline or claim a ranking increase from this redesign.

## Useful outcomes to track over the next 90 days

- A visitor moves from a question to a relevant guide, tool, or primary source.
- A team completes a portable Work Order and reports an evaluated outcome.
- A briefing produces a meaningful guide correction or new evaluation case.
- An agent fetches a schema/example pair and preserves the record's status and limitations.
- Material source changes are reviewed and reflected in the public record.

Traffic, article count, and collected headlines support these outcomes; they are not substitutes for them.

## Existing work preserved

The Media Evidence Desk implementation, assets, schema, and tests present at the start of the task remain intact. Its tool is included in the homepage, toolkit, navigation, and source-led editorial journey. The previous homepage feature was retained in `content/editorial/media-feature.html` as a source reference. A complete pre-pivot local snapshot is available at `/tmp/arctura-before-pivot/site.tar.gz` in this working environment.
