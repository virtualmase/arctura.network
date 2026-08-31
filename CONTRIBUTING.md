# Contributing to Arctura Network

Read [`docs/VOICE_SYSTEM.md`](docs/VOICE_SYSTEM.md) before writing public interface copy, documentation, release notes, or social material.

Arctura accepts work that makes the network more useful, inspectable, and maintainable. Contributions should leave enough evidence for another person to understand what changed and verify the result.

## Useful contributions

- Correct a public record or documentation conflict.
- Add an anonymized Agent Work Order example.
- Improve a validator, test, accessibility detail, or maintenance check.
- Propose a bounded prototype with a named user, expected result, and acceptance checks.

Do not submit secrets, personal data, private customer material, wallet keys, credentials, or unverifiable production claims.

## Before opening a pull request

1. Open or reference an issue that states the problem and the proof needed to close it.
2. Keep the change bounded. Separate unrelated changes.
3. Preserve the distinction between observed evidence, interpretation, and proposal.
4. Run the release gate:

   ```bash
   npm ci
   npm run validate:publishing
   npm run validate:work-order -- examples/work-orders/support-response-review.json
   npm test
   ```

5. Explain what changed, how it was checked, and what remains uncertain.

## Work Order examples

Examples belong in `examples/work-orders/` and must validate against the versioned schema. Remove names, account identifiers, message contents, and other private data. Prefer representative synthetic inputs.

The current schema is published at:

`https://arctura.network/schemas/work-order/v1/schema.json`

## Work Order evaluations

Use the structured **Share a Work Order evaluation** issue form to report whether a tested order produced its expected result, respected its authority boundary, and passed its acceptance checks. Report privacy-safe checks and evidence, not private prompts, customer data, credentials, or confidential outputs. Evaluation issues carry the `evaluation` label so verified use can be counted without embedding telemetry in the local-only builder.

## Public evidence

A public claim needs a source that an independent reviewer can inspect. When evidence is incomplete, state the boundary explicitly. Never broaden a bounded test result into a mainnet, production, security, or performance claim.

## Stewardship

Maintainers may request narrower scope, stronger evidence, clearer ownership, or additional review before accepting a change. Acceptance means the contribution meets the stated checks; it is not an endorsement of unrelated claims.
