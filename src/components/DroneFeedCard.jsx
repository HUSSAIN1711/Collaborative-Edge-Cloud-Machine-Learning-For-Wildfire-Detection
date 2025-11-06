import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import useAppStore from "../store/useAppStore";

function DroneFeedCard() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const dronePosition = useAppStore((state) => state.dronePosition);

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
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Location:</strong> {dronePosition.lat.toFixed(4)},{" "}
          {dronePosition.lng.toFixed(4)}
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

