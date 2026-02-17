import React from "react";
import { Box, Paper, Typography } from "@mui/material";

/**
 * Shared panel wrapper for dashboard sections.
 * Provides consistent container style with optional title and header actions.
 *
 * @param {string} [title] - Panel title (optional)
 * @param {React.ReactNode} [actions] - Header actions, e.g. buttons or toggles (optional)
 * @param {React.ReactNode} children - Panel content
 * @param {object} [sx] - Additional MUI sx for the root Paper
 */
function DashboardPanel({ title, actions, children, sx = {} }) {
  const hasHeader = Boolean(title || actions);

  return (
    <Paper
      elevation={1}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        ...sx,
      }}
    >
      {hasHeader && (
        <Box
          sx={{
            flexShrink: 0,
            px: 1.5,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.default",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {title && (
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {title}
            </Typography>
          )}
          <Box sx={{ ml: 1 }}>{actions}</Box>
        </Box>
      )}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
        {children}
      </Box>
    </Paper>
  );
}

export default DashboardPanel;
