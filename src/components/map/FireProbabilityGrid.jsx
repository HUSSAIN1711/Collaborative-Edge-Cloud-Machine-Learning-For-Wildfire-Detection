import React, { useMemo, useState } from "react";
import { Rectangle, OverlayView } from "@react-google-maps/api";
import fireBoundaryService from "../../services/fireBoundaryService";
import useAppStore from "../../store/useAppStore";

/**
 * Map probability to fill color (green -> yellow -> orange -> red)
 */
function colorForProbability(p) {
  if (p >= 85) return "#CC0000";
  if (p >= 70) return "#FF4444";
  if (p >= 50) return "#FFA500";
  if (p >= 25) return "#FFD700";
  return "#90EE90";
}

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

/**
 * Grid of rectangles showing fire probability across the selected zone
 * Uses Rectangle overlays instead of HeatmapLayer (no visualization library)
 * @param {Object} selectedDrone - Currently selected drone
 * @param {boolean} visible - Whether to show the overlays (avoids unmount cleanup issues)
 */
function FireProbabilityGrid({ selectedDrone, visible = true }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const fireBoundaryOptions = useAppStore((s) => s.fireBoundaryOptions);
  const cells = useMemo(() => {
    const sensors = selectedDrone?.zone?.sensors ?? [];
    return fireBoundaryService.calculateProbabilityGrid(sensors, fireBoundaryOptions);
  }, [selectedDrone, fireBoundaryOptions]);

  if (!selectedDrone || cells.length === 0) return null;

  const handleMouseOver = (cell, e) => {
    const latLng = e.latLng;
    setHoveredCell({
      probability: cell.probability,
      position: { lat: latLng.lat(), lng: latLng.lng() },
    });
  };

  const handleMouseMove = (e) => {
    const latLng = e.latLng;
    setHoveredCell((prev) =>
      prev ? { ...prev, position: { lat: latLng.lat(), lng: latLng.lng() } } : null
    );
  };

  const handleMouseOut = () => setHoveredCell(null);

  return (
    <>
      {cells.map((cell, i) => (
        <Rectangle
          key={`prob-${i}`}
          bounds={cell.bounds}
          visible={visible}
          options={{
            fillColor: colorForProbability(cell.probability),
            fillOpacity: 0.45,
            strokeColor: "rgba(255, 255, 255, 0.5)",
            strokeOpacity: 0.25,
            strokeWeight: 1,
            clickable: true,
            zIndex: 1,
          }}
          onMouseOver={(e) => handleMouseOver(cell, e)}
          onMouseMove={handleMouseMove}
          onMouseOut={handleMouseOut}
        />
      ))}
      {visible && hoveredCell && (
        <OverlayView
          position={hoveredCell.position}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          getPixelOffset={() => ({ x: 0, y: 0 })}
        >
          <div style={tooltipStyle}>{Math.round(hoveredCell.probability)}% fire risk</div>
        </OverlayView>
      )}
    </>
  );
}

export default React.memo(FireProbabilityGrid);
