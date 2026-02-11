import React, { useEffect, useState, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import useAppStore from "../store/useAppStore";
import { useDroneAnimation } from "../hooks/useDroneAnimation";
import { useProximityCheck } from "../hooks/useProximityCheck";
import { useMapCenter } from "../hooks/useMapCenter";
import SensorMarkers from "./map/SensorMarkers";
import DroneMarkers from "./map/DroneMarkers";
import FireBoundaryPolygons from "./map/FireBoundaryPolygons";
import FireProbabilityGrid from "./map/FireProbabilityGrid";

const containerStyle = {
  width: "100%",
  height: "100%",
};

/**
 * Main map container component that displays sensors, drones, and fire boundaries
 * Manages map initialization, drone animation, and proximity checking
 */
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
    initializeZonesAndDrones,
    markerDisplayMode,
    fireDisplayMode,
  } = useAppStore();

  const selectedDrone = drones.find((drone) => drone.id === selectedDroneId) || null;
  const [isInitialized, setIsInitialized] = useState(false);
  const mapRef = useRef(null);

  // Initialize zones and drones on component mount
  useEffect(() => {
    try {
      if (!isInitialized && sensors.length > 0) {
        initializeZonesAndDrones();
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error initializing zones and drones:", error);
      setIsInitialized(true); // Prevent infinite retry
    }
  }, [sensors, initializeZonesAndDrones, isInitialized]);

  // Use custom hooks for complex logic
  const mapCenter = useMapCenter(selectedDroneId, mapRef);
  useDroneAnimation(selectedDroneId, selectedDrone);
  useProximityCheck(selectedDrone, sensors);

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
      <SensorMarkers
        sensors={sensors}
        markerDisplayMode={markerDisplayMode}
        onSensorClick={setSelectedSensor}
      />
      <DroneMarkers drones={drones} selectedDroneId={selectedDroneId} />
      <FireBoundaryPolygons
        drones={drones}
        selectedDroneId={selectedDroneId}
        visible={fireDisplayMode === "boundary"}
      />
      <FireProbabilityGrid selectedDrone={selectedDrone} visible={fireDisplayMode === "heatmap"} />
    </GoogleMap>
  ) : null;
}

export default React.memo(MapContainer);