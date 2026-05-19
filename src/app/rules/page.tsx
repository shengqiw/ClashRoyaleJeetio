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
} from "@mui/material";
import {
  CheckCircleOutlined,
  ErrorOutlined,
  FlashOn,
  Assignment,
  GroupWork,
  EmojiEvents,
  Handshake,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import "../shared.css";
import "./rules.css";

const sections = [
  {
    title: "Requirements",
    headerIcon: <Assignment sx={{ color: "#ffd040", fontSize: 20 }} />,
    listIcon: (i: number) => <CheckCircleOutlined key={i} sx={{ color: "#ffd040", fontSize: 18 }} />,
    items: [
      "Minimum 6000 trophies to join",
      "King Level 12+",
      "Path Of Legends Best Season Master 3",
      "2000+ Battles Won",
    ],
  },
  {
    title: "Earn Your Keep",
    headerIcon: <EmojiEvents sx={{ color: "#a0e840", fontSize: 20 }} />,
    listIcon: (i: number) => <FlashOn key={i} sx={{ color: "#a0e840", fontSize: 18 }} />,
    items: [
      "Participate in War — boat defense, attack, duel!",
      "Donate cards to clanmates regularly",
      "Be active in clan chat",
      "Participate in clan events and tournaments",
    ],
  },
  {
    title: "Don't Get Kicked",
    headerIcon: <ErrorOutlined sx={{ color: "#e05050", fontSize: 20 }} />,
    listIcon: (i: number) => <ErrorOutlined key={i} sx={{ color: "#e05050", fontSize: 18 }} />,
    items: [
      "Missing more than 2 war weeks in a row",
      "Inactive for 1 month",
      "Toxic behavior or harassment of clan members",
      "Promoting other clans in chat",
    ],
  },
  {
    title: "Soft Rules",
    headerIcon: <Handshake sx={{ color: "#40b8e0", fontSize: 20 }} />,
    listIcon: (i: number) => <GroupWork key={i} sx={{ color: "#40b8e0", fontSize: 18 }} />,
    items: [
      "Adult language is allowed, but no hate speech",
      "Help newer members with deck advice",
      "Participate in friendly battles to practice",
      "Notify leadership if you'll be inactive",
      "Vote on important clan decisions",
    ],
  },
];

export default function RulesPage() {
  return (
    <Box className="game-bg rules-page">
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          <Typography className="game-title">Clan Rules</Typography>
          <Typography className="game-subtitle" sx={{ mt: 1 }}>
            Follow these guidelines to maintain membership and help us thrive
          </Typography>
        </motion.div>

        {/* Panels */}
        <Grid container spacing={{ xs: 2, md: 3 }} rowSpacing={{ xs: 2, md: 3 }}>
          {sections.map((section, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={section.title}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1), duration: 0.45 }}
                style={{ height: "100%" }}
              >
                <Box className="game-panel">
                  {/* Panel header */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.75 }}>
                    {section.headerIcon}
                    <Typography className="game-panel-title">{section.title}</Typography>
                  </Box>

                  <List disablePadding>
                    {section.items.map((item, i) => (
                      <ListItem key={i} sx={{ py: 0.6, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {section.listIcon(i)}
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          slotProps={{
                            primary: {
                              sx: {
                                color: "#c0e878",
                                fontSize: { xs: "0.82rem", md: "0.88rem" },
                                lineHeight: 1.5,
                              },
                            },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.45 }}
          style={{ marginTop: "2rem" }}
        >
          <Box className="game-footer-panel">
            <Typography className="game-footer-title">
              Ready for battle?
            </Typography>
            <Typography className="game-footer-body">
              Follow these rules and help us climb to the top!
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
