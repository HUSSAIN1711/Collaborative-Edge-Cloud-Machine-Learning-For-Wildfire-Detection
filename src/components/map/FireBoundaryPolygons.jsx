import React, { useState } from "react";
import { Polygon, Polyline, OverlayView } from "@react-google-maps/api";

/**
 * Component for rendering fire boundary polygons on the map
 * Shows percentage (≥85% high risk, ≥50% medium risk) on hover
 * @param {Array} drones - Array of drone objects with fireBoundary data
 * @param {string} selectedDroneId - ID of the currently selected drone
 * @param {boolean} visible - Whether to show the overlays (avoids unmount cleanup issues)
 */
function FireBoundaryPolygons({ drones, selectedDroneId, visible = true }) {
  const [hoveredBoundary, setHoveredBoundary] = useState(null);

  const tooltipStyle = {
    background: "rgba(0, 0, 0, 0.85)",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    pointerEvents: "none",
    position: "absolute",
    transform: "translate(-50%, -100%)",
    marginBottom: "8px",
    zIndex: 100,
  };

  const handleMouseOver = (percentage, e) => {
    const latLng = e.latLng;
    setHoveredBoundary({
      percentage,
      position: { lat: latLng.lat(), lng: latLng.lng() },
    });
  };

  const handleMouseMove = (e) => {
    const latLng = e.latLng;
    setHoveredBoundary((prev) =>
      prev ? { ...prev, position: { lat: latLng.lat(), lng: latLng.lng() } } : null
    );
  };

  const handleMouseOut = () => {
    setHoveredBoundary(null);
  };

  return (
    <>
      {drones.map((drone) => {
        if (!drone.fireBoundary) {
          return null;
        }

        const isSelected = drone.id === selectedDroneId;
        const { highRiskBoundary = [], mediumRiskBoundary = [] } =
          drone.fireBoundary;

        return (
          <React.Fragment key={`boundary-${drone.id}`}>
            {/* Medium Risk Boundary (Yellow) - ≥50% */}
            {mediumRiskBoundary.length > 0 && (
              <>
                <Polygon
                  paths={mediumRiskBoundary}
                  options={{
                    fillColor: "#FFD700",
                    fillOpacity: isSelected ? 0.25 : 0.15,
                    strokeColor: "#FFA500",
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    visible,
                  }}
                />
                <Polyline
                  path={[...mediumRiskBoundary, mediumRiskBoundary[0]]}
                  options={{
                    strokeColor: "#FFA500",
                    strokeOpacity: isSelected ? 0.7 : 0.5,
                    strokeWeight: isSelected ? 2.5 : 2,
                    visible,
                  }}
                  onMouseOver={(e) => handleMouseOver("≥50%", e)}
                  onMouseMove={handleMouseMove}
                  onMouseOut={handleMouseOut}
                />
              </>
            )}
            {/* High Risk Boundary (Red) - ≥85% */}
            {highRiskBoundary.length > 0 && (
              <>
                <Polygon
                  paths={highRiskBoundary}
                  options={{
                    fillColor: "#FF5555",
                    fillOpacity: isSelected ? 0.2 : 0.15,
                    strokeColor: "#FF2222",
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    zIndex: 2,
                    visible,
                  }}
                />
                <Polyline
                  path={[...highRiskBoundary, highRiskBoundary[0]]}
                  options={{
                    strokeColor: "#FF2222",
                    strokeOpacity: isSelected ? 0.7 : 0.55,
                    strokeWeight: isSelected ? 2.5 : 2,
                    visible,
                  }}
                  onMouseOver={(e) => handleMouseOver("≥85%", e)}
                  onMouseMove={handleMouseMove}
                  onMouseOut={handleMouseOut}
                />
              </>
            )}
          </React.Fragment>
        );
      })}

      {/* Hover tooltip */}
      {visible && hoveredBoundary && (
        <OverlayView
          position={hoveredBoundary.position}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          getPixelOffset={() => ({ x: 0, y: 0 })}
        >
          <div style={tooltipStyle}>{hoveredBoundary.percentage} fire risk</div>
        </OverlayView>
      )}
    </>
  );
}

export default FireBoundaryPolygons;
