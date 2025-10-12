import React, { useEffect } from 'react';
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
  Button
} from '@mui/material';
import useAppStore from '../store/useAppStore';
import weatherService from '../services/weatherService';

function Sidebar() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const dronePosition = useAppStore((state) => state.dronePosition);
  const weatherData = useAppStore((state) => state.weatherData);
  const getWeatherData = useAppStore((state) => state.getWeatherData);
  const setWeatherData = useAppStore((state) => state.setWeatherData);

  const getWeatherForSensor = (sensorId) => {
    // Return cached weather data directly
    const data = weatherData[sensorId];
    console.log('Getting weather for sensor', sensorId, ':', data);
    return data;
  };

  const getFireRiskColor = (probability) => {
    if (probability === 100) return '#f44336'; // Red
    if (probability >= 70) return '#ff9800'; // Orange
    if (probability >= 40) return '#ffeb3b'; // Yellow
    return '#4caf50'; // Green
  };

  const getFireRiskLabel = (probability) => {
    if (probability === 100) return 'CRITICAL';
    if (probability >= 70) return 'HIGH';
    if (probability >= 40) return 'MODERATE';
    return 'LOW';
  };

  // Auto-fetch weather data when sensor is selected
  useEffect(() => {
    if (selectedSensor) {
      console.log('Sensor selected, fetching weather data for sensor', selectedSensor.id);
      weatherService.fetchWeatherData(selectedSensor.position.lat, selectedSensor.position.lng)
        .then(weatherData => {
          console.log('Auto-fetch weather result:', weatherData);
          setWeatherData(selectedSensor.id, weatherData);
        })
        .catch(error => {
          console.error('Auto-fetch weather error:', error);
        });
    }
  }, [selectedSensor, setWeatherData]);

  return (
    <Box>
      {/* Dashboard Details Panel */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Dashboard Details
          </Typography>
          {selectedSensor ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'background.paper' }}>
                    <Typography variant="h4" sx={{ color: getFireRiskColor(selectedSensor.fireProbability) }}>
                      {selectedSensor.fireProbability}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Predicted Fire Probability
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'background.paper' }}>
                    <Typography variant="h6" color="text.secondary">
                      {selectedSensor.status}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Chip 
                label={getFireRiskLabel(selectedSensor.fireProbability)}
                color={selectedSensor.fireProbability === 100 ? 'error' : 
                       selectedSensor.fireProbability >= 70 ? 'warning' : 'success'}
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
            <Typography variant="h6" gutterBottom>Sensor #{selectedSensor.id}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Status:</strong> {selectedSensor.status}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Last Ping:</strong> {selectedSensor.lastPing}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Location:</strong> {selectedSensor.position.lat.toFixed(4)}, {selectedSensor.position.lng.toFixed(4)}
            </Typography>
            <Typography variant="body2" sx={{ color: selectedSensor.fireProbability > 50 ? 'red' : 'inherit' }}>
              <strong>Predicted Fire Probability:</strong> {selectedSensor.fireProbability}%
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">No Sensor Selected</Typography>
            <Typography variant="body2">Click a sensor on the map to see its details.</Typography>
          </CardContent>
        </Card>
      )}

      {/* Weather Data */}
      {selectedSensor && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="primary">
                Live Weather Conditions
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  console.log('Manually fetching weather for sensor', selectedSensor.id);
                  weatherService.fetchWeatherData(selectedSensor.position.lat, selectedSensor.position.lng)
                    .then(weatherData => {
                      console.log('Manual weather fetch result:', weatherData);
                      setWeatherData(selectedSensor.id, weatherData);
                    })
                    .catch(error => {
                      console.error('Manual weather fetch error:', error);
                    });
                }}
              >
                Refresh
              </Button>
            </Box>
            {getWeatherForSensor(selectedSensor.id) ? (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Temperature:</strong> {getWeatherForSensor(selectedSensor.id).temperature}°F
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Humidity:</strong> {getWeatherForSensor(selectedSensor.id).humidity}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Wind Speed:</strong> {getWeatherForSensor(selectedSensor.id).windSpeed} mph
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Wind Direction:</strong> {getWeatherForSensor(selectedSensor.id).windDirection}°
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Wind Gust:</strong> {getWeatherForSensor(selectedSensor.id).windGust} mph
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>UV Index:</strong> {getWeatherForSensor(selectedSensor.id).uvIndex}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Visibility:</strong> {getWeatherForSensor(selectedSensor.id).visibility} mi
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Cloud Cover:</strong> {getWeatherForSensor(selectedSensor.id).cloudCover}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Dew Point:</strong> {getWeatherForSensor(selectedSensor.id).dewPoint}°F
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Heat Index:</strong> {getWeatherForSensor(selectedSensor.id).heatIndex}°F
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Wind Chill:</strong> {getWeatherForSensor(selectedSensor.id).windChill}°F
                  </Typography>
                </Grid>
                {getWeatherForSensor(selectedSensor.id).thunderstormProbability > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="warning.main">
                      <strong>Thunderstorm Probability:</strong> {getWeatherForSensor(selectedSensor.id).thunderstormProbability}%
                    </Typography>
                  </Grid>
                )}
              <Grid item xs={12}>
                <Typography variant="body2">
                  <strong>Conditions:</strong> {getWeatherForSensor(selectedSensor.id).description}
                </Typography>
              </Grid>
              {getWeatherForSensor(selectedSensor.id).airQuality && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Air Quality Data
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>PM2.5:</strong> {getWeatherForSensor(selectedSensor.id).airQuality.pm2_5} μg/m³
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>PM10:</strong> {getWeatherForSensor(selectedSensor.id).airQuality.pm10} μg/m³
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>O₃:</strong> {getWeatherForSensor(selectedSensor.id).airQuality.o3} μg/m³
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>NO₂:</strong> {getWeatherForSensor(selectedSensor.id).airQuality.no2} μg/m³
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Fetching live weather data...
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Drone Mission Status */}
      <Card>
        <CardContent>
          <Typography variant="h6">Drone Mission</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Location:</strong> {dronePosition.lat.toFixed(4)}, {dronePosition.lng.toFixed(4)}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Status:</strong> {selectedSensor ? 'Monitoring Sensor' : 'Navigating to Next Sensor'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Mission:</strong> Autonomous sensor patrol route
          </Typography>
        </CardContent>
        {selectedSensor && (
          <CardMedia
            component="img"
            height="194"
            image={selectedSensor.imageUrl}
            alt={`Live feed from sensor ${selectedSensor.id}`}
          />
        )}
      </Card>
    </Box>
  );
}

export default Sidebar;
