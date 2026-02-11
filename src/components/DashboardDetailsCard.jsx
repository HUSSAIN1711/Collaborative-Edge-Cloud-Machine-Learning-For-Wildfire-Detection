import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Button,
} from "@mui/material";
import useAppStore from "../store/useAppStore";
import {
  getFireRiskColor,
  getFireRiskLabel,
  getBatteryColor,
  getHealthColor,
} from "../utils/colorUtils";

/**
 * Component that displays dashboard details for the selected sensor
 * Shows fire probability, status, battery, and health information
 */
function DashboardDetailsCard() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const markerDisplayMode = useAppStore((state) => state.markerDisplayMode);
  const toggleMarkerDisplayMode = useAppStore(
    (state) => state.toggleMarkerDisplayMode
  );

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" color="primary">
            Dashboard Details
          </Typography>
          <Button
            variant={
              markerDisplayMode === "health" ? "contained" : "outlined"
            }
            size="small"
            onClick={toggleMarkerDisplayMode}
            sx={{ minWidth: 100 }}
          >
            {markerDisplayMode === "health" ? "Health Mode" : "Default Mode"}
          </Button>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 2, display: "block" }}
        >
          {markerDisplayMode === "health"
            ? "Health Mode: Green = Normal, Red = Abnormal (Battery < 10%)"
            : "Default Mode: Standard Google Maps markers"}
        </Typography>
        {selectedSensor ? (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper
                  sx={{
                    p: 1,
                    textAlign: "center",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      color: getFireRiskColor(selectedSensor.fireProbability),
                    }}
                  >
                    {selectedSensor.fireProbability}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Predicted Fire Probability
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  sx={{
                    p: 1,
                    textAlign: "center",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    {selectedSensor.status}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  sx={{
                    p: 1,
                    textAlign: "center",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      color: getBatteryColor(selectedSensor.batteryStatus),
                    }}
                  >
                    {selectedSensor.batteryStatus}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Battery Status
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  sx={{
                    p: 1,
                    textAlign: "center",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: getHealthColor(selectedSensor.sensorHealth),
                    }}
                  >
                    {selectedSensor.sensorHealth}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sensor Health
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Chip
              label={getFireRiskLabel(selectedSensor.fireProbability)}
              color={
                selectedSensor.fireProbability === 100
                  ? "error"
                  : selectedSensor.fireProbability >= 70
                  ? "warning"
                  : "success"
              }
              size="small"
              sx={{ mb: 1 }}
            />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Drone approaching sensor... Data will appear automatically.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardDetailsCard;

