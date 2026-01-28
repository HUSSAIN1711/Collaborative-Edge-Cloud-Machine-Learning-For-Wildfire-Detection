import React from "react";
import { Typography, Card, CardContent } from "@mui/material";
import useAppStore from "../store/useAppStore";
import { getBatteryColor, getHealthColor } from "../utils/colorUtils";
import { formatPosition } from "../utils/positionUtils";

/**
 * Component that displays detailed information about the selected sensor
 * Shows sensor ID, status, location, fire probability, battery, and health
 */
function SensorDetailsCard() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);

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
          <strong>Location:</strong> {formatPosition(selectedSensor.position)}
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

