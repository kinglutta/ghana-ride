# YENKO RIDE — Brand & Voice Guide

YENKO RIDE is Ghana’s free, home-grown ride platform: built for the way people actually move, with open maps, fair fares and human support.

## Brand promise

> Move smarter. Ride YENKO.

Every screen should feel:

- **Local** — Ghana first, `GH₵` always, places and people feel real.
- **Fair** — transparent fares, no hidden tracking fees, no paid map APIs.
- **Human** — calm language, clear next steps, no aggressive growth hacks.
- **Live** — real-time status, visible safety tools, an operations team that can act.

## Approved names

| Use | Meaning |
| --- | --- |
| **YENKO RIDE** | Full product name |
| **YENKO** | Short form in headings and CTAs |
| **Rider** | Person booking a ride |
| **Captain** | Person driving a ride |
| **Operations** | Admin / command-centre team |
| **Command Centre** | Admin dashboard |
| **Access code** | Invite code for Operations onboarding |
| **GH₵** | All fares, earnings and wallet values |
| **OpenStreetMap** | Map tiles and place data |
| **OSRM** | Routing engine |

## Words to avoid

- Any legacy competitor or marketplace name.
- “Clone”, “copy” or “alternative to …” in docs, UI or commit messages.
- Generic “User” and “Driver” in customer-facing copy — say **Rider** and **Captain**.
- Currency symbols other than `GH₵` in user-facing text.
- “Google Maps”, API-key language or paid-map wording — the stack is 100% free and open.

## Writing style

- Use sentence case: **Find a ride**, not **Find A Ride**.
- Keep CTAs short and active: **Go online**, **Track ride**, **Pay now**, **Refresh data**.
- Prefer plain words: **price** over **fare algorithm**, **trip** over **transaction**.
- Be calm when things fail: explain what happened and give one clear next action.
- Use emoji sparingly — a single marker in a stat card or role tile is enough.
- Never expose internal IDs, tokens or code values in messages.

## Product language examples

| Instead of | Write |
| --- | --- |
| Driver | Captain |
| User account | Rider account |
| Admin login | Operations sign in |
| Invite code | Operations access code |
| Ride sharing | Ride platform |
| Payment gateway | Mobile Money provider |
| Live map | Live fleet map |

## Guardrail

A brand audit runs in CI and locally:

```bash
npm run brand:audit
```

It scans tracked and untracked source, docs and config for legacy competitor branding and fails with file + line details if any appears. Binary assets are skipped.
