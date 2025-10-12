// Weather service for fetching weather data from Google Maps Weather API
class WeatherService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://weather.googleapis.com/v1';
  }

  async fetchWeatherData(lat, lng) {
    try {
      console.log('Fetching weather data from Google Maps Weather API for:', lat, lng);
      console.log('API Key available:', !!this.apiKey);
      
      // Using Google Maps Weather API
      const response = await fetch(
        `${this.baseUrl}/current?key=${this.apiKey}&location=${lat},${lng}&units=imperial`
      );
      
      console.log('Google Weather API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Weather API error response:', errorText);
        throw new Error(`Google Weather API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Google Weather API response data:', data);
      
      // Extract current conditions from Google Weather API response
      const current = data.currentConditions;
      
      if (!current) {
        throw new Error('No current conditions data in response');
      }
      
      return {
        temperature: Math.round(current.temperature),
        humidity: Math.round(current.humidity * 100), // Convert to percentage
        windSpeed: Math.round(current.windSpeed),
        windDirection: current.windDirection,
        pressure: Math.round(current.pressure),
        description: current.condition,
        icon: current.icon,
        // Additional Google Weather API specific data
        precipitation: current.precipitation || 0,
        precipitationType: current.condition.toLowerCase().includes('rain') ? 'rain' : 'none',
        windGust: Math.round(current.windGust || current.windSpeed),
        uvIndex: current.uvIndex || 0,
        visibility: Math.round(current.visibility || 10),
        cloudCover: Math.round(current.cloudCover * 100), // Convert to percentage
        thunderstormProbability: current.condition.toLowerCase().includes('thunder') ? 80 : 0,
        dewPoint: Math.round(current.dewPoint),
        heatIndex: Math.round(current.heatIndex || current.temperature),
        windChill: Math.round(current.windChill || current.temperature),
        // Air quality data from Google Weather API
        airQuality: current.airQuality ? {
          co: current.airQuality.co,
          no2: current.airQuality.no2,
          o3: current.airQuality.o3,
          pm2_5: current.airQuality.pm2_5,
          pm10: current.airQuality.pm10,
          so2: current.airQuality.so2
        } : null
      };
    } catch (error) {
      console.error('Error fetching weather data from Google Maps Weather API:', error);
      // Return mock data if API fails
      return {
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
        airQuality: null
      };
    }
  }

  // Calculate distance between two coordinates
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Check if drone is within proximity of a sensor
  isDroneNearSensor(dronePosition, sensorPosition, proximityMiles = 0.1) {
    const distance = this.calculateDistance(
      dronePosition.lat, dronePosition.lng,
      sensorPosition.lat, sensorPosition.lng
    );
    return distance <= proximityMiles;
  }
}

export default new WeatherService();
