import { Grid2 as Grid } from "@mui/material";
import { MyCard } from "../dumb/card";
import explorer from "@/assets/explorer.jpg";
import pekka from "@/assets/pekka.jpg";
import battleHealer from "@/assets/battle-healer.jpg";

export const HomeCards = () => {
  return (
    <Grid container spacing={8} paddingX={8}>
      <Grid size={4}>
        <MyCard bgImage={explorer.src} title="Rules" />
      </Grid>
      <Grid size={4}>
        <MyCard bgImage={pekka.src} title="Stats" />
      </Grid>
      <Grid size={4}>
        <MyCard bgImage={battleHealer.src} title="Hierarchy" />
      </Grid>
    </Grid>
  );
};
