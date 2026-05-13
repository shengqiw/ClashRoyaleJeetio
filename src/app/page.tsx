import { Box, Grid, Typography } from "@mui/material";
import { HomeCards } from "@/components/smart/home-cards";

export default function Root() {
  return (
    <>
      <Grid container sx={{ mt: 3 }}>
        <Grid size={8} offset={2} sx={{ textAlign: "center" }}>
          <Typography variant="h1" className="purple-shadow">
            Jeetio Clash Royale
          </Typography>
          <Typography variant="h5" className="purple-shadow" sx={{ mt: 2 }}>
            <i>Forever Paving the Future</i>
          </Typography>
        </Grid>
      </Grid>
      <div className="br" />
      <HomeCards />
      <Box className="br" sx={{ mb: 5 }} />
    </>
  );
}
