/**
 * Service for calling the wildfire image detection API
 */

function getApiBaseUrl() {
  if (import.meta.env.VITE_IMAGE_PREDICTION_API_URL) {
    return import.meta.env.VITE_IMAGE_PREDICTION_API_URL;
  }
  // In dev, use Vite proxy so the request is same-origin (avoids CORS / "Failed to fetch")
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return ''; // same origin; Vite proxies /api-image/* to localhost:5001
  }
  // Use same host as the page (localhost vs 127.0.0.1) when not using proxy
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5001`;
  }
  return 'http://localhost:5001';
}

const API_PATH_PREFIX = import.meta.env.DEV && !import.meta.env.VITE_IMAGE_PREDICTION_API_URL ? '/api-image' : '';

const API_BASE_URL = getApiBaseUrl();

/**
 * Convert an image URL to a blob, then to a File object for API upload
 * This handles CORS issues by fetching through a proxy or directly
 */
async function imageUrlToFile(imageUrl) {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Create a File object from the blob
    // Extract filename from URL or use a default
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('?')[0] || 'image.jpg';
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
    
    return file;
  } catch (error) {
    console.error('Error converting image URL to file:', error);
    // Don't rethrow "Failed to fetch" — caller would think the API is down. This is the image URL fetch failing (often CORS).
    throw new Error(
      'Could not load image from URL. External images may be blocked by CORS or network.'
    );
  }
}

/**
 * Predict wildfire from an image URL.
 * Uses /predict-from-url so the API fetches the image (avoids browser CORS on external URLs).
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Promise<{fire_detected: boolean, confidence: number, probability: number}>}
 */
async function predictFromImageUrl(imageUrl) {
  try {
    const response = await fetch(`${API_BASE_URL}${API_PATH_PREFIX}/predict-from-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error predicting from image URL:', error);
    if (error?.message === 'Failed to fetch') {
      const where = API_PATH_PREFIX ? `(proxied at ${API_PATH_PREFIX})` : `at ${API_BASE_URL}`;
      throw new Error(
        `Image prediction API is not reachable ${where}. Start it with: npm run dev (runs both app and API), or run: python3 src/MachineLearningModels/EdgeDeviceModelArtifacts/image_inference_api.py`
      );
    }
    throw error;
  }
}

/**
 * Predict wildfire from a File object (for file uploads)
 * @param {File} imageFile - File object of the image to analyze
 * @returns {Promise<{fire_detected: boolean, confidence: number, probability: number}>}
 */
async function predictFromImageFile(imageFile) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}${API_PATH_PREFIX}/predict`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error predicting from image file:', error);
    if (error?.message === 'Failed to fetch') {
      const where = API_PATH_PREFIX ? `(proxied at ${API_PATH_PREFIX})` : `at ${API_BASE_URL}`;
      throw new Error(
        `Image prediction API is not reachable ${where}. Start it with: npm run dev (runs both app and API), or run: python3 src/MachineLearningModels/EdgeDeviceModelArtifacts/image_inference_api.py`
      );
    }
    throw error;
  }
}

/**
 * Check if the prediction API is available
 * @returns {Promise<boolean>}
 */
async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}${API_PATH_PREFIX}/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'healthy' && data.model_loaded === true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

const imagePredictionService = {
  predictFromImageUrl,
  predictFromImageFile,
  checkApiHealth,
};

export default imagePredictionService;
