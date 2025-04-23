import { Box, Grid2 as Grid, Typography } from "@mui/material";
import { HomeCards } from "@/components/smart/home-cards";

export default function Root() {
  return (
    <>
      <Grid container mt={3}>
        <Grid size={8} offset={2} textAlign={"center"}>
          <Typography variant="h1" className="purple-shadow">
            Jeetio Clash Royale
          </Typography>
          <Typography variant="h5" className="purple-shadow" mt={2}>
            <i>Forever Paving the Future</i>
          </Typography>
        </Grid>
      </Grid>
      <div className="br" />
      <HomeCards />
      <Box mb={5} className="br"/>
    </>
  );
}
