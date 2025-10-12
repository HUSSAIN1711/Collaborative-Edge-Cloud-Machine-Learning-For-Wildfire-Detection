# Wildfire Detection Dashboard Setup

---

## Prerequisites

Before you begin, ensure you have **Node.js** installed on your system. This is required to use `npm` (Node Package Manager) for installing project dependencies.

- **Node.js**: Download the LTS (Long-Term Support) version from [https://nodejs.org](https://nodejs.org)

---

## Getting Started

Follow these steps to get the project set up and running on your local machine.

### 1. Install Dependencies

Navigate to the project directory and install the necessary dependencies:

```bash
npm install

```

## Setup your google maps api key

This project requires a Google Maps API key to display the map and sensor data. You must create your own key for the application to work.

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable the Maps Javascript API
4. Generate a new API key

## Configuring the Weather API

The dashboard integrates comprehensive weather data for each sensor location using [WeatherAPI.com](https://www.weatherapi.com/). This provides real-time weather data including temperature, precipitation, humidity, wind conditions, UV index, air quality, and more.

### WeatherAPI.com Setup

1. Go to [WeatherAPI.com](https://www.weatherapi.com/)
2. Sign up for a free account
3. Navigate to your dashboard to get your API key
4. Copy your API key
5. Add it to your `.env.local` file as `VITE_WEATHER_API_KEY`

**Note**: WeatherAPI.com offers a generous free tier with comprehensive weather and air quality data.

## Create .env.local

Once the API keys are generated, create a `.env.local` file in the project root with the following content:

```
# Google Maps API Key (Required for map functionality)
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE

# WeatherAPI.com API Key (Required for weather data)
VITE_WEATHER_API_KEY=YOUR_WEATHER_API_KEY_HERE
```

**Important Notes:**
- Make sure to name the file exactly `.env.local`
- The `.gitignore` file ensures this file is not committed to version control
- Replace the placeholder values with your actual API keys
- Do not share these keys publicly



## Start the development server:
```bash
npm run dev
```

## Features

- **Interactive Map**: Satellite view with sensor locations and fire boundaries
- **Animated Drone**: Smooth movement with trailing path visualization
- **Dynamic Sensor Data**: Automatic sensor selection when drone approaches
- **Fire Risk Visualization**: Color-coded probability zones (red/yellow/orange)
- **Probability Bubbles**: Real-time fire probability display on sensor markers
- **Advanced Weather Integration**: Comprehensive weather data via Google Weather API including UV index, wind gusts, visibility, cloud cover, and thunderstorm probability
- **Statistical Dashboard**: Fire probability, variance, confidence intervals
- **Responsive Design**: Clean, modern UI with Material-UI components
- **Data Caching**: Efficient weather data caching with 1-hour refresh

## Project Structure

```
src/
├── components/
│   ├── MapContainer.jsx    # Main map component with Google Maps
│   └── Sidebar.jsx         # Sensor details and drone info
├── data/
│   ├── sensors.json        # Sensor data with statistical measures
│   ├── dronePath.json      # Drone flight path
│   └── fireBoundary.json   # Fire boundary coordinates
├── services/
│   └── weatherService.js   # Weather API integration and caching
├── store/
│   └── useAppStore.js      # Zustand state management
├── App.jsx                 # Main app component
└── main.jsx               # Entry point
```
