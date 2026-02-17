import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  CardMedia,
  Chip,
  CircularProgress,
} from "@mui/material";
import useAppStore from "../store/useAppStore";
import { formatPosition } from "../utils/positionUtils";
import { predictWildfireFromImageBlob } from "../services/wildfireInferenceService";
import DashboardPanel from "./DashboardPanel";

/**
 * Component that displays drone mission feed information
 * Shows drone location, zone, status, and live sensor feed when available
 */
function DroneFeedCard() {
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

  if (!selectedDrone) {
    return (
      <DashboardPanel title="Drone Mission">
        <Typography variant="body2" color="text.secondary">
          No drone selected
        </Typography>
      </DashboardPanel>
    );
  }

  const dronePosition = selectedDrone.position || { lat: 0, lng: 0 };
  const zone = selectedDrone.zone;

  return (
    <DashboardPanel title={`${selectedDrone.name} Mission`}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Location:</strong> {formatPosition(dronePosition)}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Zone:</strong> {zone?.name || "Unknown"} (
        {zone?.sensors.length || 0} sensors)
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Status:</strong>{" "}
        {selectedSensor ? "Monitoring Sensor" : "Navigating to Next Sensor"}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <strong>Mission:</strong> Autonomous sensor patrol route
      </Typography>
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
                bgcolor: "action.hover",
                color: "text.secondary",
              }}
            >
              {predictionLoading ? (
                <CircularProgress size={32} />
              ) : (
                <Typography variant="body2">
                  {predictionError ? "Image unavailable" : "Loading image…"}
                </Typography>
              )}
            </Box>
          )}
          <Box
            sx={{
              p: 1.5,
              borderTop: 1,
              borderColor: "divider",
              bgcolor: "background.default",
              display: "flex",
              alignItems: "center",
              gap: 1,
              minHeight: 40,
            }}
          >
            {predictionLoading && (
              <>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Running wildfire prediction…
                </Typography>
              </>
            )}
            {predictionError && (
              <Typography variant="body2" color="error.main">
                {predictionError.includes("Failed to fetch") &&
                !predictionError.includes("fetch image")
                  ? "Inference server not reachable. Start it with: cd api && python image_inference_api.py"
                  : predictionError.includes("fetch image") ||
                      predictionError.includes("403") ||
                      predictionError.includes("Forbidden")
                    ? "Image host blocked request (403). Try another sensor."
                    : `Prediction: ${predictionError}`}
              </Typography>
            )}
            {!predictionLoading && !predictionError && prediction && (
              <Chip
                size="small"
                label={
                  prediction.fire_detected
                    ? `Fire detected (${prediction.confidence}%)`
                    : `No fire (${prediction.confidence}%)`
                }
                sx={{
                  bgcolor: prediction.fire_detected
                    ? "error.dark"
                    : "success.dark",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
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
            bgcolor: "background.default",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">
            Waiting for sensor selection...
          </Typography>
        </Box>
      )}
    </DashboardPanel>
  );
}

export default DroneFeedCard;
