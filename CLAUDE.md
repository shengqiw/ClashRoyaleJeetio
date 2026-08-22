# jeetio — notes for Claude sessions

Shen does not code in this repo — Claude maintains it. Optimize for shipping fast and
leaving a debuggable trail. Nonprofit Clash Royale clan site; the budget is $0.

## Comms (check first)

`COMMS.md` in this repo is the mailbox between Shen's Claude sessions (cowork cloud
session ↔ Claude Code in VS Code). On session start: read it, handle anything addressed
to you (`TO: code-local` if you are the VS Code session), reply by appending an envelope,
flip STATUS to read. Envelope format is in the file header. Cross-machine/global comms go
through his private claude-brain repo (github.com/shengqiw/claude-brain — see its README
and protocols/interlink.md); this file is the fast lane for this machine only. Talk to
Shen in plain English — envelopes are Claude-to-Claude only.

## Architecture (current, Aug 2026)

One deployable unit: this Next.js 14 app. No AWS dependency in the serving path.

**Core libs (`src/lib/`) — every one of these is the single place for its concern:**

- `clash.ts` — ALL Clash Royale data. Supercell API via the free RoyaleAPI proxy
  (`proxy.royaleapi.dev`, key IP-whitelists `45.79.218.79`), legacy AWS gateway as
  optional fallback. Returns typed `Clan`/`Player`. ISR-cached 1h everywhere.
- `llm.ts` — free-tier LLM fallback chain (Groq → Gemini free → OpenRouter free;
  "deep" leads with DeepSeek R1 free). OpenAI-compatible, zero deps.
- `insights.ts` — PURE derived analytics over the one clan payload: activity
  classification, donation stats, at-risk list, elder shortlist, plain-English
  `headlines`. No I/O. This is where new stats go — they cost zero API calls.
  All tunable numbers are in one `THRESHOLDS` const, calibrated to the live roster.
- `log.ts` — the only logging sink. One JSON line per event, greppable `[scope]`
  prefix, `trace` id threaded through so one click can be reassembled from the log.
- `features.ts` — the site map. Nav and home tiles are GENERATED from it. Adding a
  route means adding an entry here, not editing two components.

**Routes (`src/app/api/`):**

- `health` — diagnostics. Start every debugging session here (see Debugging below).
- `insights` — derived clan facts as JSON (`?full=1` includes per-member rows).
- `analyze` — AI coach. Injects `insights.ts` facts into the prompt so free models
  cite real numbers instead of inventing arithmetic.
- `clan`, `player` — thin JSON wrappers over lib/clash for client-side features.

**Pages / components:**

- `src/app/stats/page.tsx` — server component, calls `getClan()` directly (no HTTP
  hop), runs `analyzeClan()` once, hands the result to every child.
- `src/components/smart|dumb/` — smart = data-aware, dumb = presentational.
- `clash-royale-apis/` (sibling repo) — LEGACY lambdas + NAT instance + API gateway.
  Do not build on it. Its hardcoded JWT is IP-locked to a decommissioned NAT EIP, so
  it cannot succeed from anywhere; `dev-server.mjs` there only exists to demonstrate
  that locally. Slated for teardown (it bills: NAT t3.nano + EIP + ALB).

## Hard rules

1. **$0 rule.** No paid tiers, no billing-attached keys. Free tier dies → swap provider
   in `src/lib/llm.ts` / `src/lib/clash.ts`; never add a credit card.
2. **No N+1 fetches.** The old stats page did per-member fetches (30–50 calls/view) and
   got disabled as "too expensive." Render from the single clan payload. New features
   needing per-player data must be user-initiated (one click = one `/api/player` call),
   never a loop over members.
3. **Secrets in `.env.local` only** (template: `.env.example`).
4. **Add features in this app.** New data needs = extend `src/lib/clash.ts`; new AI
   behavior = new route on top of `src/lib/llm.ts`. Do not create new infra.

## Debugging

**Start here — `GET /api/health`.** One call, no source reading required. It reports
which env keys exist (booleans, never values), what the data path and LLM chain are
configured to do, which features are live vs planned, and a `warnings[]` array of
known-bad states already diagnosed in plain English.

```
curl -s localhost:3000/api/health | jq          # config only, instant, no upstream calls
curl -s 'localhost:3000/api/health?probe=clash' # + a real clan fetch (free, cached)
curl -s 'localhost:3000/api/health?probe=all'   # + ONE free-tier LLM call. Don't poll.
```

Returns 503 (not 200) when something is actually broken. When you diagnose a failure
twice, add it to `buildWarnings()` so the third time is a one-liner.

**Log lines.** Every server log is one JSON object with a greppable prefix, emitted
only via `src/lib/log.ts`:

- `[clash]` data-path attempts (proxy vs legacy, status, ms)
- `[llm]` provider attempts (provider, model, ok, ms, status, err)
- `[api]` route outcomes (route, status, ms, plus route-specific fields)
- `[health]` diagnostics runs

Every line carries a `trace` id, and API responses echo it. `grep <trace> dev.log`
returns the full story of one user action across all four scopes — that is the fastest
path from "the coach errored" to root cause. The AI Coach panel prints the trace next
to its answer and next to any error, so a screenshot is enough to find the logs.

**Known failure modes:**

- Provider 400/404 → stale free-model name, update `src/lib/llm.ts`; chain covers the gap.
  (Aug 2026: gemini-2.5-flash went 404 "no longer available to new users" → pinned
  gemini-3.6-flash. List live names: `GET generativelanguage.googleapis.com/v1beta/models?key=`.)
- Truncated / mid-sentence LLM answer, HTTP 200 → `max_tokens` too low. Thinking models
  (gemini-3.x, DeepSeek R1) charge hidden reasoning tokens against the cap; default is
  4096 for that reason. ~770 reasoning tokens for a ~210-token answer is normal.
- `TimeoutError` from gemini → transient; it happens. With one key present there is no
  fallback, so it surfaces as a 503. `/api/health` warns about this explicitly.
- Chain is only as deep as the keys present. Today only `GEMINI_API_KEY` is set, so a
  Gemini outage = 503 from `/api/analyze`, not a fall-through. A free Groq key fixes it.
- Empty stats page → check `[clash]`: missing SUPERCELL_API_KEY? proxy down? Both paths
  null → page shows friendly fallback (with the trace id in dev), never crashes.
- An insights list is unexpectedly empty → check `THRESHOLDS` in `src/lib/insights.ts`
  against the real distribution before assuming a bug. `curl 'localhost:3000/api/insights?full=1'`
  gives you every member's numbers to calibrate against.
- Free-tier reality (Aug 2026): Groq ~1k req/day · Gemini free ~1.5k/day Flash ·
  OpenRouter free 50/day (1k/day after one-time $10 credit — NOT approved, ask Shen).

## Adding a feature

The structure exists so this is mechanical. Pick the row that matches:

| You want | Touch | Cost |
|---|---|---|
| A new stat about the clan | `src/lib/insights.ts` (pure fn + a `THRESHOLDS` entry) | zero API calls |
| A new page | `src/lib/features.ts` entry + `src/app/<href>/page.tsx` | nav/tiles auto-update |
| New AI behavior | new route over `src/lib/llm.ts` (copy `api/analyze`) | free-tier calls |
| New Clash endpoint | one `getX()` in `src/lib/clash.ts` + a type in `src/types/` | 1 cached call |
| Per-player data | `GET /api/player`, ONE call per user click | never loop the roster |

Register planned work as a `status: "planned"` feature — it documents intent, renders
nowhere, and shows up in `/api/health` so the next session sees it.

Two features are already registered as planned: `deck-ai` and `player-lookup`.

## Deploy & DNS (runbook)

- Local: `npm run dev` (Node 20+). Build: `npm run build` — never depends on network.
  VS Code: `.vscode/tasks.json` defines "dev: all" (Cmd+Shift+B) which starts the UI on
  :3000 and the legacy-lambda harness on :4000 in split terminal tabs; each task frees
  its port first, so re-running never collides.
- Hosting target: Vercel hobby (free) — repo `shengqiw/ClashRoyaleJeetio`, root of this
  app, env vars from `.env.local`. Every push to master auto-deploys.
- DNS: jeetio.com is registered at Namecheap (registrar-servers nameservers) and
  currently has NO A records — the domain points nowhere until it's aimed at Vercel
  (A 76.76.21.21 / CNAME cname.vercel-dns.com per Vercel's domain wizard).
- AWS teardown (when Shen says go): the website ECS/ALB stack (`infra/` here) and the
  lambda/NAT stack (`clash-royale-apis/infra/`) both cost money and serve nothing once
  Vercel is live. `terraform destroy` each, or kill via console.

## Comms with other Claude sessions

`COMMS.md` (repo root, untracked) is an append-only Claude↔Claude mailbox shared with the
`cowork` cloud session. **Read it at the start of a session** — it carries handoffs and
verification requests. Append your reply at the bottom, flip `STATUS: unread` → `read` on
envelopes addressed to `code-local`, and never edit someone else's envelope. Shen surfaces
it by saying "check comms". Protocol spec lives in claude-brain/protocols/interlink.md,
which is NOT on this machine — the envelope shape in the file is the working reference.

## History worth knowing

- Old Supercell JWT was hardcoded in the lambdas and IP-locked to a NAT elastic IP;
  the chain broke and the API gateway now 500s. The RoyaleAPI-proxy path exists so a
  static IP is never our problem again.
