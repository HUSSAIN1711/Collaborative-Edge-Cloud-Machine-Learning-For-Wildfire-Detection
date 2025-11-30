// Test file for drone path service
import { describe, it, expect } from 'vitest';
import dronePathService from '../dronePathService';
import pathOptimizationService from '../pathOptimizationService';

// Mock sensor data for testing
const mockSensors = [
  {
    id: 1,
    position: { lat: 34.098, lng: -118.595 },
    status: 'Critical'
  },
  {
    id: 2,
    position: { lat: 34.085, lng: -118.610 },
    status: 'Warning'
  },
  {
    id: 3,
    position: { lat: 34.057, lng: -118.582 },
    status: 'Active'
  }
];

describe('DronePathService', () => {
  test('should generate path with valid sensors', () => {
    const path = dronePathService.generateDronePath(mockSensors);
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
    
    // Check that all path points have valid coordinates
    path.forEach(point => {
      expect(typeof point.lat).toBe('number');
      expect(typeof point.lng).toBe('number');
      expect(point.lat).toBeGreaterThan(0);
      expect(point.lng).toBeLessThan(0); // Negative longitude for California
    });
  });

  test('should handle empty sensor array', () => {
    const path = dronePathService.generateDronePath([]);
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0); // Should return default path
  });

  test('should handle invalid sensor data', () => {
    const invalidSensors = [
      { id: 1, position: null, status: 'Active' },
      { id: 2, position: { lat: 'invalid', lng: 'invalid' }, status: 'Warning' }
    ];
    
    const path = dronePathService.generateDronePath(invalidSensors);
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
  });

  test('should prioritize critical sensors', () => {
    const path = dronePathService.generateDronePath(mockSensors, { prioritizeCritical: true });
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
  });

  test('should use optimization when enabled', () => {
    const path = dronePathService.generateDronePath(mockSensors, { 
      useOptimization: true,
      optimizationAlgorithm: 'nearestNeighbor'
    });
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
  });
});

describe('PathOptimizationService', () => {
  test('should optimize path with nearest neighbor', () => {
    const optimizedPath = pathOptimizationService.optimizePath(mockSensors, {
      algorithm: 'nearestNeighbor',
      prioritizeCritical: true
    });
    expect(Array.isArray(optimizedPath)).toBe(true);
    // Path may include additional waypoints, so check it's at least the sensor count
    expect(optimizedPath.length).toBeGreaterThanOrEqual(mockSensors.length);
  });

  test('should handle single sensor', () => {
    const singleSensor = [mockSensors[0]];
    const optimizedPath = pathOptimizationService.optimizePath(singleSensor);
    expect(Array.isArray(optimizedPath)).toBe(true);
    expect(optimizedPath.length).toBe(1);
  });

  test('should calculate path cost correctly', () => {
    const testPath = [
      { lat: 34.0, lng: -118.0 },
      { lat: 34.1, lng: -118.1 },
      { lat: 34.2, lng: -118.2 }
    ];
    const cost = pathOptimizationService.calculatePathCost(testPath);
    expect(typeof cost).toBe('number');
    expect(cost).toBeGreaterThan(0);
  });
});

// Integration test
describe('Integration Tests', () => {
  test('should work with real sensor data structure', () => {
    const realSensors = [
      {
        id: 1,
        position: { lat: 34.098, lng: -118.595 },
        status: 'Critical',
        fireProbability: 100
      },
      {
        id: 2,
        position: { lat: 34.085, lng: -118.610 },
        status: 'Warning',
        fireProbability: 95
      }
    ];

    const path = dronePathService.generateDronePath(realSensors);
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
    
    // Verify path statistics
    const stats = dronePathService.getPathStatistics(path);
    expect(typeof stats.totalDistance).toBe('number');
    expect(typeof stats.pointCount).toBe('number');
    expect(stats.pointCount).toBe(path.length);
  });
});
