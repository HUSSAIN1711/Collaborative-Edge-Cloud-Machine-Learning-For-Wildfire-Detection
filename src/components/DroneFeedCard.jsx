import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import useAppStore from "../store/useAppStore";
import { formatPosition } from "../utils/positionUtils";

/**
 * Component that displays drone mission feed information
 * Shows drone location, zone, status, and live sensor feed when available
 */
function DroneFeedCard() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const selectedDroneId = useAppStore((state) => state.selectedDroneId);
  const drones = useAppStore((state) => state.drones);

  const selectedDrone = drones.find((drone) => drone.id === selectedDroneId) || null;

  if (!selectedDrone) {
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            p: 1.5,
            bgcolor: "background.default",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Drone Mission
          </Typography>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No drone selected
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const dronePosition = selectedDrone.position || { lat: 0, lng: 0 };
  const zone = selectedDrone.zone;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          p: 1.5,
          bgcolor: "background.default",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {selectedDrone.name} Mission
        </Typography>
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Location:</strong> {formatPosition(dronePosition)}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Zone:</strong> {zone?.name || "Unknown"} ({zone?.sensors.length || 0} sensors)
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Status:</strong>{" "}
          {selectedSensor ? "Monitoring Sensor" : "Navigating to Next Sensor"}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>Mission:</strong> Autonomous sensor patrol route
        </Typography>
      </CardContent>
      {selectedSensor && selectedSensor.imageUrl ? (
        <CardMedia
          component="img"
          height="194"
          image={selectedSensor.imageUrl}
          alt={`Live feed from sensor ${selectedSensor.id}`}
          sx={{ objectFit: "cover" }}
        />
      ) : (
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
    </Card>
  );
}

export default DroneFeedCard;

