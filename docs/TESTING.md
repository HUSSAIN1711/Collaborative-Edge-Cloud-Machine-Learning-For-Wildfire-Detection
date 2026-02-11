# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit testing. Vitest is a fast, Vite-native test runner that's perfect for React projects.

## Installation

The testing dependencies are already included in `package.json`. If you need to install them:

```bash
npm install
```

## Running Tests

### Run all tests in watch mode
```bash
npm test
```
This will start Vitest in watch mode, automatically re-running tests when files change.

### Run all tests once (CI mode)
```bash
npm run test:run
```
This runs all tests once and exits - perfect for CI/CD pipelines.

### Run tests with UI
```bash
npm run test:ui
```
This opens a web-based UI where you can see test results, coverage, and debug tests interactively.

### Run tests with coverage report
```bash
npm run test:coverage
```
This generates a coverage report showing which parts of your code are tested.

## Test Structure

Tests are organized to mirror the source code structure:

```
src/
├── utils/
│   ├── __tests__/
│   │   ├── geoUtils.test.js
│   │   ├── mapUtils.test.js
│   │   └── zoneUtils.test.js
│   ├── geoUtils.js
│   ├── mapUtils.js
│   └── zoneUtils.js
├── services/
│   ├── __tests__/
│   │   ├── dronePathService.test.js
│   │   └── fireBoundaryService.test.js
│   ├── dronePathService.js
│   └── fireBoundaryService.js
└── test/
    └── setup.js
```

## Writing Tests

### Basic Test Structure

```javascript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myModule';

describe('myModule', () => {
  describe('myFunction', () => {
    it('should do something correctly', () => {
      const result = myFunction(input);
      expect(result).toBe(expected);
    });

    it('should handle edge cases', () => {
      const result = myFunction(null);
      expect(result).toBeDefined();
    });
  });
});
```

### Test Functions

- `describe()` - Groups related tests
- `it()` or `test()` - Individual test case
- `expect()` - Assertions
- `beforeEach()` - Setup before each test
- `afterEach()` - Cleanup after each test
- `beforeAll()` - Setup once before all tests
- `afterAll()` - Cleanup once after all tests

### Common Assertions

```javascript
expect(value).toBe(expected)           // Strict equality
expect(value).toEqual(expected)        // Deep equality
expect(value).toBeTruthy()              // Truthy value
expect(value).toBeFalsy()               // Falsy value
expect(value).toBeDefined()             // Not undefined
expect(value).toBeNull()                // Null
expect(value).toBeGreaterThan(n)        // Number comparison
expect(value).toContain(item)           // Array/string contains
expect(value).toHaveLength(n)           // Array/string length
expect(fn).toThrow()                    // Function throws error
```

## Test Coverage

Coverage reports show:
- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches taken
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

Aim for at least 80% coverage on critical utilities and services.

## Best Practices

1. **Test one thing at a time** - Each test should verify a single behavior
2. **Use descriptive test names** - Test names should clearly describe what they test
3. **Test edge cases** - Include null, undefined, empty arrays, invalid inputs
4. **Keep tests independent** - Tests should not depend on each other
5. **Mock external dependencies** - Use mocks for API calls, window objects, etc.
6. **Test both success and failure cases** - Verify error handling

## Example: Testing a Utility Function

```javascript
import { describe, it, expect } from 'vitest';
import { calculateDistance } from '../geoUtils';

describe('calculateDistance', () => {
  it('should calculate distance between two points', () => {
    const distance = calculateDistance(34.0, -118.0, 35.0, -119.0);
    expect(distance).toBeGreaterThan(0);
    expect(typeof distance).toBe('number');
  });

  it('should return 0 for identical coordinates', () => {
    const distance = calculateDistance(34.0, -118.0, 34.0, -118.0);
    expect(distance).toBe(0);
  });
});
```

## Debugging Tests

1. Use `console.log()` in tests (they're automatically filtered in watch mode)
2. Use the UI mode: `npm run test:ui` for interactive debugging
3. Use `debugger` statement and run tests in Node debugger
4. Use `--reporter=verbose` for more detailed output

## Continuous Integration

For CI/CD pipelines, use:
```bash
npm run test:run
```

This ensures tests run once and exit with the appropriate exit code.

