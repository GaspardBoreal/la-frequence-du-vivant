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

    // Calculate date range - use last 30 days of HISTORICAL data (not forecast)
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - 1); // Yesterday (archive API needs completed days)
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - Math.min(days, 90)); // Max 90 days for archive

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Use ARCHIVE API for historical data (not forecast)
    // Open-Meteo Archive API: https://open-meteo.com/en/docs/historical-weather-api
    const weatherUrl = new URL('https://archive-api.open-meteo.com/v1/archive');
    weatherUrl.searchParams.set('latitude', latitude.toString());
    weatherUrl.searchParams.set('longitude', longitude.toString());
    weatherUrl.searchParams.set('start_date', startDateStr);
    weatherUrl.searchParams.set('end_date', endDateStr);
    weatherUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_max,relative_humidity_2m_min,relative_humidity_2m_mean,precipitation_sum,wind_speed_10m_max,sunshine_duration');
    weatherUrl.searchParams.set('timezone', 'Europe/Paris');

    console.log('🌡️ Fetching from Open-Meteo Archive API:', weatherUrl.toString());

    // Add robust timeout with AbortController
    const controller = new AbortController();
    const timeoutMs = 15000; // 15 second timeout for archive API

    const weatherData = await Promise.race([
      // Actual API call
      (async () => {
        const weatherResponse = await fetch(weatherUrl.toString(), {
          signal: controller.signal
        });
        
        if (!weatherResponse.ok) {
          const errorText = await weatherResponse.text();
          console.error('❌ Open-Meteo Archive API error:', weatherResponse.status, errorText);
          throw new Error(`Open-Meteo Archive API error: ${weatherResponse.status} - ${errorText}`);
        }
        
        return await weatherResponse.json();
      })(),
      // Timeout promise
      new Promise((_, reject) => {
        setTimeout(() => {
          controller.abort();
          reject(new Error(`Open-Meteo Archive API timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
    
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
        // Add timeout for climate API too
        const climateController = new AbortController();
        const climateTimeoutMs = 10000; // 10 second timeout for climate data
        
        const climateData_temp = await Promise.race([
          (async () => {
            const climateResponse = await fetch(climateUrl.toString(), {
              signal: climateController.signal
            });
            return climateResponse.ok ? await climateResponse.json() : null;
          })(),
          new Promise((_, reject) => {
            setTimeout(() => {
              climateController.abort();
              reject(new Error(`Climate API timeout after ${climateTimeoutMs}ms`));
            }, climateTimeoutMs);
          })
        ]);
        
        climateData = climateData_temp;
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