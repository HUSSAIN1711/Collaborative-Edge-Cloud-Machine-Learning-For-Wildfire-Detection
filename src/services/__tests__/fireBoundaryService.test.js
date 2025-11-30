import { describe, it, expect } from 'vitest';
import fireBoundaryService from '../fireBoundaryService';

describe('FireBoundaryService', () => {
  const mockSensors = [
    {
      id: 1,
      position: { lat: 34.0, lng: -118.0 },
      fireProbability: 90,
      status: 'Critical',
    },
    {
      id: 2,
      position: { lat: 34.1, lng: -118.1 },
      fireProbability: 85,
      status: 'Warning',
    },
    {
      id: 3,
      position: { lat: 34.2, lng: -118.2 },
      fireProbability: 75,
      status: 'Warning',
    },
    {
      id: 4,
      position: { lat: 35.0, lng: -119.0 },
      fireProbability: 50,
      status: 'Active',
    },
  ];

  describe('calculateFireBoundary', () => {
    it('should calculate boundary for high-risk sensors', () => {
      const boundary = fireBoundaryService.calculateFireBoundary(mockSensors, {
        probabilityThreshold: 70,
      });
      
      expect(Array.isArray(boundary)).toBe(true);
      expect(boundary.length).toBeGreaterThan(0);
    });

    it('should return empty array when not enough sensors', () => {
      const boundary = fireBoundaryService.calculateFireBoundary(
        [mockSensors[0]],
        { minSensors: 2 }
      );
      
      expect(boundary).toEqual([]);
    });

    it('should filter by probability threshold', () => {
      const boundary = fireBoundaryService.calculateFireBoundary(mockSensors, {
        probabilityThreshold: 80,
      });
      
      expect(Array.isArray(boundary)).toBe(true);
    });

    it('should handle empty sensor array', () => {
      const boundary = fireBoundaryService.calculateFireBoundary([]);
      expect(boundary).toEqual([]);
    });

    it('should handle sensors with invalid positions', () => {
      const invalidSensors = [
        { id: 1, position: null, fireProbability: 90 },
        { id: 2, position: { lat: 'invalid', lng: -118.0 }, fireProbability: 85 },
      ];
      
      const boundary = fireBoundaryService.calculateFireBoundary(invalidSensors);
      expect(Array.isArray(boundary)).toBe(true);
    });

    it('should use caching', () => {
      const boundary1 = fireBoundaryService.calculateFireBoundary(mockSensors);
      const boundary2 = fireBoundaryService.calculateFireBoundary(mockSensors);
      
      expect(boundary1).toEqual(boundary2);
    });
  });
});

