import React from "react";
import { Polygon } from "@react-google-maps/api";

/**
 * Component for rendering fire boundary polygons on the map
 * @param {Array} drones - Array of drone objects with fireBoundary data
 * @param {string} selectedDroneId - ID of the currently selected drone
 */
function FireBoundaryPolygons({ drones, selectedDroneId }) {
  return (
    <>
      {drones.map((drone) => {
        if (!drone.fireBoundary) {
          return null;
        }

        const isSelected = drone.id === selectedDroneId;
        const { highRiskBoundary = [], mediumRiskBoundary = [] } = drone.fireBoundary;

        return (
          <React.Fragment key={`boundary-${drone.id}`}>
            {/* Medium Risk Boundary (Yellow) - rendered first so high risk appears on top */}
            {mediumRiskBoundary.length > 0 && (
              <Polygon
                paths={mediumRiskBoundary}
                options={{
                  fillColor: "#FFD700", // Yellow/Gold
                  fillOpacity: isSelected ? 0.25 : 0.15,
                  strokeColor: "#FFA500", // Orange
                  strokeOpacity: isSelected ? 0.7 : 0.5,
                  strokeWeight: isSelected ? 2.5 : 2,
                }}
              />
            )}
            {/* High Risk Boundary (Red) - rendered on top */}
            {highRiskBoundary.length > 0 && (
              <Polygon
                paths={highRiskBoundary}
                options={{
                  fillColor: "#FF5555", // Softer, warmer red
                  fillOpacity: isSelected ? 0.2 : 0.15,
                  strokeColor: "#FF2222", // Softer red stroke
                  strokeOpacity: isSelected ? 0.7 : 0.55,
                  strokeWeight: isSelected ? 2.5 : 2,
                  zIndex: 2, // Ensure it's on top
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default FireBoundaryPolygons;
