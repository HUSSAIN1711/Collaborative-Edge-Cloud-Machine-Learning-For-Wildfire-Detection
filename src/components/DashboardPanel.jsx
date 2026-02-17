import React from "react";
import { Box, Paper } from "@mui/material";

/**
 * Shared panel wrapper. No separate header; title is first line of content.
 * 80% transparent with blur so map shows through.
 */
function DashboardPanel({ children, sx = {} }) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        bgcolor: "rgba(48, 48, 48, 0.2)",
        backdropFilter: "blur(12px)",
        border: 1,
        borderColor: "rgba(255,255,255,0.15)",
        borderRadius: 1,
        ...sx,
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
        {children}
      </Box>
    </Paper>
  );
}

export default DashboardPanel;
