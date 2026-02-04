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

The dashboard integrates comprehensive weather data for each sensor location using the Google Maps Weather API. This provides real-time weather data including temperature, precipitation, humidity, wind conditions, UV index, air quality, and more.

### Google Maps Weather API Setup

The weather data is fetched using the same Google Maps API key you already have configured. No additional setup is required - the weather API is automatically enabled when you enable the Maps JavaScript API.

**Note**: The Google Maps Weather API provides comprehensive weather and air quality data as part of the Google Maps platform.

## Create .env.local

Once the API keys are generated, create a `.env.local` file in the project root with the following content:

```
# Google Maps API Key (Required for map functionality and weather data)
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE

# Optional: Image prediction API URL (defaults to http://localhost:5001)
# VITE_IMAGE_PREDICTION_API_URL=http://localhost:5001
```

**Important Notes:**
- Make sure to name the file exactly `.env.local`
- The `.gitignore` file ensures this file is not committed to version control
- Replace the placeholder values with your actual API keys
- Do not share these keys publicly

## Image Prediction API (Optional)

The dashboard can show AI wildfire predictions on sensor images. To enable this:

1. **Install Python dependencies** (one-time):
   ```bash
   pip install -r src/MachineLearningModels/EdgeDeviceModelArtifacts/requirements.txt
   ```
   This installs PyTorch, Flask, **flask-cors**, Pillow, and other dependencies.

2. **Place the model file** at `models/wildfire_resnet18.pth` (project root).

3. **Run the full stack**: Use `npm run dev` (see below) to start both the React app and the image prediction API, or run the API manually:
   ```bash
   python3 src/MachineLearningModels/EdgeDeviceModelArtifacts/image_inference_api.py
   ```
   The API runs on port 5001. **flask-cors** is required so the dashboard can call the API.

## Start the development server

**Recommended** – starts both the React dashboard and the image prediction API:

```bash
npm run dev
```

To run only the React app (no image predictions):

```bash
npm run dev:app
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
