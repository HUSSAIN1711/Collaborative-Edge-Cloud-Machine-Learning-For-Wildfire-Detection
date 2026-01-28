/**
 * Weather helper functions for fetching and managing weather data
 * Centralized location for weather-related helper functions
 */

import weatherService from "../services/weatherService";

/**
 * Fetch weather data for a sensor and update the store
 * @param {Object} sensor - Sensor object with position and id
 * @param {Function} setWeatherData - Function to update weather data in store
 * @returns {Promise<Object>} Weather data object
 */
export async function fetchWeatherForSensor(sensor, setWeatherData) {
  if (!sensor || !sensor.position || !sensor.id) {
    throw new Error("Invalid sensor object");
  }

  try {
    const weatherData = await weatherService.fetchWeatherData(
      sensor.position.lat,
      sensor.position.lng
    );
    setWeatherData(sensor.id, weatherData);
    return weatherData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}

/**
 * Check if weather data exists for a sensor
 * @param {string} sensorId - Sensor ID
 * @param {Object} weatherData - Weather data object from store
 * @returns {boolean} True if weather data exists
 */
export function hasWeatherData(sensorId, weatherData) {
  return weatherData && weatherData[sensorId] !== undefined;
}

/**
 * Get weather data for a sensor
 * @param {string} sensorId - Sensor ID
 * @param {Object} weatherData - Weather data object from store
 * @returns {Object|null} Weather data object or null
 */
export function getWeatherForSensor(sensorId, weatherData) {
  return weatherData && weatherData[sensorId] ? weatherData[sensorId] : null;
}
