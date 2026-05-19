import { Grid } from "@mui/material";
import { MyCard } from "../dumb/card";
import monkBg from "@/assets/monk-bg.jpg";
import pekka from "@/assets/pekka.jpg";
import spells from "@/assets/spells.jpg";

export const HomeCards = () => {
  return (
    <Grid container spacing={8} sx={{ px: 8 }}>
      <Grid size={{xs: 12, md: 4}}>
        <MyCard bgImage={monkBg.src} title="Clan Info" href="/clan-info" />
      </Grid>
      <Grid size={{xs: 12, md: 4}}>
        <MyCard bgImage={pekka.src} title="Stats Lookup" href="/stats" />
      </Grid>
      <Grid size={{xs: 12, md: 4}}>
        <MyCard bgImage={spells.src} title="Deck AI" href="/deckai" />
      </Grid>
    </Grid>
  );
};
