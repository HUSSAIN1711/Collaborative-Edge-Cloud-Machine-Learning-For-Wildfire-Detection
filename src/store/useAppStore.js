// src/store/useAppStore.js
import { create } from "zustand";
import sensorsData from "../data/sensors.json";
import dronePathService from "../services/dronePathService";

const useAppStore = create((set, get) => ({
  sensors: sensorsData,
  dronePath: [], // Will be generated dynamically
  selectedSensor: null,
  dronePosition: { lat: 34.07, lng: -118.58 }, // Default starting position
  weatherData: {}, // Cache for weather data by sensor ID
  weatherCacheTimestamps: {}, // Track when weather data was last fetched
  markerDisplayMode: "health", // 'health' or 'default'
  pathGenerationOptions: {
    maxDistance: 0.5,
    pathDensity: 0.01,
    prioritizeCritical: true,
    includeWaypoints: true,
  },

  // Initialize drone path on store creation
  initializeDronePath: () => {
    try {
      const state = get();
      const path = dronePathService.generateDronePath(
        state.sensors,
        state.pathGenerationOptions
      );
      set({
        dronePath: path,
        dronePosition: path[0] || { lat: 34.07, lng: -118.58 },
      });
      console.log("Drone path initialized with", path.length, "points");
    } catch (error) {
      console.error("Error initializing drone path:", error);
      // Fallback to default path
      const fallbackPath = [
        { lat: 34.07, lng: -118.58 },
        { lat: 34.08, lng: -118.59 },
        { lat: 34.09, lng: -118.6 },
      ];
      set({
        dronePath: fallbackPath,
        dronePosition: fallbackPath[0],
      });
    }
  },

  // Regenerate drone path when sensors change
  regenerateDronePath: () => {
    try {
      const state = get();
      const path = dronePathService.generateDronePath(
        state.sensors,
        state.pathGenerationOptions
      );
      set({ dronePath: path });
      console.log("Drone path regenerated with", path.length, "points");
    } catch (error) {
      console.error("Error regenerating drone path:", error);
    }
  },

  // Update path generation options
  updatePathOptions: (newOptions) => {
    set((state) => ({
      pathGenerationOptions: { ...state.pathGenerationOptions, ...newOptions },
    }));
    // Regenerate path with new options
    get().regenerateDronePath();
  },

  // Add new sensor and regenerate path
  addSensor: (sensor) => {
    set((state) => ({
      sensors: [...state.sensors, sensor],
    }));
    get().regenerateDronePath();
  },

  // Update sensor and regenerate path
  updateSensor: (sensorId, updates) => {
    set((state) => ({
      sensors: state.sensors.map((sensor) =>
        sensor.id === sensorId ? { ...sensor, ...updates } : sensor
      ),
    }));
    get().regenerateDronePath();
  },

  // Remove sensor and regenerate path
  removeSensor: (sensorId) => {
    set((state) => ({
      sensors: state.sensors.filter((sensor) => sensor.id !== sensorId),
    }));
    get().regenerateDronePath();
  },

  setSelectedSensor: (sensor) => set({ selectedSensor: sensor }),
  setDronePosition: (position) => set({ dronePosition: position }),
  setWeatherData: (sensorId, weatherData) =>
    set((state) => ({
      weatherData: { ...state.weatherData, [sensorId]: weatherData },
      weatherCacheTimestamps: {
        ...state.weatherCacheTimestamps,
        [sensorId]: Date.now(),
      },
    })),
  getWeatherData: (sensorId) => {
    const state = get();
    const timestamp = state.weatherCacheTimestamps[sensorId];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Return cached data if it's less than an hour old
    if (timestamp && now - timestamp < oneHour) {
      console.log(`Using cached weather data for sensor ${sensorId}`);
      return state.weatherData[sensorId];
    }
    console.log(`No valid cached weather data for sensor ${sensorId}`);
    return null; // Indicates data needs to be fetched
  },

  // Clear weather cache for a specific sensor
  clearWeatherData: (sensorId) =>
    set((state) => {
      const newWeatherData = { ...state.weatherData };
      const newTimestamps = { ...state.weatherCacheTimestamps };
      delete newWeatherData[sensorId];
      delete newTimestamps[sensorId];
      return {
        weatherData: newWeatherData,
        weatherCacheTimestamps: newTimestamps,
      };
    }),

  // Clear all weather cache
  clearAllWeatherData: () =>
    set({
      weatherData: {},
      weatherCacheTimestamps: {},
    }),

  // Get path statistics
  getPathStatistics: () => {
    const state = get();
    return dronePathService.getPathStatistics(state.dronePath);
  },

  // Calculate sensor health based on battery status
  calculateSensorHealth: (batteryStatus) => {
    return batteryStatus < 10 ? "Abnormal" : "Normal";
  },

  // Update sensor health for all sensors based on current battery status
  updateSensorHealth: () =>
    set((state) => ({
      sensors: state.sensors.map((sensor) => ({
        ...sensor,
        sensorHealth: sensor.batteryStatus < 10 ? "Abnormal" : "Normal",
      })),
    })),

  // Toggle marker display mode between health-based and default
  toggleMarkerDisplayMode: () =>
    set((state) => ({
      markerDisplayMode:
        state.markerDisplayMode === "health" ? "default" : "health",
    })),

  // Set specific marker display mode
  setMarkerDisplayMode: (mode) => set({ markerDisplayMode: mode }),
}));

export default useAppStore;
