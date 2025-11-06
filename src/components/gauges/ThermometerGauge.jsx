import React from "react";
import { Box, Typography } from "@mui/material";

function ThermometerGauge({ value, min = 50, max = 100, label = "Temp", unit = "°F", color, height = 80 }) {
  // Ensure value is clamped within min/max for calculations
  const clampedValue = Math.min(max, Math.max(min, value));
  const percentage = Math.min(100, Math.max(0, ((clampedValue - min) / (max - min)) * 100));
  
  const width = 12; // Tube width
  const bulbSize = 24; // Bulb diameter
  const scaleWidth = 5; // Minimal width for positioning offset
  
  // Determine color based on temperature zones for better visual context
  const getTempColor = (temp) => {
    if (temp >= 90) return "#f44336"; // Red - Very hot (fire risk)
    if (temp >= 75) return "#ff9800"; // Orange - Hot
    if (temp >= 60) return "#ffeb3b"; // Yellow - Warm
    return "#4fc3f7"; // Blue - Cool
  };
  
  const fillColor = color || getTempColor(value);
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'flex-end',
        position: 'relative',
        // Adjusted width now that we don't need the scale markers
        width: width + 20, 
        height: height + bulbSize + 35, // Total component height
        mx: 'auto', // Center the entire component within its parent
        pt: 1, 
      }}
    >
      
      {/* 1. Thermometer Tube and Bulb (Now centered due to removing the scale) */}
      <Box 
        sx={{
          // Use 'auto' margins to center the entire visual component horizontally
          mx: 'auto', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        {/* Tube */}
        <Box
          sx={{
            position: "relative",
            width: width,
            height: height,
            bgcolor: "rgba(255, 255, 255, 0.15)",
            borderRadius: `${width / 2}px ${width / 2}px 0 0`,
            border: `1px solid ${fillColor}`,
            overflow: "hidden",
            mb: '-2px',
          }}
        >
          {/* Fill */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              height: `${percentage}%`,
              bgcolor: fillColor,
              transition: "height 0.5s ease",
            }}
          />
        </Box>
        
        {/* Bulb */}
        <Box
          sx={{
            width: bulbSize,
            height: bulbSize,
            borderRadius: "50%",
            bgcolor: fillColor,
            border: `3px solid ${fillColor}`,
            mt: 0,
          }}
        >
          {/* Internal shadow for depth */}
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.5)',
            }}
          />
        </Box>
        
        {/* Value and Label */}
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ fontWeight: "bold", color: fillColor, fontSize: "1rem" }}>
            {value}{unit}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
            {label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default ThermometerGauge;