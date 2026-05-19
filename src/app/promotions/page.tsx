"use client";

import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  Grid,
  Divider,
} from "@mui/material";
import {
  StarBorder,
  StarHalf,
  Star,
  ArrowUpward,
  AssignmentTurnedIn,
  SupervisedUserCircle,
  EmojiEvents,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import "../shared.css";
import "./promotions.css";

const tiers = [
  {
    title: "Member",
    icon: <StarBorder sx={{ color: "#60a5fa", fontSize: { xs: 38, md: 46 } }} />,
    responsibilities: [
      "Meet minimum clan war medal requirements",
      "Active participation in clan activities",
      "Regular card donations",
      "Positive attitude in clan chat",
    ],
    requirements: null,
  },
  {
    title: "Elder",
    icon: <StarHalf sx={{ color: "#ffd040", fontSize: { xs: 38, md: 46 } }} />,
    responsibilities: [
      "Recruit new members",
      "Encourage lower-level members",
      "Maintain clan communication",
    ],
    requirements: [
      "Active for 2+ months",
      "2000+ clan war medals for 4 consecutive weeks",
      "Active in clan chat",
      "Recommended by current Co-Leader or Leader",
    ],
  },
  {
    title: "Co-Leader",
    icon: <Star sx={{ color: "#a0e840", fontSize: { xs: 38, md: 46 } }} />,
    responsibilities: [
      "Clan management rights",
      "Kick / promote members",
      "Set clan war strategies",
      "Resolve conflicts",
    ],
    requirements: [
      "Active for 6+ months",
      "Consistently 2000+ clan war medals per war",
      "Proven track record of clan support",
      "Trust and recommendation from Leader",
      "Exceptional communication skills",
    ],
  },
];

export default function PromotionsPage() {
  return (
    <Box className="game-bg promos-page">
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          <Typography className="game-title">Clan Progression</Typography>
          <Typography className="game-subtitle" sx={{ mt: 1 }}>
            Your path to leadership starts here
          </Typography>
        </motion.div>

        {/* Tier cards */}
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {tiers.map((tier, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={tier.title}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * (index + 1), duration: 0.45 }}
                style={{ height: "100%" }}
              >
                <Box className="game-panel">
                  {/* Tier icon + name */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      mb: 1.75,
                      gap: 0.75,
                    }}
                  >
                    {tier.icon}
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: "#d4f878",
                        fontSize: { xs: "1.2rem", md: "1.35rem" },
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {tier.title}
                    </Typography>
                  </Box>

                  <Divider className="game-divider" />

                  {/* Responsibilities */}
                  <Box sx={{ mt: 1.25 }}>
                    <Typography className="game-section-label" sx={{ mb: 0.75 }}>
                      <AssignmentTurnedIn sx={{ fontSize: 14, color: "#40b8e0" }} />
                      Responsibilities
                    </Typography>
                    <List disablePadding>
                      {tier.responsibilities.map((item, i) => (
                        <ListItem key={i} sx={{ py: 0.5, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <ArrowUpward sx={{ color: "#a0e840", fontSize: 15 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={item}
                            slotProps={{
                              primary: {
                                sx: {
                                  color: "#c0e878",
                                  fontSize: { xs: "0.8rem", md: "0.85rem" },
                                  lineHeight: 1.5,
                                },
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* Promotion requirements (Elder + Co-Leader only) */}
                  {tier.requirements && (
                    <>
                      <Divider className="game-divider" sx={{ mt: 1 }} />
                      <Box sx={{ mt: 1.25 }}>
                        <Typography className="game-section-label" sx={{ mb: 0.75 }}>
                          <EmojiEvents sx={{ fontSize: 14, color: "#ffd040" }} />
                          Promotion Requirements
                        </Typography>
                        <List disablePadding>
                          {tier.requirements.map((req, i) => (
                            <ListItem key={i} sx={{ py: 0.5, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <SupervisedUserCircle sx={{ color: "#ffd040", fontSize: 15 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={req}
                                slotProps={{
                                  primary: {
                                    sx: {
                                      color: "#c0e878",
                                      fontSize: { xs: "0.8rem", md: "0.85rem" },
                                      lineHeight: 1.5,
                                    },
                                  },
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </>
                  )}
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.45 }}
          style={{ marginTop: "2rem" }}
        >
          <Box className="game-footer-panel">
            <Typography className="game-footer-title">
              Leadership is Earned, Not Given
            </Typography>
            <Typography className="game-footer-body">
              Demonstrate consistent dedication, skill, and a positive attitude to climb through our ranks.
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
