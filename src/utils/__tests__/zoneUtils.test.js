import { describe, it, expect } from 'vitest';
import { calculateZoneCenter, calculateZoneBounds } from '../zoneUtils';

describe('zoneUtils', () => {
  const mockSensors = [
    { id: 1, position: { lat: 34.0, lng: -118.0 }, status: 'Active' },
    { id: 2, position: { lat: 35.0, lng: -119.0 }, status: 'Warning' },
    { id: 3, position: { lat: 36.0, lng: -120.0 }, status: 'Critical' },
  ];

  describe('calculateZoneCenter', () => {
    it('should calculate center from sensors', () => {
      const center = calculateZoneCenter(mockSensors);
      
      expect(center.lat).toBe(35.0);
      expect(center.lng).toBe(-119.0);
    });

    it('should return default for empty array', () => {
      expect(calculateZoneCenter([])).toEqual({ lat: 0, lng: 0 });
    });

    it('should return default for null/undefined', () => {
      expect(calculateZoneCenter(null)).toEqual({ lat: 0, lng: 0 });
      expect(calculateZoneCenter(undefined)).toEqual({ lat: 0, lng: 0 });
    });

    it('should handle sensors with null positions', () => {
      const sensorsWithNull = [
        { id: 1, position: { lat: 34.0, lng: -118.0 } },
        { id: 2, position: null },
        { id: 3, position: { lat: 36.0, lng: -120.0 } },
      ];
      const center = calculateZoneCenter(sensorsWithNull);
      
      expect(center.lat).toBe(35.0);
      expect(center.lng).toBe(-119.0);
    });

    it('should handle single sensor', () => {
      const center = calculateZoneCenter([mockSensors[0]]);
      expect(center.lat).toBe(34.0);
      expect(center.lng).toBe(-118.0);
    });
  });

  describe('calculateZoneBounds', () => {
    it('should calculate bounds from sensors', () => {
      const bounds = calculateZoneBounds(mockSensors);
      
      expect(bounds.north).toBe(36.0);
      expect(bounds.south).toBe(34.0);
      expect(bounds.east).toBe(-118.0);
      expect(bounds.west).toBe(-120.0);
    });

    it('should return default for empty array', () => {
      expect(calculateZoneBounds([])).toEqual({ north: 0, south: 0, east: 0, west: 0 });
    });

    it('should return default for null/undefined', () => {
      expect(calculateZoneBounds(null)).toEqual({ north: 0, south: 0, east: 0, west: 0 });
      expect(calculateZoneBounds(undefined)).toEqual({ north: 0, south: 0, east: 0, west: 0 });
    });

    it('should handle sensors with null positions', () => {
      const sensorsWithNull = [
        { id: 1, position: { lat: 34.0, lng: -120.0 } },
        { id: 2, position: null },
        { id: 3, position: { lat: 36.0, lng: -118.0 } },
      ];
      const bounds = calculateZoneBounds(sensorsWithNull);
      
      expect(bounds.north).toBe(36.0);
      expect(bounds.south).toBe(34.0);
    });

    it('should handle single sensor', () => {
      const bounds = calculateZoneBounds([mockSensors[0]]);
      expect(bounds.north).toBe(34.0);
      expect(bounds.south).toBe(34.0);
      expect(bounds.east).toBe(-118.0);
      expect(bounds.west).toBe(-118.0);
    });
  });
});

