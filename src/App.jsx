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
import SimulationControl from "./components/SimulationControl";

/**
 * Theme: grey 80% transparency, Roboto Mono 12pt
 */
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "rgba(64, 64, 64, 0.2)",
      paper: "rgba(48, 48, 48, 0.2)",
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: 12,
    body1: { fontSize: "12px" },
    body2: { fontSize: "12px" },
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
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Map: full viewport behind everything */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
        >
          <MapContainer />
        </Box>

        {/* Overlay: 80% transparent with blur so map shows through */}
        <Grid
          container
          sx={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            pointerEvents: "none",
            "& > *": { pointerEvents: "auto" },
          }}
        >
          {/* Left: pass-through so map receives drag/click; only weather strip is interactive */}
          <Grid
            item
            xs={12}
            md={8}
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0 }} />
            <Box
              sx={{
                flexShrink: 0,
                p: 2,
                borderTop: 1,
                borderColor: "rgba(255,255,255,0.15)",
                height: "250px",
                overflow: "auto",
                bgcolor: "rgba(48, 48, 48, 0.2)",
                backdropFilter: "blur(12px)",
                pointerEvents: "auto",
              }}
            >
              <WeatherCard />
            </Box>
          </Grid>

          {/* Right: 80% transparent + blur, panels */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              bgcolor: "rgba(48, 48, 48, 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
              <SimulationControl />
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
