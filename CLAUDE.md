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
  Exception: `api/war-decks` does real work (see War Decks below).
- `src/lib/proxyJson.ts` — use this for backend calls that can hang or return non-JSON.
  It exists because a raw `await res.json()` on a gateway-timeout page throws inside the
  handler and Next turns that into an empty 500.
- `src/lib/log.ts` — the only logging sink. See Debugging.
- `src/lib/` also has `CardImage.tsx`, `useCardIcons.ts`, `deckIntel.ts`, `inlineMarkdown.tsx`.
- Pages: `/`, `/stats`, `/rules`, `/promotions`, `/deckai`, `/member/[tag]`, `/clan-info`,
  `/meta-lab`, `/privacy`, `/offline`, `/admin`, `/test`.
- Fonts: Geist via the `geist` npm package (`geist/font/sans|mono`), NOT `next/font/google`.
  Same self-hosted output and CSS variables; the difference is `next build` no longer
  phones fonts.googleapis.com, which made builds fail anywhere Google is blocked.
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

## War Decks (Deck AI → "War Decks", added 2026-09-12)

Builds a player's 4 Clan War decks (32 different cards, real levels) from a meta
snapshot. `POST /api/war-decks { tag, band? }` — one backend call (`/clash/player/:tag`
for the collection) + one Gemini call. Layers, in the order to read them:

- `src/data/metaDecks.ts` — the dated meta snapshot (~30 decks, tier, bands, family,
  trends). **This is the thing to refresh** after each balance patch; the file header
  says how. Names use `Evo X` / `Hero X` prefixes; the engine strips them when the
  player lacks the variant.
- `src/data/cardRoles.ts` — role + elixir + preferred substitutes per card. Substitution
  is how a template survives a missing / underleveled / already-used card. A card
  missing here is a test failure (`npm test`), because the engine can't reason about it.
- `src/lib/warDecks.ts` — pure engine. Level normalization (API levels are rarity-
  relative; Sept 2026 caps: common 16 / rare 14 / epic 11 / legendary 8, so an epic
  "9/11" is an in-game 14 — the cap is read off the collection), band from trophies (low <5k, mid 5–8k,
  high 8–11k, top ≥11k or PoL league ≥10), realize each template, greedy + improve
  lineup search, `validateLineup`. No network, no React — `npm test` covers it.
- `src/lib/warAdvisor.ts` — Gemini picks between the engine's lineups, assigns war
  roles (duel opener/second/closer, 1v1/boat), writes the why/how, may swap ≤3 cards
  from the player's unused cards. Every swap is re-validated; anything invalid is
  dropped. No key / quota / timeout → `cannedOutcome` (rule-based, flagged in
  `advisor.used=false`). The page never goes dark because Gemini did.
- `src/lib/gemini.ts` — REST wrapper (no SDK). `GEMINI_API_KEY` (free AI Studio key),
  `GEMINI_MODEL` (default gemini-3.6-flash — 2.5 was retired for new keys 2026-09-13; a 404
  walks a fallback chain ending in `gemini-flash-latest`), `GEMINI_API_BASE` (tests only).
- Route caches per tag+band for 10 min in-instance to spare the free-tier RPM.

Local end-to-end without the real backend: `npx tsx eval/mock-backend.mjs`, then
`API_BASE_URL=http://localhost:4000 API_KEY=x GEMINI_API_KEY=x
GEMINI_API_BASE=http://localhost:4000/gemini npm start` and open `/deckai?mode=war`
with tag `#FULL` (maxed) or anything else (partial mid-ladder collection).

Evolutions and Heroes in the live API (verified 2026-09-13): both ride on
`evolutionLevel` — ≥1 with `iconUrls.evolutionMedium` = evolution unlocked; ≥2 with
`iconUrls.heroMedium` = hero unlocked (hero-only cards like Dark Prince report 2).
`pickCardArt()` / `hasHeroUnlocked()` in `useCardIcons.ts` and `hasHero()` in the engine
encode this. The catalog indexes hero art under `hero::<name>` so "Hero X" labels render.

## PWA (added 2026-09-12)

The site installs to a phone home screen and survives a dead connection. Pieces:

- `src/app/manifest.ts` → `/manifest.webmanifest` (auto-linked). Icons in `public/icons/`
  (192, 512, maskable-512), `src/app/icon.png` (favicon — replaced a 4.6 MB `icon.svg`
  that every page load was fetching), `src/app/apple-icon.png`. All generated from
  `src/assets/jeetio-logo.png` with sharp; regenerate rather than hand-edit.
- `public/sw.js` — hand-written, no workbox. Pages network-first (deploys always win),
  `/_next/static` cache-first, same-origin images stale-while-revalidate, **`/api/*`
  never cached**, **cross-origin never touched** (v1 intercepted the card-art CDN and
  broke every card image: `/sw.js` gets the page CSP, whose `connect-src` blocks the
  worker's own fetch to api-assets.clashroyale.com). Bump `VERSION` when the strategy
  changes. `next.config.mjs` serves it with `Cache-Control: max-age=0`.
- `src/components/dumb/pwa-register.tsx` — `PwaRegister` (worker registration, root
  layout) and `PwaInstallBar` (small inline "add to home screen" strip, home page only,
  near the bottom — Shen found the fixed overlay annoying). Android via
  `beforeinstallprompt`, iOS via Share-sheet instructions, dismiss remembered 30 days.
- Verify locally: `npm run build && npm start`, open a page, kill the server, reload —
  visited pages still render, unvisited ones get `/offline`. Playwright's `setOffline`
  does NOT cut service-worker fetches, so kill the server for real when testing.

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
