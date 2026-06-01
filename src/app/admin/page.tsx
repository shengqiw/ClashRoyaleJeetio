"use client";

import {
  Box,
  Typography,
  Container,
  Grid,
} from "@mui/material";
import {
  Insights,
  Storage,
  ScatterPlot,
  Speed,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import "../shared.css";

/* Placeholder metrics — wire these up to the embeddings backend later. */
const metrics = [
  {
    label: "Total Embeddings",
    value: "—",
    icon: <Storage sx={{ color: "#a0e840", fontSize: 22 }} />,
  },
  {
    label: "Vector Dimensions",
    value: "—",
    icon: <ScatterPlot sx={{ color: "#a0e840", fontSize: 22 }} />,
  },
  {
    label: "Index Size",
    value: "—",
    icon: <Insights sx={{ color: "#a0e840", fontSize: 22 }} />,
  },
  {
    label: "Avg. Query Latency",
    value: "—",
    icon: <Speed sx={{ color: "#a0e840", fontSize: 22 }} />,
  },
];

export default function AdminPage() {
  return (
    <Box className="game-bg">
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          <Typography className="game-title">Admin · Embeddings</Typography>
          <Typography className="game-subtitle" sx={{ mt: 1 }}>
            Internal metrics for the vector embeddings pipeline
          </Typography>
        </motion.div>

        {/* Metric cards */}
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {metrics.map((metric, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={metric.label}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * (index + 1), duration: 0.45 }}
                style={{ height: "100%" }}
              >
                <Box className="game-panel" sx={{ textAlign: "center" }}>
                  <Box sx={{ mb: 1.25 }}>{metric.icon}</Box>
                  <Typography
                    sx={{
                      color: "#cef870",
                      fontWeight: 900,
                      fontSize: "1.8rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {metric.value}
                  </Typography>
                  <Typography className="game-section-label" sx={{ mt: 1, justifyContent: "center" }}>
                    {metric.label}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Placeholder panel for future charts / tables */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45 }}
          style={{ marginTop: "2rem" }}
        >
          <Box className="game-footer-panel">
            <Typography className="game-footer-title">
              Embeddings dashboard
            </Typography>
            <Typography className="game-footer-body">
              Charts, index breakdowns, and recent query logs will live here.
              This page is scaffolded and not yet wired to live data.
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
