import React from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import useAppStore from "../store/useAppStore";

/**
 * Component that provides a dropdown selector for choosing which drone to view
 * Displays drone name, zone, and sensor count for each option
 */
function DroneSelector() {
  const drones = useAppStore((state) => state.drones);
  const selectedDroneId = useAppStore((state) => state.selectedDroneId);
  const setSelectedDroneId = useAppStore((state) => state.setSelectedDroneId);

  if (drones.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <FormControl fullWidth variant="outlined" size="small">
        <InputLabel id="drone-selector-label">Select Drone</InputLabel>
        <Select
          labelId="drone-selector-label"
          id="drone-selector"
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
    </Box>
  );
}

export default DroneSelector;

