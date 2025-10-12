// src/store/useAppStore.js
import { create } from 'zustand';
import sensorsData from '../data/sensors.json';
import dronePathData from '../data/dronePath.json';

const useAppStore = create((set, get) => ({
  sensors: sensorsData,
  dronePath: dronePathData,
  selectedSensor: null,
  dronePosition: dronePathData[0],
  weatherData: {}, // Cache for weather data by sensor ID
  weatherCacheTimestamps: {}, // Track when weather data was last fetched
  setSelectedSensor: (sensor) => set({ selectedSensor: sensor }),
  setDronePosition: (position) => set({ dronePosition: position }),
  setWeatherData: (sensorId, weatherData) => set((state) => ({
    weatherData: { ...state.weatherData, [sensorId]: weatherData },
    weatherCacheTimestamps: { ...state.weatherCacheTimestamps, [sensorId]: Date.now() }
  })),
  getWeatherData: (sensorId) => {
    const state = get();
    const timestamp = state.weatherCacheTimestamps[sensorId];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Return cached data if it's less than an hour old
    if (timestamp && (now - timestamp) < oneHour) {
      return state.weatherData[sensorId];
    }
    return null; // Indicates data needs to be fetched
  }
}));

export default useAppStore;
