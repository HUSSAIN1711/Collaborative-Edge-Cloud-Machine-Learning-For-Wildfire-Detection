import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  isValidPosition,
  hasValidSensorPosition,
  calculateCenter,
  calculateBounds,
  isDroneNearSensor,
} from '../geoUtils';

describe('geoUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Distance between Los Angeles and San Francisco (approximately 350 miles)
      const la = { lat: 34.0522, lng: -118.2437 };
      const sf = { lat: 37.7749, lng: -122.4194 };
      const distance = calculateDistance(la.lat, la.lng, sf.lat, sf.lng);
      
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(400);
      expect(typeof distance).toBe('number');
    });

    it('should return 0 for identical coordinates', () => {
      const distance = calculateDistance(34.0522, -118.2437, 34.0522, -118.2437);
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(34.0, -118.0, 35.0, -119.0);
      expect(distance).toBeGreaterThan(0);
      expect(typeof distance).toBe('number');
    });

    it('should calculate small distances accurately', () => {
      // Two points very close together (should be less than 1 mile)
      const distance = calculateDistance(34.0522, -118.2437, 34.0523, -118.2438);
      expect(distance).toBeLessThan(1);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('isValidPosition', () => {
    it('should return true for valid position', () => {
      expect(isValidPosition({ lat: 34.0522, lng: -118.2437 })).toBe(true);
    });

    it('should return false for null position', () => {
      expect(isValidPosition(null)).toBeFalsy();
      expect(isValidPosition(undefined)).toBeFalsy();
    });

    it('should return false for missing lat or lng', () => {
      expect(isValidPosition({ lat: 34.0522 })).toBe(false);
      expect(isValidPosition({ lng: -118.2437 })).toBe(false);
      expect(isValidPosition({})).toBe(false);
    });

    it('should return false for non-number coordinates', () => {
      expect(isValidPosition({ lat: '34.0522', lng: -118.2437 })).toBe(false);
      expect(isValidPosition({ lat: 34.0522, lng: '-118.2437' })).toBe(false);
      expect(isValidPosition({ lat: null, lng: -118.2437 })).toBe(false);
    });

    it('should return false for NaN coordinates', () => {
      expect(isValidPosition({ lat: NaN, lng: -118.2437 })).toBe(false);
      expect(isValidPosition({ lat: 34.0522, lng: NaN })).toBe(false);
    });
  });

  describe('hasValidSensorPosition', () => {
    it('should return true for sensor with valid position', () => {
      const sensor = {
        id: 1,
        position: { lat: 34.0522, lng: -118.2437 },
        status: 'Active',
      };
      expect(hasValidSensorPosition(sensor)).toBe(true);
    });

    it('should return false for null sensor', () => {
      expect(hasValidSensorPosition(null)).toBeFalsy();
      expect(hasValidSensorPosition(undefined)).toBeFalsy();
    });

    it('should return false for sensor without position', () => {
      expect(hasValidSensorPosition({ id: 1, status: 'Active' })).toBeFalsy();
    });

    it('should return false for sensor with invalid position', () => {
      const sensor = {
        id: 1,
        position: { lat: 'invalid', lng: -118.2437 },
        status: 'Active',
      };
      expect(hasValidSensorPosition(sensor)).toBe(false);
    });
  });

  describe('calculateCenter', () => {
    it('should calculate center of multiple positions', () => {
      const positions = [
        { lat: 34.0, lng: -118.0 },
        { lat: 35.0, lng: -119.0 },
        { lat: 36.0, lng: -120.0 },
      ];
      const center = calculateCenter(positions);
      
      expect(center.lat).toBe(35.0);
      expect(center.lng).toBe(-119.0);
    });

    it('should return default for empty array', () => {
      const center = calculateCenter([]);
      expect(center).toEqual({ lat: 0, lng: 0 });
    });

    it('should return default for null/undefined', () => {
      expect(calculateCenter(null)).toEqual({ lat: 0, lng: 0 });
      expect(calculateCenter(undefined)).toEqual({ lat: 0, lng: 0 });
    });

    it('should filter out invalid positions', () => {
      const positions = [
        { lat: 34.0, lng: -118.0 },
        { lat: 'invalid', lng: -119.0 },
        { lat: 36.0, lng: -120.0 },
      ];
      const center = calculateCenter(positions);
      
      expect(center.lat).toBe(35.0); // Average of valid positions
      expect(center.lng).toBe(-119.0);
    });

    it('should handle single position', () => {
      const positions = [{ lat: 34.0522, lng: -118.2437 }];
      const center = calculateCenter(positions);
      
      expect(center.lat).toBe(34.0522);
      expect(center.lng).toBe(-118.2437);
    });
  });

  describe('calculateBounds', () => {
    it('should calculate bounds correctly', () => {
      const positions = [
        { lat: 34.0, lng: -120.0 },
        { lat: 35.0, lng: -118.0 },
        { lat: 36.0, lng: -119.0 },
      ];
      const bounds = calculateBounds(positions);
      
      expect(bounds.north).toBe(36.0);
      expect(bounds.south).toBe(34.0);
      expect(bounds.east).toBe(-118.0);
      expect(bounds.west).toBe(-120.0);
    });

    it('should return default for empty array', () => {
      const bounds = calculateBounds([]);
      expect(bounds).toEqual({ north: 0, south: 0, east: 0, west: 0 });
    });

    it('should filter out invalid positions', () => {
      const positions = [
        { lat: 34.0, lng: -120.0 },
        { lat: 'invalid', lng: -118.0 },
        { lat: 36.0, lng: -119.0 },
      ];
      const bounds = calculateBounds(positions);
      
      expect(bounds.north).toBe(36.0);
      expect(bounds.south).toBe(34.0);
    });

    it('should handle single position', () => {
      const positions = [{ lat: 34.0522, lng: -118.2437 }];
      const bounds = calculateBounds(positions);
      
      expect(bounds.north).toBe(34.0522);
      expect(bounds.south).toBe(34.0522);
      expect(bounds.east).toBe(-118.2437);
      expect(bounds.west).toBe(-118.2437);
    });
  });

  describe('isDroneNearSensor', () => {
    it('should return true when drone is within proximity', () => {
      const dronePosition = { lat: 34.0522, lng: -118.2437 };
      const sensorPosition = { lat: 34.0523, lng: -118.2438 };
      
      expect(isDroneNearSensor(dronePosition, sensorPosition, 0.1)).toBe(true);
    });

    it('should return false when drone is too far', () => {
      const dronePosition = { lat: 34.0522, lng: -118.2437 };
      const sensorPosition = { lat: 35.0, lng: -119.0 };
      
      expect(isDroneNearSensor(dronePosition, sensorPosition, 0.1)).toBe(false);
    });

    it('should use default proximity of 0.1 miles', () => {
      const dronePosition = { lat: 34.0522, lng: -118.2437 };
      const sensorPosition = { lat: 34.0523, lng: -118.2438 };
      
      expect(isDroneNearSensor(dronePosition, sensorPosition)).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(isDroneNearSensor(null, { lat: 34.0, lng: -118.0 })).toBe(false);
      expect(isDroneNearSensor({ lat: 34.0, lng: -118.0 }, null)).toBe(false);
      expect(isDroneNearSensor({ lat: 'invalid', lng: -118.0 }, { lat: 34.0, lng: -118.0 })).toBe(false);
    });

    it('should handle custom proximity threshold', () => {
      const dronePosition = { lat: 34.0522, lng: -118.2437 };
      const sensorPosition = { lat: 34.1, lng: -118.3 };
      
      expect(isDroneNearSensor(dronePosition, sensorPosition, 10)).toBe(true);
      expect(isDroneNearSensor(dronePosition, sensorPosition, 0.01)).toBe(false);
    });
  });
});

