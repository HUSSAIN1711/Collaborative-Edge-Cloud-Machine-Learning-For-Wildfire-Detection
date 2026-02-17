import React from "react";
import {
  Box,
  Grid,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import MapContainer from "./components/MapContainer";
import SensorOverview from "./components/SensorOverview";
import WeatherCard from "./components/WeatherCard";
import DroneOverview from "./components/DroneOverview";

/**
 * Dark theme configuration for the application
 */
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#2c3e50",
      paper: "#34495e",
    },
  },
});

/**
 * Main application component
 * Sets up the layout with map, sensor info, weather, and drone feed
 */
function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Grid container sx={{ height: "100%" }}>
          {/* Left Column: Map and Weather */}
          <Grid
            item
            xs={12}
            md={8}
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            {/* Map Container - takes most of the space */}
            <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
              <MapContainer />
            </Box>
            {/* Weather Conditions - under the map only */}
            <Box
              sx={{
                flexShrink: 0,
                p: 2,
                borderTop: 1,
                borderColor: "divider",
                height: "250px",
                overflow: "auto",
              }}
            >
              <WeatherCard />
            </Box>
          </Grid>

          {/* Right Column: Drone Overview and Sensor Overview */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
              <DroneOverview />
              <SensorOverview />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}

export default App;
