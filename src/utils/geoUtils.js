// Geographic utility functions
// Centralized location for common geographic calculations

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in miles
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
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

/**
 * Check if a position object has valid coordinates
 * @param {Object} position - Position object with lat and lng
 * @returns {boolean} True if position is valid
 */
export function isValidPosition(position) {
  return (
    position &&
    typeof position.lat === "number" &&
    typeof position.lng === "number" &&
    !isNaN(position.lat) &&
    !isNaN(position.lng)
  );
}

/**
 * Check if a sensor has a valid position
 * @param {Object} sensor - Sensor object
 * @returns {boolean} True if sensor has valid position
 */
export function hasValidSensorPosition(sensor) {
  return sensor && isValidPosition(sensor.position);
}

/**
 * Calculate the center point (centroid) of an array of positions
 * @param {Array} positions - Array of position objects with lat and lng
 * @returns {Object} Center point {lat, lng}
 */
export function calculateCenter(positions) {
  if (!positions || positions.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const validPositions = positions.filter(isValidPosition);
  if (validPositions.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = validPositions.reduce(
    (acc, pos) => ({
      lat: acc.lat + pos.lat,
      lng: acc.lng + pos.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / validPositions.length,
    lng: sum.lng / validPositions.length,
  };
}

/**
 * Calculate bounding box for an array of positions
 * @param {Array} positions - Array of position objects with lat and lng
 * @returns {Object} Bounds object {north, south, east, west}
 */
export function calculateBounds(positions) {
  if (!positions || positions.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  const validPositions = positions.filter(isValidPosition);
  if (validPositions.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  const lats = validPositions.map((p) => p.lat);
  const lngs = validPositions.map((p) => p.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}

/**
 * Check if drone is within proximity of a sensor
 * @param {Object} dronePosition - Drone position {lat, lng}
 * @param {Object} sensorPosition - Sensor position {lat, lng}
 * @param {number} proximityMiles - Proximity threshold in miles (default: 0.1)
 * @returns {boolean} True if drone is within proximity
 */
export function isDroneNearSensor(
  dronePosition,
  sensorPosition,
  proximityMiles = 0.1
) {
  if (!isValidPosition(dronePosition) || !isValidPosition(sensorPosition)) {
    return false;
  }

  const distance = calculateDistance(
    dronePosition.lat,
    dronePosition.lng,
    sensorPosition.lat,
    sensorPosition.lng
  );
  return distance <= proximityMiles;
}

