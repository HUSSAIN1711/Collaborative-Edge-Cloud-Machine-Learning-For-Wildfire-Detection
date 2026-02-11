# Collaborative-Edge-Cloud-Machine-Learning-For-Wildfire-Detection

Repository for EECS 159A Senior Design Project with Professor Hamid Jafarkhani

This repository tracks progress as we work on the project. The application is a React-based wildfire detection and monitoring dashboard featuring multiple autonomous drones, zone-based sensor organization, dynamic path generation, and real-time data visualization.

## Project Members

- Hussain Mahuvawala
- Muhammad Shahmir Shamim
- Rich Soong
- Sidhartha Shah
- Zayd Salem

## Quick Start

1. **Install dependencies**: `npm install`
2. **Set up environment**: Create `.env.local` with your Google Maps API key (see [Setup Guide](./docs/SETUP.md))
3. **Run development server**: `npm run dev`
4. **Run tests**: `npm test`

## Project Overview

This is a multi-drone wildfire detection system that:
- Organizes 24 sensors into 3 geographic zones
- Assigns one autonomous drone per zone (3 drones total)
- Generates dynamic flight paths for each drone
- Calculates per-zone fire boundaries based on sensor data
- Provides real-time weather data integration
- Features an interactive map with satellite view

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

### 📘 [Context & Architecture](./docs/context.md)
**Complete project context and architecture documentation**
- Project overview and technology stack
- Detailed component descriptions
- Service architecture (drone paths, fire boundaries, weather)
- Utility functions and code organization
- Data structures and state management
- Current features and behaviors
- Development notes and future enhancements

**Use this when**: You need to understand the overall system architecture, how components interact, or the data flow.

### 🚀 [Setup Guide](./docs/SETUP.md)
**Step-by-step setup instructions**
- Prerequisites and installation
- Google Maps API key configuration
- Weather API setup
- Environment variable configuration
- Development server startup
- Feature overview

**Use this when**: You're setting up the project for the first time or need to configure API keys.

### 🧪 [Testing Guide](./docs/TESTING.md)
**Comprehensive testing documentation**
- Vitest framework overview
- Running tests (watch mode, CI mode, UI mode, coverage)
- Test structure and organization
- Writing new tests with examples
- Test coverage reports
- Best practices and debugging

**Use this when**: You want to write tests, understand test structure, or run the test suite.

### ⚡ [Quick Test Guide](./docs/QUICK_TEST_GUIDE.md)
**Quick reference for testing**
- Essential test commands
- Current test results (68 tests passing)
- What's tested in each module
- Quick examples for adding tests

**Use this when**: You need a quick reference for test commands or want to see what's currently tested.

## Project Structure

```
src/
├── components/          # React components
│   ├── MapContainer.jsx      # Main map with drones and sensors
│   ├── DroneSelector.jsx     # Drone selection dropdown
│   ├── DroneFeedCard.jsx     # Selected drone information
│   ├── SensorHealthOverview.jsx  # Sensor health display
│   ├── WeatherCard.jsx       # Weather data visualization
│   └── gauges/               # Reusable gauge components
├── data/                # Static data files
│   ├── sensors.json          # 24 sensors across 3 zones
│   └── sensorZones.json      # Zone definitions
├── services/            # Business logic services
│   ├── dronePathService.js   # Dynamic path generation
│   ├── fireBoundaryService.js # Fire boundary calculation
│   ├── pathOptimizationService.js # Path optimization
│   └── weatherService.js     # Weather API integration
├── store/               # State management
│   └── useAppStore.js        # Zustand store
├── utils/               # Utility functions
│   ├── geoUtils.js           # Geographic calculations
│   ├── mapUtils.js          # Google Maps utilities
│   └── zoneUtils.js         # Zone calculations
└── test/                # Test configuration
    └── setup.js             # Test setup and mocks
```


## Technology Stack

- **React 18** with Vite
- **Material-UI (MUI)** for components
- **Zustand** for state management
- **Google Maps API** for mapping and weather
- **Vitest** for testing

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once (CI mode)
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Run ESLint

## Environment Setup

Create a `.env.local` file in the project root:

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

See [Setup Guide](./docs/SETUP.md) for detailed instructions.

## Testing

The project includes comprehensive unit tests:
- **68 tests** covering utilities and services
- **100% passing** test suite
- Run `npm test` to start testing

See [Testing Guide](./docs/TESTING.md) for complete documentation.

## Contributing

1. Review the [Context & Architecture](./docs/context.md) to understand the system
2. Follow the code structure and patterns
3. Write tests for new features
4. Update documentation as needed

## License

This project is part of EECS 159A Senior Design Project.
