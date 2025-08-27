-- Create species translations table for bilingual support
CREATE TABLE public.species_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scientific_name TEXT NOT NULL UNIQUE,
  common_name_fr TEXT,
  common_name_en TEXT,
  alternative_names_fr TEXT[],
  source TEXT NOT NULL DEFAULT 'manual',
  confidence_level TEXT NOT NULL DEFAULT 'high',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.species_translations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view species translations" 
ON public.species_translations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert species translations" 
ON public.species_translations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update species translations" 
ON public.species_translations 
FOR UPDATE 
USING (true);

-- Create index for fast lookups
CREATE INDEX idx_species_translations_scientific_name ON public.species_translations(scientific_name);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_species_translations_updated_at
BEFORE UPDATE ON public.species_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some common French species translations
INSERT INTO public.species_translations (scientific_name, common_name_fr, common_name_en) VALUES
('Turdus merula', 'Merle noir', 'Common Blackbird'),
('Erithacus rubecula', 'Rouge-gorge familier', 'European Robin'),
('Parus major', 'Mésange charbonnière', 'Great Tit'),
('Passer domesticus', 'Moineau domestique', 'House Sparrow'),
('Columba livia', 'Pigeon biset', 'Rock Dove'),
('Corvus corone', 'Corneille noire', 'Carrion Crow'),
('Sturnus vulgaris', 'Étourneau sansonnet', 'European Starling'),
('Motacilla alba', 'Bergeronnette grise', 'White Wagtail'),
('Sylvia atricapilla', 'Fauvette à tête noire', 'Blackcap'),
('Carduelis carduelis', 'Chardonneret élégant', 'European Goldfinch');