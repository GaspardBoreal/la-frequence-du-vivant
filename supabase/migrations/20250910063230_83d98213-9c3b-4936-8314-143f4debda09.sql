-- Ajouter la colonne ia_fonctionnalites à la table marche_contextes_hybrids
ALTER TABLE marche_contextes_hybrids 
ADD COLUMN ia_fonctionnalites jsonb DEFAULT NULL;