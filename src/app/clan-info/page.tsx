"use client";

import React from "react";
import { Box, Typography, Container, Grid, Divider } from "@mui/material";
import {
  StarBorder,
  StarHalf,
  Star,
  ArrowUpward,
  AssignmentTurnedIn,
  SupervisedUserCircle,
  EmojiEvents,
  CheckCircleOutlined,
  ErrorOutlined,
  FlashOn,
  Assignment,
  GroupWork,
  Handshake,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import "../shared.css";
import "./clan-info.css";

const ruleSections = [
  {
    title: "Requirements",
    headerIcon: <Assignment sx={{ color: "#FBBF24", fontSize: 20 }} />,
    listIcon: () => <CheckCircleOutlined sx={{ color: "#FBBF24", fontSize: 15 }} />,
    items: [
      "Minimum 6000 trophies to join",
      "King Level 12+",
      "Path Of Legends Best Season Master 3",
      "2000+ Battles Won",
    ],
  },
  {
    title: "Earn Your Keep",
    headerIcon: <EmojiEvents sx={{ color: "#FEF08A", fontSize: 20 }} />,
    listIcon: () => <FlashOn sx={{ color: "#FEF08A", fontSize: 15 }} />,
    items: [
      "Participate in War — boat defense, attack, duel!",
      "Donate cards to clanmates regularly",
      "Be active in clan chat",
      "Participate in clan events and tournaments",
    ],
  },
  {
    title: "Don't Get Kicked",
    headerIcon: <ErrorOutlined sx={{ color: "#EF4444", fontSize: 20 }} />,
    listIcon: () => <ErrorOutlined sx={{ color: "#EF4444", fontSize: 15 }} />,
    items: [
      "Missing more than 2 war weeks in a row",
      "Inactive for 1 month",
      "Toxic behavior or harassment of clan members",
      "Promoting other clans in chat",
    ],
  },
  {
    title: "Soft Rules",
    headerIcon: <Handshake sx={{ color: "#C4B5FD", fontSize: 20 }} />,
    listIcon: () => <GroupWork sx={{ color: "#C4B5FD", fontSize: 15 }} />,
    items: [
      "Adult language is allowed, but no hate speech",
      "Help newer members with deck advice",
      "Participate in friendly battles to practice",
      "Notify leadership if you'll be inactive",
      "Vote on important clan decisions",
    ],
  },
];

const tiers = [
  {
    title: "Member",
    icon: <StarBorder sx={{ color: "#93C5FD", fontSize: { xs: 36, md: 44 } }} />,
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
    icon: <StarHalf sx={{ color: "#FCD34D", fontSize: { xs: 36, md: 44 } }} />,
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
    icon: <Star sx={{ color: "#FEF08A", fontSize: { xs: 36, md: 44 } }} />,
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

function BulletRow({
  icon,
  text,
  textSx = {},
}: {
  icon: React.ReactNode;
  text: string;
  textSx?: object;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: "8px", py: "5px" }}>
      <Box sx={{ display: "flex", flexShrink: 0, mt: "3px" }}>{icon}</Box>
      <Typography sx={{ color: "#E9D5FF", fontSize: { xs: "0.82rem", md: "0.87rem" }, lineHeight: 1.55, ...textSx }}>
        {text}
      </Typography>
    </Box>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: 0.75 }}>
      <Box sx={{ display: "flex", flexShrink: 0 }}>{icon}</Box>
      <Typography className="game-section-label" component="span">{label}</Typography>
    </Box>
  );
}

export default function ClanInfoPage() {
  return (
    <Box className="game-bg clan-info-page">
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          <Typography className="game-title">Clan Info</Typography>
          <Typography className="game-subtitle" sx={{ mt: 1 }}>
            Rules, ranks, and the path to leadership
          </Typography>
        </motion.div>

        {/* ── Clan Rules ── */}
        <Typography className="section-divider-label">Clan Rules</Typography>

        <Grid container spacing={{ xs: 2, md: 3 }} rowSpacing={{ xs: 2, md: 3 }}>
          {ruleSections.map((section, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={section.title}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * (index + 1), duration: 0.45 }}
                style={{ height: "100%" }}
              >
                <Box className="game-panel">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.75 }}>
                    {section.headerIcon}
                    <Typography className="game-panel-title">{section.title}</Typography>
                  </Box>
                  {section.items.map((item, i) => (
                    <BulletRow key={i} icon={section.listIcon()} text={item} />
                  ))}
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* ── Clan Progression ── */}
        <Divider className="game-section-divider" />
        <Typography className="section-divider-label">Clan Progression</Typography>

        <Grid container spacing={{ xs: 2, md: 3 }}>
          {tiers.map((tier, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={tier.title}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + 0.12 * (index + 1), duration: 0.45 }}
                style={{ height: "100%" }}
              >
                <Box className="game-panel">
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 1.75, gap: 0.75 }}>
                    {tier.icon}
                    <Typography className="tier-title">{tier.title}</Typography>
                  </Box>

                  <Divider className="game-divider" />

                  <Box sx={{ mt: 1.25 }}>
                    <SectionLabel
                      icon={<AssignmentTurnedIn sx={{ fontSize: 13, color: "#93C5FD" }} />}
                      label="Responsibilities"
                    />
                    {tier.responsibilities.map((item, i) => (
                      <BulletRow
                        key={i}
                        icon={<ArrowUpward sx={{ color: "#FCD34D", fontSize: 13 }} />}
                        text={item}
                        textSx={{ fontSize: { xs: "0.79rem", md: "0.84rem" } }}
                      />
                    ))}
                  </Box>

                  {tier.requirements && (
                    <>
                      <Divider className="game-divider" sx={{ mt: 1 }} />
                      <Box sx={{ mt: 1.25 }}>
                        <SectionLabel
                          icon={<EmojiEvents sx={{ fontSize: 13, color: "#FCD34D" }} />}
                          label="Promotion Requirements"
                        />
                        {tier.requirements.map((req, i) => (
                          <BulletRow
                            key={i}
                            icon={<SupervisedUserCircle sx={{ color: "#FCD34D", fontSize: 13 }} />}
                            text={req}
                            textSx={{ fontSize: { xs: "0.79rem", md: "0.84rem" } }}
                          />
                        ))}
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
          transition={{ delay: 1.1, duration: 0.45 }}
          style={{ marginTop: "2rem" }}
        >
          <Box className="game-footer-panel">
            <Typography className="game-footer-title">
              Earn Your Place. Lead With Honor.
            </Typography>
            <Typography className="game-footer-body">
              Follow the rules, prove your dedication, and rise through the ranks to shape our clan&apos;s future.
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
