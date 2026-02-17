import React from "react";
import { Box, Typography } from "@mui/material";

const panelTextSx = {
  fontFamily: "Roboto Mono, monospace",
  fontSize: "12px",
  lineHeight: 1.5,
};

/**
 * One line: "Label: " (white) + single space + "Info" (grey).
 * If infoRight (e.g. bar) is provided, line is label left + infoRight right-justified.
 */
function PanelLine({ label, info, infoRight, capitalize = true }) {
  const labelText = capitalize && typeof label === "string" ? label.replace(/\b\w/g, (c) => c.toUpperCase()) : label;
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        ...panelTextSx,
      }}
    >
      <Typography component="span" sx={{ ...panelTextSx, color: "#fff" }}>
        {labelText}:{" "}
      </Typography>
      {infoRight != null ? (
        <Typography component="span" sx={{ ...panelTextSx, color: "#999" }}>
          {infoRight}
        </Typography>
      ) : (
        <Typography component="span" sx={{ ...panelTextSx, color: "#999" }}>
          {info}
        </Typography>
      )}
    </Box>
  );
}

export default PanelLine;
export { panelTextSx };
