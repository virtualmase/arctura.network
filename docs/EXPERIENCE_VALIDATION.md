# Redesign completion evidence

Verified locally on 28 September 2026. Scope: the reviewable frontend and publishing system described in `90_DAY_EXPERIENCE.md`. Production has not been deployed by this task.

| Requirement | Evidence |
| --- | --- |
| Coherent 90-day direction | `90_DAY_EXPERIENCE.md`: positioning, audience journeys, information architecture, authoring and research loop |
| Redesigned frontend | 16 designed routes; shared static navigation across the 61 sitemap pages; responsive editorial layouts and original diagrams |
| Useful additional content | Four sourced briefings and three practical guides in `content/editorial/articles.json`, linked to tools, examples, and sources |
| People/citizens, teams, agents | Dedicated starting paths and guides; machine-readable resource index; explicit authority and evidence limits |
| Search and topic discovery | Browser checks passed for topic filters, URL state, local search, empty results, and no-JavaScript browsing |
| Source-led dynamic foundation | Three official feeds fetched successfully; nine research candidates collected; no public content modified; scheduled artifact-only workflow defined |
| Safe publication boundary | Draft/candidate exclusion, source/date validation, output escaping, and feed consistency tested; withdrawal and republication verified in an isolated build; withdrawn managed articles receive noindex replacements |
| Technical SEO | All 61 sitemap pages pass canonical, metadata, JSON-LD, link, reachability, and resource checks; RSS and sitemap parse as XML |
| Existing behavior retained | 44 Node tests pass, including tools, evidence boundaries, HTTP routes, feeds, and public machine resources; four Python collector tests pass |
| Responsive behavior | All 61 public pages checked at 390px; 12 representative new routes checked at 320px and 1440px; no horizontal overflow or browser errors |
| Accessibility | No automated WCAG A/AA violations in the tested new pages; nine existing tool/library routes rechecked after contrast fixes with zero reported violations |
| Keyboard and progressive enhancement | Mobile menu links, Escape, source content without JavaScript, and the full search index without JavaScript verified |
| Performance | Local simulated-mobile Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100 |
| Reproducible output | A second publication pass leaves generated HTML, feeds, sitemap, resource manifest, and search index byte-identical |
| Release HTTP checks | The 20-route release audit passes against the local server, including new editorial routes and feeds |
| Existing work preserved | Pre-existing Media Evidence Desk source, assets, schema, and functional checks retained and integrated into the redesigned journeys |

The automated accessibility checks do not establish complete accessibility conformance. Lighthouse results are local lab measurements, not production Core Web Vitals or a ranking guarantee. Authenticated keyword/trend and third-party mention/citation providers are not connected; the observation importer and research workflow are ready for authorized data.

## Review

Start the site with `npm start`, or inspect the current preview at `http://localhost:3098` while that server is running. Review the homepage, `/start/`, `/briefings/`, `/guides/`, `/tools/`, `/resources/`, and `/evidence/`.

## Production boundary

The original live homepage and sitemap differed from the initial local files. The new release audit expects this redesign and is intended to run against production after a reviewed deployment. Local validation is not a claim of production parity. These checks were recorded before release. GitHub publication was subsequently authorized; production parity must still be checked after deployment.
