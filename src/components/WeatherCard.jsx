import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import DashboardPanel from "./DashboardPanel";
import PanelTitle from "./panel/PanelTitle";
import PanelLine from "./panel/PanelLine";
import TextBar from "./panel/TextBar";
import TextOption from "./panel/TextOption";
import { softColors } from "../theme/colors";
import useAppStore from "../store/useAppStore";
import {
  fetchWeatherForSensor,
  getWeatherForSensor,
} from "../utils/weatherHelpers";

function WeatherCard() {
  const [showMore, setShowMore] = useState(false);
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const weatherData = useAppStore((state) => state.weatherData);
  const setWeatherData = useAppStore((state) => state.setWeatherData);

  useEffect(() => {
    if (selectedSensor) {
      fetchWeatherForSensor(selectedSensor, setWeatherData).catch((err) =>
        console.error("Auto-fetch weather error:", err)
      );
    }
  }, [selectedSensor, setWeatherData]);

  if (!selectedSensor) return null;

  const weather = getWeatherForSensor(selectedSensor.id, weatherData) || {};

  return (
    <DashboardPanel sx={{ minHeight: "280px" }}>
      <PanelTitle title="Wildfire Conditions" />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 0.5 }}>
        <TextOption
          label="Refresh"
          selected={false}
          onClick={() =>
            fetchWeatherForSensor(selectedSensor, setWeatherData).catch((err) =>
              console.error("Manual weather fetch error:", err)
            )
          }
        />
        <TextOption
          label={showMore ? "Show less" : "Show more"}
          selected={showMore}
          onClick={() => setShowMore((v) => !v)}
        />
      </Box>
      {weather.temperature !== undefined ? (
        <Box sx={{ "& > *": { marginBottom: 0.5 } }}>
          <PanelLine
            label="Temperature"
            infoRight={
              <span>
                {weather.temperature} F{" "}
                <TextBar
                  value={Math.max(0, Math.min(100, Number(weather.temperature)))}
                  color={softColors.grey}
                />
              </span>
            }
          />
          <PanelLine
            label="Humidity"
            infoRight={
              <span>
                {weather.humidity} % <TextBar value={weather.humidity} color={softColors.grey} />
              </span>
            }
          />
          <PanelLine
            label="Wind"
            info={
              [weather.windSpeed != null && `${weather.windSpeed} mph`, weather.windDirection != null && `${weather.windDirection}°`]
                .filter(Boolean)
                .join(" ") || ""
            }
          />
          {showMore && (
            <>
              <PanelLine label="Wind Gust" info={`${weather.windGust ?? ""} mph`} />
              <PanelLine label="Conditions" info={weather.description ?? ""} />
              <PanelLine label="Visibility" info={`${weather.visibility ?? ""} mi`} />
              <PanelLine label="Cloud Cover" info={`${weather.cloudCover ?? ""} %`} />
              <PanelLine label="UV Index" info={weather.uvIndex ?? ""} />
              <PanelLine label="Dew Point" info={`${weather.dewPoint ?? ""} F`} />
              {weather.thunderstormProbability > 0 && (
                <PanelLine
                  label="Thunderstorm Probability"
                  info={`${weather.thunderstormProbability} %`}
                />
              )}
              {weather.airQuality && (
                <>
                  <PanelLine
                    label="PM2.5"
                    info={`${weather.airQuality.pm2_5 ?? ""} µg/m³`}
                  />
                  <PanelLine
                    label="PM10"
                    info={`${weather.airQuality.pm10 ?? ""} µg/m³`}
                  />
                </>
              )}
            </>
          )}
        </Box>
      ) : (
        <Typography sx={{ fontFamily: "Roboto Mono", fontSize: "12px", color: "#999" }}>
          Fetching Live Weather Data...
        </Typography>
      )}
    </DashboardPanel>
  );
}

export default WeatherCard;
