# Dynamic Drone Path Generation System

## Overview

This system replaces the hardcoded `dronePath.json` with a dynamic algorithm that generates optimal drone paths based on sensor data from `sensors.json`. The system prioritizes critical sensors and uses advanced optimization algorithms to create efficient flight paths.

## Key Features

### 1. Dynamic Path Generation
- **Input**: Sensor data from `sensors.json`
- **Output**: Optimized coordinate path for drone navigation
- **Priority**: Critical sensors are visited first, followed by Warning, then Active

### 2. Multiple Optimization Algorithms
- **Nearest Neighbor**: Fast, greedy algorithm for quick path generation
- **Genetic Algorithm**: Evolutionary approach for complex optimization
- **Simulated Annealing**: Probabilistic optimization for global minima

### 3. Robust Error Handling
- Graceful fallback to default paths when errors occur
- Comprehensive input validation
- Runtime error prevention

### 4. Caching System
- Path generation results are cached for performance
- Automatic cache invalidation based on sensor changes
- Configurable cache timeout

## Architecture

### Core Services

#### `dronePathService.js`
Main service for generating drone paths based on sensor data.

**Key Methods:**
- `generateDronePath(sensors, options)` - Generate optimal path
- `calculateOptimalPath(sensors, options)` - Core path calculation
- `getPathStatistics(path)` - Get path performance metrics

#### `pathOptimizationService.js`
Advanced optimization algorithms for path efficiency.

**Key Methods:**
- `optimizePath(sensors, options)` - Optimize sensor visit order
- `nearestNeighborOptimization()` - Greedy algorithm
- `geneticOptimization()` - Evolutionary approach
- `simulatedAnnealingOptimization()` - Probabilistic optimization

### Store Integration

#### `useAppStore.js`
Updated Zustand store with dynamic path management.

**New Methods:**
- `initializeDronePath()` - Initialize path on app start
- `regenerateDronePath()` - Update path when sensors change
- `updatePathOptions(options)` - Modify path generation settings
- `addSensor(sensor)` - Add new sensor and regenerate path
- `updateSensor(id, updates)` - Update sensor and regenerate path
- `removeSensor(id)` - Remove sensor and regenerate path

### Component Updates

#### `MapContainer.jsx`
Enhanced with error handling and dynamic path initialization.

**Improvements:**
- Automatic path initialization on component mount
- Robust error handling for drone animation
- Validation of coordinate data
- Graceful fallback for invalid positions

## Configuration Options

### Path Generation Options
```javascript
{
  maxDistance: 0.5,           // Maximum distance between consecutive points
  pathDensity: 0.01,          // Distance between path points
  prioritizeCritical: true,   // Visit critical sensors first
  includeWaypoints: true,     // Include intermediate waypoints
  useOptimization: true,      // Enable optimization algorithms
  optimizationAlgorithm: 'nearestNeighbor' // Algorithm to use
}
```

### Optimization Options
```javascript
{
  algorithm: 'nearestNeighbor', // 'nearestNeighbor' | 'genetic' | 'simulatedAnnealing'
  prioritizeCritical: true,     // Prioritize critical sensors
  maxDistance: 5.0,             // Maximum distance between sensors
  includeReturnPath: true       // Include return to start
}
```

## Usage Examples

### Basic Path Generation
```javascript
import dronePathService from './services/dronePathService';

const sensors = [
  { id: 1, position: { lat: 34.098, lng: -118.595 }, status: 'Critical' },
  { id: 2, position: { lat: 34.085, lng: -118.610 }, status: 'Warning' }
];

const path = dronePathService.generateDronePath(sensors);
```

### Advanced Configuration
```javascript
const options = {
  maxDistance: 0.3,
  pathDensity: 0.005,
  prioritizeCritical: true,
  useOptimization: true,
  optimizationAlgorithm: 'genetic'
};

const path = dronePathService.generateDronePath(sensors, options);
```

### Store Integration
```javascript
import useAppStore from './store/useAppStore';

const { 
  initializeDronePath, 
  regenerateDronePath, 
  updatePathOptions 
} = useAppStore();

// Initialize path
initializeDronePath();

// Update options and regenerate
updatePathOptions({ maxDistance: 0.2 });
```

## Performance Considerations

### Caching
- Path generation results are cached for 5 minutes
- Cache keys based on sensor data and options
- Automatic cache invalidation on sensor changes

### Optimization
- Nearest Neighbor: O(n²) - Fast for small datasets
- Genetic Algorithm: O(generations × population) - Good for complex optimization
- Simulated Annealing: O(iterations) - Excellent for global optimization

### Memory Management
- Automatic cleanup of expired cache entries
- Efficient data structures for large sensor datasets
- Garbage collection friendly implementation

## Error Handling

### Input Validation
- Validates sensor data structure
- Checks coordinate validity
- Handles missing or invalid data gracefully

### Runtime Protection
- Try-catch blocks around all critical operations
- Fallback to default paths on errors
- Comprehensive logging for debugging

### Component Safety
- Validates drone position before rendering
- Prevents infinite loops in animations
- Graceful degradation on service failures

## Testing

### Unit Tests
- Comprehensive test coverage for all services
- Mock data for isolated testing
- Edge case validation

### Integration Tests
- End-to-end path generation testing
- Store integration validation
- Component rendering verification

## Migration from Hardcoded Paths

### Before (Hardcoded)
```javascript
import dronePathData from '../data/dronePath.json';
// Static path from JSON file
```

### After (Dynamic)
```javascript
import useAppStore from '../store/useAppStore';

const { dronePath, initializeDronePath } = useAppStore();
// Dynamic path generated from sensors
```

## Benefits

1. **Maintainability**: No more manual path updates
2. **Scalability**: Automatically handles new sensors
3. **Efficiency**: Optimized paths reduce flight time
4. **Flexibility**: Configurable algorithms and parameters
5. **Reliability**: Robust error handling prevents crashes
6. **Performance**: Caching and optimization improve speed

## Future Enhancements

1. **Real-time Updates**: Dynamic path updates based on sensor status changes
2. **Weather Integration**: Path adjustments based on weather conditions
3. **Battery Optimization**: Paths optimized for drone battery life
4. **Multi-drone Support**: Coordinated paths for multiple drones
5. **Machine Learning**: AI-powered path optimization based on historical data

## Troubleshooting

### Common Issues

1. **Path not generating**: Check sensor data validity
2. **Performance issues**: Reduce path density or disable optimization
3. **Memory leaks**: Clear cache periodically
4. **Invalid coordinates**: Validate sensor positions

### Debug Mode
Enable detailed logging by setting:
```javascript
localStorage.setItem('debug', 'dronePathService');
```

## API Reference

### DronePathService
- `generateDronePath(sensors, options)` - Generate path
- `getPathStatistics(path)` - Get statistics
- `clearCache()` - Clear cache

### PathOptimizationService
- `optimizePath(sensors, options)` - Optimize path
- `getOptimizationStats(original, optimized)` - Get improvement stats
- `clearCache()` - Clear optimization cache

### useAppStore
- `initializeDronePath()` - Initialize path
- `regenerateDronePath()` - Regenerate path
- `updatePathOptions(options)` - Update options
- `addSensor(sensor)` - Add sensor
- `updateSensor(id, updates)` - Update sensor
- `removeSensor(id)` - Remove sensor
- `getPathStatistics()` - Get path stats
