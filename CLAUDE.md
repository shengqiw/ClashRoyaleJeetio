# jeetio — notes for Claude sessions

Shen does not code in this repo — Claude maintains it. Optimize for shipping fast and
leaving a debuggable trail. Nonprofit Clash Royale clan site; the budget is $0.

## Read this first

**This file is committed. Trust it only after `git fetch && git log --oneline HEAD..origin/master`
comes back empty.** An earlier session worked from an untracked, 31-commit-stale copy of
this file, built a full restructure against an architecture that no longer existed, and
could not ship it. Remote wins over docs, always.

## Architecture (verified 2026-08-22)

Next.js **16.3.2** · React **19.2.8** · MUI **v9** · TypeScript 6 · App Router.

This app is a **thin front end over an external backend**. It holds no Clash Royale
credentials and talks to no Supercell endpoint directly.

- **All data** comes from `API_BASE_URL`, with `API_KEY` sent as the `x-api-key` header.
  Backend paths are `/clash/...` (clan, player, battlelog, cards) and `/intel/...`
  (deck counters, path-of-legend, pinecone, jobs).
- `src/app/api/*` — 15 thin proxy routes. Each checks the two env vars, fetches, returns.
- `src/lib/proxyJson.ts` — use this for backend calls that can hang or return non-JSON.
  It exists because a raw `await res.json()` on a gateway-timeout page throws inside the
  handler and Next turns that into an empty 500.
- `src/lib/log.ts` — the only logging sink. See Debugging.
- `src/lib/` also has `CardImage.tsx`, `useCardIcons.ts`, `deckIntel.ts`, `inlineMarkdown.tsx`.
- Pages: `/`, `/stats`, `/rules`, `/promotions`, `/deckai`, `/member/[tag]`, `/clan-info`,
  `/admin`, `/test`.
- `clash-royale-apis/` (sibling repo) — LEGACY and DEAD. Its lambdas carry a JWT IP-locked
  to a decommissioned NAT EIP, so they cannot succeed from anywhere. Do not build on it.
  It still bills (NAT t3.nano + EIP + ALB) and is slated for teardown.

## Hard rules

1. **$0 rule.** No paid tiers, no billing-attached keys. Never add a credit card.
2. **No N+1 fetches.** The old stats page did per-member fetches (30–50 calls/view) and
   got disabled as "too expensive". Anything per-player must be user-initiated —
   one click = one call, never a loop over a roster.
3. **Secrets in `.env.local` only** (template: `.env.example`). `.gitignore` uses `*.env*`
   with a `!.env.example` negation — deliberately broad, because the old `.env*.local`
   pattern required the name to END in `.local` and let `.env.local.bak` (real keys)
   through. Run `git check-ignore <file>` before staging anything env-shaped.

## Debugging

**Start at `GET /api/health`.** One call, no source reading:

```
curl -s localhost:3000/api/health | jq          # config + warnings, no upstream calls
curl -s 'localhost:3000/api/health?probe=1'     # + a real call to the backend
```

It reports whether `API_BASE_URL`/`API_KEY` are set (booleans, never values), whether the
backend answers and how slowly, and a `warnings[]` of already-diagnosed failures. Returns
**503** when genuinely broken, so it doubles as an uptime-monitor target. When you diagnose
something twice, add it to `warnings` so the third time is free.

**Logs.** Everything goes through `src/lib/log.ts` as one-line JSON with a greppable prefix:
`[api]` route outcomes · `[backend]` upstream calls · `[health]` diagnostics. Lines carry a
`trace` id, so `grep <trace>` reassembles one request.

**Known gotchas:**

- Empty pages / 500s saying "Missing API_BASE_URL or API_KEY" → the env vars aren't set in
  that environment. `.env.local` on Shen's Mac does NOT have them, so local dev cannot reach
  the backend without them; `/api/health` says so explicitly.
- Client hangs with "Unexpected end of JSON input" → a route bypassed `proxyJson.ts`.
- MUI renders inside `@layer mui` (`enableCssLayer: true` in `mui-app-provider.tsx`), so
  ANY unlayered element selector in a global stylesheet beats MUI's own styles regardless
  of specificity. A bare `li { display: inline }` in globals.css flattened the card-picker
  Autocomplete into an inline soup this way (fixed 2026-08-23 by scoping to `nav li`).
  Never add bare element selectors to global CSS — scope them.
- `npm run lint` reports `react-hooks/set-state-in-effect` in `admin`, `deckai`, `stats`.
  **These are false positives — do not "fix" them.** The effects load `localStorage` state
  on mount via helpers that guard `typeof window === "undefined"`. Moving them into a lazy
  `useState(() => ...)` initializer runs during SSR, returns the empty fallback, and the
  feature silently stops loading. The rule arrived with eslint-config-next 16.3.x.
- Lint does not gate `next build`; the build passing does not mean lint is clean.

## Deploy

- Local: `npm run dev` (Node 20+). Build: `npm run build`. Both are network-independent.
- **Vercel auto-deploys every push to `master`** — repo `shengqiw/ClashRoyaleJeetio`. There
  is no `vercel` CLI and no `.vercel` link on Shen's Mac, so pushing master IS deploying.
  Env vars must be set in the Vercel project, not just `.env.local`.
- DNS: jeetio.com is at Namecheap and had NO A records as of Aug 2026 — the domain points
  nowhere until aimed at Vercel (A 76.76.21.21 / CNAME cname.vercel-dns.com).

## Comms

`COMMS.md` (repo root, **gitignored — local only**) is an append-only Claude↔Claude mailbox
shared with the `cowork` cloud session. Read it at session start; append your reply at the
bottom; flip `STATUS: unread` → `read` on envelopes addressed to `code-local`; never edit
someone else's envelope. Talk to Shen in plain English — envelopes are Claude-to-Claude only.
