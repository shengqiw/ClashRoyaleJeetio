import { Box, Grid2 as Grid, Typography } from "@mui/material";
import "./rules.css";
import spells from "@/assets/spells.jpg";

export default function Rules() {
  return (
    <Grid container>
      <Grid size={10} offset={1} className="page-bg">
          <Typography variant="h1" className="gold-shadow center" mt={3}>
            Clan Rules
          </Typography>
        <Box className="vert-li" mx={2}>
          <Typography variant="h4" className="gold" mt={3}>
            Requirements
          </Typography>
          <ul>
            <li>Be active in clan wars</li>
            <li>Donate cards</li>
            <li>Be respectful</li>
            <li>Have fun</li>
          </ul>
        </Box>
      </Grid>
    </Grid>
  );
}
