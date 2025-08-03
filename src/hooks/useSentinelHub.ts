import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export interface SentinelHubConfig {
  instanceId: string;
  clientId: string;
  clientSecret: string;
}

export interface SatelliteImageRequest {
  bbox: [number, number, number, number];
  time: string;
  width: number;
  height: number;
  format: 'image/png' | 'image/jpeg' | 'image/tiff';
  evalscript: string;
}

export interface NDVIData {
  date: string;
  ndvi: number;
  description: string;
}

export interface SatelliteTimeSeries {
  dates: string[];
  ndviValues: number[];
  cloudCover: number[];
}

// Evalscripts for different visualizations
export const EVALSCRIPTS = {
  trueColor: `
    //VERSION=3
    function setup() {
      return {
        input: ["B02", "B03", "B04"],
        output: { bands: 3 }
      };
    }
    function evaluatePixel(sample) {
      return [sample.B04, sample.B03, sample.B02];
    }
  `,
  
  ndvi: `
    //VERSION=3
    function setup() {
      return {
        input: ["B04", "B08"],
        output: { bands: 1 }
      };
    }
    function evaluatePixel(sample) {
      let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
      return [ndvi];
    }
  `,
  
  ndviColorized: `
    //VERSION=3
    function setup() {
      return {
        input: ["B04", "B08"],
        output: { bands: 3 }
      };
    }
    function evaluatePixel(sample) {
      let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
      if (ndvi < 0.0) return [1, 1, 1]; // White for water/snow
      if (ndvi < 0.2) return [0.8, 0.6, 0.4]; // Brown for bare soil
      if (ndvi < 0.4) return [1, 1, 0]; // Yellow for sparse vegetation
      if (ndvi < 0.6) return [0.5, 1, 0]; // Light green
      if (ndvi < 0.8) return [0, 0.8, 0]; // Green
      return [0, 0.4, 0]; // Dark green for dense vegetation
    }
  `
};

// Mock data for development - replace with real API calls
const generateMockNDVITimeSeries = (lat: number, lng: number): SatelliteTimeSeries => {
  const dates = [];
  const ndviValues = [];
  const cloudCover = [];
  
  const startDate = new Date('2024-01-01');
  for (let i = 0; i < 12; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(i);
    dates.push(currentDate.toISOString().split('T')[0]);
    
    // Simulate seasonal NDVI variation
    const seasonalFactor = Math.sin((i / 12) * 2 * Math.PI - Math.PI/2) * 0.3 + 0.5;
    const noise = (Math.random() - 0.5) * 0.1;
    ndviValues.push(Math.max(0, Math.min(1, seasonalFactor + noise)));
    
    cloudCover.push(Math.random() * 30);
  }
  
  return { dates, ndviValues, cloudCover };
};

export const useSentinelHub = (latitude: number, longitude: number) => {
  // Initialize with a date from 2024 to match NDVI data
  const [selectedDate, setSelectedDate] = useState<string>('2024-08-03');
  const [visualizationType, setVisualizationType] = useState<'trueColor' | 'ndvi' | 'ndviColorized' | 'mapbox'>('trueColor');

  // Fetch satellite image
  const satelliteImageQuery = useQuery({
    queryKey: ['sentinelImage', latitude, longitude, selectedDate, visualizationType],
    queryFn: async () => {
      console.log('🛰️ Fetching real satellite image for:', { latitude, longitude, selectedDate, visualizationType });
      
      // Force Mapbox fallback if requested
      if (visualizationType === 'mapbox') {
        const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${longitude},${latitude},15/512x512?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBudHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`;
        
        console.log('🗺️ Using Mapbox satellite (forced):', mapboxUrl);
        return {
          imageUrl: mapboxUrl,
          metadata: {
            date: selectedDate,
            cloudCover: 0,
            resolution: 'High Resolution',
            visualizationType: 'Mapbox Satellite',
            source: 'Mapbox',
            fallback: false
          }
        };
      }
      
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.functions.invoke('sentinel-hub', {
          body: {
            latitude,
            longitude,
            selectedDate,
            visualizationType,
            action: 'image'
          }
        });
        
        if (error) {
          throw new Error(`Sentinel Hub API error: ${error.message}`);
        }
        
        console.log('✅ Sentinel Hub image data received:', data);
        return data;
      } catch (error) {
        console.error('❌ Error fetching satellite image:', error);
        // Fallback to Mapbox satellite imagery
        const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${longitude},${latitude},15/512x512?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`;
        
        console.log('🗺️ Fallback to Mapbox satellite:', mapboxUrl);
        return {
          imageUrl: mapboxUrl,
          metadata: {
            date: selectedDate,
            cloudCover: Math.random() * 20,
            resolution: '10m',
            visualizationType,
            source: 'Mapbox Satellite',
            fallback: true
          }
        };
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!(latitude && longitude)
  });

  // Fetch NDVI time series
  const ndviTimeSeriesQuery = useQuery({
    queryKey: ['ndviTimeSeries', latitude, longitude],
    queryFn: async () => {
      console.log('📈 Fetching real NDVI time series for:', { latitude, longitude });
      
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.functions.invoke('sentinel-hub', {
          body: {
            latitude,
            longitude,
            action: 'timeseries'
          }
        });
        
        if (error) {
          throw new Error(`Sentinel Hub time series API error: ${error.message}`);
        }
        
        console.log('✅ Sentinel Hub time series data received:', data);
        return data;
      } catch (error) {
        console.error('❌ Error fetching NDVI time series:', error);
        // Fallback to mock data if API fails
        return generateMockNDVITimeSeries(latitude, longitude);
      }
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!(latitude && longitude)
  });

  // Generate poetic interpretation of NDVI
  const generatePoeticNDVI = (ndvi: number): string => {
    if (ndvi < 0.2) return "Terre nue, promesse silencieuse";
    if (ndvi < 0.4) return "Premières pousses, éveil timide";
    if (ndvi < 0.6) return "Verdoyance naissante, souffle de vie";
    if (ndvi < 0.8) return "Feuillage dense, symphonie verte";
    return "Éclat végétal, apogée de chlorophylle";
  };

  // Generate haiku based on current NDVI
  const generateHaiku = (ndvi: number, season: string): string => {
    const haikus = {
      spring: [
        "Bourgeons éclatent\nLa sève monte vers l'azur\nRenaissance verte",
        "Pétales s'ouvrent\nLe sol respire doucement\nPrintemps satellite"
      ],
      summer: [
        "Chlorophylle intense\nLe vert pulse dans l'infrarouge\nÉté cosmique",
        "Feuilles murmurent\nAux ondes électromagnétiques\nChant de photons"
      ],
      autumn: [
        "Or et pourpre dansent\nLa terre change de palette\nAutomne numérique",
        "Feuilles qui tombent\nPixels ocre dans le capteur\nMétamorphose"
      ],
      winter: [
        "Silence blanc\nLa neige efface les indices\nRepos spectral",
        "Branches nues\nContre le ciel satellite\nSquelette de lumière"
      ]
    };
    
    const seasonHaikus = haikus[season as keyof typeof haikus] || haikus.spring;
    return seasonHaikus[Math.floor(Math.random() * seasonHaikus.length)];
  };

  return {
    satelliteImage: satelliteImageQuery.data,
    ndviTimeSeries: ndviTimeSeriesQuery.data,
    isLoading: satelliteImageQuery.isLoading || ndviTimeSeriesQuery.isLoading,
    error: satelliteImageQuery.error || ndviTimeSeriesQuery.error,
    selectedDate,
    setSelectedDate,
    visualizationType,
    setVisualizationType,
    generatePoeticNDVI,
    generateHaiku,
    refetch: () => {
      satelliteImageQuery.refetch();
      ndviTimeSeriesQuery.refetch();
    }
  };
};