import { IWeatherSnapshot } from '../models/types';

export class WeatherService {
  /**
   * Fetches real-time weather from Open-Meteo or fallback provider.
   * If offline or no coordinates provided, returns a transparent fallback with isStaleOrUnavailable: true.
   */
  async getWeather(lat?: number, lng?: number, region?: string): Promise<IWeatherSnapshot> {
    const now = new Date().toISOString();

    if (lat === undefined || lng === undefined) {
      return {
        temperatureC: 22.0,
        relativeHumidityPercent: 65,
        precipitationMm: 0.0,
        windSpeedKmh: 10.0,
        conditionsSummary: `Estimated seasonal climate for region: ${region || 'Unspecified'}`,
        capturedAt: now,
        source: 'regional_climate_estimate',
        isStaleOrUnavailable: true,
      };
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Weather API responded with status ${res.status}`);
      }

      const data = (await res.json()) as any;
      const current = data.current;

      const code = current.weather_code;
      let summary = 'Clear';
      if (code > 0 && code <= 3) summary = 'Partly Cloudy';
      else if (code >= 51 && code <= 67) summary = 'Rain / Drizzle';
      else if (code >= 80 && code <= 82) summary = 'Showers';
      else if (code >= 95) summary = 'Thunderstorm';

      return {
        temperatureC: current.temperature_2m,
        relativeHumidityPercent: current.relative_humidity_2m,
        precipitationMm: current.precipitation,
        windSpeedKmh: current.wind_speed_10m,
        conditionsSummary: summary,
        capturedAt: now,
        source: 'open-meteo-v1',
        isStaleOrUnavailable: false,
      };
    } catch (err: any) {
      return {
        temperatureC: 21.5,
        relativeHumidityPercent: 70,
        precipitationMm: 0.0,
        windSpeedKmh: 8.0,
        conditionsSummary: `Weather provider unavailable (${err.message}). Using conservative reference baseline.`,
        capturedAt: now,
        source: 'cached_fallback',
        isStaleOrUnavailable: true,
      };
    }
  }
}

export const weatherService = new WeatherService();
