# Wildfire Detection Dashboard - Project Context

## Project Overview

This is a React-based wildfire detection and monitoring dashboard that displays an interactive map with multiple sensor zones, multiple autonomous drones (one per zone), dynamic fire boundary predictions, and real-time sensor data visualization. The system uses zone-based organization where sensors are grouped into geographic zones, with each zone assigned its own drone for autonomous monitoring.

## Technology Stack

- **Framework**: React 18 with Vite
- **Mapping**: @react-google-maps/api (Google Maps integration)
- **UI Components**: Material-UI (MUI) v5
- **State Management**: Zustand
- **Styling**: Emotion (included with MUI)
- **Testing**: Vitest with jsdom
- **Build Tool**: Vite 4.5.0

## Project Structure

```
src/
├── components/
│   ├── MapContainer.jsx           # Main map with Google Maps, all drones, fire boundaries
│   ├── DroneSelector.jsx          # Dropdown menu to select which drone to monitor
│   ├── DroneFeedCard.jsx          # Displays selected drone's mission and live feed
│   ├── SensorHealthOverview.jsx   # Sensor details with health gauges
│   ├── WeatherCard.jsx            # Weather data display with gauges
│   ├── gauges/                    # Reusable gauge components
│   │   ├── CircularGauge.jsx
│   │   ├── HumidityGauge.jsx
│   │   ├── SemiCircularGauge.jsx
│   │   ├── ThermometerGauge.jsx
│   │   └── WindCompass.jsx
│   └── [other components...]
├── data/
│   ├── sensors.json               # 24 sensors across 3 zones
│   ├── sensorZones.json           # Zone definitions (3 zones, 8 sensors each)
│   └── fireBoundary.json          # Legacy file (now dynamically calculated)
├── services/
│   ├── dronePathService.js        # Dynamic path generation for drones
│   ├── fireBoundaryService.js     # Fire boundary calculation per zone
│   ├── pathOptimizationService.js # Path optimization algorithms
│   ├── weatherService.js          # Google Weather API integration
│   └── __tests__/                 # Unit tests for services
├── store/
│   └── useAppStore.js             # Zustand global state management
├── utils/
│   ├── geoUtils.js                # Geographic calculations (distance, validation, etc.)
│   ├── mapUtils.js                # Google Maps utilities (icons, rotation)
│   ├── zoneUtils.js               # Zone calculations (center, bounds)
│   ├── sensorZoneService.js       # Sensor clustering (legacy, now uses predefined zones)
│   └── __tests__/                 # Unit tests for utilities
├── test/
│   └── setup.js                   # Test configuration and mocks
├── App.jsx                        # Main application component
└── main.jsx                       # React application entry point
```

## Core Architecture

### Multi-Drone System

The application supports **3 drones**, each assigned to a specific zone:

- **Zone 1**: Sensors 1-8 (Drone 1)
- **Zone 2**: Sensors 9-16 (Drone 2)
- **Zone 3**: Sensors 17-24 (Drone 3)

Each drone:
- Navigates only sensors in its assigned zone
- Generates its own optimized flight path dynamically
- Calculates its own fire boundary based on zone sensors
- Maintains independent position and path index
- Only the selected drone animates (others remain stationary)

### Zone-Based Organization

Sensors are organized into 3 predefined zones defined in `sensorZones.json`:
- Each zone contains 8 sensors
- Zones are geographically separated
- Each zone has a calculated center and bounds
- Fire boundaries are calculated per zone, not globally

### State Management (useAppStore.js)

**State:**
- `sensors`: Array of 24 sensor objects
- `zones`: Array of 3 zone objects with sensors and metadata
- `drones`: Array of 3 drone objects (one per zone)
- `selectedDroneId`: Currently selected drone for monitoring
- `selectedSensor`: Currently selected sensor
- `weatherData`: Cached weather data by sensor ID
- `markerDisplayMode`: "health" or "default" for marker display

**Key Actions:**
- `initializeZonesAndDrones()`: Builds zones from sensorZones.json and creates drones
- `setSelectedDroneId()`: Changes which drone is being monitored
- `updateDronePosition()`: Updates a specific drone's position
- `updateDronePathIndex()`: Updates a specific drone's path index
- `regenerateAllDronePaths()`: Regenerates paths for all drones

## Key Components

### MapContainer.jsx
- **Purpose**: Main map interface with all visualizations
- **Features**:
  - Satellite map view (centers on selected drone's zone center)
  - All 24 sensor markers (clickable, health-based coloring)
  - All 3 drone markers (selected drone highlighted in cyan)
  - 3 fire boundary polygons (one per zone, selected zone highlighted)
  - Only selected drone animates (moves every 2 seconds)
  - Proximity detection for weather data fetching
  - Map only recenters when drone selection changes (not on movement)

### DroneSelector.jsx
- **Purpose**: Dropdown menu to select which drone to monitor
- **Features**:
  - Lists all available drones
  - Shows zone name and sensor count for each drone
  - Selecting a drone starts its animation and centers map on its zone

### DroneFeedCard.jsx
- **Purpose**: Displays selected drone's mission information
- **Features**:
  - Drone name and current location
  - Zone information and sensor count
  - Mission status (monitoring sensor vs navigating)
  - Live camera feed from selected sensor (when available)

### SensorHealthOverview.jsx
- **Purpose**: Detailed sensor health and status display
- **Features**:
  - Fire probability gauge with risk level
  - Battery level gauge
  - Sensor health indicator (Normal/Abnormal)
  - Last ping time and location
  - Toggle for marker display mode (health vs default)

### WeatherCard.jsx
- **Purpose**: Comprehensive weather data display
- **Features**:
  - Temperature gauge (thermometer)
  - Humidity gauge
  - Wind speed and direction (compass)
  - Pressure, UV index, visibility
  - Weather description and conditions
  - Auto-fetches when sensor is selected
  - 1-hour caching to reduce API calls

## Services

### dronePathService.js
- **Purpose**: Generate optimal drone paths dynamically
- **Features**:
  - Path generation based on sensor locations
  - Priority-based routing (Critical > Warning > Active)
  - Path optimization using multiple algorithms
  - Caching for performance
  - Path statistics calculation

### fireBoundaryService.js
- **Purpose**: Calculate fire boundaries from sensor data
- **Features**:
  - Convex hull calculation (Graham Scan algorithm)
  - Smooth boundary generation (Catmull-Rom splines)
  - Configurable probability thresholds
  - Per-zone boundary calculation
  - Caching for performance

### pathOptimizationService.js
- **Purpose**: Optimize sensor visit order
- **Features**:
  - Nearest Neighbor algorithm
  - Genetic Algorithm (for complex optimization)
  - Simulated Annealing
  - Path cost calculation

### weatherService.js
- **Purpose**: Fetch and cache weather data
- **Features**:
  - Google Maps Weather API integration
  - 1-hour caching per location
  - Comprehensive weather data (temperature, humidity, wind, UV, etc.)
  - Fallback data on API failure

## Utility Functions

### geoUtils.js
Centralized geographic calculations:
- `calculateDistance()`: Haversine formula for distance in miles
- `isValidPosition()`: Validate coordinate objects
- `hasValidSensorPosition()`: Validate sensor positions
- `calculateCenter()`: Calculate centroid of positions
- `calculateBounds()`: Calculate bounding box
- `isDroneNearSensor()`: Proximity checking

### mapUtils.js
Google Maps utilities:
- `isGoogleMapsLoaded()`: Check API availability
- `createSensorIcon()`: Create sensor marker icons
- `createDroneIcon()`: Create drone marker icons
- `calculateDroneRotation()`: Calculate rotation based on movement

### zoneUtils.js
Zone-specific calculations:
- `calculateZoneCenter()`: Zone center from sensors
- `calculateZoneBounds()`: Zone bounds from sensors

## Data Structure

### Sensors (sensors.json)
24 sensors with:
- `id`: Unique identifier (1-24)
- `position`: {lat, lng} coordinates
- `status`: "Active", "Warning", "Critical", or "Offline"
- `fireProbability`: 0-100 (fire risk percentage)
- `firePercentage`: 0-100 (fire coverage percentage)
- `batteryStatus`: 0-100 (battery level)
- `sensorHealth`: "Normal" or "Abnormal" (calculated from battery)
- `lastPing`: Timestamp string
- `imageUrl`: Live feed image URL
- Statistical data: `probabilityVariance`, `standardDeviation`, `confidenceInterval`

### Sensor Zones (sensorZones.json)
3 zone definitions:
- `id`: Zone identifier (zone-1, zone-2, zone-3)
- `name`: Zone name
- `sensorIds`: Array of sensor IDs in this zone

### Zones (Generated at Runtime)
Each zone object contains:
- `id`: Zone identifier
- `name`: Zone name
- `sensors`: Array of sensor objects in this zone
- `center`: {lat, lng} calculated center point
- `bounds`: {north, south, east, west} bounding box

### Drones (Generated at Runtime)
Each drone object contains:
- `id`: Drone identifier (drone1, drone2, drone3)
- `name`: Display name (Drone 1, Drone 2, Drone 3)
- `zoneId`: Associated zone ID
- `zone`: Full zone object reference
- `path`: Array of {lat, lng} path points
- `position`: Current {lat, lng} position
- `pathIndex`: Current index in path array
- `fireBoundary`: Array of {lat, lng} boundary points

## Testing

### Test Framework
- **Vitest**: Fast, Vite-native test runner
- **Coverage**: V8 coverage provider
- **Environment**: jsdom for browser simulation

### Test Coverage
- **68 unit tests** across utilities and services
- **Test files**:
  - `geoUtils.test.js`: 27 tests
  - `mapUtils.test.js`: 16 tests
  - `zoneUtils.test.js`: 10 tests
  - `fireBoundaryService.test.js`: 6 tests
  - `dronePathService.test.js`: 9 tests

### Running Tests
```bash
npm test              # Watch mode
npm run test:run      # Run once
npm run test:ui       # Interactive UI
npm run test:coverage # With coverage report
```

## Styling & Theme

- **Theme**: Dark theme using MUI's createTheme
- **Colors**: 
  - Background: #2c3e50 (dark blue-gray)
  - Paper: #34495e (lighter blue-gray)
  - Selected drone: Cyan (#00FFFF)
  - Unselected drones: Yellow (#FFFF00)
- **Layout**: Responsive grid (8/4 split on desktop, stacked on mobile)

## Environment Requirements

- **Google Maps API Key**: Required for map and weather functionality
- **Environment Variable**: `VITE_GOOGLE_MAPS_API_KEY`
- **File**: `.env.local` (not committed to version control)
- **APIs Used**:
  - Maps JavaScript API
  - Weather API (via Google Maps)

## Current Features

✅ **Multi-Drone System**: 3 drones, one per zone
✅ **Zone-Based Organization**: 3 zones with 8 sensors each (24 total)
✅ **Dynamic Path Generation**: Paths calculated from sensor locations
✅ **Per-Zone Fire Boundaries**: Each zone has its own fire boundary
✅ **Drone Selection Menu**: Switch between drones to monitor
✅ **Selective Animation**: Only selected drone moves
✅ **Smart Map Centering**: Centers on zone center, only when drone changes
✅ **Interactive Google Maps**: Satellite view with all overlays
✅ **Clickable Sensor Markers**: Health-based coloring
✅ **Real-Time Weather Data**: Google Weather API integration
✅ **Weather Data Caching**: 1-hour cache to reduce API calls
✅ **Comprehensive Gauges**: Temperature, humidity, wind, fire risk, battery
✅ **Proximity Detection**: Auto-selects sensor when drone is near
✅ **Responsive Sidebar**: Sensor details and drone feed
✅ **Dark Theme UI**: Modern, clean interface
✅ **State Management**: Zustand for efficient state handling
✅ **Comprehensive Unit Tests**: 68 tests with good coverage
✅ **Code Reusability**: Utility functions for common operations

## Key Behaviors

### Drone Animation
- Only the selected drone animates
- Animation starts when drone is selected
- Drone moves along its path every 2 seconds
- Each drone maintains its own path index
- Switching drones stops previous animation and starts new one

### Map Centering
- Map centers on selected drone's zone center (not drone position)
- Only recenters when drone selection changes
- Map stays fixed while drone moves (no constant recentering)

### Fire Boundaries
- Each zone calculates its own fire boundary
- Boundaries based on sensors with fireProbability >= 70%
- Selected zone's boundary is highlighted
- Boundaries use smooth curves (Catmull-Rom splines)

### Weather Data
- Fetched automatically when drone approaches sensor (within 0.5 miles)
- Cached for 1 hour per sensor
- Comprehensive data: temperature, humidity, wind, pressure, UV, etc.
- Fallback data if API fails

## Development Notes

- Drone animation updates every 2 seconds
- Map centers on zone center, not drone position
- Fire boundaries recalculate when sensors update
- Paths regenerate when sensors change
- Weather data is cached to minimize API calls
- All sensor data is currently static (JSON files)
- Images are sourced from external URLs for demonstration
- No real-time data connections implemented yet

## Code Quality

- **Modular Architecture**: Services, utilities, and components are well-separated
- **Reusable Utilities**: Common functions extracted to utility modules
- **Comprehensive Testing**: 68 unit tests covering critical functionality
- **Error Handling**: Graceful fallbacks and error prevention
- **Performance**: Caching for paths, boundaries, and weather data
- **Code Organization**: Clear separation of concerns

## Future Enhancements (Not Implemented)

- Real-time data API integration
- WebSocket connections for live updates
- Historical data visualization
- Alert system for high fire risk
- User authentication
- Data export functionality
- Multi-user collaboration
- Drone control interface
- Path editing capabilities

## Dependencies

See `package.json` for complete list. Key dependencies:
- React 18.2.0
- @react-google-maps/api 2.19.3
- @mui/material 5.14.20
- zustand 4.4.7
- vite 4.5.0
- vitest 1.0.4 (testing)

## Getting Started

1. Install dependencies: `npm install`
2. Create `.env.local` with Google Maps API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
3. Start development server: `npm run dev`
4. Run tests: `npm test`
5. Open browser to localhost:5173 (or port shown in terminal)

## Last Updated

Updated to reflect current multi-drone, zone-based architecture with comprehensive testing and utility functions. All 68 unit tests passing.
