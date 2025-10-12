// Weather service for fetching weather data from WeatherAPI.com
class WeatherService {
  constructor() {
    this.apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    this.baseUrl = 'https://api.weatherapi.com/v1';
  }

  async fetchWeatherData(lat, lng) {
    try {
      console.log('Fetching weather data from WeatherAPI.com for:', lat, lng);
      console.log('API Key available:', !!this.apiKey);
      
      // Using WeatherAPI.com
      const response = await fetch(
        `${this.baseUrl}/current.json?key=${this.apiKey}&q=${lat},${lng}&aqi=yes`
      );
      
      console.log('Weather API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Weather API error response:', errorText);
        throw new Error(`WeatherAPI.com error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Weather API response data:', data);
      
      // Extract current conditions from WeatherAPI.com response
      const current = data.current;
      
      if (!current) {
        throw new Error('No current conditions data in response');
      }
      
      return {
        temperature: Math.round(current.temp_f),
        humidity: current.humidity,
        windSpeed: Math.round(current.wind_mph),
        windDirection: current.wind_degree,
        pressure: Math.round(current.pressure_in * 33.863886666667), // Convert inHg to hPa
        description: current.condition.text,
        icon: current.condition.icon,
        // Additional WeatherAPI.com specific data
        precipitation: current.precip_in || 0,
        precipitationType: current.condition.text.toLowerCase().includes('rain') ? 'rain' : 'none',
        windGust: Math.round(current.gust_mph || 0),
        uvIndex: current.uv || 0,
        visibility: Math.round(current.vis_miles || 10),
        cloudCover: current.cloud || 0,
        thunderstormProbability: current.condition.text.toLowerCase().includes('thunder') ? 80 : 0,
        dewPoint: Math.round(current.dewpoint_f),
        heatIndex: Math.round(current.heatindex_f || current.temp_f),
        windChill: Math.round(current.windchill_f || current.temp_f),
        // Air quality data from WeatherAPI.com
        airQuality: data.air_quality ? {
          co: data.air_quality.co,
          no2: data.air_quality.no2,
          o3: data.air_quality.o3,
          pm2_5: data.air_quality.pm2_5,
          pm10: data.air_quality.pm10,
          so2: data.air_quality.so2
        } : null
      };
    } catch (error) {
      console.error('Error fetching weather data from WeatherAPI.com:', error);
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
