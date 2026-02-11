// src/store/useAppStore.js
import { create } from "zustand";
import sensorsData from "../data/sensors.json";
import sensorZonesData from "../data/sensorZones.json";
import dronePathService from "../services/dronePathService";
import fireBoundaryService from "../services/fireBoundaryService";
import { calculateZoneCenter, calculateZoneBounds } from "../utils/zoneUtils";

/**
 * Calculate sensorHealth for each sensor based on batteryStatus
 * Sensors with battery < 10% are marked as "Abnormal"
 */
const processedSensors = sensorsData.map((sensor) => ({
  ...sensor,
  sensorHealth: sensor.batteryStatus < 10 ? "Abnormal" : "Normal",
}));

/**
 * Main application store using Zustand
 * Manages sensors, drones, zones, weather data, and UI state
 */
const useAppStore = create((set, get) => ({
  sensors: processedSensors,
  zones: [], // Array of zone objects with sensors
  drones: [], // Array of drone objects, one per zone
  selectedDroneId: null, // ID of the currently selected drone
  selectedSensor: null,
  weatherData: {}, // Cache for weather data by sensor ID
  weatherCacheTimestamps: {}, // Track when weather data was last fetched
  markerDisplayMode: "health", // 'health' or 'default'
  fireDisplayMode: "boundary", // 'boundary' or 'heatmap'
  pathGenerationOptions: {
    maxDistance: 0.5,
    pathDensity: 0.01,
    prioritizeCritical: true,
    includeWaypoints: true,
  },
  fireBoundaryOptions: {
    probabilityThreshold: 70,
    marginMiles: 0.15,
    smoothingFactor: 0.5, // Smoothing factor (0-1, higher = more smooth)
    maxInfluenceMiles: 2.0, // Maximum distance sensors can influence
    gridResolution: 0.01, // Grid resolution in degrees
    decayExponent: 2.5, // Gradual decay exponent (higher = more gradual transition)
  },

  /**
   * Initialize zones and drones based on predefined sensor zones
   * Creates zones from sensor zone definitions and generates drones with paths
   */
  initializeZonesAndDrones: () => {
    try {
      const state = get();
      
      // Create a map of sensor ID to sensor object for quick lookup
      const sensorMap = new Map(state.sensors.map(sensor => [sensor.id, sensor]));
      
      // Build zones from predefined zone definitions
      const zones = sensorZonesData.map((zoneDef) => {
        // Get sensors for this zone by matching IDs
        const zoneSensors = zoneDef.sensorIds
          .map(id => sensorMap.get(id))
          .filter(sensor => sensor !== undefined); // Filter out any missing sensors
        
        // Calculate zone center and bounds from sensor positions
        const center = calculateZoneCenter(zoneSensors);
        const bounds = calculateZoneBounds(zoneSensors);
        
        return {
          id: zoneDef.id,
          name: zoneDef.name,
          sensors: zoneSensors,
          center: center,
          bounds: bounds,
        };
      });

      // Create a drone for each zone
      const drones = zones.map((zone, index) => {
        const droneId = `drone${index + 1}`;
        
        // Generate path only if zone has sensors
        const path = zone.sensors.length > 0
          ? dronePathService.generateDronePath(
              zone.sensors,
        state.pathGenerationOptions
            )
          : [];
        
        // Calculate fire boundary for this zone
        const fireBoundary = zone.sensors.length > 0
          ? fireBoundaryService.calculateFireBoundary(
              zone.sensors,
              state.fireBoundaryOptions
            )
          : { highRiskBoundary: [], mediumRiskBoundary: [] };
        
        // Start position: first sensor in zone, or zone center, or default
        const startPosition = zone.sensors.length > 0
          ? (path[0] || zone.sensors[0].position || zone.center)
          : zone.center;
        
        return {
          id: droneId,
          name: `Drone ${index + 1}`,
          zoneId: zone.id,
          zone: zone,
          path: path,
          position: startPosition,
          pathIndex: 0,
          fireBoundary: fireBoundary,
        };
      });
      
      // Set first drone as selected by default
      const selectedDroneId = drones.length > 0 ? drones[0].id : null;
      
      set({
        zones: zones,
        drones: drones,
        selectedDroneId: selectedDroneId,
      });
      
    } catch (error) {
      console.error("Error initializing zones and drones:", error);
      set({
        zones: [],
        drones: [],
        selectedDroneId: null,
      });
    }
  },

  /**
   * Regenerate paths and boundaries for all drones
   * Useful when path generation options change
   */
  regenerateAllDronePaths: () => {
    try {
      const state = get();
      const updatedDrones = state.drones.map((drone) => {
        const zone = state.zones.find((z) => z.id === drone.zoneId);
        if (!zone || zone.sensors.length === 0) return drone;
        
      const path = dronePathService.generateDronePath(
          zone.sensors,
        state.pathGenerationOptions
      );
        
        const fireBoundary = fireBoundaryService.calculateFireBoundary(
          zone.sensors,
          state.fireBoundaryOptions
        );
        
        return {
          ...drone,
          path: path,
          fireBoundary: fireBoundary,
          // Preserve current position if path is regenerated
          position: path[0] || drone.position,
        };
      });
      
      set({ drones: updatedDrones });
    } catch (error) {
      console.error("Error regenerating drone paths:", error);
    }
  },

  /**
   * Update a specific drone's position
   * @param {string} droneId - ID of the drone to update
   * @param {Object} position - New position {lat, lng}
   */
  updateDronePosition: (droneId, position) => {
    set((state) => ({
      drones: state.drones.map((drone) =>
        drone.id === droneId ? { ...drone, position: position } : drone
      ),
    }));
  },

  /**
   * Update a specific drone's path index
   * @param {string} droneId - ID of the drone to update
   * @param {number} pathIndex - New path index
   */
  updateDronePathIndex: (droneId, pathIndex) => {
    set((state) => ({
      drones: state.drones.map((drone) =>
        drone.id === droneId ? { ...drone, pathIndex: pathIndex } : drone
      ),
    }));
  },

  /**
   * Update path generation options and regenerate all paths
   * @param {Object} newOptions - New path generation options
   */
  updatePathOptions: (newOptions) => {
    set((state) => ({
      pathGenerationOptions: { ...state.pathGenerationOptions, ...newOptions },
    }));
    // Regenerate all paths with new options
    get().regenerateAllDronePaths();
  },

  /**
   * Add new sensor and regenerate zones/drones
   * @param {Object} sensor - Sensor object to add
   */
  addSensor: (sensor) => {
    set((state) => ({
      sensors: [...state.sensors, sensor],
    }));
    get().initializeZonesAndDrones();
  },

  /**
   * Update sensor and regenerate zones/drones
   * @param {string} sensorId - ID of the sensor to update
   * @param {Object} updates - Partial sensor object with updates
   */
  updateSensor: (sensorId, updates) => {
    set((state) => ({
      sensors: state.sensors.map((sensor) =>
        sensor.id === sensorId ? { ...sensor, ...updates } : sensor
      ),
    }));
    get().initializeZonesAndDrones();
  },

  /**
   * Remove sensor and regenerate zones/drones
   * @param {string} sensorId - ID of the sensor to remove
   */
  removeSensor: (sensorId) => {
    set((state) => ({
      sensors: state.sensors.filter((sensor) => sensor.id !== sensorId),
    }));
    get().initializeZonesAndDrones();
  },

  /**
   * Set the selected sensor
   * @param {Object|null} sensor - Sensor object to select, or null to deselect
   */
  setSelectedSensor: (sensor) => set({ selectedSensor: sensor }),

  /**
   * Set the selected drone ID
   * @param {string|null} droneId - Drone ID to select, or null to deselect
   */
  setSelectedDroneId: (droneId) => set({ selectedDroneId: droneId }),

  /**
   * Get the currently selected drone
   * @returns {Object|null} Selected drone object or null
   */
  getSelectedDrone: () => {
    const state = get();
    return state.drones.find((drone) => drone.id === state.selectedDroneId) || null;
  },
  
  /**
   * Get drone by ID
   * @param {string} droneId - Drone ID to find
   * @returns {Object|null} Drone object or null
   */
  getDroneById: (droneId) => {
    const state = get();
    return state.drones.find((drone) => drone.id === droneId) || null;
  },
  /**
   * Set weather data for a sensor
   * @param {string} sensorId - Sensor ID
   * @param {Object} weatherData - Weather data object
   */
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
  /**
   * Get weather data for a sensor (checks cache validity)
   * @param {string} sensorId - Sensor ID
   * @returns {Object|null} Weather data object or null if expired/missing
   */
  getWeatherData: (sensorId) => {
    const state = get();
    const timestamp = state.weatherCacheTimestamps[sensorId];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Return cached data if it's less than an hour old
    if (timestamp && now - timestamp < oneHour) {
      return state.weatherData[sensorId];
    }
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

  /**
   * Clear all weather cache
   */
  clearAllWeatherData: () =>
    set({
      weatherData: {},
      weatherCacheTimestamps: {},
    }),

  // Get path statistics for a specific drone
  getPathStatistics: (droneId) => {
    const state = get();
    const drone = droneId 
      ? state.drones.find((d) => d.id === droneId)
      : state.drones.find((d) => d.id === state.selectedDroneId);
    
    if (!drone) return { totalDistance: 0, pointCount: 0, averageSegmentLength: 0 };
    return dronePathService.getPathStatistics(drone.path);
  },

  /**
   * Calculate sensor health based on battery status
   * @param {number} batteryStatus - Battery percentage (0-100)
   * @returns {string} Health status ('Normal' or 'Abnormal')
   */
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

  /**
   * Toggle marker display mode between health-based and default
   */
  toggleMarkerDisplayMode: () =>
    set((state) => ({
      markerDisplayMode:
        state.markerDisplayMode === "health" ? "default" : "health",
    })),

  /**
   * Set specific marker display mode
   * @param {string} mode - Display mode ('health' or 'default')
   */
  setMarkerDisplayMode: (mode) => set({ markerDisplayMode: mode }),
  setFireDisplayMode: (mode) => set({ fireDisplayMode: mode }),

  /**
   * Update fire boundary options and regenerate boundaries
   * @param {Object} options - New fire boundary options
   */
  updateFireBoundaryOptions: (options) => {
    set((state) => ({
      fireBoundaryOptions: { ...state.fireBoundaryOptions, ...options },
    }));
    // Regenerate all drone boundaries
    const state2 = get();
    const updatedDrones = state2.drones.map((drone) => {
      const zone = state2.zones.find((z) => z.id === drone.zoneId);
      if (!zone) return drone;
      
      const fireBoundary = fireBoundaryService.calculateFireBoundary(
        zone.sensors,
        state2.fireBoundaryOptions
      );
      
      return {
        ...drone,
        fireBoundary: fireBoundary,
      };
    });
    set({ drones: updatedDrones });
  },
}));

export default useAppStore;
