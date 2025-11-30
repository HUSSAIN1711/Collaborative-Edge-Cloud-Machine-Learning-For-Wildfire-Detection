// Sensor Zone Clustering Service
// Groups sensors into geographic zones using distance-based clustering

import { calculateDistance, hasValidSensorPosition } from './geoUtils';
import { calculateZoneCenter, calculateZoneBounds } from './zoneUtils';

class SensorZoneService {
  /**
   * Group sensors into zones based on geographic proximity
   * @param {Array} sensors - Array of sensor objects with position
   * @param {Object} options - Configuration options
   * @returns {Array} Array of zone objects, each containing sensors and metadata
   */
  groupSensorsIntoZones(sensors, options = {}) {
    const {
      maxZoneDistance = 0.5, // Maximum distance in miles for sensors to be in same zone
      minSensorsPerZone = 1, // Minimum sensors required to form a zone
    } = options;

    if (!sensors || sensors.length === 0) {
      return [];
    }

    try {
      // Filter out sensors without valid positions
      const validSensors = sensors.filter(hasValidSensorPosition);

      if (validSensors.length === 0) {
        return [];
      }

      // Use hierarchical clustering to group sensors
      const zones = this.clusterSensors(validSensors, maxZoneDistance);

      // Filter zones with minimum sensor count
      const validZones = zones.filter(
        (zone) => zone.sensors.length >= minSensorsPerZone
      );

      // Add zone metadata
      return validZones.map((zone, index) => ({
        id: `zone-${index + 1}`,
        name: `Zone ${index + 1}`,
        sensors: zone.sensors,
        center: calculateZoneCenter(zone.sensors),
        bounds: calculateZoneBounds(zone.sensors),
      }));
    } catch (error) {
      console.error("Error grouping sensors into zones:", error);
      // Fallback: return all sensors as a single zone
      return [
        {
          id: "zone-1",
          name: "Zone 1",
          sensors: sensors,
          center: calculateZoneCenter(sensors),
          bounds: calculateZoneBounds(sensors),
        },
      ];
    }
  }

  /**
   * Cluster sensors using distance-based grouping
   */
  clusterSensors(sensors, maxDistance) {
    const clusters = [];
    const assigned = new Set();

    for (let i = 0; i < sensors.length; i++) {
      if (assigned.has(i)) continue;

      const cluster = [sensors[i]];
      assigned.add(i);

      // Find all sensors within maxDistance
      for (let j = i + 1; j < sensors.length; j++) {
        if (assigned.has(j)) continue;

        const distance = calculateDistance(
          sensors[i].position.lat,
          sensors[i].position.lng,
          sensors[j].position.lat,
          sensors[j].position.lng
        );

        if (distance <= maxDistance) {
          cluster.push(sensors[j]);
          assigned.add(j);
        }
      }

      clusters.push({ sensors: cluster });
    }

    return clusters;
  }

}

export default new SensorZoneService();

