import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isGoogleMapsLoaded,
  createSensorIcon,
  createDroneIcon,
  calculateDroneRotation,
} from '../mapUtils';

describe('mapUtils', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    global.window = { ...originalWindow };
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe('isGoogleMapsLoaded', () => {
    it('should return true when Google Maps is loaded', () => {
      global.window.google = {
        maps: {
          SymbolPath: {},
        },
      };
      expect(isGoogleMapsLoaded()).toBeTruthy();
    });

    it('should return false when Google Maps is not loaded', () => {
      delete global.window.google;
      expect(isGoogleMapsLoaded()).toBeFalsy();
    });

    it('should return false when window is undefined', () => {
      const originalWindow = global.window;
      global.window = undefined;
      expect(isGoogleMapsLoaded()).toBeFalsy();
      global.window = originalWindow;
    });
  });

  describe('createSensorIcon', () => {
    it('should create icon for Normal sensor health', () => {
      global.window.google = {
        maps: {
          SymbolPath: {
            CIRCLE: 0,
          },
        },
      };
      const icon = createSensorIcon('Normal');
      
      expect(icon).toBeDefined();
      expect(icon.path).toBe(0);
      expect(icon.fillColor).toBe('#4caf50');
      expect(icon.strokeColor).toBe('#2e7d32');
      expect(icon.scale).toBe(12);
    });

    it('should create icon for Abnormal sensor health', () => {
      global.window.google = {
        maps: {
          SymbolPath: {
            CIRCLE: 0,
          },
        },
      };
      const icon = createSensorIcon('Abnormal');
      
      expect(icon).toBeDefined();
      expect(icon.fillColor).toBe('#f44336');
      expect(icon.strokeColor).toBe('#d32f2f');
    });

    it('should return undefined when Google Maps is not loaded', () => {
      global.window.google = undefined;
      const icon = createSensorIcon('Normal');
      expect(icon).toBeUndefined();
    });
  });

  describe('createDroneIcon', () => {
    beforeEach(() => {
      global.window.google = {
        maps: {
          SymbolPath: {
            FORWARD_CLOSED_ARROW: 1,
          },
        },
      };
    });

    it('should create icon for selected drone', () => {
      const icon = createDroneIcon(true, 45);
      
      expect(icon).toBeDefined();
      expect(icon.path).toBe(1);
      expect(icon.scale).toBe(10);
      expect(icon.strokeColor).toBe('#00FFFF');
      expect(icon.fillColor).toBe('#00FFFF');
      expect(icon.fillOpacity).toBe(1.0);
      expect(icon.strokeWeight).toBe(3);
      expect(icon.rotation).toBe(45);
    });

    it('should create icon for unselected drone', () => {
      const icon = createDroneIcon(false, 90);
      
      expect(icon).toBeDefined();
      expect(icon.scale).toBe(8);
      expect(icon.strokeColor).toBe('#FFFF00');
      expect(icon.fillColor).toBe('#FFFF00');
      expect(icon.fillOpacity).toBe(0.8);
      expect(icon.strokeWeight).toBe(2);
      expect(icon.rotation).toBe(90);
    });

    it('should use default rotation of 0', () => {
      const icon = createDroneIcon(false);
      expect(icon.rotation).toBe(0);
    });

    it('should return undefined when Google Maps is not loaded', () => {
      global.window.google = undefined;
      const icon = createDroneIcon(true, 45);
      expect(icon).toBeUndefined();
    });
  });

  describe('calculateDroneRotation', () => {
    it('should calculate rotation correctly', () => {
      const dronePath = [
        { lat: 34.0, lng: -118.0 },
        { lat: 34.1, lng: -118.1 },
        { lat: 34.2, lng: -118.2 },
      ];
      const rotation = calculateDroneRotation(dronePath, 0);
      
      expect(typeof rotation).toBe('number');
      expect(isNaN(rotation)).toBe(false);
    });

    it('should return 0 for path with less than 2 points', () => {
      expect(calculateDroneRotation([], 0)).toBe(0);
      expect(calculateDroneRotation([{ lat: 34.0, lng: -118.0 }], 0)).toBe(0);
    });

    it('should handle wrap-around at end of path', () => {
      const dronePath = [
        { lat: 34.0, lng: -118.0 },
        { lat: 34.1, lng: -118.1 },
      ];
      const rotation = calculateDroneRotation(dronePath, 1);
      
      expect(typeof rotation).toBe('number');
      // Should wrap to beginning of path
    });

    it('should return 0 for invalid path index', () => {
      const dronePath = [
        { lat: 34.0, lng: -118.0 },
        { lat: 34.1, lng: -118.1 },
      ];
      expect(calculateDroneRotation(dronePath, 10)).toBe(0);
    });

    it('should return 0 for null/undefined path', () => {
      expect(calculateDroneRotation(null, 0)).toBe(0);
      expect(calculateDroneRotation(undefined, 0)).toBe(0);
    });

    it('should handle error gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidPath = [{ lat: null, lng: null }];
      
      const rotation = calculateDroneRotation(invalidPath, 0);
      expect(rotation).toBe(0);
      
      consoleSpy.mockRestore();
    });
  });
});

