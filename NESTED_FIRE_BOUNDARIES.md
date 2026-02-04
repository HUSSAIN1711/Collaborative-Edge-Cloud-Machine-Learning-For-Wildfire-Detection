# Nested Fire Boundaries Feature

## Overview
The fire boundary system now supports multiple nested boundaries at different probability thresholds, creating a layered visualization of fire risk zones.

## How It Works

### Threshold Levels
By default, the system creates boundaries at 5 different probability thresholds:
- **25%** - Light Yellow (Low Risk)
- **50%** - Yellow-Orange (Moderate Risk)
- **75%** - Orange (Moderate-High Risk)
- **95%** - Orange-Red (High Risk)
- **100%** - Red (Critical Risk)

### Visual Design
Each boundary is color-coded and styled based on its risk level:

| Threshold | Fill Color | Stroke Color | Opacity | Stroke Weight |
|-----------|------------|--------------|---------|---------------|
| 100%      | Red (#FF0000) | Dark Red | 0.3 / 0.8 | 3px |
| 95%       | Orange-Red (#FF6600) | Dark Orange | 0.25 / 0.7 | 2.5px |
| 75%       | Orange (#FF9900) | Dark Orange | 0.2 / 0.6 | 2px |
| 50%       | Yellow-Orange (#FFBF00) | Dark Yellow | 0.15 / 0.5 | 2px |
| 25%       | Light Yellow (#FFE066) | Light Yellow | 0.1 / 0.4 | 1.5px |

### Nesting Behavior
- Boundaries are calculated in **descending order** (highest threshold first)
- Higher risk boundaries are **nested inside** lower risk boundaries
- Each boundary only includes sensors at or above its threshold
- Boundaries are automatically smoothed using Catmull-Rom splines

## Implementation Details

### Service Layer (`fireBoundaryService.js`)
- **`calculateMultipleFireBoundaries()`**: Main method that calculates all boundaries
- **`getBoundaryColor()`**: Returns color scheme based on threshold
- Uses the same convex hull and smoothing algorithms as single boundaries

### Store Layer (`useAppStore.js`)
- **`fireBoundaries`**: Array of boundary objects with `{threshold, boundary, color}`
- **`calculateMultipleFireBoundaries()`**: Calculates all boundaries at once
- Automatically recalculates when sensors or options change

### Component Layer (`MapContainer.jsx`)
- Renders all boundaries as separate `Polygon` components
- Each boundary uses its assigned color scheme
- Falls back to single boundary for backward compatibility

## Configuration

You can customize the thresholds in the store:

```javascript
fireBoundaryOptions: {
  thresholds: [25, 50, 75, 95, 100], // Customize these values
  marginMiles: 0.15,
  smoothingFactor: 0.5,
}
```

## Usage Example

```javascript
// In your component
const fireBoundaries = useAppStore((state) => state.fireBoundaries);

// fireBoundaries is an array like:
[
  {
    threshold: 100,
    boundary: [{lat: 34.09, lng: -118.59}, ...],
    color: {
      fillColor: "#FF0000",
      strokeColor: "#CC0000",
      fillOpacity: 0.3,
      strokeOpacity: 0.8,
      strokeWeight: 3
    }
  },
  // ... more boundaries
]
```

## Benefits

1. **Visual Risk Gradation**: Easy to see risk levels at a glance
2. **Better Decision Making**: Understand the spread of different risk zones
3. **Intuitive Color Coding**: Red = critical, Yellow = low risk
4. **Smooth Boundaries**: All boundaries use the same smoothing algorithm
5. **Performance**: Cached results prevent unnecessary recalculations

## Future Enhancements

Potential improvements:
- Interactive legend showing threshold levels
- Toggle visibility for individual boundaries
- Custom threshold configuration UI
- Animation when boundaries update
- Boundary area calculations



