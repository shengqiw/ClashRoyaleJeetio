# jeetio — project briefing (for GitHub Copilot)

This repo is co-maintained by Claude (via Cowork) and Copilot. Claude keeps the deep
notes in `CLAUDE.md` at the repo root — read it before large changes. Short version:

- Nonprofit Clash Royale clan site. **$0 budget**: every external API here is a free
  tier (RoyaleAPI proxy for Supercell data, Groq/Gemini/OpenRouter for LLM). Never
  introduce a paid tier or billing-attached key.
- All Clash Royale data goes through `src/lib/clash.ts`; all LLM calls go through
  `src/lib/llm.ts` (provider fallback chain). Extend those — don't fetch APIs directly
  from pages or components.
- **Never fetch per-member/per-item in a loop** (N+1). Render from the single clan
  payload; per-player detail must be user-initiated, one click = one `/api/player` call.
- Anything derived from the clan payload (activity, donation stats, shortlists) belongs
  in `src/lib/insights.ts` — pure functions, no I/O, zero API cost. Tunable numbers go
  in its `THRESHOLDS` const, never inline.
- Routes and nav come from `src/lib/features.ts`. Adding a page = an entry there plus
  `src/app/<href>/page.tsx`; don't hand-edit the nav.
- Secrets live in `.env.local` only (`.env.example` is the template). Never hardcode
  tokens — the old lambdas did, and it broke production.
- Debugging: start at `GET /api/health` (config, warnings, optional live probes). All
  server logs go through `src/lib/log.ts` as one-line JSON with `[clash]`/`[llm]`/`[api]`/
  `[health]` prefixes and a shared `trace` id — `grep <trace>` reassembles one request.
- Next.js 14 app router, MUI, TypeScript. `npm run dev` / `npm run build`; keep
  `next lint` clean. Build must never depend on network availability.
- To leave notes for Claude, put them in code comments or `CLAUDE.md` — Claude reads
  the repo fresh each session.
