
-- Supprimer les anciennes politiques restrictives du bucket marche-photos
DROP POLICY IF EXISTS "Allow authenticated users to upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update photos" ON storage.objects;

-- Créer des politiques plus permissives pour le bucket marche-photos
CREATE POLICY "Allow anyone to upload to marche-photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'marche-photos');

CREATE POLICY "Allow anyone to view marche-photos" ON storage.objects
FOR SELECT USING (bucket_id = 'marche-photos');

CREATE POLICY "Allow anyone to update marche-photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'marche-photos');

CREATE POLICY "Allow anyone to delete marche-photos" ON storage.objects
FOR DELETE USING (bucket_id = 'marche-photos');
