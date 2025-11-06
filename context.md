# Wildfire Detection Dashboard - Project Context

## Project Overview

This is a React-based proof-of-concept dashboard for wildfire detection and monitoring. The application displays an interactive map with sensor locations, an animated drone, fire boundary overlays, and real-time sensor data visualization.

## Technology Stack

- **Framework**: React 18 with Vite
- **Mapping**: @react-google-maps/api (Google Maps integration)
- **UI Components**: Material-UI (MUI) v5
- **State Management**: Zustand
- **Styling**: Emotion (included with MUI)

## Project Structure

```
src/
├── components/
│   ├── MapContainer.jsx        # Main map component with Google Maps
│   └── Sidebar.jsx             # Sensor details and drone info display
├── data/
│   ├── sensors.json            # Static sensor data (4 sensors)
│   ├── dronePath.json          # Drone flight path waypoints (13 points)
│   └── fireBoundary.json       # Fire boundary polygon coordinates (6 points)
├── store/
│   └── useAppStore.js          # Zustand global state management
├── App.jsx                     # Main application component with dark theme
└── main.jsx                    # React application entry point
```

## Key Components

### MapContainer.jsx
- **Purpose**: Renders the Google Maps interface with all overlays
- **Features**:
  - Satellite map view centered on Los Angeles area (34.07, -118.58)
  - Sensor markers (clickable for selection)
  - Animated drone marker (yellow arrow, moves every 2 seconds)
  - Fire boundary polygon (orange/red overlay)
- **Dependencies**: Google Maps API key required via environment variable
- **Animation**: Drone follows predefined path in a loop

### Sidebar.jsx
- **Purpose**: Displays selected sensor information and drone status
- **Features**:
  - Sensor details (ID, status, temperature, humidity, fire percentage)
  - Drone live feed location
  - Live camera feed from selected sensor
  - Conditional rendering based on sensor selection

### useAppStore.js (Zustand Store)
- **State Management**:
  - `sensors`: Array of sensor data from sensors.json
  - `dronePath`: Array of waypoints from dronePath.json
  - `selectedSensor`: Currently selected sensor object
  - `dronePosition`: Current drone position (updates every 2 seconds)
- **Actions**:
  - `setSelectedSensor`: Updates selected sensor
  - `setDronePosition`: Updates drone position for animation

## Data Structure

### Sensors (sensors.json)
Each sensor contains:
- `id`: Unique identifier
- `position`: Lat/lng coordinates
- `status`: "Active" or "Warning"
- `lastPing`: Timestamp string
- `temperature`: Temperature in Fahrenheit
- `humidity`: Humidity percentage
- `fireProbability`: Fire probability/risk percentage (0-100)
- `imageUrl`: Unsplash image URL for live feed

### Drone Path (dronePath.json)
Array of coordinate objects with `lat` and `lng` properties defining the flight path.

### Fire Boundary (fireBoundary.json)
Array of coordinate objects forming a polygon around the fire area.

## Styling & Theme

- **Theme**: Dark theme using MUI's createTheme
- **Colors**: 
  - Background: #2c3e50 (dark blue-gray)
  - Paper: #34495e (lighter blue-gray)
- **Layout**: Responsive grid (8/4 split on desktop, stacked on mobile)

## Environment Requirements

- **Google Maps API Key**: Required for map functionality
- **Environment Variable**: `VITE_GOOGLE_MAPS_API_KEY`
- **File**: `.env.local` (not committed to version control)

## Current Features

✅ Interactive Google Maps with satellite view
✅ Clickable sensor markers
✅ Animated drone following predefined path
✅ Fire boundary polygon overlay
✅ Real-time sensor data display
✅ Live feed images from sensors
✅ Responsive sidebar with sensor details
✅ Dark theme UI
✅ State management with Zustand

## Development Notes

- Drone animation updates every 2 seconds
- Map is centered on Los Angeles area coordinates
- Fire percentage > 50% displays in red text
- All sensor data is currently static (JSON files)
- Images are sourced from Unsplash for demonstration
- No real-time data connections implemented yet

## Future Enhancements (Not Implemented)

- Real-time data API integration
- WebSocket connections for live updates
- Historical data visualization
- Alert system for high fire risk
- User authentication
- Multiple drone support
- Custom marker icons
- Data export functionality

## Dependencies

See `package.json` for complete list. Key dependencies:
- React 18.2.0
- @react-google-maps/api 2.19.3
- @mui/material 5.14.20
- zustand 4.4.7
- vite 4.5.0

## Getting Started

1. Install dependencies: `npm install`
2. Create `.env.local` with Google Maps API key
3. Start development server: `npm run dev`
4. Open browser to localhost:5173 (or port shown in terminal)

## Last Updated

Project created and scaffolded with all core functionality implemented.
