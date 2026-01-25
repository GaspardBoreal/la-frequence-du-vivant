-- Create table for persisting custom export keywords
CREATE TABLE public.export_keywords (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword text NOT NULL,
  category text DEFAULT 'custom',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(keyword)
);

-- Enable RLS
ALTER TABLE public.export_keywords ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view export_keywords" 
ON public.export_keywords 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert export_keywords" 
ON public.export_keywords 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete export_keywords" 
ON public.export_keywords 
FOR DELETE 
USING (true);

-- Index for faster lookups
CREATE INDEX idx_export_keywords_category ON public.export_keywords(category);