import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

function getWindDirectionLabel(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function WindCompass({ windSpeed, windDirection, size = 100, unit = "mph" }) {
  const theme = useTheme();
  const primaryColor = theme.palette.info.main;
  const secondaryColor = theme.palette.text.secondary;
  
  const radius = size / 2 - 4;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // 1. Convert Meteorological (Coming FROM) to Vector (Going TO)
  const vectorDirection = (windDirection + 180) % 360;
  
  // 2. Convert Degrees to Radians, correctly offset for SVG (0 deg is up/North)
  // Standard math: 0 is East, 90 is North. Compass: 0 is North.
  // We subtract 90 degrees to align 0 North, and then apply a negative sign 
  // because SVG Y-axis is inverted (positive Y is down).
  // A simpler method is to treat 0 degrees as North and use standard polar-to-cartesian.
  
  const angle = (vectorDirection) * Math.PI / 180; // Angle from North (0 degrees)
  
  // Define arrow tip (head) and tail endpoints relative to the center
  const arrowHeadLength = radius * 0.9;
  const arrowTailLength = radius * 0.4;
  
  // Polar to Cartesian conversion for compass:
  // X = r * sin(angle) (sin for X ensures 0 degrees (N) is 0 on X axis)
  // Y = -r * cos(angle) (negative cos for Y ensures 0 degrees (N) is negative/up on Y axis)
  
  const headX = centerX + arrowHeadLength * Math.sin(angle);
  const headY = centerY - arrowHeadLength * Math.cos(angle); 
  
  const tailX = centerX - arrowTailLength * Math.sin(angle);
  const tailY = centerY + arrowTailLength * Math.cos(angle);
  
  // 3. Arrowhead size fix: Increased from 8 to 12
  const arrowheadSize = 12;

  return (
    <Box 
      sx={{ 
        position: "relative", 
        width: size, 
        height: size + 15,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <svg width={size} height={size} style={{ display: "block" }}>
        
        {/* 1. Base Compass Ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1.5"
        />
        
        {/* 2. Cardinal Directions */}
        <text x={centerX} y={8} textAnchor="middle" fill={secondaryColor} fontSize="12" fontWeight="bold">N</text>
        <text x={size - 8} y={centerY + 4} textAnchor="end" fill={secondaryColor} fontSize="12">E</text>
        <text x={centerX} y={size - 2} textAnchor="middle" fill={secondaryColor} fontSize="12">S</text>
        <text x={8} y={centerY + 4} textAnchor="start" fill={secondaryColor} fontSize="12">W</text>
        
        {/* 3. Wind Direction Arrow Line (from tail to head) */}
        <line
          x1={tailX} 
          y1={tailY}
          x2={headX}
          y2={headY}
          stroke={primaryColor}
          strokeWidth="3"
          strokeLinecap="round"
          markerEnd="url(#windArrowhead)"
        />
        
        {/* 4. Center Point */}
        <circle cx={centerX} cy={centerY} r="3.5" fill={primaryColor} />

        {/* 5. Arrowhead marker definition (Fixed size using userSpaceOnUse) */}
        <defs>
          <marker
            id="windArrowhead"
            markerWidth={arrowheadSize}
            markerHeight={arrowheadSize}
            refX={arrowheadSize * 0.9} // Position tip of the arrow
            refY={arrowheadSize / 2} // Center refY
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon points={`0 0, ${arrowheadSize} ${arrowheadSize / 2}, 0 ${arrowheadSize}`} fill={primaryColor} />
          </marker>
        </defs>
      </svg>
      
      {/* 6. Text Display */}
      <Box sx={{ mt: 0.5, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ fontWeight: "bold", color: primaryColor, fontSize: "1.1rem", lineHeight: 1.1 }}>
          {windSpeed} {unit}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.8rem", mt: -0.5, lineHeight: 1 }}>
          {getWindDirectionLabel(windDirection)} ({windDirection}°)
        </Typography>
      </Box>
    </Box>
  );
}

export default WindCompass;