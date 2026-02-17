import React from "react";
import { Typography } from "@mui/material";

/**
 * Selectable text option: [Option]. Selected = white, unselected = grey. Clickable.
 */
function TextOption({ label, selected, onClick }) {
  return (
    <Typography
      component="span"
      onClick={onClick}
      sx={{
        fontFamily: "Roboto Mono, monospace",
        fontSize: "12px",
        color: selected ? "#fff" : "#888",
        cursor: "pointer",
        "&:hover": { color: "#fff" },
      }}
    >
      [{label}]
    </Typography>
  );
}

export default TextOption;
