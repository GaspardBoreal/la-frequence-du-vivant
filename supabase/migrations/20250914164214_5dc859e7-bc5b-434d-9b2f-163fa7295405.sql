-- Fonction pour recalculer les durées manquantes des audios WEBM
CREATE OR REPLACE FUNCTION public.fix_audio_durations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mettre à jour les audios sans durée avec une estimation basée sur la taille
  -- Pour les fichiers WEBM, on estime environ 1KB par seconde (très approximatif)
  UPDATE marche_audio 
  SET duree_secondes = GREATEST(1, LEAST(300, COALESCE(taille_octets / 1000, 30)))
  WHERE duree_secondes IS NULL 
    AND taille_octets > 0
    AND (format_audio = 'webm' OR nom_fichier LIKE '%.webm');
  
  -- Pour les autres formats sans durée, donner une valeur par défaut de 30 secondes
  UPDATE marche_audio 
  SET duree_secondes = 30
  WHERE duree_secondes IS NULL OR duree_secondes <= 0;
  
  -- Log du nombre de mises à jour
  RAISE NOTICE 'Durées audio corrigées pour les enregistrements sans durée valide';
END;
$$;

-- Exécuter la fonction
SELECT public.fix_audio_durations();

-- Supprimer la fonction après utilisation
DROP FUNCTION IF EXISTS public.fix_audio_durations();