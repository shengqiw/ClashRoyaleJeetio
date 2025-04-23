import { Clan } from "@/types/Clan";
import { Grid2 as Grid, Typography } from "@mui/material";
// import { MemberList } from "./member-list";
import clanWar from "@/assets/clan-war.jpg";
import Image from "next/image";

export const ClanInfo = ({ clan }: { clan: Clan }) => {
  return (
    <Grid container spacing={3} height={"60vh"}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Image src={clanWar} alt="Clan Badge" className="img-fit" />
      </Grid>
      <Grid size={{ xs: 12, md: 5 }} textAlign={"center"}>
        <Typography variant="h2" className="gold" mr={3} fontWeight={'bold'}>
          {clan.name} Clan
        </Typography>
        <Typography variant="h6" className="gold">
          {clan.tag}
        </Typography>
        <Typography variant="subtitle1" className="gold" fontStyle={"italic"} mt={2}>
          Description: {clan.description}
        </Typography>
        <Typography variant="h5" className="gold" mt={2}>
          Status: {clan.type}
        </Typography>
        <Typography variant="h5" className="gold" mt={2}>
          Clan Trophies: {clan.clanScore}
        </Typography>
        <Typography variant="h5" className="gold" mt={2}>
          Required Trophies: {clan.requiredTrophies}
        </Typography>
        <Typography variant="h5" className="gold" mt={2}>
          Donations per week: {clan.donationsPerWeek}
        </Typography>
        <Typography variant="h5" className="gold" mt={2}>
          Member Count: {clan.members}
        </Typography>
      </Grid>
    </Grid>
  );
};
