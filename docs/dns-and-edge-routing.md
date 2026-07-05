# DNS & Edge Routing — `vynr.app`

Operational runbook for how `vynr.app` is wired at the edge, and — specifically — **why Vercel reports the domain as "misconfigured" and why that warning is expected.**

> Decision of record: **`vynr/docs/ADRs/ADR-WEB-0001-Vynr-Web-Presence.md` → ADDENDUM-001**.
> Wiki synthesis: `vynr-wiki/subsystems/edge-routing.md`.

## TL;DR

- **Do NOT turn off the Cloudflare orange cloud on `vynr.app`.** Grey-clouding it breaks `vynr.app/mcp/*` (the Cellar MCP endpoint, ADR-0112).
- **The Vercel "misconfigured domain" email is expected and cosmetic.** The site works; TLS works. Dismiss it. Only act if Vercel actually fails TLS or stops serving.

## The topology

`vynr.app` DNS is hosted at **Cloudflare** (nameservers `april.ns.cloudflare.com` / `yevgen.ns.cloudflare.com`). The apex and `www` are **proxied (orange cloud)**, so Cloudflare's edge fronts **two different origins**, split by path:

```
                          ┌─────────────────────────────┐
   vynr.app/*  ───────────▶  Cloudflare edge (proxied)  │
                          └───────────┬─────────────────┘
                                      │
              /mcp/*  ───────────────►│  Cloudflare Worker  (vynr-share)  ── ADR-0112 Cellar MCP
                                      │      (intercepts BEFORE Vercel)
                                      │
        everything else ────────────►│  Vercel origin  (this vynr-web Next.js site)
```

| Path | Served by | How to tell (response headers) |
|------|-----------|--------------------------------|
| `vynr.app/` and all normal pages | **Vercel** via Cloudflare | `x-vercel-id`, `x-vercel-cache`, `x-nextjs-prerender` present |
| `vynr.app/mcp/*` | **Cloudflare Worker** `vynr-share`, before Vercel | `401 {"error":"invalid_token"}`, `content-type: application/json`, **no `x-vercel-*` headers** |

The Worker owning `/mcp/*` is the reason the apex must stay proxied: **Cloudflare Worker routes require a proxied (orange) DNS record for the route's hostname.**

## Why Vercel says "misconfigured domain"

Vercel's domain verification does a DNS lookup for `vynr.app`. Because Cloudflare proxies the apex, that lookup returns **Cloudflare's anycast IPs**, not Vercel's expected `76.76.21.21` (apex A) / `cname.vercel-dns.com` (CNAME). Vercel can't confirm the record points at itself, so it flags the domain **"misconfigured."**

This is a known artifact of putting a reverse proxy (Cloudflare) in front of Vercel — **not** a functional problem. The site returns `HTTP 200` over HTTPS with valid TLS + HSTS.

**Action: ignore/dismiss this specific warning.** Escalate only if Vercel begins actually failing TLS or refusing traffic.

## What NOT to do

- ❌ **Do not set `vynr.app` / `www` to "DNS only" (grey cloud)** to silence the Vercel warning. That removes the Cloudflare Worker from the path; `vynr.app/mcp/*` then falls through to Vercel (no such endpoint) and **every assistant's Cellar MCP link breaks** (ADR-0112). The website would still load — the MCP connector would not.
- ❌ **Do not set Cloudflare SSL/TLS mode to "Flexible."** It causes redirect loops with Vercel's HTTPS enforcement. Keep it **Full (strict)**.

## Verify the current state

```bash
# Nameservers should be Cloudflare
dig +short vynr.app NS
# apex should resolve to Cloudflare anycast IPs (104.21.x / 172.67.x), i.e. proxied
dig +short vynr.app A

# Normal path → Vercel headers present
curl -sS -I https://vynr.app/ | grep -iE 'x-vercel|server'

# /mcp/ → Cloudflare Worker: 401 JSON, NO x-vercel-* headers
curl -sS -o /dev/null -w '%{http_code}\n' https://vynr.app/mcp/
curl -sS -I https://vynr.app/mcp/ | grep -iE 'x-vercel|content-type|server'
```

Expected: normal paths carry `x-vercel-*`; `/mcp/` returns `401` `application/json` with **no** `x-vercel-*` header.

## Deferred cleaner architecture (not done — breaking change)

If a clean Vercel dashboard ever becomes worth the cost, split the concerns:

```
vynr.app (+ www) → Vercel            → DNS only (grey)   ← Vercel warning clears
mcp.vynr.app     → vynr-share Worker → proxied (orange)
```

This requires moving the Worker route to `mcp.vynr.app`, updating the ADR-0112 connect UX / Share Sheet to emit `mcp.vynr.app/{token}`, and re-registering **every already-issued** assistant connector URL. It is a breaking change to live capability links for no functional gain — deferred deliberately. See ADR-WEB-0001 ADDENDUM-001.
