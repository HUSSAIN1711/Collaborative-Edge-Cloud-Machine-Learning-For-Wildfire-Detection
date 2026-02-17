import React from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import useAppStore from "../store/useAppStore";
import DashboardPanel from "./DashboardPanel";
import DroneFeedCard from "./DroneFeedCard";

/**
 * Combined Drone Overview panel: drone selector, boundary/heatmap toggle, and mission feed.
 */
function DroneOverview() {
  const drones = useAppStore((state) => state.drones);
  const selectedDroneId = useAppStore((state) => state.selectedDroneId);
  const setSelectedDroneId = useAppStore((state) => state.setSelectedDroneId);
  const fireDisplayMode = useAppStore((state) => state.fireDisplayMode);
  const setFireDisplayMode = useAppStore((state) => state.setFireDisplayMode);

  return (
    <DashboardPanel title="Drone Overview" sx={{ mb: 1 }}>
      {drones.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No drones available
        </Typography>
      ) : (
        <>
          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 1 }}>
            <InputLabel id="drone-overview-select-label">Select Drone</InputLabel>
            <Select
              labelId="drone-overview-select-label"
              id="drone-overview-select"
              value={selectedDroneId || ""}
              onChange={(e) => setSelectedDroneId(e.target.value)}
              label="Select Drone"
            >
              {drones.map((drone) => (
                <MenuItem key={drone.id} value={drone.id}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {drone.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Zone: {drone.zone.name} • {drone.zone.sensors.length} sensors
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={fireDisplayMode}
            exclusive
            onChange={(_, v) => v && setFireDisplayMode(v)}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="boundary">Boundary</ToggleButton>
            <ToggleButton value="heatmap">Heatmap</ToggleButton>
          </ToggleButtonGroup>
          <DroneFeedCard embedInPanel />
        </>
      )}
    </DashboardPanel>
  );
}

export default DroneOverview;
