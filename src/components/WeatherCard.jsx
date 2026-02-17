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
  const [dataSource, setDataSource] = useState("simulated"); // "simulated" | "live"
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const simulationTimestamp = useAppStore((state) => state.simulationTimestamp);
  const weatherData = useAppStore((state) => state.weatherData);
  const setWeatherData = useAppStore((state) => state.setWeatherData);

  // Auto-fetch live weather when switching to live mode
  useEffect(() => {
    if (selectedSensor && dataSource === "live") {
      fetchWeatherForSensor(selectedSensor, setWeatherData).catch((err) =>
        console.error("Auto-fetch weather error:", err)
      );
    }
  }, [selectedSensor, setWeatherData, dataSource]);

  if (!selectedSensor) return null;

  // Build the weather object depending on which data source is active
  const liveWeather = getWeatherForSensor(selectedSensor.id, weatherData) || {};
  const simWeather = {
    temperature: selectedSensor.temperature,
    humidity: selectedSensor.humidity,
    windSpeed: selectedSensor.windSpeed,
    windDirection: selectedSensor.windDirection,
  };
  const weather = dataSource === "simulated" ? simWeather : liveWeather;
  const hasData =
    dataSource === "simulated"
      ? selectedSensor.temperature !== undefined
      : liveWeather.temperature !== undefined;

  return (
    <DashboardPanel sx={{ minHeight: "280px" }}>
      <PanelTitle title="Wildfire Conditions" />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 0.5 }}>
        <TextOption
          label="Simulated"
          selected={dataSource === "simulated"}
          onClick={() => setDataSource("simulated")}
        />
        <TextOption
          label="Live"
          selected={dataSource === "live"}
          onClick={() => setDataSource("live")}
        />
        {dataSource === "live" && (
          <TextOption
            label="Refresh"
            selected={false}
            onClick={() =>
              fetchWeatherForSensor(selectedSensor, setWeatherData).catch(
                (err) => console.error("Manual weather fetch error:", err)
              )
            }
          />
        )}
        <TextOption
          label={showMore ? "Show less" : "Show more"}
          selected={showMore}
          onClick={() => setShowMore((v) => !v)}
        />
      </Box>
      {dataSource === "simulated" && (
        <Typography
          sx={{
            fontFamily: "Roboto Mono",
            fontSize: "10px",
            color: "#777",
            mb: 0.5,
          }}
        >
          Tick {simulationTimestamp}
        </Typography>
      )}
      {hasData ? (
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
                {weather.humidity} %{" "}
                <TextBar value={weather.humidity} color={softColors.grey} />
              </span>
            }
          />
          <PanelLine
            label="Wind"
            info={
              [
                weather.windSpeed != null && `${weather.windSpeed} mph`,
                weather.windDirection != null && `${weather.windDirection}°`,
              ]
                .filter(Boolean)
                .join(" ") || ""
            }
          />
          {showMore && dataSource === "live" && (
            <>
              <PanelLine
                label="Wind Gust"
                info={`${liveWeather.windGust ?? ""} mph`}
              />
              <PanelLine
                label="Conditions"
                info={liveWeather.description ?? ""}
              />
              <PanelLine
                label="Visibility"
                info={`${liveWeather.visibility ?? ""} mi`}
              />
              <PanelLine
                label="Cloud Cover"
                info={`${liveWeather.cloudCover ?? ""} %`}
              />
              <PanelLine label="UV Index" info={liveWeather.uvIndex ?? ""} />
              <PanelLine
                label="Dew Point"
                info={`${liveWeather.dewPoint ?? ""} F`}
              />
              {liveWeather.thunderstormProbability > 0 && (
                <PanelLine
                  label="Thunderstorm Probability"
                  info={`${liveWeather.thunderstormProbability} %`}
                />
              )}
              {liveWeather.airQuality && (
                <>
                  <PanelLine
                    label="PM2.5"
                    info={`${liveWeather.airQuality.pm2_5 ?? ""} µg/m³`}
                  />
                  <PanelLine
                    label="PM10"
                    info={`${liveWeather.airQuality.pm10 ?? ""} µg/m³`}
                  />
                </>
              )}
            </>
          )}
          {showMore && dataSource === "simulated" && (
            <>
              <PanelLine
                label="Fire Probability"
                info={`${selectedSensor.fireProbability ?? 0} %`}
              />
              <PanelLine
                label="Fire Percentage"
                info={`${selectedSensor.firePercentage ?? 0} %`}
              />
            </>
          )}
        </Box>
      ) : (
        <Typography
          sx={{ fontFamily: "Roboto Mono", fontSize: "12px", color: "#999" }}
        >
          {dataSource === "live"
            ? "Fetching Live Weather Data..."
            : "Initialising simulation..."}
        </Typography>
      )}
    </DashboardPanel>
  );
}

export default WeatherCard;
