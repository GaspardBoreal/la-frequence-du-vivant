import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenMeteoQuery {
  latitude: number;
  longitude: number;
  days?: number; // Default 30 days
  includeClimate?: boolean; // Include long-term climate data
}

interface OpenMeteoResponse {
  success: boolean;
  data?: {
    current?: any;
    daily?: any;
    climate?: any;
  };
  error?: string;
  source: 'open-meteo';
  processedAt: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🌤️ Open-Meteo API call initiated');

    const query: OpenMeteoQuery = await req.json();
    const { latitude, longitude, days = 30, includeClimate = false } = query;

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    console.log(`📍 Fetching weather data for: ${latitude}, ${longitude}`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch current + historical weather data
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', latitude.toString());
    weatherUrl.searchParams.set('longitude', longitude.toString());
    weatherUrl.searchParams.set('start_date', startDateStr);
    weatherUrl.searchParams.set('end_date', endDateStr);
    weatherUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_max,relative_humidity_2m_min,relative_humidity_2m_mean,precipitation_sum,wind_speed_10m_max,sunshine_duration');
    weatherUrl.searchParams.set('timezone', 'Europe/Paris');

    console.log('🌡️ Fetching from Open-Meteo API:', weatherUrl.toString());

    const weatherResponse = await fetch(weatherUrl.toString());
    
    if (!weatherResponse.ok) {
      throw new Error(`Open-Meteo API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    
    let climateData = null;
    
    // Optionally fetch long-term climate data
    if (includeClimate) {
      console.log('🌍 Fetching climate data...');
      
      const climateUrl = new URL('https://climate-api.open-meteo.com/v1/climate');
      climateUrl.searchParams.set('latitude', latitude.toString());
      climateUrl.searchParams.set('longitude', longitude.toString());
      climateUrl.searchParams.set('start_date', '1991-01-01');
      climateUrl.searchParams.set('end_date', '2020-12-31');
      climateUrl.searchParams.set('daily', 'temperature_2m_mean,precipitation_sum');

      try {
        const climateResponse = await fetch(climateUrl.toString());
        if (climateResponse.ok) {
          climateData = await climateResponse.json();
        }
      } catch (error) {
        console.log('⚠️ Climate data unavailable:', error);
      }
    }

    // Process and aggregate the data
    const daily = weatherData.daily;
    if (!daily || !daily.time) {
      throw new Error('Invalid weather data received from Open-Meteo');
    }

    // Calculate aggregated statistics
    const temperatures = daily.temperature_2m_mean || [];
    const tempMax = daily.temperature_2m_max || [];
    const tempMin = daily.temperature_2m_min || [];
    const humidity = daily.relative_humidity_2m_mean || [];
    const humidityMax = daily.relative_humidity_2m_max || [];
    const humidityMin = daily.relative_humidity_2m_min || [];
    const precipitation = daily.precipitation_sum || [];
    const windSpeed = daily.wind_speed_10m_max || [];
    const sunshine = daily.sunshine_duration || [];

    const aggregatedData = {
      period: {
        start: startDateStr,
        end: endDateStr,
        days: days
      },
      temperature: {
        avg: temperatures.length > 0 ? temperatures.reduce((a: number, b: number) => a + b, 0) / temperatures.length : null,
        min: tempMin.length > 0 ? Math.min(...tempMin.filter((t: number) => t !== null)) : null,
        max: tempMax.length > 0 ? Math.max(...tempMax.filter((t: number) => t !== null)) : null,
      },
      humidity: {
        avg: humidity.length > 0 ? humidity.reduce((a: number, b: number) => a + b, 0) / humidity.length : null,
        min: humidityMin.length > 0 ? Math.min(...humidityMin.filter((h: number) => h !== null)) : null,
        max: humidityMax.length > 0 ? Math.max(...humidityMax.filter((h: number) => h !== null)) : null,
      },
      precipitation: {
        total: precipitation.length > 0 ? precipitation.reduce((a: number, b: number) => a + (b || 0), 0) : 0,
        days: precipitation.filter((p: number) => p > 0.1).length,
      },
      wind: {
        avg: windSpeed.length > 0 ? windSpeed.reduce((a: number, b: number) => a + b, 0) / windSpeed.length : null,
      },
      sunshine: {
        total: sunshine.length > 0 ? sunshine.reduce((a: number, b: number) => a + (b || 0), 0) / 3600 : null, // Convert to hours
      }
    };

    console.log('✅ Weather data processed successfully:', {
      days: aggregatedData.period.days,
      avgTemp: aggregatedData.temperature.avg?.toFixed(1),
      totalPrecip: aggregatedData.precipitation.total?.toFixed(1)
    });

    const response: OpenMeteoResponse = {
      success: true,
      data: {
        aggregated: aggregatedData,
        daily: weatherData.daily,
        climate: climateData
      },
      source: 'open-meteo',
      processedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in open-meteo-data function:', error);
    
    const errorResponse: OpenMeteoResponse = {
      success: false,
      error: error.message,
      source: 'open-meteo',
      processedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});