import React, { useState } from "react";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import useAppStore from "../store/useAppStore";
import DashboardPanel from "./DashboardPanel";
import PanelTitle from "./panel/PanelTitle";
import PanelLine from "./panel/PanelLine";
import TextBar from "./panel/TextBar";
import TextOption from "./panel/TextOption";
import { softColors } from "../theme/colors";

const AUTO_VALUE = "auto";

function sensorBarColor(value, type) {
  if (type === "fireRisk") {
    if (value >= 70) return softColors.red;
    if (value >= 40) return softColors.orange;
    return softColors.green;
  }
  if (type === "battery") {
    if (value < 25) return softColors.red;
    if (value < 50) return softColors.orange;
    return softColors.green;
  }
  return softColors.grey;
}

function SensorOverview() {
  const sensors = useAppStore((state) => state.sensors);
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const setSelectedSensor = useAppStore((state) => state.setSelectedSensor);
  const sensorAutoMode = useAppStore((state) => state.sensorAutoMode);
  const setSensorAutoMode = useAppStore((state) => state.setSensorAutoMode);
  const selectedDroneId = useAppStore((state) => state.selectedDroneId);
  const drones = useAppStore((state) => state.drones);
  const markerDisplayMode = useAppStore((state) => state.markerDisplayMode);
  const setMarkerDisplayMode = useAppStore(
    (state) => state.setMarkerDisplayMode,
  );

  const selectedDrone = drones.find((d) => d.id === selectedDroneId) || null;
  const sensorList = selectedDrone?.zone?.sensors ?? sensors;

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const displayLabel = sensorAutoMode
    ? "Auto (closest to drone)"
    : selectedSensor != null
      ? `Sensor ${selectedSensor.id}`
      : "Select sensor";

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (value) => {
    if (value === AUTO_VALUE) {
      setSensorAutoMode(true);
    } else {
      setSensorAutoMode(false);
      const sensor = sensorList.find((s) => String(s.id) === value);
      setSelectedSensor(sensor ?? null);
    }
    handleClose();
  };

  return (
    <DashboardPanel sx={{ mb: 1 }}>
      <PanelTitle title="Sensor Overview" />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
        <TextOption
          label="Health Mode"
          selected={markerDisplayMode === "health"}
          onClick={() => setMarkerDisplayMode("health")}
        />
        <TextOption
          label="Default Mode"
          selected={markerDisplayMode === "default"}
          onClick={() => setMarkerDisplayMode("default")}
        />
      </Box>
      <Box sx={{ mb: 1.5 }}>
        <Typography
          component="span"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            fontFamily: "Roboto Mono, monospace",
            fontSize: "12px",
            color: "#fff",
            cursor: "pointer",
            "&:hover": { color: "#ccc" },
          }}
        >
          [{displayLabel}]
        </Typography>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            bgcolor: "rgba(48, 48, 48, 0.2)",
              backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            mt: 0.5,
            minWidth: 200,
          },
        }}
      >
        <MenuItem
          onClick={() => handleSelect(AUTO_VALUE)}
          sx={{
            fontFamily: "Roboto Mono, monospace",
            fontSize: "12px",
            color: sensorAutoMode ? "#fff" : "#888",
          }}
        >
          [Auto (closest to drone)]
        </MenuItem>
        {sensorList.map((sensor) => (
          <MenuItem
            key={sensor.id}
            onClick={() => handleSelect(String(sensor.id))}
            sx={{
              fontFamily: "Roboto Mono, monospace",
              fontSize: "12px",
              color:
                !sensorAutoMode && selectedSensor?.id === sensor.id
                  ? "#fff"
                  : "#888",
            }}
          >
            [Sensor {sensor.id}]
          </MenuItem>
        ))}
      </Menu>
      {!selectedSensor ? (
        <Box
          sx={{ fontFamily: "Roboto Mono", fontSize: "12px", color: "#999" }}
        >
          Drone Approaching Sensor... Data Will Appear Automatically. Or Select
          A Sensor Above.
        </Box>
      ) : (
        <Box sx={{ "& > *": { marginBottom: 0.5 } }}>
          <PanelLine label="Sensor" info={`#${selectedSensor.id}`} />
          <PanelLine label="Status" info={selectedSensor.status} />
          <PanelLine
            label="Fire Risk"
            infoRight={
              <span>
                {selectedSensor.fireProbability} %{" "}
                <TextBar
                  value={selectedSensor.fireProbability}
                  color={sensorBarColor(
                    selectedSensor.fireProbability,
                    "fireRisk",
                  )}
                />
              </span>
            }
          />
          <PanelLine
            label="Battery"
            infoRight={
              <span>
                {selectedSensor.batteryStatus} %{" "}
                <TextBar
                  value={selectedSensor.batteryStatus}
                  color={sensorBarColor(
                    selectedSensor.batteryStatus,
                    "battery",
                  )}
                />
              </span>
            }
          />
          <PanelLine
            label="Sensor Health"
            info={
              <span
                style={{
                  color:
                    selectedSensor.sensorHealth === "Normal"
                      ? softColors.green
                      : softColors.red,
                }}
              >
                {selectedSensor.sensorHealth}
              </span>
            }
          />
          {selectedSensor.temperature !== undefined && (
            <PanelLine
              label="Temperature"
              info={`${selectedSensor.temperature} F`}
            />
          )}
          {selectedSensor.humidity !== undefined && (
            <PanelLine
              label="Humidity"
              info={`${selectedSensor.humidity} %`}
            />
          )}
          {selectedSensor.windSpeed !== undefined && (
            <PanelLine
              label="Wind"
              info={`${selectedSensor.windSpeed} mph ${selectedSensor.windDirection ?? ""}°`}
            />
          )}
          <PanelLine label="Last Ping" info={selectedSensor.lastPing} />
          <PanelLine
            label="Location"
            info={`${selectedSensor.position.lat.toFixed(4)}, ${selectedSensor.position.lng.toFixed(4)}`}
          />
        </Box>
      )}
    </DashboardPanel>
  );
}

export default SensorOverview;
