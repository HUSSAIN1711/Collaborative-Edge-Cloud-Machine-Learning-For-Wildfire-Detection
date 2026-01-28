/**
 * Color utility functions for consistent color calculations across components
 * Centralized location for all color-related helper functions
 */

/**
 * Get color based on fire risk probability
 * @param {number} probability - Fire probability percentage (0-100)
 * @returns {string} Hex color code
 */
export function getFireRiskColor(probability) {
  if (probability === 100) return "#f44336"; // Red
  if (probability >= 70) return "#ff9800"; // Orange
  if (probability >= 40) return "#ffeb3b"; // Yellow
  return "#4caf50"; // Green
}

/**
 * Get label for fire risk level
 * @param {number} probability - Fire probability percentage (0-100)
 * @returns {string} Risk level label
 */
export function getFireRiskLabel(probability) {
  if (probability === 100) return "CRITICAL";
  if (probability >= 70) return "HIGH";
  if (probability >= 40) return "MODERATE";
  return "LOW";
}

/**
 * Get color based on battery level
 * @param {number} batteryLevel - Battery percentage (0-100)
 * @returns {string} Hex color code
 */
export function getBatteryColor(batteryLevel) {
  if (batteryLevel < 10) return "#f44336"; // Red
  if (batteryLevel < 25) return "#ff9800"; // Orange
  if (batteryLevel < 50) return "#ffeb3b"; // Yellow
  return "#4caf50"; // Green
}

/**
 * Get color based on sensor health status
 * @param {string} health - Health status ('Normal' or 'Abnormal')
 * @returns {string} Hex color code
 */
export function getHealthColor(health) {
  return health === "Abnormal" ? "#f44336" : "#4caf50";
}

/**
 * Get color based on temperature
 * @param {number} temp - Temperature in Fahrenheit
 * @returns {string} Hex color code
 */
export function getTemperatureColor(temp) {
  if (temp >= 90) return "#f44336";
  if (temp >= 75) return "#ff9800";
  if (temp >= 60) return "#ffeb3b";
  return "#4fc3f7";
}

/**
 * Get color based on humidity level
 * @param {number} humidity - Humidity percentage (0-100)
 * @returns {string} Hex color code
 */
export function getHumidityColor(humidity) {
  if (humidity < 30) return "#f44336";
  if (humidity < 50) return "#ff9800";
  return "#4caf50";
}

/**
 * Get color for fire probability bubble overlay
 * @param {number} probability - Fire probability percentage (0-100)
 * @returns {Object} Object with bubbleColor and textColor
 */
export function getFireProbabilityBubbleColors(probability) {
  let bubbleColor;
  const textColor = "#ffffff"; // White text for all

  if (probability > 90) {
    bubbleColor = "#f44336"; // Red
  } else if (probability > 75) {
    bubbleColor = "#ff9800"; // Orange
  } else {
    bubbleColor = "#4caf50"; // Green
  }

  return { bubbleColor, textColor };
}
