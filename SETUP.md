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

## Create .env.local

Once the API key is generated you will need to add this API key to a new file called .env.local

Make sure to name the file exactly that since your API key should not be shared with anyone and the .gitignore file enforces that when you commit, this file will not be included, it will only be present in your local machine

Add the following content, replacing `YOUR_API_KEY_HERE` with your actual API key:

```
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```



## Start the development server:
```bash
npm run dev
```

## Features

- Interactive map with satellite view
- Sensor markers that can be clicked to view details
- Animated drone that follows a predefined path
- Fire boundary overlay
- Real-time sensor data display in sidebar
- Live feed images from sensors

## Project Structure

```
src/
├── components/
│   ├── MapContainer.jsx    # Main map component with Google Maps
│   └── Sidebar.jsx         # Sensor details and drone info
├── data/
│   ├── sensors.json        # Sensor data
│   ├── dronePath.json      # Drone flight path
│   └── fireBoundary.json   # Fire boundary coordinates
├── store/
│   └── useAppStore.js      # Zustand state management
├── App.jsx                 # Main app component
└── main.jsx               # Entry point
```
