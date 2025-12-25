-- Ajouter la colonne type_audio à marche_audio pour stocker le type assigné manuellement
ALTER TABLE marche_audio 
ADD COLUMN type_audio TEXT DEFAULT NULL;

-- Ajouter un commentaire pour documenter l'usage
COMMENT ON COLUMN marche_audio.type_audio IS 'Type d''audio assigné manuellement (ex: gaspard, dordogne, sounds). NULL = auto-détection par mots-clés.';