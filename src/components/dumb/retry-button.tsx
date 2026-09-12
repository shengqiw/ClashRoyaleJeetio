"use client";
import { Button } from "@mui/material";

/** Reloads the page — used by /offline, which is otherwise a server component. */
export const RetryButton = () => (
  <Button
    variant="contained"
    onClick={() => window.location.reload()}
    sx={{ background: "#7ec040", color: "#0a1a06", fontWeight: 800, "&:hover": { background: "#a0e840" } }}
  >
    Try again
  </Button>
);
