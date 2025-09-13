-- Migration directe des données de vocabulaire mal catégorisées
UPDATE marche_contextes_hybrids 
SET 
  vocabulaire_local = jsonb_set(
    vocabulaire_local,
    '{donnees}',
    jsonb_build_object(
      'termes_locaux', 
      CASE 
        WHEN vocabulaire_local->'donnees'->'termes_hydrologiques' IS NOT NULL 
        THEN vocabulaire_local->'donnees'->'termes_hydrologiques'
        ELSE '[]'::jsonb
      END,
      'phenomenes',
      CASE 
        WHEN vocabulaire_local->'donnees'->'phenomenes_naturels' IS NOT NULL 
        THEN vocabulaire_local->'donnees'->'phenomenes_naturels'
        ELSE '[]'::jsonb
      END,
      'pratiques',
      CASE 
        WHEN vocabulaire_local->'donnees'->'pratiques_traditionnelles' IS NOT NULL 
        THEN vocabulaire_local->'donnees'->'pratiques_traditionnelles'
        ELSE '[]'::jsonb
      END
    )
  ) || jsonb_build_object(
    'migration', jsonb_build_object(
      'date', now(),
      'version', '1.0',
      'note', 'Categorisation automatique des phenomenes_naturels, pratiques_traditionnelles et termes_hydrologiques'
    )
  ),
  updated_at = now()
WHERE vocabulaire_local IS NOT NULL 
  AND vocabulaire_local->'donnees' IS NOT NULL
  AND (
    vocabulaire_local->'donnees'->'phenomenes_naturels' IS NOT NULL 
    OR vocabulaire_local->'donnees'->'pratiques_traditionnelles' IS NOT NULL
    OR vocabulaire_local->'donnees'->'termes_hydrologiques' IS NOT NULL
  );