-- Migration pour résoudre l'incohérence des données et implémenter la suppression en cascade

-- 1. Nettoyer les données orphelines du 14 août 2025
DELETE FROM biodiversity_snapshots WHERE snapshot_date = '2025-08-14';
DELETE FROM weather_snapshots WHERE snapshot_date = '2025-08-14';
DELETE FROM real_estate_snapshots WHERE snapshot_date = '2025-08-14';

-- 2. Créer une fonction pour gérer la suppression en cascade des données de collecte
CREATE OR REPLACE FUNCTION public.cleanup_collection_data()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- 3. Créer le trigger pour déclencher automatiquement la suppression en cascade
CREATE TRIGGER trigger_cleanup_collection_data
    AFTER DELETE ON data_collection_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_collection_data();