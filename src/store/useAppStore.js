// src/store/useAppStore.js
import { create } from "zustand";
import sensorsData from "../data/sensors.json";
import dronePathService from "../services/dronePathService";
import fireBoundaryService from "../services/fireBoundaryService";

// Calculate sensorHealth for each sensor based on batteryStatus
const processedSensors = sensorsData.map((sensor) => ({
  ...sensor,
  sensorHealth: sensor.batteryStatus < 10 ? "Abnormal" : "Normal",
}));

// Drone feed images (4 images that loop as the drone visits sensors)
const DRONE_FEED_IMAGE_URLS = [
  "https://upload.wikimedia.org/wikipedia/commons/0/05/Burnout_ops_on_Mangum_Fire_McCall_Smokejumpers.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Aerial_view_of_the_Amazon_Rainforest.jpg/960px-Aerial_view_of_the_Amazon_Rainforest.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Namdapha2.jpg/500px-Namdapha2.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Prescribed_burn_in_a_Pinus_nigra_stand_in_Portugal.JPG/500px-Prescribed_burn_in_a_Pinus_nigra_stand_in_Portugal.JPG",
];

const useAppStore = create((set, get) => ({
  sensors: processedSensors,
  dronePath: [], // Will be generated dynamically
  fireBoundary: [], // Will be calculated dynamically from sensors
  selectedSensor: null,
  dronePosition: { lat: 34.07, lng: -118.58 }, // Default starting position
  droneFeedImageUrls: DRONE_FEED_IMAGE_URLS,
  weatherData: {}, // Cache for weather data by sensor ID
  weatherCacheTimestamps: {}, // Track when weather data was last fetched
  imagePredictions: {}, // Cache for image predictions by sensor ID
  imagePredictionTimestamps: {}, // Track when predictions were last fetched
  markerDisplayMode: "health", // 'health' or 'default'
  pathGenerationOptions: {
    maxDistance: 0.5,
    pathDensity: 0.01,
    prioritizeCritical: true,
    includeWaypoints: true,
  },
  fireBoundaryOptions: {
    probabilityThreshold: 70,
    marginMiles: 0.15,
    smoothingFactor: 0.5, // Increased for more visible smoothing
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
      // Also calculate fire boundary
      get().calculateFireBoundary();
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
      // Also recalculate fire boundary
      get().calculateFireBoundary();
    } catch (error) {
      console.error("Error regenerating drone path:", error);
    }
  },

  // Calculate fire boundary from sensors
  calculateFireBoundary: () => {
    try {
      const state = get();
      const boundary = fireBoundaryService.calculateFireBoundary(
        state.sensors,
        state.fireBoundaryOptions
      );
      set({ fireBoundary: boundary });
      console.log("Fire boundary calculated with", boundary.length, "points");
    } catch (error) {
      console.error("Error calculating fire boundary:", error);
      set({ fireBoundary: [] });
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
    set((state) => {
      // Only update if the data actually changed (prevent unnecessary re-renders)
      const currentData = state.weatherData[sensorId];
      
      // Deep equality check for key fields to prevent duplicate updates
      if (currentData) {
        const hasChanged = 
          currentData.temperature !== weatherData.temperature ||
          currentData.humidity !== weatherData.humidity ||
          currentData.windSpeed !== weatherData.windSpeed ||
          currentData.description !== weatherData.description ||
          currentData.windDirection !== weatherData.windDirection;
        
        if (!hasChanged) {
          // Data hasn't meaningfully changed, skip update to prevent re-render
          return state;
        }
      }
      
      // Update store with new weather data
      return {
        weatherData: { ...state.weatherData, [sensorId]: weatherData },
        weatherCacheTimestamps: {
          ...state.weatherCacheTimestamps,
          [sensorId]: Date.now(),
        },
      };
    }),
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

  // Update fire boundary options
  updateFireBoundaryOptions: (options) => {
    set((state) => ({
      fireBoundaryOptions: { ...state.fireBoundaryOptions, ...options },
    }));
    get().calculateFireBoundary();
  },

  // Image prediction methods (keyed by drone feed index 0–3)
  setImagePrediction: (feedIndex, prediction) =>
    set((state) => ({
      imagePredictions: { ...state.imagePredictions, [feedIndex]: prediction },
      imagePredictionTimestamps: {
        ...state.imagePredictionTimestamps,
        [feedIndex]: Date.now(),
      },
    })),

  getImagePrediction: (feedIndex) => {
    const state = get();
    const timestamp = state.imagePredictionTimestamps[feedIndex];
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // Cache for 5 minutes

    if (timestamp && now - timestamp < fiveMinutes) {
      return state.imagePredictions[feedIndex];
    }
    return null;
  },

  clearImagePrediction: (feedIndex) =>
    set((state) => {
      const newPredictions = { ...state.imagePredictions };
      const newTimestamps = { ...state.imagePredictionTimestamps };
      delete newPredictions[feedIndex];
      delete newTimestamps[feedIndex];
      return {
        imagePredictions: newPredictions,
        imagePredictionTimestamps: newTimestamps,
      };
    }),
}));

export default useAppStore;
