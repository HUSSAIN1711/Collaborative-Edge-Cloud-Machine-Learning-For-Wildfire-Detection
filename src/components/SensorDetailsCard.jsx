import React from "react";
import { Typography, Card, CardContent } from "@mui/material";
import useAppStore from "../store/useAppStore";

function SensorDetailsCard() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);

  const getBatteryColor = (batteryLevel) => {
    if (batteryLevel < 10) return "#f44336"; // Red
    if (batteryLevel < 25) return "#ff9800"; // Orange
    if (batteryLevel < 50) return "#ffeb3b"; // Yellow
    return "#4caf50"; // Green
  };

  const getHealthColor = (health) => {
    return health === "Abnormal" ? "#f44336" : "#4caf50";
  };

  return selectedSensor ? (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sensor #{selectedSensor.id}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Status:</strong> {selectedSensor.status}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Last Ping:</strong> {selectedSensor.lastPing}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Location:</strong> {selectedSensor.position.lat.toFixed(4)},{" "}
          {selectedSensor.position.lng.toFixed(4)}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: selectedSensor.fireProbability > 50 ? "red" : "inherit",
            mb: 1,
          }}
        >
          <strong>Predicted Fire Probability:</strong>{" "}
          {selectedSensor.fireProbability}%
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: getBatteryColor(selectedSensor.batteryStatus),
            mb: 1,
          }}
        >
          <strong>Battery Status:</strong> {selectedSensor.batteryStatus}%
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: getHealthColor(selectedSensor.sensorHealth) }}
        >
          <strong>Sensor Health:</strong> {selectedSensor.sensorHealth}
        </Typography>
      </CardContent>
    </Card>
  ) : (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6">No Sensor Selected</Typography>
        <Typography variant="body2">
          Click a sensor on the map to see its details.
        </Typography>
      </CardContent>
    </Card>
  );
}

export default SensorDetailsCard;

