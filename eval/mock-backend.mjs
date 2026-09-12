/**
 * Local stand-in for the real backend + Gemini, so the War Decks route and
 * page can be exercised without API_BASE_URL/API_KEY or a Gemini key:
 *
 *   node eval/mock-backend.mjs            # listens on :4000
 *   API_BASE_URL=http://localhost:4000 API_KEY=x GEMINI_API_KEY=x \
 *   GEMINI_API_BASE=http://localhost:4000/gemini npm start
 *
 * Serves /clash/player/:tag (a synthetic mid-ladder collection in the real
 * Supercell shape — rarity-relative levels), /clash/cards (names + placeholder
 * icons) and a fake Gemini generateContent that answers the advisor schema.
 * Tags: #FULL → every card maxed; anything else → the partial collection.
 */
import http from "node:http";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
// tsx registers a loader for .ts imports when run via `npx tsx`; fall back to
// a tiny inline list if we're plain node.
let CARD_ROLES;
try {
  ({ CARD_ROLES } = await import(pathToFileURL(require.resolve("../src/data/cardRoles.ts")).href));
} catch {
  CARD_ROLES = Object.fromEntries(["Knight", "Archers", "Fireball", "The Log", "Hog Rider", "Musketeer", "Cannon", "Skeletons", "Ice Spirit", "Ice Golem"].map((n) => [n, { elixir: 3, roles: [] }]));
}

const RARITY = (i) => (i % 9 === 0 ? ["champion", 4] : i % 5 === 0 ? ["legendary", 6] : i % 3 === 0 ? ["epic", 9] : i % 2 === 0 ? ["rare", 12] : ["common", 14]);

function collection(full) {
  const names = Object.keys(CARD_ROLES);
  return names
    .filter((_n, i) => full || i % 4 !== 3)
    .map((name, i) => {
      const [rarity, maxLevel] = RARITY(i);
      const wanted = full ? 14 : 9 + ((i * 7) % 6); // 9..14
      return {
        name,
        id: 26000000 + i,
        level: wanted - (14 - maxLevel),
        maxLevel,
        rarity,
        elixirCost: CARD_ROLES[name].elixir,
        evolutionLevel: i % 6 === 0 ? 1 : 0,
        maxEvolutionLevel: i % 6 === 0 ? 1 : 0,
        iconUrls: { medium: `https://api-assets.clashroyale.com/cards/300/${i}.png` },
      };
    });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (url.pathname.startsWith("/clash/player/")) {
    const tag = decodeURIComponent(url.pathname.split("/").pop());
    if (tag === "#NOPE") return json(404, { reason: "notFound" });
    const full = tag === "#FULL";
    return json(200, {
      tag,
      name: full ? "Maxed Mike" : "Mid Ladder Molly",
      expLevel: full ? 60 : 38,
      trophies: full ? 12100 : 6200,
      bestTrophies: full ? 12400 : 6400,
      currentPathOfLegendSeasonResult: { leagueNumber: full ? 10 : 4 },
      cards: collection(full),
    });
  }
  if (url.pathname === "/clash/cards") {
    return json(200, { items: collection(true).map((c) => ({ name: c.name, id: c.id, iconUrls: c.iconUrls })), supportItems: [] });
  }
  if (url.pathname.startsWith("/gemini/")) {
    let body = "";
    for await (const chunk of req) body += chunk;
    const prompt = JSON.parse(body).contents[0].parts[0].text;
    // Echo enough to prove the prompt reached us, then answer in the schema.
    const reply = {
      lineupIndex: 0,
      summary: `Mock coach read ${prompt.length} chars. Four decks, no repeats — the cycle deck is your strongest by levels, open duels with it.`,
      decks: [0, 1, 2, 3].map((i) => ({
        deckIndex: i,
        warRole: ["Duel opener", "Duel second", "Duel closer", "1v1 / boat"][i],
        why: `Mock reason for deck ${i}: highest-level win condition in the lineup.`,
        howToPlay: `Mock tip ${i}: defend first, punish in double elixir.`,
      })),
      swaps: [{ deckIndex: 0, out: "Nonexistent Card", in: "Also Fake", why: "should be rejected" }],
    };
    return json(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] }, finishReason: "STOP" }] });
  }
  json(404, { error: "mock: unknown path " + url.pathname });
});

server.listen(4000, () => console.log("mock backend on http://localhost:4000"));
