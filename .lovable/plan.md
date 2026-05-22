# Fix — Analyse IA "Ce que nous avons vu" ne retourne plus qu'une espèce

## Cause racine

L'edge function `analyze-exploration-species` envoie à l'IA un user prompt au format pipe-delimité :
```
${s.key} | ${s.scientificName} | ${s.commonName} | ${s.count}
```
Le modèle Gemini Flash copie **toute la ligne** comme valeur du champ `key` au lieu de ne reprendre que le premier segment. Conséquence : les 59 lignes IA insérées dans `exploration_curations` ont un `entity_id` composite (ex. `"Harmonia axyridis | Harmonia axyridis | Asian Lady Beetle | 10"`) qui ne matche plus le `scientificName` utilisé côté front. Seule la 1 entrée Knowledge Base s'affiche.

## Correctif (1 fichier)

**`supabase/functions/analyze-exploration-species/index.ts`** — durcir le remapping IA → pool :

1. **Construire une lookup `Map<normalizedKey, SpeciesInput>`** sur `needsAi`, indexée à la fois sur :
   - `sp.key` brut (lowercase)
   - `sp.scientificName?.toLowerCase()`
   - première portion avant ` | ` lowercased
2. **Pour chaque résultat IA**, extraire la "vraie" key :
   - prendre `r.key`, splitter sur ` | `, retenir le 1er segment, trim, lowercase
   - chercher dans la lookup → récupérer le `sp` d'origine
   - si introuvable, fallback : matcher par `scientificName` insensible à la casse parmi `needsAi`
   - si toujours introuvable → ignorer la ligne (log warning) plutôt que polluer la base
3. **Stocker `entity_id = sp.key`** (la key canonique d'origine, identique au format KB), pas la valeur renvoyée par l'IA.
4. **Ajouter un log de contrôle** : `[analyze] AI mapped: X/${needsAi.length}, unmatched: Y` pour détecter toute future dérive du modèle.
5. **Renforcer le system prompt** : reformuler la règle pour le champ `key` (ex. "key DOIT être copié EXACTEMENT depuis le 1er champ avant le ` | `, sans modification, sans recapitalisation, sans recopier les autres champs"). Garde-fou, pas la défense principale.

## Nettoyage (optionnel mais recommandé)

Purger les lignes corrompues de la dernière analyse pour cette exploration afin que l'UI se recharge proprement :
```sql
DELETE FROM exploration_curations
WHERE sense='oeil' AND entity_type='species' AND source='ai'
  AND entity_id LIKE '% | %';
```
À exécuter en migration one-shot OU à laisser l'utilisateur relancer "Relancer l'analyse IA" — la fonction supprime déjà toutes les lignes `source='ai'` avant de réinsérer (cf. ligne 370-375). Une simple relance après le fix suffit donc.

## Validation

1. Cliquer "Relancer l'analyse IA" sur l'exploration `20dd3be8-…`.
2. Vérifier les logs : `[analyze] AI mapped: 59/59, unmatched: 0`.
3. Vérifier en base que `entity_id` ne contient plus jamais ` | `.
4. Vérifier dans "Ce que nous avons vu" que les 6 catégories (indigène, auxiliaire, bioindicatrice, ravageur, eee, patrimoniale) se peuplent comme avant.

## Hors scope

- Pas de changement de schéma DB.
- Pas de changement front : le tolérant `useMarcheurSensibleSpecies` (split sur ` | `) reste en place comme filet de sécurité legacy.
- Pas de modification de la Knowledge Base ni du modèle.
