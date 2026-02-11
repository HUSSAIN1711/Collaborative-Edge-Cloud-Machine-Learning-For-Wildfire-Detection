// Dynamic drone path generation service
import pathOptimizationService from "./pathOptimizationService";
import { calculateDistance } from "../utils/geoUtils";

/**
 * Service for generating and optimizing drone paths based on sensor locations
 * Handles path generation, caching, and optimization algorithms
 */
class DronePathService {
  /**
   * Initialize the drone path service with cache configuration
   */
  constructor() {
    this.pathCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Generate optimal drone path based on sensor data
   * @param {Array} sensors - Array of sensor objects
   * @param {Object} options - Configuration options
   * @returns {Array} Array of coordinate objects {lat, lng}
   */
  generateDronePath(sensors, options = {}) {
    try {
      // Validate input
      if (!Array.isArray(sensors) || sensors.length === 0) {
        console.warn("No sensors provided, returning default path");
        return this.getDefaultPath();
      }

      // Check cache first
      const cacheKey = this.getCacheKey(sensors, options);
      const cached = this.pathCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.path;
      }

      // Generate new path
      const path = this.calculateOptimalPath(sensors, options);
      
      // Cache the result
      this.pathCache.set(cacheKey, {
        path,
        timestamp: Date.now()
      });

      return path;
    } catch (error) {
      console.error("Error generating drone path:", error);
      return this.getDefaultPath();
    }
  }

  /**
   * Calculate optimal path using sensor priority and proximity
   */
  calculateOptimalPath(sensors, options) {
    const {
      maxDistance = 0.5, // Maximum distance between consecutive points
      pathDensity = 0.01, // Distance between path points
      prioritizeCritical = true,
      useOptimization = true,
      optimizationAlgorithm = "nearestNeighbor"
    } = options;

    try {
      // First, optimize the sensor visit order
      let optimizedSensors = sensors;
      if (useOptimization && sensors.length > 1) {
        try {
          const optimizationOptions = {
            algorithm: optimizationAlgorithm,
            prioritizeCritical,
            maxDistance: 2.0, // Allow longer distances for optimization
            includeReturnPath: false,
          };

          const optimizedPath = pathOptimizationService.optimizePath(sensors, optimizationOptions);
          // Convert optimized path back to sensor order
          optimizedSensors = this.pathToSensorOrder(optimizedPath, sensors);

          // Ensure we have all sensors
          if (optimizedSensors.length < sensors.length) {
            console.warn("Optimization missed some sensors, falling back to simple priority sort");
            optimizedSensors = this.getSimplePriorityOrder(sensors, prioritizeCritical);
          }
        } catch (optimizationError) {
          console.error("Optimization failed, using simple priority sort:", optimizationError);
          optimizedSensors = this.getSimplePriorityOrder(sensors, prioritizeCritical);
        }
      } else {
        optimizedSensors = this.getSimplePriorityOrder(sensors, prioritizeCritical);
      }

      const path = [];
      const visitedSensors = new Set();

      // Start with the first sensor or center point
      const startPoint = optimizedSensors[0]?.position || { lat: 34.07, lng: -118.58 };
      path.push(startPoint);

      // Generate path segments between sensors
      for (let i = 0; i < optimizedSensors.length; i++) {
        const currentSensor = optimizedSensors[i];
        if (visitedSensors.has(currentSensor.id)) continue;


        // Add waypoints to the sensor
        const waypoints = this.generateWaypointsToSensor(
          path[path.length - 1],
          currentSensor.position,
          pathDensity
        );
        path.push(...waypoints);

        // Add sensor-specific patrol pattern
        const patrolPoints = this.generatePatrolPattern(currentSensor, pathDensity);
        path.push(...patrolPoints);

        visitedSensors.add(currentSensor.id);

        // Add transition to next sensor if not the last one
        if (i < optimizedSensors.length - 1) {
          const nextSensor = optimizedSensors[i + 1];
          const transitionPoints = this.generateTransitionPath(
            currentSensor.position,
            nextSensor.position,
            pathDensity
          );
          path.push(...transitionPoints);
        }
      }

      // Ensure all sensors are visited (fallback)
      if (visitedSensors.size < optimizedSensors.length) {
        console.warn(
          `Only ${visitedSensors.size}/${optimizedSensors.length} sensors visited, adding remaining sensors`
        );

        for (const sensor of optimizedSensors) {
          if (!visitedSensors.has(sensor.id)) {
            // Add waypoints to the missed sensor
            const waypoints = this.generateWaypointsToSensor(
              path[path.length - 1],
              sensor.position,
              pathDensity
            );
            path.push(...waypoints);

            // Add patrol pattern
            const patrolPoints = this.generatePatrolPattern(sensor, pathDensity);
            path.push(...patrolPoints);

            visitedSensors.add(sensor.id);
          }
        }
      }

      // Add return path to starting point
      if (path.length > 1) {
        const returnPath = this.generateWaypointsToSensor(
          path[path.length - 1],
          startPoint,
          pathDensity
        );
        path.push(...returnPath);
      }

      const finalPath = this.optimizePath(path, maxDistance);

      // Validate that all sensors are included
      this.validatePathCompleteness(finalPath, sensors);

      return finalPath;
    } catch (error) {
      console.error("Error in calculateOptimalPath:", error);
      return this.getDefaultPath();
    }
  }

  /**
   * Validate that all sensors are included in the path
   * @param {Array} path - Generated path array
   * @param {Array} sensors - Array of sensor objects
   */
  validatePathCompleteness(path, sensors) {
    const pathPositions = path.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`);
    const sensorPositions = sensors.map(
      (s) => `${s.position.lat.toFixed(3)},${s.position.lng.toFixed(3)}`
    );

    let includedSensors = 0;
    for (const sensorPos of sensorPositions) {
      if (pathPositions.some((pathPos) => pathPos === sensorPos)) {
        includedSensors++;
      }
    }

    if (includedSensors < sensors.length) {
      console.warn(`WARNING: Only ${includedSensors}/${sensors.length} sensors are included in the path!`);
    }
  }

  /**
   * Convert optimized path back to sensor order
   * @param {Array} optimizedPath - Optimized path array
   * @param {Array} originalSensors - Original sensor array
   * @returns {Array} Array of sensors in optimized order
   */
  pathToSensorOrder(optimizedPath, originalSensors) {
    const sensorOrder = [];
    const visitedIds = new Set();

    // First, try to match exact positions
    for (const point of optimizedPath) {
      const sensor = originalSensors.find(
        (s) =>
          !visitedIds.has(s.id) &&
          Math.abs(s.position.lat - point.lat) < 0.001 &&
          Math.abs(s.position.lng - point.lng) < 0.001
      );
      if (sensor) {
        sensorOrder.push(sensor);
        visitedIds.add(sensor.id);
      }
    }

    // If we didn't get all sensors, add the remaining ones
    for (const sensor of originalSensors) {
      if (!visitedIds.has(sensor.id)) {
        sensorOrder.push(sensor);
        visitedIds.add(sensor.id);
      }
    }

    return sensorOrder;
  }

  /**
   * Get simple priority order for sensors (fallback method)
   * @param {Array} sensors - Array of sensor objects
   * @param {boolean} prioritizeCritical - Whether to prioritize critical sensors
   * @returns {Array} Sorted array of sensors
   */
  getSimplePriorityOrder(sensors, prioritizeCritical) {
    if (!prioritizeCritical) {
      return [...sensors];
    }

    const priorityOrder = { Critical: 3, Warning: 2, Active: 1 };
    return [...sensors].sort((a, b) => priorityOrder[b.status] - priorityOrder[a.status]);
  }

  /**
   * Generate waypoints between two points
   * @param {Object} from - Starting position {lat, lng}
   * @param {Object} to - Target position {lat, lng}
   * @param {number} density - Distance between waypoints
   * @returns {Array} Array of waypoint positions
   */
  generateWaypointsToSensor(from, to, density) {
    const waypoints = [];
    const distance = this.calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const steps = Math.max(1, Math.floor(distance / density));

    for (let i = 1; i <= steps; i++) {
      const ratio = i / steps;
      const lat = from.lat + (to.lat - from.lat) * ratio;
      const lng = from.lng + (to.lng - from.lng) * ratio;
      waypoints.push({ lat, lng });
    }

    return waypoints;
  }

  /**
   * Generate patrol pattern around a sensor
   * @param {Object} sensor - Sensor object with position and status
   * @param {number} density - Distance between patrol points
   * @returns {Array} Array of patrol positions
   */
  generatePatrolPattern(sensor, density) {
    const { position, status } = sensor;
    const patrolRadius = this.getPatrolRadius(status);
    const patrolPoints = [];

    // Create circular patrol pattern
    const numPoints = Math.max(4, Math.floor((2 * Math.PI * patrolRadius) / density));

    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints;
      const lat = position.lat + (patrolRadius / 69) * Math.cos(angle); // 69 miles per degree
      const lng =
        position.lng +
        ((patrolRadius / 69) * Math.sin(angle)) / Math.cos((position.lat * Math.PI) / 180);

      patrolPoints.push({ lat, lng });
    }

    return patrolPoints;
  }

  /**
   * Generate transition path between sensors
   * @param {Object} from - Starting position {lat, lng}
   * @param {Object} to - Target position {lat, lng}
   * @param {number} density - Distance between transition points
   * @returns {Array} Array of transition positions
   */
  generateTransitionPath(from, to, density) {
    const distance = this.calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const steps = Math.max(1, Math.floor(distance / density));
    const waypoints = [];

    for (let i = 1; i < steps; i++) {
      const ratio = i / steps;
      const lat = from.lat + (to.lat - from.lat) * ratio;
      const lng = from.lng + (to.lng - from.lng) * ratio;
      waypoints.push({ lat, lng });
    }

    return waypoints;
  }

  /**
   * Get patrol radius based on sensor status
   * @param {string} status - Sensor status ('Critical', 'Warning', 'Active')
   * @returns {number} Patrol radius in miles
   */
  getPatrolRadius(status) {
    const radiusMap = {
      Critical: 0.05, // 0.05 miles
      Warning: 0.03, // 0.03 miles
      Active: 0.02, // 0.02 miles
    };
    return radiusMap[status] || 0.02;
  }

  /**
   * Optimize path by removing redundant points
   * @param {Array} path - Path array to optimize
   * @param {number} maxDistance - Maximum distance between consecutive points
   * @returns {Array} Optimized path array
   */
  optimizePath(path, maxDistance) {
    if (path.length <= 2) return path;

    const optimized = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = optimized[optimized.length - 1];
      const current = path[i];
      const distance = this.calculateDistance(prev.lat, prev.lng, current.lat, current.lng);

      if (distance >= maxDistance) {
        optimized.push(current);
      }
    }

    // Always include the last point
    optimized.push(path[path.length - 1]);

    return optimized;
  }

  /**
   * Calculate distance between two coordinates (delegates to geoUtils)
   * @param {number} lat1 - Latitude of first point
   * @param {number} lng1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lng2 - Longitude of second point
   * @returns {number} Distance in miles
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    return calculateDistance(lat1, lng1, lat2, lng2);
  }

  /**
   * Get default path when no sensors are available
   * @returns {Array} Default path array
   */
  getDefaultPath() {
    return [
      { lat: 34.07, lng: -118.58 },
      { lat: 34.08, lng: -118.59 },
      { lat: 34.09, lng: -118.60 },
      { lat: 34.10, lng: -118.61 }
    ];
  }

  /**
   * Generate cache key for path
   * @param {Array} sensors - Array of sensor objects
   * @param {Object} options - Path generation options
   * @returns {string} Cache key string
   */
  getCacheKey(sensors, options) {
    const sensorIds = sensors.map((s) => s.id).sort().join(",");
    const optionsKey = JSON.stringify(options);
    return `${sensorIds}-${optionsKey}`;
  }

  /**
   * Clear path cache
   */
  clearCache() {
    this.pathCache.clear();
  }

  /**
   * Get path statistics
   * @param {Array} path - Path array to analyze
   * @returns {Object} Statistics object with totalDistance, pointCount, averageSegmentLength
   */
  getPathStatistics(path) {
    if (!path || path.length < 2) {
      return { totalDistance: 0, pointCount: 0, averageSegmentLength: 0 };
    }

    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
      const distance = this.calculateDistance(
        path[i - 1].lat,
        path[i - 1].lng,
        path[i].lat,
        path[i].lng
      );
      totalDistance += distance;
    }

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      pointCount: path.length,
      averageSegmentLength: Math.round((totalDistance / (path.length - 1)) * 100) / 100,
    };
  }
}

export default new DronePathService();
