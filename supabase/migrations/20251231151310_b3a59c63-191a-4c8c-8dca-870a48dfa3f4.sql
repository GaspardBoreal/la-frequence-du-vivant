-- Ajouter le champ literary_type pour la classification manuelle des types littéraires
ALTER TABLE marche_audio 
ADD COLUMN IF NOT EXISTS literary_type text DEFAULT NULL;

-- Commentaire explicatif
COMMENT ON COLUMN marche_audio.literary_type IS 
  'Type littéraire de l''audio (haiku, fable, poeme, prose, fragment, etc.) - classification manuelle prioritaire sur l''auto-détection';