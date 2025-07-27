
-- Ajouter les colonnes manquantes à la table marches
ALTER TABLE public.marches 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS departement text,
ADD COLUMN IF NOT EXISTS adresse text;

-- Mettre à jour le trigger pour la colonne updated_at si elle existe
DROP TRIGGER IF EXISTS update_marches_updated_at ON public.marches;
CREATE TRIGGER update_marches_updated_at
    BEFORE UPDATE ON public.marches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
