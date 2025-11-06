import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
} from "@mui/material";
import { CheckCircle, Error } from "@mui/icons-material";
import useAppStore from "../store/useAppStore";
import CircularGauge from "./gauges/CircularGauge";

function SensorHealthOverview() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const markerDisplayMode = useAppStore((state) => state.markerDisplayMode);
  const toggleMarkerDisplayMode = useAppStore(
    (state) => state.toggleMarkerDisplayMode
  );

  const getFireRiskColor = (probability) => {
    if (probability === 100) return "#f44336"; // Red
    if (probability >= 70) return "#ff9800"; // Orange
    if (probability >= 40) return "#ffeb3b"; // Yellow
    return "#4caf50"; // Green
  };

  const getFireRiskLabel = (probability) => {
    if (probability === 100) return "CRITICAL";
    if (probability >= 70) return "HIGH";
    if (probability >= 40) return "MODERATE";
    return "LOW";
  };

  const getBatteryColor = (batteryLevel) => {
    if (batteryLevel < 10) return "#f44336"; // Red
    if (batteryLevel < 25) return "#ff9800"; // Orange
    if (batteryLevel < 50) return "#ffeb3b"; // Yellow
    return "#4caf50"; // Green
  };

  const getHealthColor = (health) => {
    return health === "Abnormal" ? "#f44336" : "#4caf50";
  };

  if (!selectedSensor) {
    return (
      <Card sx={{ mb: 0 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sensor & Health Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Drone approaching sensor... Data will appear automatically.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent>
        {/* Header with Title and Mode Toggle */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 0.5 }}>
              Sensor #{selectedSensor.id}
            </Typography>
            <Chip
              label={selectedSensor.status}
              size="small"
              sx={{
                bgcolor: selectedSensor.status === "Active" ? "#4caf50" : "#ff9800",
                color: "white",
              }}
            />
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={markerDisplayMode === "health"}
                onChange={toggleMarkerDisplayMode}
                color="primary"
              />
            }
            label={
              <Typography variant="caption">
                {markerDisplayMode === "health" ? "Health Mode" : "Default Mode"}
              </Typography>
            }
          />
        </Box>

        {/* Health Meters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Fire Probability Gauge */}
          <Grid item xs={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularGauge
                value={selectedSensor.fireProbability}
                min={0}
                max={100}
                label="Fire Risk"
                unit="%"
                color={getFireRiskColor(selectedSensor.fireProbability)}
                size={100}
              />
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={getFireRiskLabel(selectedSensor.fireProbability)}
                  size="small"
                  sx={{
                    bgcolor: getFireRiskColor(selectedSensor.fireProbability),
                    color: "white",
                    fontSize: "0.7rem",
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Battery Gauge */}
          <Grid item xs={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularGauge
                value={selectedSensor.batteryStatus}
                min={0}
                max={100}
                label="Battery"
                unit="%"
                color={getBatteryColor(selectedSensor.batteryStatus)}
                size={100}
              />
            </Box>
          </Grid>

          {/* Sensor Health */}
          <Grid item xs={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-start",
              }}
            >
              {selectedSensor.sensorHealth === "Normal" ? (
                <CheckCircle
                  sx={{ fontSize: 80, color: "#4caf50", mb: 1 }}
                />
              ) : (
                <Error sx={{ fontSize: 80, color: "#f44336", mb: 1 }} />
              )}
              <Typography
                variant="h6"
                sx={{
                  color: getHealthColor(selectedSensor.sensorHealth),
                  fontWeight: "bold",
                }}
              >
                {selectedSensor.sensorHealth}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sensor Health
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Additional Info */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Last Ping:</strong>
            </Typography>
            <Typography variant="body2">{selectedSensor.lastPing}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Location:</strong>
            </Typography>
            <Typography variant="body2">
              {selectedSensor.position.lat.toFixed(4)},{" "}
              {selectedSensor.position.lng.toFixed(4)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default SensorHealthOverview;

