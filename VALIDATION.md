# Validation Record

**Validated:** 2026-08-19

The local static preview rendered the Netuid 505 evidence record at `/evidence/netuid-505/` with an explicit testnet-only boundary, a first-party-evidence disclosure, no Finney-netuid claim, and a clearly non-live quorum state. The authority page at `/authority/` rendered the distinct roles and source precedence for Arctura Network, Arctura Observatory, the Autonomous Resource Management reference, and the public implementation repository.

The local regression suite passed eight tests, including static route availability, machine-readable evidence metadata, non-live quorum copy, cross-domain authority records, and the permanent `www`-to-apex redirect. The static build command completed successfully.

**Navigation refinement validated:** 2026-08-19. The production homepage now presents a single sticky public-record hierarchy—Netuid 505 launch record, evidence status, then authority record—rather than competing documentation buttons. The documentation surface uses the same sticky navigation and visibly marks the launch record as the current page. The navigation update passed the expanded nine-test suite and was checked on the live desktop rendering.

**Community and launch-note validation:** 2026-08-19. Production serves `/participate/` and `/updates/netuid-505-launch/`, both using the shared sticky records navigation with their current-page state. The community page confines validator guidance to the documented Netuid 505 local-testnet procedure and explicitly excludes Finney enrollment, staking, and emissions claims. The launch note states the bounded operational result and names its unrecorded outcomes. The final homepage audit standardized the sticky menu to Community, Netuid 505 record, Evidence, Update, and Authority, with the external ARM reference retained separately. The ten-test suite and static build passed before deployment.
