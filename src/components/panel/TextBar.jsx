import React from "react";
import { Box, Typography } from "@mui/material";

const FULL = "\u2588";
const EMPTY = "\u2591";

/**
 * Bar display like ██████░░░░ (10 segments). Value 0-100.
 */
function TextBar({ value = 0, segments = 10, color = "#fff" }) {
  const clamped = Math.max(0, Math.min(100, Number(value)));
  const filled = Math.round((clamped / 100) * segments);
  const bar = FULL.repeat(filled) + EMPTY.repeat(segments - filled);
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: "Roboto Mono, monospace",
        fontSize: "12px",
        letterSpacing: "0.02em",
        color,
      }}
    >
      {bar}
    </Typography>
  );
}

export default TextBar;
