// Sensor Zone Clustering Service
// Groups sensors into geographic zones using distance-based clustering

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
      const validSensors = sensors.filter(
        (sensor) =>
          sensor.position &&
          typeof sensor.position.lat === "number" &&
          typeof sensor.position.lng === "number"
      );

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
        center: this.calculateZoneCenter(zone.sensors),
        bounds: this.calculateZoneBounds(zone.sensors),
      }));
    } catch (error) {
      console.error("Error grouping sensors into zones:", error);
      // Fallback: return all sensors as a single zone
      return [
        {
          id: "zone-1",
          name: "Zone 1",
          sensors: sensors,
          center: this.calculateZoneCenter(sensors),
          bounds: this.calculateZoneBounds(sensors),
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

        const distance = this.calculateDistance(
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

  /**
   * Calculate the center point of a zone
   */
  calculateZoneCenter(sensors) {
    if (sensors.length === 0) {
      return { lat: 0, lng: 0 };
    }

    const sum = sensors.reduce(
      (acc, sensor) => ({
        lat: acc.lat + sensor.position.lat,
        lng: acc.lng + sensor.position.lng,
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / sensors.length,
      lng: sum.lng / sensors.length,
    };
  }

  /**
   * Calculate bounding box for a zone
   */
  calculateZoneBounds(sensors) {
    if (sensors.length === 0) {
      return {
        north: 0,
        south: 0,
        east: 0,
        west: 0,
      };
    }

    const lats = sensors.map((s) => s.position.lat);
    const lngs = sensors.map((s) => s.position.lng);

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };
  }

  /**
   * Calculate distance between two coordinates in miles
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export default new SensorZoneService();

