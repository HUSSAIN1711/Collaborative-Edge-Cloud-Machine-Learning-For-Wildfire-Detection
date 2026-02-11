import React, { useMemo } from "react";
import { Rectangle } from "@react-google-maps/api";
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

/**
 * Grid of rectangles showing fire probability across the selected zone
 * Uses Rectangle overlays instead of HeatmapLayer (no visualization library)
 * @param {Object} selectedDrone - Currently selected drone
 * @param {boolean} visible - Whether to show the overlays (avoids unmount cleanup issues)
 */
function FireProbabilityGrid({ selectedDrone, visible = true }) {
  const fireBoundaryOptions = useAppStore((s) => s.fireBoundaryOptions);
  const cells = useMemo(() => {
    const sensors = selectedDrone?.zone?.sensors ?? [];
    return fireBoundaryService.calculateProbabilityGrid(sensors, fireBoundaryOptions);
  }, [selectedDrone, fireBoundaryOptions]);

  if (!selectedDrone || cells.length === 0) return null;

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
            strokeColor: colorForProbability(cell.probability),
            strokeOpacity: 0.6,
            strokeWeight: 1,
            clickable: false,
            zIndex: 1,
          }}
        />
      ))}
    </>
  );
}

export default React.memo(FireProbabilityGrid);
