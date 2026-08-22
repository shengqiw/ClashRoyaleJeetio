import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import type { MemberInsight } from "@/lib/insights";

/**
 * Renders members from the clan payload ALREADY in hand — one API call total.
 * Do NOT fetch per-member details here: that's the N+1 pattern that made the
 * old stats page "too expensive" (30–50 lambda + Supercell calls per view).
 *
 * Takes MemberInsight, not raw Member, so the activity/flag logic lives in exactly
 * one place (src/lib/insights.ts) and the table can never disagree with the AI coach.
 */

const ACTIVITY_COLOR: Record<MemberInsight["activity"], string> = {
  active: "#4ade80",
  idle: "#fbbf24",
  inactive: "#f87171",
};

const HEADERS = ["#", "Name", "Role", "Trophies", "Donated", "Received", "Last seen", "Flags"];

export const MemberTable = ({ members }: { members: MemberInsight[] }) => (
  <TableContainer component={Paper} sx={{ maxWidth: 1100, mx: "auto", bgcolor: "rgba(0,0,0,0.55)" }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          {HEADERS.map((h) => (
            <TableCell key={h} sx={{ color: "gold", fontWeight: "bold" }}>
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {[...members]
          .sort((a, b) => a.clanRank - b.clanRank)
          .map((m) => (
            <TableRow key={m.tag}>
              <TableCell sx={{ color: "white" }}>{m.clanRank}</TableCell>
              <TableCell sx={{ color: "gold" }}>{m.name}</TableCell>
              <TableCell sx={{ color: "white" }}>{m.role}</TableCell>
              <TableCell sx={{ color: "white" }}>{m.trophies}</TableCell>
              <TableCell sx={{ color: "white" }}>{m.donations}</TableCell>
              <TableCell sx={{ color: "white" }}>{m.donationsReceived}</TableCell>
              <TableCell sx={{ color: ACTIVITY_COLOR[m.activity] }}>
                {m.daysSinceSeen === null ? "—" : m.daysSinceSeen === 0 ? "today" : `${m.daysSinceSeen}d ago`}
              </TableCell>
              <TableCell>
                {m.flags
                  .filter((f) => f !== "idle" && f !== "inactive")
                  .map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      size="small"
                      sx={{ mr: 0.5, bgcolor: "rgba(255,255,255,0.12)", color: "white" }}
                    />
                  ))}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  </TableContainer>
);
