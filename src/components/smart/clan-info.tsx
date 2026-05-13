import { Clan } from "@/types/Clan";
import { Grid, Typography } from "@mui/material";
import clanWar from "@/assets/clan-war.jpg";
import Image from "next/image";

export const ClanInfo = ({ clan }: { clan: Clan }) => {
  return (
    <Grid container spacing={3} sx={{ height: "60vh" }}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Image src={clanWar} alt="Clan Badge" className="img-fit" />
      </Grid>
      <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: "center" }}>
        <Typography variant="h2" className="gold" sx={{ mr: 3, fontWeight: "bold" }}>
          {clan.name} Clan
        </Typography>
        <Typography variant="h6" className="gold">
          {clan.tag}
        </Typography>
        <Typography variant="subtitle1" className="gold" sx={{ fontStyle: "italic", mt: 2 }}>
          Description: {clan.description}
        </Typography>
        <Typography variant="h5" className="gold" sx={{ mt: 2 }}>
          Status: {clan.type}
        </Typography>
        <Typography variant="h5" className="gold" sx={{ mt: 2 }}>
          Clan Trophies: {clan.clanScore}
        </Typography>
        <Typography variant="h5" className="gold" sx={{ mt: 2 }}>
          Required Trophies: {clan.requiredTrophies}
        </Typography>
        <Typography variant="h5" className="gold" sx={{ mt: 2 }}>
          Donations per week: {clan.donationsPerWeek}
        </Typography>
        <Typography variant="h5" className="gold" sx={{ mt: 2 }}>
          Member Count: {clan.members}
        </Typography>
      </Grid>
    </Grid>
  );
};
