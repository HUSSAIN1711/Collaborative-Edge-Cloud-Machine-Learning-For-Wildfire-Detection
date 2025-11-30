import { calculateDistance, isDroneNearSensor as checkDroneProximity } from "../utils/geoUtils";

// Weather service for fetching weather data from Google Maps Weather API
class WeatherService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://weather.googleapis.com/v1';
    // HashMap to store weather data by sensor ID
    this.weatherCache = new Map();
    this.cacheTimestamps = new Map();
    this.cacheExpiryTime = 60 * 60 * 1000; // 1 hour in milliseconds
  }

  // Generate a cache key for a location
  getCacheKey(lat, lng) {
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
  }

  // Check if cached data is still valid
  isCacheValid(cacheKey) {
    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) return false;
    return (Date.now() - timestamp) < this.cacheExpiryTime;
  }

  // Get cached weather data if available and valid
  getCachedWeatherData(lat, lng) {
    const cacheKey = this.getCacheKey(lat, lng);
    if (this.weatherCache.has(cacheKey) && this.isCacheValid(cacheKey)) {
      console.log('Using cached weather data for:', lat, lng);
      return this.weatherCache.get(cacheKey);
    }
    return null;
  }

  // Store weather data in cache
  setCachedWeatherData(lat, lng, weatherData) {
    const cacheKey = this.getCacheKey(lat, lng);
    this.weatherCache.set(cacheKey, weatherData);
    this.cacheTimestamps.set(cacheKey, Date.now());
    console.log('Cached weather data for:', lat, lng);
  }

  async fetchWeatherData(lat, lng) {
    try {
      // Check cache first
      const cachedData = this.getCachedWeatherData(lat, lng);
      if (cachedData) {
        return cachedData;
      }

      console.log('Fetching weather data from Google Maps Weather API for:', lat, lng);
      console.log('API Key available:', !!this.apiKey);
      
      // Using Google Maps Weather API
      const response = await fetch(
        `${this.baseUrl}/currentConditions:lookup?key=${this.apiKey}&location.latitude=${lat}&location.longitude=${lng}&units_system=IMPERIAL`
      );
      
      console.log('Google Weather API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Weather API error response:', errorText);
        throw new Error(`Google Weather API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Google Weather API response data:', data);
      
      // Extract current conditions from Google Weather API response using correct structure
      const current = data;
      
      if (!current) {
        throw new Error('No current conditions data in response');
      }
      
      // Parse the response according to the actual Google Weather API structure
      const weatherData = {
        temperature: Math.round(current.temperature?.degrees || 0),
        humidity: Math.round(current.relativeHumidity || 0),
        windSpeed: Math.round(current.wind?.speed?.value || 0),
        windDirection: current.wind?.direction?.degrees || 0,
        pressure: Math.round(current.airPressure?.meanSeaLevelMillibars || 0),
        description: current.weatherCondition?.description?.text || 'Unknown',
        icon: current.weatherCondition?.iconBaseUri || '',
        // Additional Google Weather API specific data
        precipitation: current.precipitation?.qpf?.quantity || 0,
        precipitationType: current.precipitation?.probability?.type?.toLowerCase() || 'none',
        windGust: Math.round(current.wind?.gust?.value || current.wind?.speed?.value || 0),
        uvIndex: current.uvIndex || 0,
        visibility: Math.round(current.visibility?.distance || 10),
        cloudCover: Math.round(current.cloudCover || 0),
        thunderstormProbability: current.thunderstormProbability || 0,
        dewPoint: Math.round(current.dewPoint?.degrees || 0),
        heatIndex: Math.round(current.heatIndex?.degrees || current.temperature?.degrees || 0),
        windChill: Math.round(current.windChill?.degrees || current.temperature?.degrees || 0),
        feelsLike: Math.round(current.feelsLikeTemperature?.degrees || current.temperature?.degrees || 0),
        // Historical data
        maxTemperature: Math.round(current.currentConditionsHistory?.maxTemperature?.degrees || current.temperature?.degrees || 0),
        minTemperature: Math.round(current.currentConditionsHistory?.minTemperature?.degrees || current.temperature?.degrees || 0),
        temperatureChange: Math.round(current.currentConditionsHistory?.temperatureChange?.degrees || 0)
      };

      // Cache the weather data
      this.setCachedWeatherData(lat, lng, weatherData);
      
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data from Google Maps Weather API:', error);
      // Return mock data if API fails
      const fallbackData = {
        temperature: 75,
        humidity: 45,
        windSpeed: 8,
        windDirection: 180,
        pressure: 1013,
        description: 'Clear sky',
        icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
        precipitation: 0,
        precipitationType: 'none',
        windGust: 12,
        uvIndex: 5,
        visibility: 10,
        cloudCover: 20,
        thunderstormProbability: 0,
        dewPoint: 60,
        heatIndex: 78,
        windChill: 75,
        feelsLike: 75,
        maxTemperature: 80,
        minTemperature: 70,
        temperatureChange: 0
      };
      
      // Cache the fallback data as well
      this.setCachedWeatherData(lat, lng, fallbackData);
      return fallbackData;
    }
  }

  // Calculate distance between two coordinates (delegates to geoUtils)
  calculateDistance(lat1, lng1, lat2, lng2) {
    return calculateDistance(lat1, lng1, lat2, lng2);
  }

  // Check if drone is within proximity of a sensor (delegates to geoUtils)
  isDroneNearSensor(dronePosition, sensorPosition, proximityMiles = 0.1) {
    return checkDroneProximity(dronePosition, sensorPosition, proximityMiles);
  }
}

export default new WeatherService();
