-- Update allowed MIME types for marche-audio bucket to include webm and safe fallbacks
update storage.buckets
set allowed_mime_types = array[
  'audio/mpeg', -- mp3
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'application/octet-stream'
]
where id = 'marche-audio';

-- Optionally increase size limit (commented out if not needed)
-- update storage.buckets set file_size_limit = 104857600 where id = 'marche-audio'; -- 100 MB

-- Ensure public read already allowed via public bucket; write operations governed by existing policies