/**
 * Position utility functions for formatting and displaying geographic positions
 * Centralized location for position-related helper functions
 */

/**
 * Format position coordinates for display
 * @param {Object} position - Position object with lat and lng properties
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted position string "lat, lng"
 */
export function formatPosition(position, decimals = 4) {
  if (!position || typeof position.lat !== "number" || typeof position.lng !== "number") {
    return "0.0000, 0.0000";
  }
  return `${position.lat.toFixed(decimals)}, ${position.lng.toFixed(decimals)}`;
}

/**
 * Format latitude for display
 * @param {number} lat - Latitude value
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted latitude string
 */
export function formatLatitude(lat, decimals = 4) {
  if (typeof lat !== "number" || isNaN(lat)) {
    return "0.0000";
  }
  return lat.toFixed(decimals);
}

/**
 * Format longitude for display
 * @param {number} lng - Longitude value
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted longitude string
 */
export function formatLongitude(lng, decimals = 4) {
  if (typeof lng !== "number" || isNaN(lng)) {
    return "0.0000";
  }
  return lng.toFixed(decimals);
}
