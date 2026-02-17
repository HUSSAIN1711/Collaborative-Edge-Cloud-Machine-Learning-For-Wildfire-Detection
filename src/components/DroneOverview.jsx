import React from "react";
import { Box } from "@mui/material";
import useAppStore from "../store/useAppStore";
import DashboardPanel from "./DashboardPanel";
import PanelTitle from "./panel/PanelTitle";
import TextOption from "./panel/TextOption";
import DroneFeedCard from "./DroneFeedCard";

/**
 * Drone panel: title, text-form selector [Drone 1] [Drone 2], [Boundary] [Heatmap], then mission feed.
 */
function DroneOverview() {
  const drones = useAppStore((state) => state.drones);
  const selectedDroneId = useAppStore((state) => state.selectedDroneId);
  const setSelectedDroneId = useAppStore((state) => state.setSelectedDroneId);
  const fireDisplayMode = useAppStore((state) => state.fireDisplayMode);
  const setFireDisplayMode = useAppStore((state) => state.setFireDisplayMode);

  return (
    <DashboardPanel sx={{ mb: 1 }}>
      <PanelTitle title="Drone" />
      {drones.length === 0 ? (
        <Box sx={{ fontFamily: "Roboto Mono", fontSize: "12px", color: "#999" }}>
          No Drones Available
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
            {drones.map((drone) => (
              <TextOption
                key={drone.id}
                label={drone.name}
                selected={drone.id === selectedDroneId}
                onClick={() => setSelectedDroneId(drone.id)}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
            <TextOption
              label="Boundary"
              selected={fireDisplayMode === "boundary"}
              onClick={() => setFireDisplayMode("boundary")}
            />
            <TextOption
              label="Heatmap"
              selected={fireDisplayMode === "heatmap"}
              onClick={() => setFireDisplayMode("heatmap")}
            />
          </Box>
          <DroneFeedCard embedInPanel />
        </>
      )}
    </DashboardPanel>
  );
}

export default DroneOverview;
