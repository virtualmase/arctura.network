# Arctura Network edge runbook

Updated: 2026-08-30

## Intended boundary

- **GitHub** is the canonical source, review, release, and public issue record.
- **Cloudflare** is the DNS, TLS, caching, security, analytics, and serverless edge.
- **Hostinger** remains the mail provider during the transition.
- A VPS is not part of the website stack. Add one only for an always-on node, daemon, GPU workload, or other process that cannot run safely on the edge.

## Current migration state

The Cloudflare zone exists in `pending` state. Its assigned nameservers are:

- `gail.ns.cloudflare.com`
- `odin.ns.cloudflare.com`

The live authoritative nameservers remain Hostinger:

- `hermes.dns-parking.com`
- `artemis.dns-parking.com`

Do not change nameservers until the Cloudflare record inventory has been compared with the live Hostinger zone and the Arctura operations identity has been established.

## Records that must remain DNS-only

Never proxy mail or non-HTTP service records:

- MX records for `mx1.hostinger.com` and `mx2.hostinger.com`
- SPF, DKIM, and DMARC records
- `autodiscover` and `autoconfig`
- FTP or any future SSH endpoint

Only browser-facing A, AAAA, or CNAME records should be proxied.

## Activation gate

Before a nameserver change:

1. Export or capture the complete live Hostinger zone.
2. Compare every live record with the pending Cloudflare zone.
3. Confirm apex and `www` point to the intended web origin.
4. Confirm MX, SPF, all three Hostinger DKIM selectors, DMARC, and mail discovery records are DNS-only.
5. Add an Arctura-controlled administrator with MFA and retain an external break-glass administrator.
6. Lower DNS TTLs if Hostinger permits it and record the previous nameservers.
7. Obtain explicit approval for the nameserver change.

## Post-activation verification

Verify from at least two independent public resolvers:

- Cloudflare nameservers are authoritative.
- `https://arctura.network/` and `https://www.arctura.network/` resolve and use valid TLS.
- `www` permanently redirects to the apex without losing the path or query string.
- `npm run audit:live` passes.
- Both Hostinger MX records resolve.
- SPF, DKIM, and DMARC resolve exactly as staged.
- A real inbound and outbound message succeeds without SPF, DKIM, or DMARC failure.

Keep the former Hostinger nameservers and zone snapshot in the private operations record. If web or mail verification fails, restore the former nameservers and investigate before retrying.

## Serverless evolution

Use static assets first. Add Cloudflare Workers only for bounded server-side behavior such as form handling, signed work-order receipts, rate-limited APIs, scheduled checks, or redirects that cannot remain static. Keep durable data behind an explicit schema and export path. Do not add a VPS merely to reproduce behavior available in Pages or Workers.
