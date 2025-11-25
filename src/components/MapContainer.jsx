import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polygon,
} from "@react-google-maps/api";
import useAppStore from "../store/useAppStore";
import weatherService from "../services/weatherService.js";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Center will be calculated dynamically from first drone's zone center
const getDefaultCenter = (drones) => {
  if (drones && drones.length > 0 && drones[0].zone && drones[0].zone.center) {
    return drones[0].zone.center;
  }
  return { lat: 34.07, lng: -118.58 };
};

function MapContainer() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const {
    sensors,
    drones,
    selectedDroneId,
    setSelectedSensor,
    updateDronePosition,
    updateDronePathIndex,
    setWeatherData,
    getWeatherData,
    initializeZonesAndDrones,
    markerDisplayMode,
  } = useAppStore();
  
  const selectedDrone = drones.find((drone) => drone.id === selectedDroneId) || null;

  const [activeSensor, setActiveSensor] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mapCenter, setMapCenter] = useState(getDefaultCenter([]));
  const mapRef = useRef(null);
  const proximityCheckTimeoutRef = useRef(null);
  const animationIntervalsRef = useRef({});

  // Initialize zones and drones on component mount
  useEffect(() => {
    try {
      if (!isInitialized && sensors.length > 0) {
        console.log("Initializing zones and drones with", sensors.length, "sensors");
        initializeZonesAndDrones();
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error initializing zones and drones:", error);
      setIsInitialized(true); // Prevent infinite retry
    }
  }, [sensors, initializeZonesAndDrones, isInitialized]);

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
  }, [selectedDroneId]); // ONLY depend on selectedDroneId - not drones array!

  // Animate only the selected drone
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

    console.log(`Starting animation for selected drone: ${droneId}`);

    // Ensure drone position is synced with pathIndex when first selected
    const currentPathIndex = drone.pathIndex || 0;
    if (dronePath && dronePath.length > 0 && currentPathIndex < dronePath.length) {
      const currentPosition = dronePath[currentPathIndex];
      if (currentPosition && 
          typeof currentPosition.lat === "number" && 
          typeof currentPosition.lng === "number") {
        // Sync position to current pathIndex
        // Only update if position is different to avoid unnecessary updates
        const currentPos = drone.position;
        if (!currentPos || 
            Math.abs(currentPos.lat - currentPosition.lat) > 0.0001 ||
            Math.abs(currentPos.lng - currentPosition.lng) > 0.0001) {
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

        if (
          nextPosition &&
          typeof nextPosition.lat === "number" &&
          typeof nextPosition.lng === "number"
        ) {
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

  // Check for selected drone proximity to sensors with error handling and debouncing
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
          let nearestSensor = null;
          let nearestDistance = Infinity;

          zoneSensors.forEach((sensor) => {
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

          zoneSensors.forEach((sensor) => {
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
    selectedDroneId,
    drones,
    sensors,
    setSelectedSensor,
    getWeatherData,
    setWeatherData,
    activeSensor,
    selectedDrone,
  ]);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
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
            markerDisplayMode === "health" && window.google && window.google.maps
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

      {/* Render All Drone Markers */}
      {drones.map((drone) => {
        if (
          !drone.position ||
          typeof drone.position.lat !== "number" ||
          typeof drone.position.lng !== "number"
        ) {
          return null;
        }

        const isSelected = drone.id === selectedDroneId;
        const pathIndex = drone.pathIndex || 0;

        return (
          <Marker
            key={drone.id}
            position={drone.position}
            icon={
              window.google && window.google.maps
                ? {
                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: isSelected ? 10 : 8,
                    strokeColor: isSelected ? "#00FFFF" : "#FFFF00",
                    fillColor: isSelected ? "#00FFFF" : "#FFFF00",
                    fillOpacity: isSelected ? 1.0 : 0.8,
                    strokeWeight: isSelected ? 3 : 2,
                    rotation: calculateDroneRotation(drone.path, pathIndex),
                  }
                : undefined
            }
          />
        );
      })}

      {/* Render Fire Boundary Polygons for each drone */}
      {drones.map((drone) => {
        if (!drone.fireBoundary || drone.fireBoundary.length === 0) {
          return null;
        }

        const isSelected = drone.id === selectedDroneId;

        return (
          <Polygon
            key={`boundary-${drone.id}`}
            paths={drone.fireBoundary}
            options={{
              fillColor: isSelected ? "#FFBF00" : "#FF8800",
              fillOpacity: isSelected ? 0.3 : 0.2,
              strokeColor: isSelected ? "#FF0000" : "#FF6600",
              strokeOpacity: isSelected ? 0.8 : 0.6,
              strokeWeight: isSelected ? 3 : 2,
            }}
          />
        );
      })}
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
