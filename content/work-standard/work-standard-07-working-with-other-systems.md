---
title: "Working With Other Systems | The Work Standard, Part 7"
meta_description: "Interoperating with another agent system is not the same as trusting it. How Arctura defines roles, capabilities, and handoffs across systems."
target_keyword: "agent interoperability trust boundaries"
url: "/work-standard/working-with-other-systems/"
image:
  filename: "arctura-cross-system-handoff.webp"
  format: webp
  alt_text: "Roles, capabilities, and handoff points defined between Arctura agents and external systems"
canonical: "https://arctura.network/work-standard/working-with-other-systems/"
og_title: "Working With Other Systems | The Work Standard, Part 7"
og_description: "Interoperating with another agent system is not the same as trusting it. How Arctura defines roles, capabilities, and handoffs across systems."
og_type: "article"
twitter_card: "summary_large_image"
robots: "index,follow,max-snippet:-1,max-image-preview:large"
status: "draft — not yet passed Council review"
lastmod: "PENDING — set on publish"
structured_data: |
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Working With Other Systems",
  "description": "Interoperating with another agent system is not the same as trusting it. How Arctura defines roles, capabilities, and handoffs across systems.",
  "url": "https://arctura.network/work-standard/working-with-other-systems/",
  "author": {
    "@type": "Organization",
    "name": "Arctura Network",
    "url": "https://arctura.network/"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Arctura Network"
  },
  "isPartOf": {
    "@type": "CreativeWorkSeries",
    "name": "The Work Standard",
    "url": "https://arctura.network/work-standard/"
  },
  "status": "Draft \u2014 pending Council review (Need / Clarity / Usefulness / Durability / Reversal)"
}
---

[Home](/) / [The Work Standard](/work-standard/) / Working With Other Systems


# 7. Working With Other Systems

When Arctura's agents interact with agents from other systems, roles, capabilities, and handoff points are stated plainly. Interoperating with another system is not the same as trusting it — that's decided separately, on evidence.

## What has to be stated before two systems connect

- **Roles.** Which side is requesting, which side is fulfilling, and whether that can change mid-interaction.
- **Capabilities.** What each system can actually do, stated in terms the other system can act on — not a general description of the product.
- **Handoff points.** The exact moment control, data, or funds pass from one system to the other, and what confirms the handoff completed.

## What this rules out

- **Assuming compatibility means safety.** Two systems being able to talk to each other technically says nothing about whether either one should be trusted with authority or funds. That's a separate decision, made on the evidence in [Part 5: Proof Over Trust](/work-standard/proof-over-trust/), not assumed from the fact that the connection works.
- **Undocumented integrations.** If a connection to another system exists but its roles and handoff points aren't written down, it doesn't get treated as production-ready, no matter how long it's been running.
- **Silent scope creep.** An integration that starts handling more than it was originally authorized for, without the mapping being updated to match.

## Why this matters

The most common way networks lose control isn't a single bad actor — it's a connection to another system that was authorized loosely and then quietly did more than intended. Being explicit about roles and handoffs up front is what keeps that from happening by accident.

## How it connects

This extends the same mapping discipline from [Part 4: Before an Agent Acts](/work-standard/before-an-agent-acts/) to connections that cross outside the network entirely.

---

*Arctura Network — The Work Standard, Part 7 of 16.*
