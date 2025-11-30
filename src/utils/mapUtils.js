// Google Maps utility functions
// Centralized location for map-related helpers

/**
 * Check if Google Maps API is loaded
 * @returns {boolean} True if Google Maps is available
 */
export function isGoogleMapsLoaded() {
  return typeof window !== "undefined" && window.google && window.google.maps;
}

/**
 * Create a sensor marker icon based on health status
 * @param {string} sensorHealth - Sensor health status ('Normal' or 'Abnormal')
 * @returns {Object|undefined} Google Maps icon object or undefined for default
 */
export function createSensorIcon(sensorHealth) {
  if (!isGoogleMapsLoaded()) {
    return undefined;
  }

  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 12,
    fillColor: sensorHealth === "Abnormal" ? "#f44336" : "#4caf50",
    fillOpacity: 0.8,
    strokeColor: sensorHealth === "Abnormal" ? "#d32f2f" : "#2e7d32",
    strokeWeight: 2,
  };
}

/**
 * Create a drone marker icon
 * @param {boolean} isSelected - Whether the drone is selected
 * @param {number} rotation - Rotation angle in degrees
 * @returns {Object|undefined} Google Maps icon object or undefined for default
 */
export function createDroneIcon(isSelected = false, rotation = 0) {
  if (!isGoogleMapsLoaded()) {
    return undefined;
  }

  return {
    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: isSelected ? 10 : 8,
    strokeColor: isSelected ? "#00FFFF" : "#FFFF00",
    fillColor: isSelected ? "#00FFFF" : "#FFFF00",
    fillOpacity: isSelected ? 1.0 : 0.8,
    strokeWeight: isSelected ? 3 : 2,
    rotation: rotation,
  };
}

/**
 * Calculate drone rotation based on movement direction
 * @param {Array} dronePath - Array of path points
 * @param {number} pathIndex - Current index in path
 * @returns {number} Rotation angle in degrees
 */
export function calculateDroneRotation(dronePath, pathIndex) {
  try {
    if (!dronePath || dronePath.length < 2) return 0;

    const current = dronePath[pathIndex];
    const nextIndex = (pathIndex + 1) % dronePath.length;
    const next = dronePath[nextIndex];

    if (!current || !next) return 0;

    const deltaLat = next.lat - current.lat;
    const deltaLng = next.lng - current.lng;

    const angle = (Math.atan2(deltaLng, deltaLat) * 180) / Math.PI;
    return isNaN(angle) ? 0 : angle;
  } catch (error) {
    console.error("Error calculating drone rotation:", error);
    return 0;
  }
}

