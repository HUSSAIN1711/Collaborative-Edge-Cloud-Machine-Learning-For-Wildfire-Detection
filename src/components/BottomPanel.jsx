import React from "react";
import { Box } from "@mui/material";
import WeatherCard from "./WeatherCard";

function BottomPanel() {
  return (
    <Box
      sx={{
        width: "100%",
        // Use minHeight to allow the container to grow, but allow the height to be controlled by content
        minHeight: "280px", // Match this to the WeatherCard's minHeight for consistency
        bgcolor: "background.default",
        
        // FIX 1: Remove top padding (pt: 0) to reduce the gap between the map and the card header.
        // Keep horizontal padding (px: 2) and bottom padding (pb: 2) for edge cleanliness.
        px: 2,
        pt: 0,
        pb: 2,
        
        // Setting overflow to auto is fine, but we need the sizing correct first.
        overflow: "auto", 
      }}
    >
      <WeatherCard />
    </Box>
  );
}

export default BottomPanel;