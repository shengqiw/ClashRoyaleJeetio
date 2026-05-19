"use client";

import { Box, Typography, Container } from "@mui/material";
import { motion } from "framer-motion";
import "../shared.css";

export default function DeckAIPage() {
  return (
    <Box className="game-bg" sx={{ background: "rgba(11, 20, 55, 0.92) !important" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#F1F5F9",
              textShadow:
                "0 3px 0 rgba(0,10,60,0.9), 0 0 22px rgba(59,130,246,0.55), 0 0 50px rgba(30,58,138,0.3)",
              fontSize: { xs: "1.5rem", md: "2rem" },
            }}
          >
            Deck AI
          </Typography>
          <Typography
            sx={{
              color: "#94A3B8",
              fontSize: { xs: "0.88rem", md: "1rem" },
              mt: 1,
              opacity: 0.88,
            }}
          >
            AI-powered deck building — coming soon
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          <Box
            sx={{
              background: "rgba(11, 20, 55, 0.97)",
              border: "1px solid rgba(59, 130, 246, 0.22)",
              borderRadius: "10px",
              padding: { xs: "1.5rem 1rem", md: "3rem" },
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: "''",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent 5%, rgba(99,160,255,0.55) 35%, rgba(99,160,255,0.55) 65%, transparent 95%)",
              },
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: "3rem", md: "5rem" },
                lineHeight: 1,
                mb: 2,
              }}
            >
              🤖
            </Typography>
            <Typography
              sx={{
                color: "#60A5FA",
                fontWeight: 700,
                fontSize: { xs: "1rem", md: "1.2rem" },
                letterSpacing: "0.04em",
                mb: 1,
              }}
            >
              Intelligent Deck Recommendations
            </Typography>
            <Typography
              sx={{
                color: "#94A3B8",
                fontSize: { xs: "0.85rem", md: "0.95rem" },
                lineHeight: 1.7,
                maxWidth: 480,
                mx: "auto",
              }}
            >
              Enter your player tag and our AI will analyze your card collection
              to suggest optimal decks for your current trophy range.
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
