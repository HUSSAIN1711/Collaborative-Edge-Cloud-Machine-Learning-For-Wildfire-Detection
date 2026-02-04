import React, { useEffect, useMemo, memo, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Fade,
  Alert,
} from "@mui/material";
import useAppStore from "../store/useAppStore";
import weatherService from "../services/weatherService";
import imagePredictionService from "../services/imagePredictionService";

// Memoized Weather Display Component - only re-renders when weather data changes
const WeatherDisplay = memo(({ weatherData, selectedSensor, setWeatherData, isLoading }) => {
  const handleRefresh = useCallback(() => {
    console.log("Manually fetching weather for sensor", selectedSensor.id);
    weatherService
      .fetchWeatherData(
        selectedSensor.position.lat,
        selectedSensor.position.lng
      )
      .then((data) => {
        console.log("Manual weather fetch result:", data);
        setWeatherData(selectedSensor.id, data);
      })
      .catch((error) => {
        console.error("Manual weather fetch error:", error);
      });
  }, [selectedSensor, setWeatherData]);

  // Show the big spinner ONLY if we are loading AND have no data at all (initial load)
  if (isLoading && !weatherData) {
    return (
      <Box
        sx={{
          minHeight: 300, // Reserve space to prevent layout shift
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={24} sx={{ mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Fetching live weather data...
        </Typography>
      </Box>
    );
  }

  // If we have no data and are NOT loading (e.g., no sensor selected)
  if (!weatherData) {
    return (
      <Box sx={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No weather data available.
        </Typography>
      </Box>
    );
  }

  // If we're here, we HAVE weatherData.
  // We'll show the data, and if 'isLoading' is true, it means we are
  // background-refreshing, so we'll show a subtle overlay.
  return (
    <Box sx={{ position: 'relative' }}>
      {/* Loading overlay for background refresh */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: -16, // Cover CardContent padding
            left: -16,
            right: -16,
            bottom: -16,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            borderRadius: 1, // Match card's border radius
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          <CircularProgress size={24} sx={{ color: 'white' }} />
        </Box>
      )}

      {/* The actual content, slightly faded during background load */}
      <Box sx={{ 
        transition: 'opacity 0.2s ease-in-out', 
        opacity: isLoading ? 0.6 : 1 
      }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" color="primary">
            Live Weather Conditions
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>
        <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Temperature:</strong> {weatherData.temperature}°F
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Humidity:</strong> {weatherData.humidity}%
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Wind Speed:</strong> {weatherData.windSpeed} mph
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Wind Direction:</strong> {weatherData.windDirection}°
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Wind Gust:</strong> {weatherData.windGust} mph
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>UV Index:</strong> {weatherData.uvIndex}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Visibility:</strong> {weatherData.visibility} mi
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Cloud Cover:</strong> {weatherData.cloudCover}%
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Dew Point:</strong> {weatherData.dewPoint}°F
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Heat Index:</strong> {weatherData.heatIndex}°F
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Wind Chill:</strong> {weatherData.windChill}°F
          </Typography>
        </Grid>
        {weatherData.thunderstormProbability > 0 && (
          <Grid item xs={12}>
            <Typography variant="body2" color="warning.main">
              <strong>Thunderstorm Probability:</strong>{" "}
              {weatherData.thunderstormProbability}%
            </Typography>
          </Grid>
        )}
        <Grid item xs={12}>
          <Typography variant="body2">
            <strong>Conditions:</strong> {weatherData.description}
          </Typography>
        </Grid>
        {weatherData.airQuality && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Air Quality Data
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>PM2.5:</strong> {weatherData.airQuality.pm2_5} μg/m³
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>PM10:</strong> {weatherData.airQuality.pm10} μg/m³
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>O₃:</strong> {weatherData.airQuality.o3} μg/m³
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>NO₂:</strong> {weatherData.airQuality.no2} μg/m³
              </Typography>
            </Grid>
          </>
        )}
        </Grid>
      </Box>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Only re-render if weather data actually changes
  // Compare by reference since we're using the same object reference from the store
  return (
    prevProps.weatherData === nextProps.weatherData &&
    prevProps.selectedSensor?.id === nextProps.selectedSensor?.id &&
    prevProps.isLoading === nextProps.isLoading
  );
});

WeatherDisplay.displayName = "WeatherDisplay";

// Custom hook to only subscribe to specific sensor's weather data
const useSensorWeather = (sensorId) => {
  return useAppStore((state) => 
    sensorId ? state.weatherData[sensorId] || null : null
  );
};

function Sidebar() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const dronePosition = useAppStore((state) => state.dronePosition);
  const droneFeedImageUrls = useAppStore((state) => state.droneFeedImageUrls);
  // Only subscribe to the specific sensor's weather data - prevents re-renders for other sensors
  const currentWeatherData = useSensorWeather(selectedSensor?.id);
  const setWeatherData = useAppStore((state) => state.setWeatherData);
  const markerDisplayMode = useAppStore((state) => state.markerDisplayMode);
  const toggleMarkerDisplayMode = useAppStore(
    (state) => state.toggleMarkerDisplayMode
  );

  // Track loading state to show smooth transitions
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [lastFetchedSensorId, setLastFetchedSensorId] = useState(null);
  
  // This state holds the data we actually show on screen.
  // It won't be set to 'null' just because we're fetching new data.
  // This implements the "stale-while-revalidate" pattern.
  const [displayWeather, setDisplayWeather] = useState(null);

  // Image prediction state
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const setImagePrediction = useAppStore((state) => state.setImagePrediction);
  const getImagePrediction = useAppStore((state) => state.getImagePrediction);
  const imagePredictions = useAppStore((state) => state.imagePredictions);
  // Drone feed loops through 4 images by sensor index (1→0, 2→1, 3→2, 4→3, 5→0, …)
  const feedIndex = selectedSensor ? (selectedSensor.id - 1) % droneFeedImageUrls.length : 0;
  const currentFeedUrl = droneFeedImageUrls[feedIndex] || null;
  const currentPrediction = useMemo(() => {
    return imagePredictions[feedIndex] ?? null;
  }, [feedIndex, imagePredictions]);

  const getFireRiskColor = (probability) => {
    if (probability === 100) return "#f44336"; // Red
    if (probability >= 70) return "#ff9800"; // Orange
    if (probability >= 40) return "#ffeb3b"; // Yellow
    return "#4caf50"; // Green
  };

  const getFireRiskLabel = (probability) => {
    if (probability === 100) return "CRITICAL";
    if (probability >= 70) return "HIGH";
    if (probability >= 40) return "MODERATE";
    return "LOW";
  };

  const getBatteryColor = (batteryLevel) => {
    if (batteryLevel < 10) return "#f44336"; // Red
    if (batteryLevel < 25) return "#ff9800"; // Orange
    if (batteryLevel < 50) return "#ffeb3b"; // Yellow
    return "#4caf50"; // Green
  };

  const getHealthColor = (health) => {
    return health === "Abnormal" ? "#f44336" : "#4caf50";
  };

  const calculateSensorHealth = (batteryStatus) => {
    return batteryStatus < 10 ? "Abnormal" : "Normal";
  };

  // Update weather loading and display logic with stale-while-revalidate pattern
  useEffect(() => {
    if (selectedSensor) {
      // Only show loading if we don't have data for this new sensor
      if (!currentWeatherData && selectedSensor.id !== lastFetchedSensorId) {
        setIsLoadingWeather(true);
        setLastFetchedSensorId(selectedSensor.id);
        // *** We DO NOT set displayWeather to null here - keep showing old data ***
      } else if (currentWeatherData) {
        // When new data arrives, update the display and stop loading
        setIsLoadingWeather(false);
        setDisplayWeather(currentWeatherData); // Update what's on screen
      }
    } else {
      // No sensor selected, clear everything
      setIsLoadingWeather(false);
      setDisplayWeather(null);
    }
  }, [selectedSensor?.id, currentWeatherData, lastFetchedSensorId]);

  // Fetch image prediction for current drone feed (loops through 4 images by feed index)
  useEffect(() => {
    if (selectedSensor && currentFeedUrl) {
      const cachedPrediction = getImagePrediction(feedIndex);

      if (!cachedPrediction) {
        setIsLoadingPrediction(true);
        setPredictionError(null);

        imagePredictionService
          .predictFromImageUrl(currentFeedUrl)
          .then((result) => {
            setImagePrediction(feedIndex, result);
            setIsLoadingPrediction(false);
          })
          .catch((error) => {
            console.error("Error predicting image:", error);
            setPredictionError(error.message || "Failed to analyze image");
            setIsLoadingPrediction(false);
          });
      }
    } else {
      setIsLoadingPrediction(false);
      setPredictionError(null);
    }
  }, [selectedSensor?.id, feedIndex, currentFeedUrl, getImagePrediction, setImagePrediction]);

  return (
    <Box>
      {/* Dashboard Details Panel */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" color="primary">
              Dashboard Details
            </Typography>
            <Button
              variant={
                markerDisplayMode === "health" ? "contained" : "outlined"
              }
              size="small"
              onClick={toggleMarkerDisplayMode}
              sx={{ minWidth: 100 }}
            >
              {markerDisplayMode === "health" ? "Health Mode" : "Default Mode"}
            </Button>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 2, display: "block" }}
          >
            {markerDisplayMode === "health"
              ? "Health Mode: Green = Normal, Red = Abnormal (Battery < 10%)"
              : "Default Mode: Standard Google Maps markers"}
          </Typography>
          {selectedSensor ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: "center",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        color: getFireRiskColor(selectedSensor.fireProbability),
                      }}
                    >
                      {selectedSensor.fireProbability}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Predicted Fire Probability
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: "center",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      {selectedSensor.status}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: "center",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        color: getBatteryColor(selectedSensor.batteryStatus),
                      }}
                    >
                      {selectedSensor.batteryStatus}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Battery Status
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: "center",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: getHealthColor(selectedSensor.sensorHealth),
                      }}
                    >
                      {selectedSensor.sensorHealth}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sensor Health
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Chip
                label={getFireRiskLabel(selectedSensor.fireProbability)}
                color={
                  selectedSensor.fireProbability === 100
                    ? "error"
                    : selectedSensor.fireProbability >= 70
                    ? "warning"
                    : "success"
                }
                size="small"
                sx={{ mb: 1 }}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Drone approaching sensor... Data will appear automatically.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Sensor Details */}
      {selectedSensor ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sensor #{selectedSensor.id}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Status:</strong> {selectedSensor.status}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Last Ping:</strong> {selectedSensor.lastPing}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Location:</strong>{" "}
              {selectedSensor.position.lat.toFixed(4)},{" "}
              {selectedSensor.position.lng.toFixed(4)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: selectedSensor.fireProbability > 50 ? "red" : "inherit",
                mb: 1,
              }}
            >
              <strong>Predicted Fire Probability:</strong>{" "}
              {selectedSensor.fireProbability}%
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: getBatteryColor(selectedSensor.batteryStatus),
                mb: 1,
              }}
            >
              <strong>Battery Status:</strong> {selectedSensor.batteryStatus}%
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: getHealthColor(selectedSensor.sensorHealth) }}
            >
              <strong>Sensor Health:</strong> {selectedSensor.sensorHealth}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">No Sensor Selected</Typography>
            <Typography variant="body2">
              Click a sensor on the map to see its details.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Weather Data */}
      {selectedSensor && (
        <Card 
          sx={{ 
            mb: 2,
            transition: 'all 0.3s ease-in-out', // Smooth card transitions
          }}
        >
          <CardContent
            sx={{
              transition: 'opacity 0.3s ease-in-out', // Smooth content transitions
            }}
          >
            <WeatherDisplay
              weatherData={displayWeather}
              selectedSensor={selectedSensor}
              setWeatherData={setWeatherData}
              isLoading={isLoadingWeather}
            />
          </CardContent>
        </Card>
      )}

      {/* Drone Mission Status */}
      <Card>
        <CardContent>
          <Typography variant="h6">Drone Mission</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Location:</strong> {dronePosition.lat.toFixed(4)},{" "}
            {dronePosition.lng.toFixed(4)}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Status:</strong>{" "}
            {selectedSensor ? "Monitoring Sensor" : "Navigating to Next Sensor"}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Mission:</strong> Autonomous sensor patrol route
          </Typography>
        </CardContent>
        {selectedSensor && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, pt: 1 }}>
              Live feed from drone
            </Typography>
            <CardMedia
              component="img"
              height="194"
              image={currentFeedUrl}
              alt={`Live feed from drone (sensor ${selectedSensor.id})`}
            />
            {/* Image Prediction Results */}
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                AI Image Analysis
              </Typography>
              {isLoadingPrediction ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Analyzing image...
                  </Typography>
                </Box>
              ) : predictionError ? (
                <Alert severity="warning" sx={{ py: 0.5 }}>
                  <Typography variant="caption">
                    {predictionError}
                  </Typography>
                </Alert>
              ) : currentPrediction ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={currentPrediction.fire_detected ? "Fire Detected" : "No Fire"}
                      color={currentPrediction.fire_detected ? "error" : "success"}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {currentPrediction.confidence}% confidence
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ML Model Prediction (ResNet18)
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No prediction available
                </Typography>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </Box>
  );
}

export default Sidebar;
