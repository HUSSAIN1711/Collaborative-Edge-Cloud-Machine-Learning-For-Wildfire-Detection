// src/services/fireEnvironmentService.js

/**
 * FireEnvironment — the "Fire Layer" for the simulation.
 *
 * Stores baseline environmental conditions and one or more fire-origin
 * points whose influence grows with the simulation timestamp.
 *
 * The public API is a single method:
 *   getConditions(lat, lng, timestamp) → { temperature, humidity,
 *       windSpeed, windDirection, fireProbability, firePercentage, status }
 */
class FireEnvironment {
  constructor() {
    // ── Baseline (ambient) conditions ──────────────────────────────
    this.baseTemperature = 75; // °F
    this.baseHumidity = 40; // %
    this.baseWindSpeed = 8; // mph
    this.baseWindDirection = 225; // degrees (SW wind)

    // ── Fire-origin points ────────────────────────────────────────
    // Each origin is placed inside a zone so the fire "starts" there
    // and gradually spreads outward as the simulation advances.
    this.fireOrigins = [
      {
        // Zone 1 — primary ignition near sensor 7
        lat: 34.24,
        lng: -117.215,
        baseRadius: 0.005, // degrees (~500 m)
        spreadRate: 0.002, // radius growth per tick
        maxTempBoost: 120, // °F above baseline at epicentre
      },
      {
        // Zone 2 — secondary ignition near sensor 10
        lat: 34.245,
        lng: -118.142,
        baseRadius: 0.003,
        spreadRate: 0.0015,
        maxTempBoost: 100,
      },
      {
        // Zone 3 — late-stage ignition near sensor 19
        lat: 37.195,
        lng: -119.265,
        baseRadius: 0.002,
        spreadRate: 0.001,
        maxTempBoost: 90,
        delayTicks: 15, // fire doesn't start until tick 15
      },
    ];
  }

  // ── Helpers ───────────────────────────────────────────────────────

  /**
   * Euclidean distance in degrees (sufficient for the small areas we cover).
   */
  _degreeDistance(lat1, lng1, lat2, lng2) {
    const dLat = lat1 - lat2;
    const dLng = lng1 - lng2;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  /**
   * Derive a status label from fireProbability.
   */
  _deriveStatus(fireProbability) {
    if (fireProbability >= 70) return "Critical";
    if (fireProbability >= 40) return "Warning";
    return "Active";
  }

  // ── Core API ──────────────────────────────────────────────────────

  /**
   * Return the simulated environmental conditions at a given position
   * and simulation tick.
   *
   * @param {number} lat  — latitude
   * @param {number} lng  — longitude
   * @param {number} timestamp — simulation tick (0, 1, 2, …)
   * @returns {{ temperature: number, humidity: number, windSpeed: number,
   *             windDirection: number, fireProbability: number,
   *             firePercentage: number, status: string }}
   */
  getConditions(lat, lng, timestamp) {
    let tempBoost = 0;
    let humidityDrop = 0;
    let windBoost = 0;

    for (const origin of this.fireOrigins) {
      const effectiveTime = timestamp - (origin.delayTicks || 0);
      if (effectiveTime <= 0) continue; // fire hasn't started at this origin yet

      const radius = origin.baseRadius + origin.spreadRate * effectiveTime;
      const distance = this._degreeDistance(lat, lng, origin.lat, origin.lng);

      if (distance < radius * 5) {
        // Exponential decay with distance; intensity grows with time
        const intensity = Math.min(effectiveTime / 50, 1); // ramps 0→1 over 50 ticks
        const decay = Math.exp(-distance / Math.max(radius, 0.001));
        const boost = origin.maxTempBoost * intensity * decay;

        tempBoost = Math.max(tempBoost, boost);
        humidityDrop = Math.max(humidityDrop, boost * 0.25);
        windBoost = Math.max(windBoost, boost * 0.12);
      }
    }

    const temperature = Math.round(this.baseTemperature + tempBoost);
    const humidity = Math.round(
      Math.max(5, this.baseHumidity - humidityDrop)
    );
    const windSpeed = Math.round(this.baseWindSpeed + windBoost);
    const windDirection = Math.round(
      (this.baseWindDirection + windBoost * 2) % 360
    );

    // Fire probability: 50% baseline so boundaries are visible from t=0,
    // then climbs toward 100% near active fire origins as tempBoost grows.
    const fireProbability = Math.round(
      Math.min(100, Math.max(0, 50 + tempBoost * 0.4))
    );
    const firePercentage = Math.round(
      Math.min(100, Math.max(0, 50 + tempBoost * 0.35))
    );
    const status = this._deriveStatus(fireProbability);

    return {
      temperature,
      humidity,
      windSpeed,
      windDirection,
      fireProbability,
      firePercentage,
      status,
    };
  }
}

// Export a singleton so every consumer shares the same instance
const fireEnvironment = new FireEnvironment();
export default fireEnvironment;
