// src/services/droneImageService.js

/**
 * Maps (zoneId, simulation timestamp) → image path.
 *
 * Each zone has three time-phase buckets that represent how the visual
 * landscape changes as the fire progresses:
 *   early  — t < 10 ticks   (pre-fire / light smoke)
 *   mid    — 10 ≤ t < 30    (active fire)
 *   late   — t ≥ 30         (intense fire)
 *
 * The image paths reference existing files in /public/sensor-images/.
 */

const imageMap = {
  "zone-1": {
    early: "/sensor-images/sensor-1.jpg",
    mid: "/sensor-images/sensor-3.webp",
    late: "/sensor-images/sensor-5.webp",
  },
  "zone-2": {
    early: "/sensor-images/sensor-11.jpg",
    mid: "/sensor-images/sensor-13.jpg",
    late: "/sensor-images/sensor-10.jpg",
  },
  "zone-3": {
    early: "/sensor-images/sensor-17.webp",
    mid: "/sensor-images/sensor-19.jpg",
    late: "/sensor-images/sensor-22.jpg",
  },
};

const EARLY_THRESHOLD = 10;
const LATE_THRESHOLD = 30;

/**
 * Determine the time-phase bucket for a given timestamp.
 * @param {number} timestamp — simulation tick
 * @returns {"early"|"mid"|"late"}
 */
function getTimePhase(timestamp) {
  if (timestamp < EARLY_THRESHOLD) return "early";
  if (timestamp < LATE_THRESHOLD) return "mid";
  return "late";
}

/**
 * Return the image path that the drone camera should display for the
 * given zone and simulation timestamp.
 *
 * @param {string} zoneId    — e.g. "zone-1"
 * @param {number} timestamp — current simulation tick
 * @returns {string} image path (relative to public/)
 */
export function getDroneImage(zoneId, timestamp) {
  const phase = getTimePhase(timestamp);
  const zoneImages = imageMap[zoneId];
  if (!zoneImages) {
    return "/sensor-images/sensor-1.jpg"; // fallback
  }
  return zoneImages[phase];
}

export default { getDroneImage };
