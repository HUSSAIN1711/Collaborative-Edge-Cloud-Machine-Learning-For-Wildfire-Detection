import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import useAppStore from "../store/useAppStore";
import { formatPosition } from "../utils/positionUtils";

/**
 * Floating draggable component that displays drone mission feed
 * Can be minimized, resized, and moved around the screen
 */
function FloatingDroneFeed() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const dronePosition = useAppStore((state) => state.dronePosition);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Initial position in bottom-right corner of map area
  // Assuming map takes up ~66% of width (md={8}), position accordingly
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Set initial position after mount
    if (typeof window !== 'undefined') {
      // Position in bottom-right of map area (approximately 66% of screen width)
      const mapWidth = window.innerWidth * 0.66;
      const mapHeight = window.innerHeight * 0.7; // Accounting for bottom panel
      setPosition({
        x: mapWidth - 370, // 350px width + 20px margin
        y: mapHeight - 320, // 300px height + 20px margin
      });
    }
  }, []);

  const [size, setSize] = useState({
    width: 350,
    height: 300,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <Rnd
      size={isMinimized ? { width: size.width, height: 50 } : size}
      position={position}
      onDragStop={(e, d) => {
        setPosition({ x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSize({
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
        setPosition(position);
      }}
      minWidth={300}
      minHeight={isMinimized ? 50 : 250}
      bounds="parent"
      style={{
        zIndex: 1000,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
      }}
      dragHandleClassName="drag-handle"
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
    >
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
        }}
      >
        <Box
          className="drag-handle"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1,
            cursor: "move",
            bgcolor: "background.default",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
            Drone Mission Feed
          </Typography>
          <Box>
            <IconButton
              size="small"
              onClick={() => setIsMinimized(!isMinimized)}
              sx={{ mr: 0.5 }}
            >
              <Typography variant="caption">
                {isMinimized ? "□" : "−"}
              </Typography>
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                setIsVisible(false);
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        {!isMinimized && (
          <>
            <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Location:</strong> {formatPosition(dronePosition)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Status:</strong>{" "}
                {selectedSensor ? "Monitoring Sensor" : "Navigating to Next Sensor"}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Mission:</strong> Autonomous sensor patrol route
              </Typography>
            </CardContent>
            {selectedSensor && selectedSensor.imageUrl && (
              <CardMedia
                component="img"
                height="194"
                image={selectedSensor.imageUrl}
                alt={`Live feed from sensor ${selectedSensor.id}`}
                sx={{ objectFit: "cover" }}
              />
            )}
            {!selectedSensor && (
              <Box
                sx={{
                  height: 194,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "background.default",
                  color: "text.secondary",
                }}
              >
                <Typography variant="body2">
                  Waiting for sensor selection...
                </Typography>
              </Box>
            )}
          </>
        )}
      </Card>
    </Rnd>
  );
}

export default FloatingDroneFeed;

