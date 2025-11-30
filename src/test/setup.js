// Test setup file for Vitest
import { vi } from 'vitest';

// Mock window.google for map utilities
global.window = global.window || {};
global.window.google = {
  maps: {
    SymbolPath: {
      CIRCLE: 0,
      FORWARD_CLOSED_ARROW: 1,
    },
  },
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

