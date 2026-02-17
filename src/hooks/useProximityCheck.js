import { useEffect, useRef, useState } from "react";
import useAppStore from "../store/useAppStore";
import weatherService from "../services/weatherService";
import { isValidPosition, isDroneNearSensor } from "../utils/geoUtils";

/**
 * Custom hook to handle proximity checking between drone and sensors
 * Manages debounced proximity checks and weather data fetching
 * @param {Object} selectedDrone - Selected drone object
 * @param {Array} sensors - Array of sensor objects
 */
export function useProximityCheck(selectedDrone, sensors) {
  const { setSelectedSensor, getWeatherData, setWeatherData, sensorAutoMode } =
    useAppStore();
  const [activeSensor, setActiveSensor] = useState(null);
  const proximityCheckTimeoutRef = useRef(null);

  useEffect(() => {
    if (!selectedDrone) return;

    // Clear any existing timeout
    if (proximityCheckTimeoutRef.current) {
      clearTimeout(proximityCheckTimeoutRef.current);
    }

    // Debounce proximity checks to avoid excessive API calls
    proximityCheckTimeoutRef.current = setTimeout(() => {
      const checkProximity = () => {
        try {
          const dronePosition = selectedDrone.position;
          if (!dronePosition || !sensors || sensors.length === 0) {
            return;
          }

          // Get sensors in the selected drone's zone
          const zoneSensors = selectedDrone.zone?.sensors || sensors;

          // First, do a quick distance check to see if drone is anywhere near any sensor
          let isNearAnySensor = false;

          zoneSensors.forEach((sensor) => {
            try {
              if (!isValidPosition(sensor.position)) {
                console.warn("Invalid sensor position:", sensor);
                return;
              }

              const distance = weatherService.calculateDistance(
                dronePosition.lat,
                dronePosition.lng,
                sensor.position.lat,
                sensor.position.lng,
              );

              // Check if drone is within proximity threshold (0.5 miles)
              if (distance <= 0.5) {
                isNearAnySensor = true;
              }
            } catch (sensorError) {
              console.error(
                `Error processing sensor ${sensor.id}:`,
                sensorError,
              );
            }
          });

          // Only proceed with detailed proximity check if drone is reasonably close to any sensor
          if (!isNearAnySensor) {
            if (activeSensor) setActiveSensor(null);
            // In auto mode, keep last sensor visible until a new one is near (don't clear to "waiting")
            return;
          }

          let nearSensor = null;

          zoneSensors.forEach((sensor) => {
            try {
              if (!isValidPosition(sensor.position)) {
                return;
              }

              if (isDroneNearSensor(dronePosition, sensor.position, 0.5)) {
                nearSensor = sensor;
                setActiveSensor(sensor);
                if (sensorAutoMode) setSelectedSensor(sensor);
              }
            } catch (sensorError) {
              console.error(
                `Error processing sensor ${sensor.id}:`,
                sensorError,
              );
            }
          });

          // Only fetch weather data if drone is near a sensor
          if (nearSensor) {
            // Check if we already have cached weather data for this sensor
            const cachedWeather = getWeatherData(nearSensor.id);

            if (!cachedWeather) {
              weatherService
                .fetchWeatherData(
                  nearSensor.position.lat,
                  nearSensor.position.lng,
                )
                .then((weatherData) => {
                  setWeatherData(nearSensor.id, weatherData);
                })
                .catch((error) => {
                  console.error("Error fetching weather data:", error);
                });
            }
          }
        } catch (error) {
          console.error("Error in proximity check:", error);
        }
      };

      checkProximity();
    }, 1000); // Debounce for 1 second

    // Cleanup timeout on unmount
    return () => {
      if (proximityCheckTimeoutRef.current) {
        clearTimeout(proximityCheckTimeoutRef.current);
      }
    };
  }, [
    selectedDrone,
    sensors,
    sensorAutoMode,
    setSelectedSensor,
    getWeatherData,
    setWeatherData,
    activeSensor,
  ]);

  return activeSensor;
}
