import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, CardMedia, CircularProgress } from "@mui/material";
import useAppStore from "../store/useAppStore";
import { formatPosition } from "../utils/positionUtils";
import { predictWildfireFromImageBlob } from "../services/wildfireInferenceService";
import { softColors } from "../theme/colors";
import DashboardPanel from "./DashboardPanel";
import PanelTitle from "./panel/PanelTitle";
import PanelLine from "./panel/PanelLine";

/**
 * Component that displays drone mission feed information
 * Shows drone location, zone, status, and live sensor feed when available
 * @param {boolean} [embedInPanel] - When true, render only inner content (no DashboardPanel wrapper)
 */
function DroneFeedCard({ embedInPanel = false }) {
  const selectedSensor = useAppStore((state) => state.selectedSensor);
  const selectedDroneId = useAppStore((state) => state.selectedDroneId);
  const drones = useAppStore((state) => state.drones);

  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  /** Object URL of the image we fetched and display (same image sent to the model). */
  const [displayImageUrl, setDisplayImageUrl] = useState(null);
  const objectUrlRef = useRef(null);

  const selectedDrone =
    drones.find((drone) => drone.id === selectedDroneId) || null;

  // Fetch image in frontend, display it, and send that same image to the API (no URL sent to API)
  useEffect(() => {
    if (!selectedSensor?.imageUrl) {
      setPrediction(null);
      setPredictionError(null);
      setDisplayImageUrl(null);
      return;
    }
    let cancelled = false;
    setPredictionLoading(true);
    setPredictionError(null);
    setDisplayImageUrl(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    fetch(selectedSensor.imageUrl)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            res.status === 403
              ? "Image host blocked request (403)."
              : `HTTP ${res.status}`,
          );
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setDisplayImageUrl(objectUrl);
        return predictWildfireFromImageBlob(blob);
      })
      .then((result) => {
        if (!cancelled && result) setPrediction(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setPredictionError(err.message);
          setPrediction(null);
        }
      })
      .finally(() => {
        if (!cancelled) setPredictionLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [selectedSensor?.imageUrl]);

  const panelTextSx = {
    fontFamily: "Roboto Mono, monospace",
    fontSize: "12px",
    color: "#999",
  };

  if (!selectedDrone) {
    const emptyMessage = (
      <Typography sx={panelTextSx}>No Drone Selected</Typography>
    );
    if (embedInPanel) return emptyMessage;
    return (
      <DashboardPanel>
        <PanelTitle title="Drone Mission" />
        {emptyMessage}
      </DashboardPanel>
    );
  }

  const dronePosition = selectedDrone.position || { lat: 0, lng: 0 };
  const zone = selectedDrone.zone;

  const content = (
    <>
      <Box sx={{ "& > *": { marginBottom: 0.5 }, mb: 1 }}>
        <PanelLine label="Location" info={formatPosition(dronePosition)} />
        <PanelLine
          label="Zone"
          info={`${zone?.name || "Unknown"} (${zone?.sensors.length || 0} sensors)`}
        />
        <PanelLine
          label="Status"
          info={
            selectedSensor
              ? "Monitoring Sensor"
              : "Navigating To Next Sensor"
          }
        />
        <PanelLine label="Mission" info="Autonomous Sensor Patrol Route" />
      </Box>
      {selectedSensor && selectedSensor.imageUrl ? (
        <Box>
          {displayImageUrl ? (
            <CardMedia
              component="img"
              height="194"
              image={displayImageUrl}
              alt={`Live feed from sensor ${selectedSensor.id}`}
              sx={{ objectFit: "cover" }}
            />
          ) : (
            <Box
              sx={{
                height: 194,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0,0,0,0.2)",
                ...panelTextSx,
              }}
            >
              {predictionLoading ? (
                <CircularProgress size={32} sx={{ color: "#999" }} />
              ) : (
                <Typography sx={panelTextSx}>
                  {predictionError ? "Image Unavailable" : "Loading Image…"}
                </Typography>
              )}
            </Box>
          )}
          <Box
            sx={{
              p: 1,
              borderTop: 1,
              borderColor: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              minHeight: 36,
            }}
          >
            {predictionLoading && (
              <>
                <CircularProgress size={18} sx={{ color: "#999" }} />
                <Typography sx={panelTextSx}>
                  Running Wildfire Prediction…
                </Typography>
              </>
            )}
            {predictionError && (
              <Typography sx={{ ...panelTextSx, color: softColors.red }}>
                {predictionError.includes("Failed to fetch") &&
                !predictionError.includes("fetch image")
                  ? "Inference Server Not Reachable. Start With: cd api && python image_inference_api.py"
                  : predictionError.includes("fetch image") ||
                      predictionError.includes("403") ||
                      predictionError.includes("Forbidden")
                    ? "Image Host Blocked Request (403). Try Another Sensor."
                    : `Prediction: ${predictionError}`}
              </Typography>
            )}
            {!predictionLoading && !predictionError && prediction && (
              <Typography
                sx={{
                  ...panelTextSx,
                  color: prediction.fire_detected ? softColors.red : softColors.green,
                }}
              >
                {prediction.fire_detected
                  ? `Fire Detected (${prediction.confidence} %)`
                  : `No Fire (${prediction.confidence} %)`}
              </Typography>
            )}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            height: 194,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...panelTextSx,
          }}
        >
          <Typography sx={panelTextSx}>
            Waiting For Sensor Selection...
          </Typography>
        </Box>
      )}
    </>
  );

  if (embedInPanel) return content;
  return (
    <DashboardPanel>
      <PanelTitle title={`${selectedDrone.name} Mission`} />
      {content}
    </DashboardPanel>
  );
}

export default DroneFeedCard;
