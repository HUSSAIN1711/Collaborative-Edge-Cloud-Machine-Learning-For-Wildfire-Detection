// Path optimization service for efficient drone routing
import { calculateDistance } from '../utils/geoUtils';

class PathOptimizationService {
  constructor() {
    this.optimizationCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes cache
  }

  /**
   * Optimize drone path using TSP (Traveling Salesman Problem) approach
   * @param {Array} sensors - Array of sensor objects
   * @param {Object} options - Optimization options
   * @returns {Array} Optimized path coordinates
   */
  optimizePath(sensors, options = {}) {
    try {
      if (!Array.isArray(sensors) || sensors.length === 0) {
        return [];
      }

      // Check cache
      const cacheKey = this.getCacheKey(sensors, options);
      const cached = this.optimizationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.path;
      }

      const {
        algorithm = 'nearestNeighbor',
        prioritizeCritical = true,
        maxDistance = 5.0, // Maximum distance between sensors
        includeReturnPath = true
      } = options;

      let optimizedPath;

      switch (algorithm) {
        case 'nearestNeighbor':
          optimizedPath = this.nearestNeighborOptimization(sensors, prioritizeCritical);
          break;
        case 'genetic':
          optimizedPath = this.geneticOptimization(sensors, prioritizeCritical);
          break;
        case 'simulatedAnnealing':
          optimizedPath = this.simulatedAnnealingOptimization(sensors, prioritizeCritical);
          break;
        default:
          optimizedPath = this.nearestNeighborOptimization(sensors, prioritizeCritical);
      }

      // Filter out sensors that are too far apart
      const filteredPath = this.filterByDistance(optimizedPath, maxDistance);

      // Add return path if requested
      if (includeReturnPath && filteredPath.length > 1) {
        const returnPath = this.generateReturnPath(filteredPath);
        filteredPath.push(...returnPath);
      }

      // Cache the result
      this.optimizationCache.set(cacheKey, {
        path: filteredPath,
        timestamp: Date.now()
      });

      return filteredPath;
    } catch (error) {
      console.error('Error optimizing path:', error);
      return this.getFallbackPath(sensors);
    }
  }

  /**
   * Nearest Neighbor optimization algorithm
   */
  nearestNeighborOptimization(sensors, prioritizeCritical) {
    const path = [];
    const visited = new Set();
    
    // Sort sensors by priority if requested
    const sortedSensors = prioritizeCritical 
      ? this.sortSensorsByPriority(sensors)
      : [...sensors];

    if (sortedSensors.length === 0) return [];

    // Start with the first sensor
    let currentSensor = sortedSensors[0];
    path.push(currentSensor.position);
    visited.add(currentSensor.id);

    // Find nearest unvisited sensor
    while (visited.size < sortedSensors.length) {
      let nearestSensor = null;
      let minDistance = Infinity;

      for (const sensor of sortedSensors) {
        if (visited.has(sensor.id)) continue;

        const distance = this.calculateDistance(
          currentSensor.position.lat, currentSensor.position.lng,
          sensor.position.lat, sensor.position.lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestSensor = sensor;
        }
      }

      if (nearestSensor) {
        path.push(nearestSensor.position);
        visited.add(nearestSensor.id);
        currentSensor = nearestSensor;
      } else {
        console.warn('No nearest sensor found, breaking optimization loop');
        break;
      }
    }

    
    // Ensure all sensors are included
    if (visited.size < sortedSensors.length) {
      console.warn('Not all sensors included in optimization, adding remaining sensors');
      for (const sensor of sortedSensors) {
        if (!visited.has(sensor.id)) {
          path.push(sensor.position);
          visited.add(sensor.id);
        }
      }
    }

    return path;
  }

  /**
   * Genetic algorithm optimization (simplified version)
   * @param {Array} sensors - Array of sensor objects
   * @param {boolean} _prioritizeCritical - Whether to prioritize critical sensors (unused in this algorithm)
   */
  geneticOptimization(sensors, _prioritizeCritical) {
    const populationSize = 20;
    const generations = 50;
    const mutationRate = 0.1;

    // Create initial population
    let population = [];
    for (let i = 0; i < populationSize; i++) {
      const individual = this.createRandomPath(sensors);
      population.push(individual);
    }

    // Evolve population
    for (let gen = 0; gen < generations; gen++) {
      population = this.evolvePopulation(population, mutationRate);
    }

    // Return best individual
    const bestIndividual = population.reduce((best, current) => 
      this.calculatePathCost(current) < this.calculatePathCost(best) ? current : best
    );

    return bestIndividual.map(index => sensors[index].position);
  }

  /**
   * Simulated annealing optimization
   * @param {Array} sensors - Array of sensor objects
   * @param {boolean} _prioritizeCritical - Whether to prioritize critical sensors (unused in this algorithm)
   */
  simulatedAnnealingOptimization(sensors, _prioritizeCritical) {
    const initialTemp = 1000;
    const coolingRate = 0.95;
    const minTemp = 1;

    let currentPath = this.createRandomPath(sensors);
    let bestPath = [...currentPath];
    let temperature = initialTemp;

    while (temperature > minTemp) {
      const newPath = this.generateNeighborPath(currentPath);
      const currentCost = this.calculatePathCost(currentPath);
      const newCost = this.calculatePathCost(newPath);

      if (newCost < currentCost || Math.random() < Math.exp(-(newCost - currentCost) / temperature)) {
        currentPath = newPath;
        if (this.calculatePathCost(currentPath) < this.calculatePathCost(bestPath)) {
          bestPath = [...currentPath];
        }
      }

      temperature *= coolingRate;
    }

    return bestPath.map(index => sensors[index].position);
  }

  /**
   * Sort sensors by priority (Critical > Warning > Active)
   */
  sortSensorsByPriority(sensors) {
    const priorityOrder = { 'Critical': 3, 'Warning': 2, 'Active': 1 };
    return [...sensors].sort((a, b) => priorityOrder[b.status] - priorityOrder[a.status]);
  }

  /**
   * Create random path through sensors
   */
  createRandomPath(sensors) {
    const path = Array.from({ length: sensors.length }, (_, i) => i);
    for (let i = path.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [path[i], path[j]] = [path[j], path[i]];
    }
    return path;
  }

  /**
   * Evolve population using genetic operators
   */
  evolvePopulation(population, mutationRate) {
    const newPopulation = [];
    
    // Keep best individual
    const best = population.reduce((best, current) => 
      this.calculatePathCost(current) < this.calculatePathCost(best) ? current : best
    );
    newPopulation.push(best);

    // Generate offspring
    while (newPopulation.length < population.length) {
      const parent1 = this.tournamentSelection(population);
      const parent2 = this.tournamentSelection(population);
      const offspring = this.crossover(parent1, parent2);
      
      if (Math.random() < mutationRate) {
        this.mutate(offspring);
      }
      
      newPopulation.push(offspring);
    }

    return newPopulation;
  }

  /**
   * Tournament selection
   */
  tournamentSelection(population) {
    const tournamentSize = 3;
    const tournament = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      tournament.push(population[Math.floor(Math.random() * population.length)]);
    }
    
    return tournament.reduce((best, current) => 
      this.calculatePathCost(current) < this.calculatePathCost(best) ? current : best
    );
  }

  /**
   * Crossover operation
   */
  crossover(parent1, parent2) {
    const start = Math.floor(Math.random() * parent1.length);
    const end = Math.floor(Math.random() * parent1.length);
    const [startIdx, endIdx] = start <= end ? [start, end] : [end, start];
    
    const child = new Array(parent1.length).fill(-1);
    
    // Copy segment from parent1
    for (let i = startIdx; i <= endIdx; i++) {
      child[i] = parent1[i];
    }
    
    // Fill remaining positions from parent2
    let childIdx = 0;
    for (let i = 0; i < parent2.length; i++) {
      if (!child.includes(parent2[i])) {
        while (child[childIdx] !== -1) childIdx++;
        child[childIdx] = parent2[i];
      }
    }
    
    return child;
  }

  /**
   * Mutation operation
   */
  mutate(path) {
    const i = Math.floor(Math.random() * path.length);
    const j = Math.floor(Math.random() * path.length);
    [path[i], path[j]] = [path[j], path[i]];
  }

  /**
   * Generate neighbor path for simulated annealing
   */
  generateNeighborPath(path) {
    const newPath = [...path];
    const i = Math.floor(Math.random() * newPath.length);
    const j = Math.floor(Math.random() * newPath.length);
    [newPath[i], newPath[j]] = [newPath[j], newPath[i]];
    return newPath;
  }

  /**
   * Calculate total cost of a path
   */
  calculatePathCost(path) {
    let totalCost = 0;
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const current = path[i];
      totalCost += this.calculateDistance(
        prev.lat, prev.lng,
        current.lat, current.lng
      );
    }
    return totalCost;
  }

  /**
   * Filter path by maximum distance between consecutive points
   */
  filterByDistance(path, maxDistance) {
    if (path.length <= 1) return path;
    
    const filtered = [path[0]];
    let lastValidIndex = 0;
    
    for (let i = 1; i < path.length; i++) {
      const distance = this.calculateDistance(
        path[lastValidIndex].lat, path[lastValidIndex].lng,
        path[i].lat, path[i].lng
      );
      
      if (distance <= maxDistance) {
        filtered.push(path[i]);
        lastValidIndex = i;
      }
    }
    
    return filtered;
  }

  /**
   * Generate return path to starting point
   * @param {Array} path - Path array
   * @returns {Array} Return path array
   */
  generateReturnPath(path) {
    if (path.length < 2) return [];

    const start = path[0];

    return [
      {
        lat: start.lat,
        lng: start.lng,
      },
    ];
  }

  /**
   * Calculate distance between two coordinates (delegates to geoUtils)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    return calculateDistance(lat1, lng1, lat2, lng2);
  }

  /**
   * Get fallback path when optimization fails
   */
  getFallbackPath(sensors) {
    return sensors.map(sensor => sensor.position);
  }

  /**
   * Generate cache key
   */
  getCacheKey(sensors, options) {
    const sensorIds = sensors.map(s => s.id).sort().join(',');
    const optionsKey = JSON.stringify(options);
    return `${sensorIds}-${optionsKey}`;
  }

  /**
   * Clear optimization cache
   */
  clearCache() {
    this.optimizationCache.clear();
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(originalPath, optimizedPath) {
    const originalCost = this.calculatePathCost(originalPath);
    const optimizedCost = this.calculatePathCost(optimizedPath);
    const improvement = ((originalCost - optimizedCost) / originalCost) * 100;
    
    return {
      originalCost: Math.round(originalCost * 100) / 100,
      optimizedCost: Math.round(optimizedCost * 100) / 100,
      improvement: Math.round(improvement * 100) / 100,
      pointCount: optimizedPath.length
    };
  }
}

export default new PathOptimizationService();
