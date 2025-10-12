import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polygon } from '@react-google-maps/api';
import useAppStore from '../store/useAppStore';
import fireBoundaryData from '../data/fireBoundary.json';
import weatherService from '../services/weatherService';

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
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const { 
    sensors, 
    dronePath, 
    dronePosition, 
    setSelectedSensor, 
    setDronePosition,
    setWeatherData,
    getWeatherData
  } = useAppStore();
  
  const [pathIndex, setPathIndex] = useState(0);
  const [activeSensor, setActiveSensor] = useState(null);
  const mapRef = useRef(null);

  // Drone animation logic
  useEffect(() => {
    const interval = setInterval(() => {
      setPathIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % dronePath.length;
        setDronePosition(dronePath[nextIndex]);
        return nextIndex;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [dronePath, setDronePosition]);

  // Check for drone proximity to sensors
  useEffect(() => {
    const checkProximity = () => {
      console.log('Checking proximity for drone at:', dronePosition);
      sensors.forEach(sensor => {
        const distance = weatherService.calculateDistance(
          dronePosition.lat, dronePosition.lng,
          sensor.position.lat, sensor.position.lng
        );
        console.log(`Distance to sensor ${sensor.id}:`, distance);
        
        if (weatherService.isDroneNearSensor(dronePosition, sensor.position, 0.5)) {
          console.log(`Drone is near sensor ${sensor.id}`);
          setActiveSensor(sensor);
          setSelectedSensor(sensor);
          
          // Fetch weather data if not cached or expired
          const cachedWeather = getWeatherData(sensor.id);
          console.log('Cached weather for sensor', sensor.id, ':', cachedWeather);
          
          if (!cachedWeather) {
            console.log('Fetching weather data for sensor', sensor.id);
            weatherService.fetchWeatherData(sensor.position.lat, sensor.position.lng)
              .then(weatherData => {
                console.log('Weather data received:', weatherData);
                setWeatherData(sensor.id, weatherData);
              })
              .catch(error => {
                console.error('Error fetching weather data:', error);
              });
          }
        }
      });
    };

    checkProximity();
  }, [dronePosition, sensors, setSelectedSensor, getWeatherData, setWeatherData]);


  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={{ mapTypeId: 'satellite' }}
      onLoad={(map) => { mapRef.current = map; }}
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
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 8,
          strokeColor: '#FFFF00',
          fillColor: '#FFFF00',
          fillOpacity: 0.8,
          strokeWeight: 2,
          rotation: calculateDroneRotation(dronePath, pathIndex)
        }}
      />

      {/* Render Fire Boundary Polygon */}
      <Polygon
        paths={fireBoundaryData}
        options={{
          fillColor: '#FFBF00',
          fillOpacity: 0.2, // More subtle
          strokeColor: '#FF0000',
          strokeOpacity: 0.6,
          strokeWeight: 2,
        }}
      />
    </GoogleMap>
  ) : <></>;
}


// Helper function to calculate drone rotation based on movement direction
function calculateDroneRotation(dronePath, pathIndex) {
  if (dronePath.length < 2) return 0;
  
  const current = dronePath[pathIndex];
  const nextIndex = (pathIndex + 1) % dronePath.length;
  const next = dronePath[nextIndex];
  
  const deltaLat = next.lat - current.lat;
  const deltaLng = next.lng - current.lng;
  
  const angle = Math.atan2(deltaLng, deltaLat) * 180 / Math.PI;
  return angle;
}

export default React.memo(MapContainer);
