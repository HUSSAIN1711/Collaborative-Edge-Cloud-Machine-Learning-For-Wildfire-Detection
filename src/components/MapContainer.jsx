import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polygon } from '@react-google-maps/api';
import useAppStore from '../store/useAppStore';
import fireBoundaryData from '../data/fireBoundary.json';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 34.07,
  lng: -118.58,
};

function MapContainer() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // IMPORTANT: Use environment variable
  });

  const { sensors, dronePath, dronePosition, setSelectedSensor, setDronePosition } = useAppStore();
  const [pathIndex, setPathIndex] = useState(0);

  // Drone animation logic
  useEffect(() => {
    const interval = setInterval(() => {
      setPathIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % dronePath.length;
        setDronePosition(dronePath[nextIndex]);
        return nextIndex;
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [dronePath, setDronePosition]);
  

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={{ mapTypeId: 'satellite' }}
    >
      {/* Render Sensor Markers */}
      {sensors.map((sensor) => (
        <Marker
          key={sensor.id}
          position={sensor.position}
          onClick={() => setSelectedSensor(sensor)}
        />
      ))}

      {/* Render Drone Marker */}
      <Marker
        position={dronePosition}
        icon={{
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, // Simple arrow for PoC
          scale: 6,
          strokeColor: '#FFFF00', // Yellow
          rotation: 120 // Example rotation
        }}
      />

      {/* Render Fire Boundary Polygon */}
      <Polygon
        paths={fireBoundaryData}
        options={{
          fillColor: '#FFBF00',
          fillOpacity: 0.35,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
        }}
      />
    </GoogleMap>
  ) : <></>;
}

export default React.memo(MapContainer);
