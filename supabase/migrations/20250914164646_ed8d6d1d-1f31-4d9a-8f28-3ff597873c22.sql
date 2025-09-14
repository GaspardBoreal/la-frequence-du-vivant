-- Correction des durées audio WEBM incorrectes
-- Les fichiers WEBM ont été mal estimés à 300 secondes par la migration précédente

-- Fonction pour recalculer les durées WEBM plus précisément
CREATE OR REPLACE FUNCTION public.recalculate_webm_durations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Corriger les durées des fichiers WEBM qui ont été mal estimées à 300 secondes
  -- Nouvelle estimation plus réaliste basée sur la compression WEBM
  UPDATE marche_audio 
  SET duree_secondes = CASE
    WHEN taille_octets < 200000 THEN GREATEST(5, LEAST(15, taille_octets / 25000))  -- Fichiers petits
    WHEN taille_octets < 500000 THEN GREATEST(10, LEAST(25, taille_octets / 20000)) -- Fichiers moyens
    WHEN taille_octets < 1000000 THEN GREATEST(15, LEAST(45, taille_octets / 18000)) -- Fichiers plus gros
    ELSE GREATEST(30, LEAST(120, taille_octets / 15000)) -- Très gros fichiers
  END
  WHERE duree_secondes = 300 
    AND (format_audio = 'audio/webm' OR nom_fichier LIKE '%.webm')
    AND taille_octets > 0;
  
  -- Log des corrections
  RAISE NOTICE 'Durées WEBM recalculées avec une meilleure estimation';
END;
$$;

-- Exécuter la correction
SELECT public.recalculate_webm_durations();

-- Nettoyer
DROP FUNCTION IF EXISTS public.recalculate_webm_durations();