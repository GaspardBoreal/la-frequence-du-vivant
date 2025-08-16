-- Corriger le warning de sécurité: Function Search Path Mutable
-- Recreer la fonction avec un search_path sécurisé

CREATE OR REPLACE FUNCTION public.cleanup_collection_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Quand un log de collecte est supprimé, supprimer les données associées
    -- basé sur la date de début de la collecte
    DELETE FROM biodiversity_snapshots 
    WHERE snapshot_date = DATE(OLD.started_at);
    
    DELETE FROM weather_snapshots 
    WHERE snapshot_date = DATE(OLD.started_at);
    
    DELETE FROM real_estate_snapshots 
    WHERE snapshot_date = DATE(OLD.started_at);
    
    RETURN OLD;
END;
$$;