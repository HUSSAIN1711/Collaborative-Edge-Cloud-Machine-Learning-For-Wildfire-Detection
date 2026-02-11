import { useEffect, useRef } from "react";
import useAppStore from "../store/useAppStore";
import { isValidPosition } from "../utils/geoUtils";

/**
 * Custom hook to handle drone animation logic
 * Manages the animation interval for the selected drone's path
 * @param {string} selectedDroneId - ID of the currently selected drone
 * @param {Object} selectedDrone - Selected drone object
 */
export function useDroneAnimation(selectedDroneId, selectedDrone) {
  const { updateDronePosition, updateDronePathIndex } = useAppStore();
  const animationIntervalsRef = useRef({});

  useEffect(() => {
    // Clear all existing intervals
    Object.values(animationIntervalsRef.current).forEach((interval) => {
      clearInterval(interval);
    });
    animationIntervalsRef.current = {};

    // Only animate if we have a selected drone
    if (!selectedDroneId || !selectedDrone) {
      return;
    }

    const drone = selectedDrone;

    if (!drone.path || drone.path.length === 0) {
      console.warn(`No path available for ${drone.id}`);
      return;
    }

    const droneId = drone.id;
    const dronePath = drone.path; // Capture path reference

    // Ensure drone position is synced with pathIndex when first selected
    const currentPathIndex = drone.pathIndex || 0;
    if (dronePath && dronePath.length > 0 && currentPathIndex < dronePath.length) {
      const currentPosition = dronePath[currentPathIndex];
      if (isValidPosition(currentPosition)) {
        // Sync position to current pathIndex
        // Only update if position is different to avoid unnecessary updates
        const currentPos = drone.position;
        if (
          !currentPos ||
          Math.abs(currentPos.lat - currentPosition.lat) > 0.0001 ||
          Math.abs(currentPos.lng - currentPosition.lng) > 0.0001
        ) {
          updateDronePosition(droneId, currentPosition);
        }
      }
    }

    // Start animation interval for the selected drone
    const interval = setInterval(() => {
      try {
        // Get current state inside the interval to get the latest pathIndex
        const currentDrones = useAppStore.getState().drones;
        const currentDrone = currentDrones.find((d) => d.id === droneId);

        if (!currentDrone) {
          console.warn(`Drone ${droneId} not found in state`);
          return;
        }

        // Check if this drone is still selected
        const currentSelectedDroneId = useAppStore.getState().selectedDroneId;
        if (currentSelectedDroneId !== droneId) {
          // Drone was deselected, stop animation
          clearInterval(interval);
          delete animationIntervalsRef.current[droneId];
          return;
        }

        const currentPathIndex = currentDrone.pathIndex || 0;
        const nextIndex = (currentPathIndex + 1) % dronePath.length;
        const nextPosition = dronePath[nextIndex];

        if (isValidPosition(nextPosition)) {
          updateDronePosition(droneId, nextPosition);
          updateDronePathIndex(droneId, nextIndex);
        } else {
          console.warn(`Invalid position for ${droneId}:`, nextPosition);
        }
      } catch (error) {
        console.error(`Error animating ${droneId}:`, error);
      }
    }, 2000);

    animationIntervalsRef.current[droneId] = interval;

    // Cleanup on unmount or when selected drone changes
    return () => {
      if (animationIntervalsRef.current[droneId]) {
        clearInterval(animationIntervalsRef.current[droneId]);
        delete animationIntervalsRef.current[droneId];
      }
    };
  }, [selectedDroneId, selectedDrone, updateDronePosition, updateDronePathIndex]);
}
