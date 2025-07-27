
-- Supprimer les politiques existantes du bucket marche-audio s'il y en a
DELETE FROM storage.policies WHERE bucket_id = 'marche-audio';

-- Créer des politiques permissives pour le bucket marche-audio
INSERT INTO storage.policies (id, bucket_id, policy_name, policy_definition, policy_type, policy_role) 
VALUES 
  ('marche-audio-select', 'marche-audio', 'Public can view audio files', 'true', 'permissive', 'authenticated'),
  ('marche-audio-select-anon', 'marche-audio', 'Anonymous can view audio files', 'true', 'permissive', 'anon'),
  ('marche-audio-insert', 'marche-audio', 'Public can upload audio files', 'true', 'permissive', 'authenticated'),
  ('marche-audio-insert-anon', 'marche-audio', 'Anonymous can upload audio files', 'true', 'permissive', 'anon'),
  ('marche-audio-update', 'marche-audio', 'Public can update audio files', 'true', 'permissive', 'authenticated'),
  ('marche-audio-update-anon', 'marche-audio', 'Anonymous can update audio files', 'true', 'permissive', 'anon'),
  ('marche-audio-delete', 'marche-audio', 'Public can delete audio files', 'true', 'permissive', 'authenticated'),
  ('marche-audio-delete-anon', 'marche-audio', 'Anonymous can delete audio files', 'true', 'permissive', 'anon');

-- Faire de même pour les autres buckets pour éviter les mêmes problèmes
DELETE FROM storage.policies WHERE bucket_id = 'marche-photos';
INSERT INTO storage.policies (id, bucket_id, policy_name, policy_definition, policy_type, policy_role) 
VALUES 
  ('marche-photos-select', 'marche-photos', 'Public can view photo files', 'true', 'permissive', 'authenticated'),
  ('marche-photos-select-anon', 'marche-photos', 'Anonymous can view photo files', 'true', 'permissive', 'anon'),
  ('marche-photos-insert', 'marche-photos', 'Public can upload photo files', 'true', 'permissive', 'authenticated'),
  ('marche-photos-insert-anon', 'marche-photos', 'Anonymous can upload photo files', 'true', 'permissive', 'anon'),
  ('marche-photos-update', 'marche-photos', 'Public can update photo files', 'true', 'permissive', 'authenticated'),
  ('marche-photos-update-anon', 'marche-photos', 'Anonymous can update photo files', 'true', 'permissive', 'anon'),
  ('marche-photos-delete', 'marche-photos', 'Public can delete photo files', 'true', 'permissive', 'authenticated'),
  ('marche-photos-delete-anon', 'marche-photos', 'Anonymous can delete photo files', 'true', 'permissive', 'anon');

DELETE FROM storage.policies WHERE bucket_id = 'marche-videos';
INSERT INTO storage.policies (id, bucket_id, policy_name, policy_definition, policy_type, policy_role) 
VALUES 
  ('marche-videos-select', 'marche-videos', 'Public can view video files', 'true', 'permissive', 'authenticated'),
  ('marche-videos-select-anon', 'marche-videos', 'Anonymous can view video files', 'true', 'permissive', 'anon'),
  ('marche-videos-insert', 'marche-videos', 'Public can upload video files', 'true', 'permissive', 'authenticated'),
  ('marche-videos-insert-anon', 'marche-videos', 'Anonymous can upload video files', 'true', 'permissive', 'anon'),
  ('marche-videos-update', 'marche-videos', 'Public can update video files', 'true', 'permissive', 'authenticated'),
  ('marche-videos-update-anon', 'marche-videos', 'Anonymous can update video files', 'true', 'permissive', 'anon'),
  ('marche-videos-delete', 'marche-videos', 'Public can delete video files', 'true', 'permissive', 'authenticated'),
  ('marche-videos-delete-anon', 'marche-videos', 'Anonymous can delete video files', 'true', 'permissive', 'anon');
