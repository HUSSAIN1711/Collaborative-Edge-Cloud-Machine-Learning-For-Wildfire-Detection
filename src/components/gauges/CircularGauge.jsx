import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

function CircularGauge({ value, min, max, label, unit, color, size = 100 }) {
  // Ensure value is within bounds for the calculation
  const calculatedValue = Math.min(max, Math.max(min, value));
  const percentage = Math.min(100, Math.max(0, ((calculatedValue - min) / (max - min)) * 100)); 

  return (
    <Box 
      sx={{ 
        textAlign: "center", 
        position: "relative", 
        width: size, 
        height: size, 
        // Ensures the outer box defines the space
        display: 'inline-flex', 
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 1. The Circular Progress Bar */}
      <CircularProgress
        variant="determinate"
        value={percentage}
        size={size}
        thickness={6}
        sx={{
          color: color,
          position: "absolute",
        }}
      />
      
      {/* 2. The Perfectly Centered Content Box */}
      <Box
        sx={{
          position: "absolute",
          // Use flex properties for perfect centering within the absolute box
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // The key to centering is ensuring the absolute box fills its parent
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <Typography 
          variant="h5" // Increased size for prominence
          sx={{ 
            fontWeight: "bold", 
            color: color, 
            lineHeight: 1.1,
            // Display the main value, e.g., "68%"
          }}
        >
          {value}{unit}
        </Typography>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            fontSize: "0.8rem", // Slightly larger for readability
            lineHeight: 1, 
            // Display the label, e.g., "Humidity"
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

export default CircularGauge;