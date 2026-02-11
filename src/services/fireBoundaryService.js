// Fire Boundary Calculation Service
// Calculates dynamic fire boundaries from sensor data with smoothing

import { hasValidSensorPosition } from '../utils/geoUtils';

class FireBoundaryService {
  constructor() {
    this.boundaryCache = new Map();
    this.cacheTimeout = 60 * 1000; // 1 minute cache
  }

  /**
   * Calculate fire probability at a given point based on distance from sensors
   * Uses exponential decay for gradual, smooth probability decrease
   * Takes the maximum probability from all sensors (not averaged)
   * @param {Object} point - Point {lat, lng}
   * @param {Array} sensors - Array of sensor objects with position and fireProbability
   * @param {number} maxInfluenceMiles - Maximum distance a sensor can influence (default: 2 miles)
   * @param {number} decayExponent - Exponent for decay curve (higher = more gradual, default: 2 for quadratic)
   * @returns {number} Interpolated fire probability (0-100)
   */
  calculateProbabilityAtPoint(point, sensors, maxInfluenceMiles = 2.0, decayExponent = 2.0) {
    if (!sensors || sensors.length === 0) return 0;

    let maxProbability = 0;

    sensors.forEach((sensor) => {
      if (!hasValidSensorPosition(sensor)) return;
      
      // Skip sensors with 0% fire probability - they shouldn't influence boundaries
      const sensorProbability = sensor.fireProbability || 0;
      if (sensorProbability <= 0) return;

      const distance = this.distance(point, sensor.position);
      
      // Skip if beyond max influence distance
      if (distance > maxInfluenceMiles) return;

      // Exponential/Quadratic decay: probability decreases gradually with distance
      // At distance 0: probability = sensorProbability (100% if sensor says 100%)
      // At distance maxInfluenceMiles: probability = 0
      // Formula: probability = sensorProbability * (1 - (distance / maxInfluenceMiles))^decayExponent
      // Using decayExponent = 2 creates a quadratic decay (smoother than linear)
      // Higher values (e.g., 2.5, 3) create even more gradual decay
      const normalizedDistance = distance / maxInfluenceMiles;
      const decayFactor = Math.max(0, Math.pow(1 - normalizedDistance, decayExponent));
      const decayedProbability = sensorProbability * decayFactor;
      
      // Take the maximum probability from all sensors
      maxProbability = Math.max(maxProbability, decayedProbability);
    });

    return Math.min(100, maxProbability);
  }

  /**
   * Calculate fire boundaries with probability-based regions
   * Returns two regions: high risk (>=85%) and medium risk (>=50%)
   * @param {Array} sensors - Array of sensor objects with position and fireProbability
   * @param {Object} options - Configuration options
   * @returns {Object} Object with highRiskBoundary and mediumRiskBoundary arrays
   */
  calculateFireBoundary(sensors, options = {}) {
    const {
      marginMiles = 0.15, // Margin around sensors in miles
      smoothingFactor = 0.5, // Smoothing factor (0-1, higher = more smooth)
      minSensors = 1, // Minimum sensors needed to create boundary
      maxInfluenceMiles = 2.0, // Maximum distance sensors can influence
      gridResolution = 0.01, // Grid resolution in degrees (~0.7 miles, for sampling)
      decayExponent = 2.0, // Decay exponent for gradual probability decrease (higher = more gradual)
    } = options;

    try {
      // Filter sensors with valid positions AND non-zero fire probability
      // Exclude sensors with 0% or very low fire probability as they shouldn't affect boundaries
      const validSensors = sensors.filter((sensor) =>
        hasValidSensorPosition(sensor) && (sensor.fireProbability || 0) > 0
      );

      if (validSensors.length < minSensors) {
        return { highRiskBoundary: [], mediumRiskBoundary: [] };
      }

      // Check cache
      const cacheKey = this.getCacheKey(validSensors, options);
      const cached = this.boundaryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.boundary;
      }

      // Calculate bounding box for grid sampling (only using sensors with fire probability > 0)
      // This ensures 0% sensors don't affect the boundary area
      const bounds = this.calculateBounds(validSensors);
      const padding = maxInfluenceMiles / 69; // Convert miles to approximate degrees
      
      // Expand bounds with padding
      const expandedBounds = {
        north: bounds.north + padding,
        south: bounds.south - padding,
        east: bounds.east + padding,
        west: bounds.west - padding,
      };

      // Sample points on a grid and calculate probabilities
      const gridPoints = [];
      const probabilityGrid = [];
      
      // Use finer grid resolution near sensors (where probability is high)
      const fineGridResolution = gridResolution * 0.2; // Much finer grid near sensors
      const coarseGridResolution = gridResolution; // Coarser grid further away
      
      // First, add sensor positions themselves and nearby points with fine grid
      // Only include sensors with fire probability > 0
      validSensors.forEach((sensor) => {
        const sensorPoint = { lat: sensor.position.lat, lng: sensor.position.lng };
        const sensorProbability = sensor.fireProbability || 0;
        
        // Skip sensors with 0% probability
        if (sensorProbability <= 0) return;
        
        // Add exact sensor position
        gridPoints.push(sensorPoint);
        probabilityGrid.push(sensorProbability);
        
        // Add fine grid around sensor (within maxInfluenceMiles)
        const sensorInfluenceRadius = maxInfluenceMiles / 69; // Convert to degrees
        for (let lat = sensor.position.lat - sensorInfluenceRadius; 
             lat <= sensor.position.lat + sensorInfluenceRadius; 
             lat += fineGridResolution) {
          for (let lng = sensor.position.lng - sensorInfluenceRadius; 
               lng <= sensor.position.lng + sensorInfluenceRadius; 
               lng += fineGridResolution) {
            const point = { lat, lng };
            const dist = this.distance(point, sensor.position);
            
            // Only include points within influence radius
            if (dist <= maxInfluenceMiles) {
              // Check if we already have this point (avoid duplicates)
              const isDuplicate = gridPoints.some((p) => 
                Math.abs(p.lat - point.lat) < 0.0001 && 
                Math.abs(p.lng - point.lng) < 0.0001
              );
              
              if (!isDuplicate) {
                const probability = this.calculateProbabilityAtPoint(
                  point,
                  validSensors,
                  maxInfluenceMiles,
                  decayExponent
                );
                gridPoints.push(point);
                probabilityGrid.push(probability);
              }
            }
          }
        }
      });
      
      // Then sample remaining area with coarser grid
      for (let lat = expandedBounds.south; lat <= expandedBounds.north; lat += coarseGridResolution) {
        for (let lng = expandedBounds.west; lng <= expandedBounds.east; lng += coarseGridResolution) {
          const point = { lat, lng };
          
          // Skip if already included in fine grid
          const isDuplicate = gridPoints.some((p) => 
            Math.abs(p.lat - point.lat) < 0.0001 && 
            Math.abs(p.lng - point.lng) < 0.0001
          );
          
          if (isDuplicate) continue;
          
          const probability = this.calculateProbabilityAtPoint(
            point,
            validSensors,
            maxInfluenceMiles,
            decayExponent
          );
          
          gridPoints.push(point);
          probabilityGrid.push(probability);
        }
      }

      // Find contour points for 85% and 50% thresholds
      const highRiskPoints = [];
      const mediumRiskPoints = [];

      // First, ALWAYS include sensor positions with >= 85% probability in high-risk points
      // This ensures sensors with high fire probability are always included
      validSensors.forEach((sensor) => {
        const sensorProbability = sensor.fireProbability || 0;
        if (sensorProbability >= 85) {
          const sensorPoint = { lat: sensor.position.lat, lng: sensor.position.lng };
          // Check if not already added
          const alreadyAdded = highRiskPoints.some((p) => 
            Math.abs(p.lat - sensorPoint.lat) < 0.0001 && 
            Math.abs(p.lng - sensorPoint.lng) < 0.0001
          );
          if (!alreadyAdded) {
            highRiskPoints.push(sensorPoint);
          }
        }
        if (sensorProbability >= 50) {
          const sensorPoint = { lat: sensor.position.lat, lng: sensor.position.lng };
          // Check if not already added
          const alreadyAdded = mediumRiskPoints.some((p) => 
            Math.abs(p.lat - sensorPoint.lat) < 0.0001 && 
            Math.abs(p.lng - sensorPoint.lng) < 0.0001
          );
          if (!alreadyAdded) {
            mediumRiskPoints.push(sensorPoint);
          }
        }
      });

      // Then add grid points that meet the thresholds
      for (let i = 0; i < gridPoints.length; i++) {
        const probability = probabilityGrid[i];
        const point = gridPoints[i];

        // Add points that meet the thresholds (but skip if it's a sensor position already added)
        if (probability >= 85) {
          const isSensorPosition = validSensors.some((s) => 
            Math.abs(s.position.lat - point.lat) < 0.0001 && 
            Math.abs(s.position.lng - point.lng) < 0.0001 &&
            (s.fireProbability || 0) >= 85
          );
          if (!isSensorPosition) {
            highRiskPoints.push(point);
          }
        }
        if (probability >= 50) {
          const isSensorPosition = validSensors.some((s) => 
            Math.abs(s.position.lat - point.lat) < 0.0001 && 
            Math.abs(s.position.lng - point.lng) < 0.0001 &&
            (s.fireProbability || 0) >= 50
          );
          if (!isSensorPosition) {
            mediumRiskPoints.push(point);
          }
        }
      }


      // Calculate convex hulls for each region
      let highRiskBoundary = [];
      let mediumRiskBoundary = [];

      // For high-risk boundary: create buffer around sensors with >= 85% probability
      if (highRiskPoints.length >= 3) {
        const hull = this.calculateConvexHull(highRiskPoints);
        // Instead of buffering outward, ensure sensors are included as vertices
        // Add sensor positions directly to the hull to prevent curving around them
        const sensorsWithHighRisk = validSensors.filter((s) => (s.fireProbability || 0) >= 85);
        const sensorPositions = sensorsWithHighRisk.map((s) => s.position);
        
        // Combine hull points with sensor positions, ensuring sensors are included
        const combinedPoints = [...hull];
        sensorPositions.forEach((sensorPos) => {
          const alreadyInHull = hull.some((hullPoint) => 
            Math.abs(hullPoint.lat - sensorPos.lat) < 0.0001 && 
            Math.abs(hullPoint.lng - sensorPos.lng) < 0.0001
          );
          if (!alreadyInHull) {
            combinedPoints.push(sensorPos);
          }
        });
        
        // Recalculate hull with sensors included
        // Use the hull directly without buffer, or with very minimal buffer to avoid curving around sensors
        const finalHull = combinedPoints.length > 3 
          ? this.calculateConvexHull(combinedPoints)
          : combinedPoints;
        // Apply very small buffer or none at all to keep boundaries going through sensors
        const bufferedHull = marginMiles > 0 
          ? this.applyBuffer(finalHull, marginMiles * 0.1) // Very minimal buffer
          : finalHull;
        // Apply gentle smoothing to soften edges without creating loops
        // Chaikin's algorithm prevents self-intersections
        highRiskBoundary = bufferedHull.length > 3
          ? this.smoothBoundary(bufferedHull, Math.min(0.4, smoothingFactor * 0.5))
          : bufferedHull;
      } else if (highRiskPoints.length > 0) {
        // If we have high-risk points but less than 3, create a circular buffer around each
        // This handles cases where sensors are isolated
        const allBufferedPoints = [];
        highRiskPoints.forEach((point) => {
          // Create a small circle around this point
          const radius = marginMiles * 2; // Larger radius for visibility
          for (let angle = 0; angle < 360; angle += 30) {
            const bufferedPoint = this.destinationPoint(point, angle, radius);
            allBufferedPoints.push(bufferedPoint);
          }
        });
        // Create convex hull of all buffered points
        if (allBufferedPoints.length >= 3) {
          highRiskBoundary = this.calculateConvexHull(allBufferedPoints);
        } else {
          highRiskBoundary = allBufferedPoints;
        }
      } else {
        // Fallback: if no high-risk points found but we have sensors with >= 85% probability,
        // create boundaries directly around those sensors
        const highRiskSensors = validSensors.filter((s) => (s.fireProbability || 0) >= 85);
        if (highRiskSensors.length > 0) {
          const sensorPoints = highRiskSensors.map((s) => s.position);
          if (sensorPoints.length >= 3) {
            const hull = this.calculateConvexHull(sensorPoints);
            // Use minimal buffer to avoid curving around sensors
            const bufferedHull = this.applyBuffer(hull, marginMiles * 0.1);
            // Apply gentle smoothing to soften edges without creating loops
            highRiskBoundary = bufferedHull.length > 3
              ? this.smoothBoundary(bufferedHull, Math.min(0.4, smoothingFactor * 0.5))
              : bufferedHull;
          } else {
            // Create circular buffers around individual sensors
            const allBufferedPoints = [];
            sensorPoints.forEach((point) => {
              const radius = marginMiles * 2;
              for (let angle = 0; angle < 360; angle += 30) {
                allBufferedPoints.push(this.destinationPoint(point, angle, radius));
              }
            });
            highRiskBoundary = allBufferedPoints.length >= 3 
              ? this.calculateConvexHull(allBufferedPoints)
              : allBufferedPoints;
          }
        }
      }

      // For medium-risk boundary
      if (mediumRiskPoints.length >= 3) {
        const hull = this.calculateConvexHull(mediumRiskPoints);
        // Ensure sensors are included as vertices to prevent curving around them
        const sensorsWithMediumRisk = validSensors.filter((s) => (s.fireProbability || 0) >= 50);
        const sensorPositions = sensorsWithMediumRisk.map((s) => s.position);
        
        // Combine hull points with sensor positions
        const combinedPoints = [...hull];
        sensorPositions.forEach((sensorPos) => {
          const alreadyInHull = hull.some((hullPoint) => 
            Math.abs(hullPoint.lat - sensorPos.lat) < 0.0001 && 
            Math.abs(hullPoint.lng - sensorPos.lng) < 0.0001
          );
          if (!alreadyInHull) {
            combinedPoints.push(sensorPos);
          }
        });
        
        // Recalculate hull with sensors included
        // Use the hull directly without buffer, or with very minimal buffer to avoid curving around sensors
        const finalHull = combinedPoints.length > 3 
          ? this.calculateConvexHull(combinedPoints)
          : combinedPoints;
        // Apply very small buffer or none at all to keep boundaries going through sensors
        const bufferedHull = marginMiles > 0 
          ? this.applyBuffer(finalHull, marginMiles * 0.1) // Very minimal buffer
          : finalHull;
        // Apply gentle smoothing to soften edges without creating loops
        // Chaikin's algorithm prevents self-intersections
        mediumRiskBoundary = bufferedHull.length > 3
          ? this.smoothBoundary(bufferedHull, Math.min(0.4, smoothingFactor * 0.5))
          : bufferedHull;
      } else if (mediumRiskPoints.length > 0) {
        const allBufferedPoints = [];
        mediumRiskPoints.forEach((point) => {
          const radius = marginMiles * 2;
          for (let angle = 0; angle < 360; angle += 30) {
            allBufferedPoints.push(this.destinationPoint(point, angle, radius));
          }
        });
        if (allBufferedPoints.length >= 3) {
          mediumRiskBoundary = this.calculateConvexHull(allBufferedPoints);
        } else {
          mediumRiskBoundary = allBufferedPoints;
        }
      } else {
        // Fallback for medium-risk: include sensors with >= 50% probability
        const mediumRiskSensors = validSensors.filter((s) => (s.fireProbability || 0) >= 50);
        if (mediumRiskSensors.length > 0) {
          const sensorPoints = mediumRiskSensors.map((s) => s.position);
          if (sensorPoints.length >= 3) {
            const hull = this.calculateConvexHull(sensorPoints);
            // Use minimal buffer to avoid curving around sensors
            const bufferedHull = this.applyBuffer(hull, marginMiles * 0.1);
            // Apply gentle smoothing to soften edges without creating loops
            mediumRiskBoundary = bufferedHull.length > 3
              ? this.smoothBoundary(bufferedHull, Math.min(0.4, smoothingFactor * 0.5))
              : bufferedHull;
          }
        }
      }

      const result = {
        highRiskBoundary,
        mediumRiskBoundary,
      };

      // Cache the result
      this.boundaryCache.set(cacheKey, {
        boundary: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error("Error calculating fire boundary:", error);
      return { highRiskBoundary: [], mediumRiskBoundary: [] };
    }
  }

  /**
   * Calculate bounding box for sensors
   */
  calculateBounds(sensors) {
    if (!sensors || sensors.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    const validSensors = sensors.filter((s) => hasValidSensorPosition(s));
    if (validSensors.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    const lats = validSensors.map((s) => s.position.lat);
    const lngs = validSensors.map((s) => s.position.lng);

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };
  }

  /**
   * Calculate Convex Hull using Graham Scan algorithm
   */
  calculateConvexHull(points) {
    if (points.length < 3) {
      return points;
    }

    // Find the bottom-most point (or left-most in case of tie)
    let startPoint = points[0];
    for (let i = 1; i < points.length; i++) {
      if (
        points[i].lat < startPoint.lat ||
        (points[i].lat === startPoint.lat && points[i].lng < startPoint.lng)
      ) {
        startPoint = points[i];
      }
    }

    // Sort points by polar angle with respect to startPoint
    const sortedPoints = points
      .filter((p) => p !== startPoint)
      .map((p) => ({
        ...p,
        angle: this.polarAngle(startPoint, p),
        distance: this.distance(startPoint, p),
      }))
      .sort((a, b) => {
        if (Math.abs(a.angle - b.angle) < 1e-10) {
          return a.distance - b.distance;
        }
        return a.angle - b.angle;
      })
      .map((p) => ({ lat: p.lat, lng: p.lng }));

    // Graham Scan
    const hull = [startPoint];
    for (const point of sortedPoints) {
      while (
        hull.length > 1 &&
        this.crossProduct(
          hull[hull.length - 2],
          hull[hull.length - 1],
          point
        ) <= 0
      ) {
        hull.pop();
      }
      hull.push(point);
    }

    return hull;
  }

  /**
   * Apply buffer/margin around the hull points
   */
  applyBuffer(hull, marginMiles) {
    if (hull.length === 0) return hull;

    // Calculate centroid
    const centroid = {
      lat: hull.reduce((sum, p) => sum + p.lat, 0) / hull.length,
      lng: hull.reduce((sum, p) => sum + p.lng, 0) / hull.length,
    };

    // Expand each point outward from centroid
    const bufferedPoints = hull.map((point) => {
      const bearing = this.bearing(centroid, point);
      const distance = this.distance(centroid, point) + marginMiles;
      return this.destinationPoint(centroid, bearing, distance);
    });

    return bufferedPoints;
  }

  /**
   * Smooth boundary using Chaikin's corner cutting algorithm
   * This method is guaranteed not to create self-intersections or loops
   */
  smoothBoundary(points, smoothingFactor) {
    if (points.length < 3) return points;

    // Close the polygon if not already closed
    let closedPoints = [...points];
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const dist = this.distance(firstPoint, lastPoint);
    if (dist > 0.001) {
      closedPoints.push({ ...firstPoint });
    }

    // Determine number of iterations based on smoothing factor
    // More iterations = smoother, but we limit to prevent over-smoothing
    const iterations = Math.max(1, Math.min(2, Math.floor(smoothingFactor * 3)));

    let smoothed = closedPoints;

    // Apply Chaikin's corner cutting algorithm
    for (let iter = 0; iter < iterations; iter++) {
      const newPoints = [];
      const numPoints = smoothed.length;
      
      for (let i = 0; i < numPoints; i++) {
        const p0 = smoothed[i];
        const p1 = smoothed[(i + 1) % numPoints]; // Wrap around for closed polygon
        
        // Chaikin's algorithm: create two points between each pair
        // At 1/4 and 3/4 of the way between p0 and p1
        // This creates smooth curves without loops
        const q0 = {
          lat: p0.lat * 0.75 + p1.lat * 0.25,
          lng: p0.lng * 0.75 + p1.lng * 0.25,
        };
        const q1 = {
          lat: p0.lat * 0.25 + p1.lat * 0.75,
          lng: p0.lng * 0.25 + p1.lng * 0.75,
        };
        
        newPoints.push(q0);
        newPoints.push(q1);
      }
      
      smoothed = newPoints;
    }

    return smoothed;
  }

  /**
   * Catmull-Rom spline interpolation
   * Interpolates between p1 (t=0) and p2 (t=1) using control points p0 and p3
   */
  catmullRomSpline(p0, p1, p2, p3, t) {
    // Catmull-Rom spline formula
    // P(t) = 0.5 * [ (2*P1) + (-P0 + P2)*t + (2*P0 - 5*P1 + 4*P2 - P3)*t² + (-P0 + 3*P1 - 3*P2 + P3)*t³ ]
    const t2 = t * t;
    const t3 = t2 * t;

    const lat =
      0.5 *
      (2 * p1.lat +
        (-p0.lat + p2.lat) * t +
        (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 +
        (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3);

    const lng =
      0.5 *
      (2 * p1.lng +
        (-p0.lng + p2.lng) * t +
        (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 +
        (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3);

    return { lat, lng };
  }

  /**
   * Calculate polar angle between two points
   */
  polarAngle(p1, p2) {
    return Math.atan2(p2.lat - p1.lat, p2.lng - p1.lng);
  }

  /**
   * Calculate cross product for three points (for convex hull)
   */
  crossProduct(p1, p2, p3) {
    return (
      (p2.lng - p1.lng) * (p3.lat - p1.lat) -
      (p2.lat - p1.lat) * (p3.lng - p1.lng)
    );
  }

  /**
   * Calculate distance between two points in miles
   */
  distance(p1, p2) {
    const R = 3959; // Earth radius in miles
    const dLat = this.toRadians(p2.lat - p1.lat);
    const dLng = this.toRadians(p2.lng - p1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(p1.lat)) *
        Math.cos(this.toRadians(p2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate bearing between two points
   */
  bearing(p1, p2) {
    const dLng = this.toRadians(p2.lng - p1.lng);
    const lat1 = this.toRadians(p1.lat);
    const lat2 = this.toRadians(p2.lat);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return this.toDegrees(Math.atan2(y, x));
  }

  /**
   * Calculate destination point given starting point, bearing, and distance
   */
  destinationPoint(start, bearing, distanceMiles) {
    const R = 3959; // Earth radius in miles
    const lat1 = this.toRadians(start.lat);
    const lng1 = this.toRadians(start.lng);
    const brng = this.toRadians(bearing);
    const d = distanceMiles / R;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) +
        Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
      );

    return {
      lat: this.toDegrees(lat2),
      lng: this.toDegrees(lng2),
    };
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Generate cache key
   */
  getCacheKey(sensors, options) {
    const sensorIds = sensors
      .map((s) => `${s.position.lat},${s.position.lng}`)
      .sort()
      .join("|");
    return `${sensorIds}_${JSON.stringify(options)}`;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.boundaryCache.clear();
  }
}

// Export singleton instance
const fireBoundaryService = new FireBoundaryService();
export default fireBoundaryService;
