import React from "react";
import { Marker } from "@react-google-maps/api";
import { isValidPosition } from "../../utils/geoUtils";
import { createDroneIcon, calculateDroneRotation } from "../../utils/mapUtils";

/**
 * Component for rendering drone markers on the map
 * @param {Array} drones - Array of drone objects to render
 * @param {string} selectedDroneId - ID of the currently selected drone
 * @param {Function} [onDroneClick] - Callback when a drone marker is clicked
 */
function DroneMarkers({ drones, selectedDroneId, onDroneClick }) {
  return (
    <>
      {drones.map((drone) => {
        if (!isValidPosition(drone.position)) {
          return null;
        }

        const isSelected = drone.id === selectedDroneId;
        const pathIndex = drone.pathIndex || 0;
        const rotation = calculateDroneRotation(drone.path, pathIndex);

        return (
          <Marker
            key={drone.id}
            position={drone.position}
            icon={createDroneIcon(isSelected, rotation)}
            onClick={() => onDroneClick?.(drone)}
            cursor={onDroneClick ? "pointer" : undefined}
          />
        );
      })}
    </>
  );
}

export default DroneMarkers;
