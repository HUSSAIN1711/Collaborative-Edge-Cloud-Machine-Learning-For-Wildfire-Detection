// Fire Boundary Calculation Service
// Calculates dynamic fire boundaries from sensor data with smoothing

import { hasValidSensorPosition } from '../utils/geoUtils';

class FireBoundaryService {
  constructor() {
    this.boundaryCache = new Map();
    this.cacheTimeout = 60 * 1000; // 1 minute cache
  }

  /**
   * Calculate fire boundary from sensors with fireProbability >= 70%
   * @param {Array} sensors - Array of sensor objects with position and fireProbability
   * @param {Object} options - Configuration options
   * @returns {Array} Array of coordinate objects {lat, lng} forming a smooth boundary
   */
  calculateFireBoundary(sensors, options = {}) {
    const {
      probabilityThreshold = 70,
      marginMiles = 0.15, // Margin around sensors in miles
      smoothingFactor = 0.5, // Smoothing factor (0-1, higher = more smooth)
      minSensors = 2, // Minimum sensors needed to create boundary
    } = options;

    try {
      // Filter sensors with high fire probability and valid positions
      const highRiskSensors = sensors.filter(
        (sensor) =>
          sensor.fireProbability >= probabilityThreshold &&
          hasValidSensorPosition(sensor)
      );

      if (highRiskSensors.length < minSensors) {
        console.log(
          `Not enough high-risk sensors (${highRiskSensors.length}) for boundary calculation`
        );
        return [];
      }

      // Check cache
      const cacheKey = this.getCacheKey(highRiskSensors, options);
      const cached = this.boundaryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.boundary;
      }

      // Extract sensor positions
      const points = highRiskSensors.map((sensor) => ({
        lat: sensor.position.lat,
        lng: sensor.position.lng,
      }));

      // Calculate convex hull
      const hull = this.calculateConvexHull(points);

      // Apply margin/buffer around the hull
      const bufferedHull = this.applyBuffer(hull, marginMiles);

      // Smooth the boundary with curves
      const smoothedBoundary = this.smoothBoundary(
        bufferedHull,
        smoothingFactor
      );

      // Cache the result
      this.boundaryCache.set(cacheKey, {
        boundary: smoothedBoundary,
        timestamp: Date.now(),
      });

      return smoothedBoundary;
    } catch (error) {
      console.error("Error calculating fire boundary:", error);
      return [];
    }
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
   * Smooth boundary using Catmull-Rom splines
   */
  smoothBoundary(points, smoothingFactor) {
    if (points.length < 3) return points;

    // Close the polygon by duplicating points for wrap-around
    const closedPoints = [
      points[points.length - 1],
      ...points,
      points[0],
      points.length > 1 ? points[1] : points[0],
    ];

    // Generate smoothed points using Catmull-Rom splines
    const smoothed = [];
    // Use smoothingFactor to determine number of segments (more segments = smoother)
    // smoothingFactor 0.3 = 10 segments, 0.5 = 15 segments, 1.0 = 30 segments
    const numSegments = Math.max(10, Math.floor(30 * smoothingFactor));

    // Process each segment between consecutive points
    for (let i = 1; i < closedPoints.length - 2; i++) {
      const p0 = closedPoints[i - 1];
      const p1 = closedPoints[i]; // Start point
      const p2 = closedPoints[i + 1]; // End point
      const p3 = closedPoints[i + 2];

      // Generate points along the spline from p1 to p2
      for (let j = 0; j <= numSegments; j++) {
        const t = j / numSegments; // t goes from 0 to 1
        const point = this.catmullRomSpline(p0, p1, p2, p3, t);

        // Always add the first point of each segment
        // Skip the last point (when j == numSegments) to avoid duplicates at boundaries
        // The next segment will start with the same point anyway
        if (j < numSegments) {
          smoothed.push(point);
        }
      }
    }

    // Ensure the polygon is closed
    if (smoothed.length > 0) {
      const firstPoint = smoothed[0];
      const lastPoint = smoothed[smoothed.length - 1];
      const distance = this.distance(
        { lat: firstPoint.lat, lng: firstPoint.lng },
        { lat: lastPoint.lat, lng: lastPoint.lng }
      );

      // Only close if not already closed (within 0.001 miles)
      if (distance > 0.001) {
        smoothed.push({ ...firstPoint });
      }
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
