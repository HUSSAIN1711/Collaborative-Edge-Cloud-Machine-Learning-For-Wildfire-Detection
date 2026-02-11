/**
 * Weather helper functions for fetching and managing weather data
 * Centralized location for weather-related helper functions
 */

import weatherService from "../services/weatherService";
import { predictWeatherRiskFromWeatherData } from "../services/wildfireInferenceService";

/**
 * Fetch weather data for a sensor and update the store
 * @param {Object} sensor - Sensor object with position and id
 * @param {Function} setWeatherData - Function to update weather data in store
 * @param {Function} [updateSensorFireProbability] - Optional function to update sensor fireProbability
 * @returns {Promise<Object>} Weather data object
 */
export async function fetchWeatherForSensor(
  sensor,
  setWeatherData,
  updateSensorFireProbability
) {
  if (!sensor || !sensor.position || !sensor.id) {
    throw new Error("Invalid sensor object");
  }

  try {
    const weatherData = await weatherService.fetchWeatherData(
      sensor.position.lat,
      sensor.position.lng
    );
    setWeatherData(sensor.id, weatherData);

    if (typeof updateSensorFireProbability === "function") {
      try {
        const weatherRisk = await predictWeatherRiskFromWeatherData(weatherData);
        if (
          weatherRisk &&
          typeof weatherRisk.fire_risk_percent === "number" &&
          !Number.isNaN(weatherRisk.fire_risk_percent)
        ) {
          updateSensorFireProbability(sensor.id, weatherRisk.fire_risk_percent);
        }
      } catch (riskError) {
        // Keep weather UI working even if weather-risk model call fails.
        console.error("Error predicting weather fire risk:", riskError);
      }
    }

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
