import { useEffect, useState } from "react";
import useAppStore from "../store/useAppStore";

/**
 * Get default center point for the map
 * @param {Array} drones - Array of drone objects
 * @returns {Object} Default center coordinates {lat, lng}
 */
const getDefaultCenter = (drones) => {
  if (drones && drones.length > 0 && drones[0].zone && drones[0].zone.center) {
    return drones[0].zone.center;
  }
  return { lat: 34.07, lng: -118.58 };
};

/**
 * Custom hook to manage map center based on selected drone
 * @param {string} selectedDroneId - ID of the currently selected drone
 * @param {Object} mapRef - Reference to the Google Maps instance
 * @returns {Object} Map center coordinates {lat, lng}
 */
export function useMapCenter(selectedDroneId, mapRef) {
  const [mapCenter, setMapCenter] = useState(() => {
    const drones = useAppStore.getState().drones;
    return getDefaultCenter(drones);
  });

  // Update map center only when selected drone changes (not on position updates)
  useEffect(() => {
    // Only recenter when selectedDroneId actually changes, not when drones array updates
    if (!selectedDroneId || !mapRef.current) {
      return;
    }

    // Get current drones from store to find the selected one
    const currentDrones = useAppStore.getState().drones;
    if (currentDrones.length === 0) {
      return;
    }

    // Find the selected drone from current drones array
    const currentSelectedDrone = currentDrones.find((d) => d.id === selectedDroneId);

    // Center on zone center, not drone position
    if (currentSelectedDrone && currentSelectedDrone.zone && currentSelectedDrone.zone.center) {
      const zoneCenter = currentSelectedDrone.zone.center;
      setMapCenter(zoneCenter);
      mapRef.current.setCenter(zoneCenter);
    } else if (currentDrones[0] && currentDrones[0].zone && currentDrones[0].zone.center) {
      // Fallback to first drone's zone center
      const zoneCenter = currentDrones[0].zone.center;
      setMapCenter(zoneCenter);
      mapRef.current.setCenter(zoneCenter);
    }
  }, [selectedDroneId, mapRef]);

  return mapCenter;
}
