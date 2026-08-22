import { Box, Typography } from "@mui/material";
import "./stats.css";
import { ClanInfo } from "@/components/smart/clan-info";
import { MemberTable } from "@/components/smart/member-table";
import { ClanPulse } from "@/components/dumb/clan-pulse";
import { AiCoach } from "@/components/smart/ai-coach";
import { getClan } from "@/lib/clash";
import { analyzeClan } from "@/lib/insights";
import { newTrace } from "@/lib/log";

/**
 * Cost model that makes this page affordable again:
 *  - ONE clan call via src/lib/clash.ts (RoyaleAPI proxy, free), cached 1h —
 *    not N+1 per-member fetches per view like the old version.
 *  - Everything on the page (pulse metrics, flags, elder shortlist) is DERIVED
 *    from that one payload by src/lib/insights.ts. New stats cost nothing.
 *  - AI Coach reuses the same payload client-side, so asking costs no Clash call.
 */
export const revalidate = 3600;

export default async function Stats() {
  const trace = newTrace();
  const clanData = await getClan(undefined, { trace });
  const insights = clanData ? analyzeClan(clanData) : null;

  return (
    <Box className="page-bg">
      <Typography variant="h1" className="gold-shadow center" mt={3}>
        Clan Stats
      </Typography>
      <div className="br" />
      {clanData && insights ? (
        <>
          <ClanInfo clan={clanData} />
          <div className="br" />
          <ClanPulse insights={insights} />
          <div className="br" />
          <AiCoach clan={clanData} />
          <div className="br" />
          <MemberTable members={insights.members} />
          <div className="br" />
        </>
      ) : (
        <Typography className="gold center" mt={4}>
          Stats are taking a nap — the clan API didn&apos;t answer. Refresh in a bit.
          {process.env.NODE_ENV !== "production" && ` (trace ${trace} — check [clash] logs or GET /api/health?probe=clash)`}
        </Typography>
      )}
    </Box>
  );
}
