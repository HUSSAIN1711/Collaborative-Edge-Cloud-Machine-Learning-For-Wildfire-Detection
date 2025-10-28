import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polygon,
} from "@react-google-maps/api";
import useAppStore from "../store/useAppStore";
import fireBoundaryData from "../data/fireBoundary.json";
import weatherService from "../services/weatherService.js";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 34.07,
  lng: -118.58,
};

function MapContainer() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const {
    sensors,
    dronePath,
    dronePosition,
    setSelectedSensor,
    setDronePosition,
    setWeatherData,
    getWeatherData,
    initializeDronePath,
    getPathStatistics,
    markerDisplayMode,
  } = useAppStore();

  const [pathIndex, setPathIndex] = useState(0);
  const [activeSensor, setActiveSensor] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const mapRef = useRef(null);
  const proximityCheckTimeoutRef = useRef(null);

  // Initialize drone path on component mount
  useEffect(() => {
    try {
      if (!isInitialized && sensors.length > 0) {
        console.log("Initializing drone path with", sensors.length, "sensors");
        initializeDronePath();
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error initializing drone path:", error);
      setIsInitialized(true); // Prevent infinite retry
    }
  }, [sensors, initializeDronePath, isInitialized]);

  // Drone animation logic with error handling
  useEffect(() => {
    if (!dronePath || dronePath.length === 0) {
      console.warn("No drone path available for animation");
      return;
    }

    const interval = setInterval(() => {
      try {
        setPathIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % dronePath.length;
          const nextPosition = dronePath[nextIndex];

          if (
            nextPosition &&
            typeof nextPosition.lat === "number" &&
            typeof nextPosition.lng === "number"
          ) {
            setDronePosition(nextPosition);
            return nextIndex;
          } else {
            console.warn("Invalid drone position:", nextPosition);
            return prevIndex;
          }
        });
      } catch (error) {
        console.error("Error in drone animation:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [dronePath, setDronePosition]);

  // Check for drone proximity to sensors with error handling and debouncing
  useEffect(() => {
    // Clear any existing timeout
    if (proximityCheckTimeoutRef.current) {
      clearTimeout(proximityCheckTimeoutRef.current);
    }

    // Debounce proximity checks to avoid excessive API calls
    proximityCheckTimeoutRef.current = setTimeout(() => {
      const checkProximity = () => {
        try {
          if (!dronePosition || !sensors || sensors.length === 0) {
            return;
          }

          // First, do a quick distance check to see if drone is anywhere near any sensor
          let isNearAnySensor = false;
          let nearestSensor = null;
          let nearestDistance = Infinity;

          sensors.forEach((sensor) => {
            try {
              if (
                !sensor.position ||
                typeof sensor.position.lat !== "number" ||
                typeof sensor.position.lng !== "number"
              ) {
                console.warn("Invalid sensor position:", sensor);
                return;
              }

              const distance = weatherService.calculateDistance(
                dronePosition.lat,
                dronePosition.lng,
                sensor.position.lat,
                sensor.position.lng
              );

              // Track the nearest sensor for potential future use
              if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestSensor = sensor;
              }

              // Check if drone is within proximity threshold (0.5 miles)
              if (distance <= 0.5) {
                isNearAnySensor = true;
              }
            } catch (sensorError) {
              console.error(
                `Error processing sensor ${sensor.id}:`,
                sensorError
              );
            }
          });

          // Only proceed with detailed proximity check if drone is reasonably close to any sensor
          if (!isNearAnySensor) {
            // Drone is far from all sensors, clear active sensor if needed
            if (activeSensor) {
              console.log(
                "Drone moved away from all sensors, clearing active sensor"
              );
              setActiveSensor(null);
            }
            return; // Exit early to avoid unnecessary processing
          }

          console.log("Drone is near sensors, checking detailed proximity...");
          let nearSensor = null;

          sensors.forEach((sensor) => {
            try {
              if (
                !sensor.position ||
                typeof sensor.position.lat !== "number" ||
                typeof sensor.position.lng !== "number"
              ) {
                return;
              }

              if (
                weatherService.isDroneNearSensor(
                  dronePosition,
                  sensor.position,
                  0.5
                )
              ) {
                console.log(`Drone is near sensor ${sensor.id}`);
                nearSensor = sensor;
                setActiveSensor(sensor);
                setSelectedSensor(sensor);
              }
            } catch (sensorError) {
              console.error(
                `Error processing sensor ${sensor.id}:`,
                sensorError
              );
            }
          });

          // Only fetch weather data if drone is near a sensor
          if (nearSensor) {
            console.log(
              `Drone is near sensor ${nearSensor.id}, checking weather data...`
            );

            // Check if we already have cached weather data for this sensor
            const cachedWeather = getWeatherData(nearSensor.id);
            console.log(
              "Cached weather for sensor",
              nearSensor.id,
              ":",
              cachedWeather
            );

            if (!cachedWeather) {
              console.log("Fetching weather data for sensor", nearSensor.id);
              weatherService
                .fetchWeatherData(
                  nearSensor.position.lat,
                  nearSensor.position.lng
                )
                .then((weatherData) => {
                  console.log("Weather data received:", weatherData);
                  setWeatherData(nearSensor.id, weatherData);
                })
                .catch((error) => {
                  console.error("Error fetching weather data:", error);
                });
            } else {
              console.log(
                "Using cached weather data for sensor",
                nearSensor.id
              );
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
    dronePosition,
    sensors,
    setSelectedSensor,
    getWeatherData,
    setWeatherData,
    activeSensor,
  ]);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={{ mapTypeId: "satellite" }}
      onLoad={(map) => {
        mapRef.current = map;
      }}
    >
      {/* Render Sensor Markers */}
      {sensors.map((sensor) => (
        <Marker
          key={sensor.id}
          position={sensor.position}
          onClick={() => setSelectedSensor(sensor)}
          icon={
            markerDisplayMode === "health"
              ? {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor:
                    sensor.sensorHealth === "Abnormal" ? "#f44336" : "#4caf50",
                  fillOpacity: 0.8,
                  strokeColor:
                    sensor.sensorHealth === "Abnormal" ? "#d32f2f" : "#2e7d32",
                  strokeWeight: 2,
                }
              : undefined // Use default marker
          }
        />
      ))}

      {/* Render Drone Marker with error handling */}
      {dronePosition &&
        typeof dronePosition.lat === "number" &&
        typeof dronePosition.lng === "number" && (
          <Marker
            position={dronePosition}
            icon={{
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 8,
              strokeColor: "#FFFF00",
              fillColor: "#FFFF00",
              fillOpacity: 0.8,
              strokeWeight: 2,
              rotation: calculateDroneRotation(dronePath, pathIndex),
            }}
          />
        )}

      {/* Render Fire Boundary Polygon */}
      <Polygon
        paths={fireBoundaryData}
        options={{
          fillColor: "#FFBF00",
          fillOpacity: 0.2, // More subtle
          strokeColor: "#FF0000",
          strokeOpacity: 0.6,
          strokeWeight: 2,
        }}
      />
    </GoogleMap>
  ) : (
    <></>
  );
}

// Helper function to calculate drone rotation based on movement direction
function calculateDroneRotation(dronePath, pathIndex) {
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

export default React.memo(MapContainer);
