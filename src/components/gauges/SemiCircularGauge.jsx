import React from "react";
import { Box, Typography } from "@mui/material";

function SemiCircularGauge({ value, min, max, label, unit, color, size = 120 }) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const angle = (percentage / 100) * 180; // 180 degrees for semi-circle
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size;

  // Calculate endpoint of the arc
  const radians = ((angle - 90) * Math.PI) / 180;
  const endX = centerX + radius * Math.cos(radians);
  const endY = centerY - radius * Math.sin(radians);

  const totalHeight = size / 2 + 40; // Add extra space for better alignment
  return (
    <Box sx={{ textAlign: "center", position: "relative", width: size, height: totalHeight }}>
      <svg width={size} height={size / 2 + 20} style={{ overflow: "visible", display: "block" }}>
        {/* Background arc */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />
        {/* Value arc */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 ${angle > 90 ? 1 : 0} 1 ${endX} ${endY}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Indicator dot */}
        <circle
          cx={endX}
          cy={endY}
          r="6"
          fill={color}
        />
      </svg>
      <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center", pb: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", color: color, mb: 0 }}>
          {value}{unit}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

export default SemiCircularGauge;

