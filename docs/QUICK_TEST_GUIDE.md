# Quick Test Guide

## Running Tests

### Basic Commands

```bash
# Run all tests in watch mode (recommended for development)
npm test

# Run all tests once (for CI/CD)
npm run test:run

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Results

✅ **All 68 tests passing!**

- **geoUtils.test.js**: 27 tests - Geographic calculations and validations
- **mapUtils.test.js**: 16 tests - Google Maps utilities and icons
- **zoneUtils.test.js**: 10 tests - Zone calculations
- **fireBoundaryService.test.js**: 6 tests - Fire boundary service
- **dronePathService.test.js**: 9 tests - Drone path generation

## What's Tested

### Geographic Utilities (`geoUtils`)
- Distance calculations (Haversine formula)
- Position validation
- Sensor position validation
- Center point calculations
- Bounding box calculations
- Proximity checks

### Map Utilities (`mapUtils`)
- Google Maps API detection
- Sensor icon creation
- Drone icon creation
- Drone rotation calculations

### Zone Utilities (`zoneUtils`)
- Zone center calculations
- Zone bounds calculations
- Edge case handling

### Services
- Fire boundary calculations
- Drone path generation
- Path optimization

## Adding New Tests

1. Create test file: `src/[module]/__tests__/[module].test.js`
2. Import Vitest: `import { describe, it, expect } from 'vitest';`
3. Write tests following the existing patterns

Example:
```javascript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myModule';

describe('myModule', () => {
  it('should work correctly', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

## Coverage

Run `npm run test:coverage` to see detailed coverage reports in the `coverage/` directory.

