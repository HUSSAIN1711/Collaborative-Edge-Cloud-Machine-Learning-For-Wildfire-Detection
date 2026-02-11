import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

function HumidityGauge({ value, min, max, label, unit, color, size = 120 }) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isLowHumidity = value < 30; // Critical threshold for fire risk
  
  return (
    <Box sx={{ textAlign: "center", position: "relative", width: size, height: size }}>
      {/* Background circle with warning zone */}
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        {/* Warning zone (bottom 30% - low humidity danger) */}
        {isLowHumidity && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - 12) / 2}
            fill="none"
            stroke="rgba(244, 67, 54, 0.3)"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * (size - 12) / 2 * 0.3} ${2 * Math.PI * (size - 12) / 2}`}
            strokeDashoffset={0}
          />
        )}
      </svg>
      
      {/* Main progress circle */}
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
      
      {/* Center content */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", color: color }}>
          {value}{unit}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", mt: 0.5 }}>
          {label}
        </Typography>
        {isLowHumidity && (
          <Typography variant="caption" color="error" sx={{ fontSize: "0.65rem", mt: 0.5, fontWeight: "bold" }}>
            ⚠ Fire Risk
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default HumidityGauge;

