// Zone utility functions
// Centralized location for zone-related calculations

import { calculateCenter, calculateBounds } from "./geoUtils";

/**
 * Calculate zone center from sensors
 * @param {Array} sensors - Array of sensor objects with position
 * @returns {Object} Center point {lat, lng}
 */
export function calculateZoneCenter(sensors) {
  if (!sensors || sensors.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const positions = sensors.map((s) => s.position).filter(Boolean);
  return calculateCenter(positions);
}

/**
 * Calculate zone bounds from sensors
 * @param {Array} sensors - Array of sensor objects with position
 * @returns {Object} Bounds object {north, south, east, west}
 */
export function calculateZoneBounds(sensors) {
  if (!sensors || sensors.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  const positions = sensors.map((s) => s.position).filter(Boolean);
  return calculateBounds(positions);
}

