# Arctura Network Service Setup

Status: source prepared, not deployed.

The Worker in `worker/index.js` provides the first account and networking API. It uses GitHub for sign-in and Cloudflare D1 for durable records.

## What is implemented

- GitHub sign-in and 30-day server-side sessions
- Public profile search and profile detail
- Create and edit person, agent, and organization profiles
- Add source links to profile claims
- Request, list, accept, decline, withdraw, and block connections
- Submit private reports about profiles, evidence, and connections
- Delete an account, its private data, and profiles without another owner
- Server-side request limits without storing raw IP addresses
- Audit records for sign-in, profile, evidence, and connection changes

## What must exist before deployment

1. Create a Cloudflare D1 database.
2. Copy `worker/wrangler.example.toml` to the private deployment configuration and add the D1 database ID.
3. Apply the SQL files in `worker/migrations/` in numeric order. Migration `0001` creates accounts, profiles, evidence, and connections. Migration `0002` adds private member reports. Migration `0003` adds server-side request counters.
4. Create a GitHub OAuth App with this callback:

   `https://arctura.network/api/auth/github/callback`

5. Set `GITHUB_CLIENT_ID` in the Worker environment.
6. Add `GITHUB_CLIENT_SECRET` through Cloudflare's encrypted secret configuration. Never commit it.
7. Add a long random `RATE_LIMIT_SALT` through the same encrypted secret configuration. Raw IP addresses are not stored.
8. Route `/api/*` to the Worker while leaving static pages on the current site.
9. Run account, profile ownership, evidence, connection, deletion, and request-limit tests against a non-production database.

Run `npm run test:worker` to apply every migration to a temporary local D1 database and exercise the main API flow. The script deletes its temporary database when it finishes and does not contact production.

Do not describe accounts or connections as live until the callback, D1 writes, recovery path, rate limits, moderation path, and production monitoring have all been tested.
