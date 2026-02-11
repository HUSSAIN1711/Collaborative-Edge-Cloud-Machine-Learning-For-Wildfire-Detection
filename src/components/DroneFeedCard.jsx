import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
} from "@mui/material";
import useAppStore from "../store/useAppStore";
import { formatPosition } from "../utils/positionUtils";
import { predictWildfireFromImageUrl } from "../services/wildfireInferenceService";

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
  /** Display image source returned by backend (usually base64 data URI). */
  const [displayImageUrl, setDisplayImageUrl] = useState(null);
  /** Cache by image URL to avoid hammering third-party hosts and hitting 429 rate limits. */
  const predictionCacheRef = useRef(new Map());

  const selectedDrone = drones.find((drone) => drone.id === selectedDroneId) || null;

  // Fetch + infer via backend so browser CORS/hotlink restrictions do not break prediction.
  useEffect(() => {
    const imageUrl = selectedSensor?.imageUrl;
    if (!imageUrl) {
      setPrediction(null);
      setPredictionError(null);
      setDisplayImageUrl(null);
      return;
    }
    let cancelled = false;
    setPredictionLoading(true);
    setPredictionError(null);
    setDisplayImageUrl(null);

    const cachedEntry = predictionCacheRef.current.get(imageUrl);
    if (cachedEntry) {
      setPrediction(cachedEntry.prediction);
      setDisplayImageUrl(cachedEntry.displayImageUrl);
      setPredictionLoading(false);
      return;
    }

    predictWildfireFromImageUrl(imageUrl)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) return;

        const contentType = blob.image_content_type || "image/jpeg";
        const resolvedImageSrc = blob.image_base64
          ? `data:${contentType};base64,${blob.image_base64}`
          : imageUrl;

        const cachedPayload = {
          prediction: blob,
          displayImageUrl: resolvedImageSrc,
        };
        predictionCacheRef.current.set(imageUrl, cachedPayload);

        setPrediction(blob);
        setDisplayImageUrl(resolvedImageSrc);
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
    };
  }, [selectedSensor?.imageUrl]);

  if (!selectedDrone) {
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            p: 1.5,
            bgcolor: "background.default",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Drone Mission
          </Typography>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No drone selected
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const dronePosition = selectedDrone.position || { lat: 0, lng: 0 };
  const zone = selectedDrone.zone;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          p: 1.5,
          bgcolor: "background.default",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {selectedDrone.name} Mission
        </Typography>
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Location:</strong> {formatPosition(dronePosition)}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Zone:</strong> {zone?.name || "Unknown"} ({zone?.sensors.length || 0} sensors)
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Status:</strong>{" "}
          {selectedSensor ? "Monitoring Sensor" : "Navigating to Next Sensor"}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>Mission:</strong> Autonomous sensor patrol route
        </Typography>
      </CardContent>
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
                {predictionError.includes("429")
                  ? "Image host rate-limited requests (HTTP 429). Please wait a bit and try another sensor."
                  : predictionError.includes("Failed to fetch") &&
                      !predictionError.includes("fetch image")
                  ? "Inference server not reachable. Start it with: python3 src/MachineLearningModels/EdgeDeviceModelArtifacts/image_inference_api.py"
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
    </Card>
  );
}

export default DroneFeedCard;

