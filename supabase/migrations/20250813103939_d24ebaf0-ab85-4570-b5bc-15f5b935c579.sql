-- Create biodiversity snapshots table for historical tracking
CREATE TABLE public.biodiversity_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  radius_meters INTEGER NOT NULL DEFAULT 500,
  
  -- Species counts
  total_species INTEGER NOT NULL DEFAULT 0,
  birds_count INTEGER NOT NULL DEFAULT 0,
  plants_count INTEGER NOT NULL DEFAULT 0,
  fungi_count INTEGER NOT NULL DEFAULT 0,
  others_count INTEGER NOT NULL DEFAULT 0,
  
  -- Biodiversity metrics
  biodiversity_index NUMERIC,
  species_richness NUMERIC,
  recent_observations INTEGER NOT NULL DEFAULT 0,
  
  -- Raw data storage
  species_data JSONB,
  sources_data JSONB,
  methodology JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weather snapshots table for historical weather data
CREATE TABLE public.weather_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Temperature data
  temperature_avg NUMERIC,
  temperature_min NUMERIC,
  temperature_max NUMERIC,
  
  -- Humidity data
  humidity_avg NUMERIC,
  humidity_min NUMERIC,
  humidity_max NUMERIC,
  
  -- Precipitation
  precipitation_total NUMERIC,
  precipitation_days INTEGER,
  
  -- Additional weather metrics
  wind_speed_avg NUMERIC,
  sunshine_hours NUMERIC,
  
  -- Data sources
  source TEXT NOT NULL DEFAULT 'open-meteo',
  raw_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create real estate snapshots table
CREATE TABLE public.real_estate_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  radius_meters INTEGER NOT NULL DEFAULT 1000,
  
  -- Transaction summary
  transactions_count INTEGER NOT NULL DEFAULT 0,
  avg_price_m2 NUMERIC,
  median_price_m2 NUMERIC,
  total_volume NUMERIC,
  
  -- Transaction details
  transactions_data JSONB,
  
  -- Data source
  source TEXT NOT NULL DEFAULT 'lexicon',
  raw_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data collection logs table
CREATE TABLE public.data_collection_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_type TEXT NOT NULL, -- 'biodiversity', 'weather', 'real_estate'
  collection_mode TEXT NOT NULL, -- 'scheduled', 'manual'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  
  -- Collection metrics
  marches_processed INTEGER DEFAULT 0,
  marches_total INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Details
  error_details JSONB,
  summary_stats JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.biodiversity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_collection_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public can view biodiversity_snapshots" 
ON public.biodiversity_snapshots 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view weather_snapshots" 
ON public.weather_snapshots 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view real_estate_snapshots" 
ON public.real_estate_snapshots 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view data_collection_logs" 
ON public.data_collection_logs 
FOR SELECT 
USING (true);

-- Admin insert/update policies (to be restricted later)
CREATE POLICY "Allow insert biodiversity_snapshots" 
ON public.biodiversity_snapshots 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow insert weather_snapshots" 
ON public.weather_snapshots 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow insert real_estate_snapshots" 
ON public.real_estate_snapshots 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow insert data_collection_logs" 
ON public.data_collection_logs 
FOR ALL
USING (true);

-- Create indexes for performance
CREATE INDEX idx_biodiversity_snapshots_marche_date ON public.biodiversity_snapshots(marche_id, snapshot_date DESC);
CREATE INDEX idx_biodiversity_snapshots_location ON public.biodiversity_snapshots(latitude, longitude);
CREATE INDEX idx_weather_snapshots_marche_date ON public.weather_snapshots(marche_id, snapshot_date DESC);
CREATE INDEX idx_weather_snapshots_location ON public.weather_snapshots(latitude, longitude);
CREATE INDEX idx_real_estate_snapshots_marche_date ON public.real_estate_snapshots(marche_id, snapshot_date DESC);
CREATE INDEX idx_data_collection_logs_type_status ON public.data_collection_logs(collection_type, status, started_at DESC);

-- Create function to update timestamps
CREATE TRIGGER update_biodiversity_snapshots_updated_at
BEFORE UPDATE ON public.biodiversity_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weather_snapshots_updated_at
BEFORE UPDATE ON public.weather_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_real_estate_snapshots_updated_at
BEFORE UPDATE ON public.real_estate_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();