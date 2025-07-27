
-- Corriger les politiques RLS pour permettre la suppression de photos
-- D'abord, supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Allow delete photos" ON public.marche_photos;

-- Créer une nouvelle politique plus permissive pour la suppression
CREATE POLICY "Allow delete photos" ON public.marche_photos
    FOR DELETE
    USING (true);

-- Vérifier que la politique pour la suppression des fichiers Storage est correcte
DROP POLICY IF EXISTS "Allow delete photos storage" ON storage.objects;

CREATE POLICY "Allow delete photos storage" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'marche-photos');
