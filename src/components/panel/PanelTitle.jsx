import React from "react";
import { Box, Typography } from "@mui/material";

const DASHES = "---------";

/**
 * Panel title in white with dashes on the line below.
 */
function PanelTitle({ title }) {
  return (
    <Box sx={{ marginBottom: 1 }}>
      <Typography
        sx={{
          fontFamily: "Roboto Mono, monospace",
          fontSize: "12px",
          color: "#fff",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontFamily: "Roboto Mono, monospace",
          fontSize: "12px",
          color: "#fff",
        }}
      >
        {DASHES}
      </Typography>
    </Box>
  );
}

export default PanelTitle;
export { DASHES };
