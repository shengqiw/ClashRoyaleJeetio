import {
  AppBar,
  Box,
  Button,
  Container,
  Grid2 as Grid,
  IconButton,
  Link,
  Toolbar,
  Typography,
} from "@mui/material";
import Image from "next/image";
import navLogo from "../assets/logo.png"
import { ReactNode } from "react";

export const PageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <Link href="/">
                <Image src={navLogo} alt="logo-jeetio" priority={true}/>
              </Link>
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Button color="inherit">Home</Button>
              <Button color="inherit">About</Button>
              <Button color="inherit">Contact</Button>
              <IconButton color="inherit">
                {/* <AccountCircleIcon /> */}
                icon
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Container component="main" sx={{ flexGrow: 1, mt: 4, mb: 4 }}>
          {children}
        </Container>

        <Box component="footer" sx={{ bgcolor: "background.paper", py: 6 }}>
          <Container maxWidth="lg">
            <Grid container spacing={4} justifyContent="space-evenly">
              <Grid size={6}>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  Company
                </Typography>
                <Link href="/about">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    About Us
                  </Typography>
                </Link>
                <Link href="/team">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    Our Team
                  </Typography>
                </Link>
              </Grid>
              <Grid size={6}>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  Contact
                </Typography>
                <Link href="/contact">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    Contact Us
                  </Typography>
                </Link>
                <Typography variant="body2" color="text.secondary">
                  support@example.com
                </Typography>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  );
};
