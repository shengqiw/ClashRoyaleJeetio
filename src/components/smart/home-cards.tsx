import { Grid2 as Grid } from "@mui/material";
import { MyCard } from "../dumb/card";
import explorer from "@/assets/explorer.jpg";
import pekka from "@/assets/pekka.jpg";
import battleHealer from "@/assets/battle-healer.jpg";

export const HomeCards = () => {
  return (
    <Grid container spacing={8} paddingX={8}>
      <Grid size={{xs: 12, md: 4}}>
        <MyCard bgImage={explorer.src} title="Rules" href="/rules" />
      </Grid>
      <Grid size={{xs: 12, md: 4}}>
        <MyCard bgImage={pekka.src} title="Stats" href="/stats" />
      </Grid>
      <Grid size={{xs: 12, md:4}}>
        <MyCard
          bgImage={battleHealer.src}
          title="Promotions"
          href="/promotions"
          styleProps={{'backgroundPosition': "25%" }}
        />
      </Grid>
    </Grid>
  );
};
