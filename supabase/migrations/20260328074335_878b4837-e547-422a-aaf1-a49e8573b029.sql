ALTER TABLE marcheur_medias ADD COLUMN marche_id UUID REFERENCES marches(id);
ALTER TABLE marcheur_audio ADD COLUMN marche_id UUID REFERENCES marches(id);
ALTER TABLE marcheur_textes ADD COLUMN marche_id UUID REFERENCES marches(id);