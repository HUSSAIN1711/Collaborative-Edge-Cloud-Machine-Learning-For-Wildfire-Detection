import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Paper,
} from "@mui/material";
import DashboardPanel from "./DashboardPanel";
import useAppStore from "../store/useAppStore";
import { getTemperatureColor, getHumidityColor } from "../utils/colorUtils";
import { fetchWeatherForSensor, getWeatherForSensor } from "../utils/weatherHelpers";
import ThermometerGauge from "./gauges/ThermometerGauge";
import CircularGauge from "./gauges/CircularGauge";
import WindCompass from "./gauges/WindCompass";

/**
 * Helper component for displaying text metrics in a grid
 * @param {Object} props - Component props
 * @param {string} props.label - Label text
 * @param {string|number} props.value - Value to display
 * @param {string} props.unit - Unit to display after value
 * @param {string} props.color - Color for label text
 * @param {string} props.valueColor - Color for value text
 */
const MetricTextItem = ({
  label,
  value,
  unit = "",
  color = "text.secondary",
  valueColor = "text.primary",
}) => (
  <Grid item xs={12} sm={6}>
    <Typography variant="caption" color={color} sx={{ fontSize: "0.7rem", lineHeight: 1 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: "medium", color: valueColor, lineHeight: 1.2 }}>
      {value} {unit}
    </Typography>
  </Grid>
);

/**
 * Component that displays weather conditions for the selected sensor
 * Shows temperature, humidity, wind, and additional weather metrics
 */
function WeatherCard() {
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const weatherData = useAppStore((state) => state.weatherData);
  const setWeatherData = useAppStore((state) => state.setWeatherData);

  // Auto-fetch weather data when sensor is selected
  useEffect(() => {
    if (selectedSensor) {
      fetchWeatherForSensor(selectedSensor, setWeatherData).catch((error) => {
        console.error("Auto-fetch weather error:", error);
      });
    }
  }, [selectedSensor, setWeatherData]);

  if (!selectedSensor) {
    return null;
  }

  const weather = getWeatherForSensor(selectedSensor.id, weatherData) || {};

  return (
    <DashboardPanel
      title="Wildfire Conditions"
      actions={
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            fetchWeatherForSensor(selectedSensor, setWeatherData).catch((error) => {
              console.error("Manual weather fetch error:", error);
            });
          }}
        >
          Refresh
        </Button>
      }
      sx={{ minHeight: "280px" }}
    >
      {weather.temperature !== undefined ? (
          <Grid container spacing={2}>
            
            {/* 1. LEFT COLUMN: GAUGES (7/12 width) */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 1.5, bgcolor: "background.paper", height: '100%' }}>
                <Grid container spacing={1.5} justifyContent="space-between" alignItems="center">
                  
                  {/* Thermometer */}
                  <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <ThermometerGauge
                      value={weather.temperature}
                      min={50}
                      max={100}
                      label="Temperature"
                      unit="°F"
                      color={getTemperatureColor(weather.temperature)}
                      height={80} 
                    />
                  </Grid>

                  {/* Humidity Gauge */}
                  <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularGauge
                      value={weather.humidity}
                      min={0}
                      max={100}
                      label="Humidity"
                      unit="%"
                      color={getHumidityColor(weather.humidity)}
                      size={90}
                    />
                    {weather.humidity < 30 && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ display: "block", mt: 0.5, fontSize: "0.65rem" }}
                      >
                        ⚠ Fire risk
                      </Typography>
                    )}
                  </Grid>

                  {/* Wind Compass */}
                  <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <WindCompass
                      windSpeed={weather.windSpeed}
                      windDirection={weather.windDirection}
                      size={100}
                      unit="mph"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* 2. RIGHT COLUMN: TEXT METRICS (5/12 width) */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 1.5, bgcolor: "background.paper", height: '100%' }}>
                <Typography variant="caption" sx={{ mb: 1, fontWeight: "bold", fontSize: "0.8rem", display: "block" }}>
                  Additional Metrics
                </Typography>
                <Grid container spacing={1.5}>
                  
                  {/* Primary Conditions */}
                  <MetricTextItem label="Wind Gust" value={weather.windGust} unit="mph" />
                  <MetricTextItem label="Conditions" value={weather.description} unit="" />
                  <MetricTextItem label="Visibility" value={weather.visibility} unit="mi" />
                  <MetricTextItem label="Cloud Cover" value={weather.cloudCover} unit="%" />
                  
                  {/* Secondary Data */}
                  <MetricTextItem label="UV Index" value={weather.uvIndex} />
                  <MetricTextItem label="Dew Point" value={weather.dewPoint} unit="°F" />
                  
                  {/* Warnings */}
                  {weather.thunderstormProbability > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="warning.main" sx={{ fontWeight: "bold", fontSize: "0.7rem" }}>
                        ⚠ Thunderstorm Prob.: {weather.thunderstormProbability}%
                      </Typography>
                    </Grid>
                  )}
                  
                  {/* Air Quality Section */}
                  {weather.airQuality && (
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ mt: 1, mb: 0.5, fontWeight: "bold", fontSize: "0.75rem", display: "block" }}>
                        Air Quality
                      </Typography>
                      <Grid container spacing={1.5}>
                        <MetricTextItem label="PM2.5" value={weather.airQuality.pm2_5} unit="μg/m³" color="text.primary" valueColor="text.secondary" />
                        <MetricTextItem label="PM10" value={weather.airQuality.pm10} unit="μg/m³" color="text.primary" valueColor="text.secondary" />
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Fetching live weather data...
            </Typography>
          </Box>
        )}
    </DashboardPanel>
  );
}

export default WeatherCard;