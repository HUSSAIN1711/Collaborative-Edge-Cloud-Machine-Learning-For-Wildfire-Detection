/**
 * Service for wildfire image inference via the ResNet18 inference API.
 * Supports (1) API fetches image by URL (predict-from-url, avoids browser 403),
 * (2) Frontend sends image blob (predict), and health check.
 */

function getApiBaseUrl() {
  if (import.meta.env.VITE_WILDFIRE_INFERENCE_API) {
    return import.meta.env.VITE_WILDFIRE_INFERENCE_API;
  }
  // In dev, same origin; Vite proxies /api-inference → localhost:5001
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return "";
  }
  // Production or SSR: use same host and port 5001
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:5001`;
  }
  return "http://localhost:5001";
}

const INFERENCE_API_BASE = getApiBaseUrl();
const API_PATH_PREFIX =
  import.meta.env.DEV && !import.meta.env.VITE_WILDFIRE_INFERENCE_API
    ? "/api-inference"
    : "";

function apiUrl(path) {
  return `${INFERENCE_API_BASE}${API_PATH_PREFIX}${path}`;
}

function wrapNetworkError(error) {
  if (error?.message === "Failed to fetch") {
    const where = API_PATH_PREFIX
      ? `(proxied at ${API_PATH_PREFIX})`
      : `at ${INFERENCE_API_BASE}`;
    throw new Error(
      `Inference server not reachable ${where}. Start it with: python3 src/MachineLearningModels/EdgeDeviceModelArtifacts/image_inference_api.py`,
    );
  }
  throw error;
}

/**
 * Run wildfire detection using the image URL. The API fetches the image server-side
 * (avoids browser 403/CORS from image hosts).
 * @param {string} imageUrl - Public URL of the image
 * @returns {Promise<{ fire_detected: boolean, confidence: number, probability: number, image_base64?: string, image_content_type?: string }>}
 * @throws on network or API error
 */
export async function predictWildfireFromImageUrl(imageUrl) {
  try {
    const res = await fetch(apiUrl("/predict-from-url"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        (body && body.error) || res.statusText || `Inference API error: ${res.status}`;
      throw new Error(message);
    }
    return body;
  } catch (err) {
    wrapNetworkError(err);
  }
}

/**
 * Run wildfire detection on an image blob (e.g. from fetch). No URL is sent to the API.
 * @param {Blob} imageBlob - Image as Blob (e.g. from response.blob())
 * @returns {Promise<{ fire_detected: boolean, confidence: number, probability: number }>}
 * @throws on network or API error
 */
export async function predictWildfireFromImageBlob(imageBlob) {
  try {
    const form = new FormData();
    form.append("image", imageBlob, "image.jpg");

    const res = await fetch(apiUrl("/predict"), {
      method: "POST",
      body: form,
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        (body && body.error) || res.statusText || `Inference API error: ${res.status}`;
      throw new Error(message);
    }

    return body;
  } catch (err) {
    wrapNetworkError(err);
  }
}

/**
 * Fetch image from URL and return as Blob. Use when you want to display and then send the same image.
 * Fails with a clear message if the host blocks (403/CORS).
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<Blob>}
 */
export async function getImageBlobFromUrl(imageUrl) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(
        res.status === 403
          ? "Image host blocked request (403)."
          : `HTTP ${res.status}`,
      );
    }
    return res.blob();
  } catch (err) {
    if (
      err.message?.includes("403") ||
      err.message?.includes("Failed to fetch")
    ) {
      throw new Error(
        "Could not load image from URL. External images may be blocked by CORS or the host (403).",
      );
    }
    throw err;
  }
}

/**
 * Health check for the inference API.
 * @returns {Promise<{ status: string, model_loaded?: boolean }>}
 */
export async function checkInferenceHealth() {
  const res = await fetch(apiUrl("/health"));
  return res.json();
}

/**
 * Predict weather-based fire risk using EdgeDeviceModelArtifacts/inference.py.
 * Accepts the raw weatherData object from weatherService.
 * @param {Object} weatherData - Weather data from weatherService
 * @returns {Promise<{ fire_risk_class: number, fire_risk_probability: number, fire_risk_percent: number, features_used: Object }>}
 */
export async function predictWeatherRiskFromWeatherData(weatherData) {
  try {
    const res = await fetch(apiUrl("/predict-weather-risk"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weatherData }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        (body && body.error) ||
        res.statusText ||
        `Weather risk inference API error: ${res.status}`;
      throw new Error(message);
    }

    return body;
  } catch (err) {
    wrapNetworkError(err);
  }
}

/**
 * Check if the inference API is available and model is loaded.
 * @returns {Promise<boolean>}
 */
export async function checkApiHealth() {
  try {
    const data = await checkInferenceHealth();
    return data?.status === "healthy" && data?.model_loaded === true;
  } catch {
    return false;
  }
}
