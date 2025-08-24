-- Create table for literary texts associated with marches
CREATE TABLE IF NOT EXISTS public.marche_textes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID NOT NULL,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  type_texte TEXT NOT NULL, -- haiku, haibun, poeme, texte-libre, essai-bref, dialogue-polyphonique, fable, fragment, carte-poetique
  ordre INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}', -- For spectrograms, drawings, voice attributions, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marche_textes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view marche_textes" 
ON public.marche_textes 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert marche_textes" 
ON public.marche_textes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update marche_textes" 
ON public.marche_textes 
FOR UPDATE 
USING (true);

CREATE POLICY "Only authenticated users can delete marche_textes" 
ON public.marche_textes 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_marche_textes_updated_at
BEFORE UPDATE ON public.marche_textes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_marche_textes_marche_id ON public.marche_textes(marche_id);
CREATE INDEX idx_marche_textes_type ON public.marche_textes(type_texte);
CREATE INDEX idx_marche_textes_ordre ON public.marche_textes(ordre);