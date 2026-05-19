# Fix : 80 vs 92 espèces dans le pool attachable

## Diagnostic

| Source | Compte affiché | D'où vient le chiffre |
|---|---|---|
| Entête de la fiche (« 92 espèces ») | **92** | RPC `get_admin_entity_context` côté serveur, qui **fusionne** `biodiversity_snapshots.species_data` ∪ `marcheur_observations` (mémoire *Chatbot species count alignment*). |
| Pool attachable au chat (« 80 ») | **80** | `useExplorationSpeciesPool` ne lit **que** `biodiversity_snapshots.species_data`. Les 12 espèces observées exclusivement par des marcheurs (citizen) sont absentes. |

C'est exactement la même asymétrie déjà corrigée pour le compteur de la Fréquence (`score-citizen-observations-fusion-logic`) et pour le RPC chatbot. Le hook `useExplorationSpeciesPool` est resté en arrière.

## Fix proposé : aligner `useExplorationSpeciesPool` sur la fusion canonique

Modifier **uniquement** `src/hooks/useExplorationSpeciesPool.ts` pour mirrorer la logique de `useExplorationBiodiversitySummary` (lignes 160-220) :

1. Après le chargement des `biodiversity_snapshots`, lancer une 2ᵉ requête :
   ```ts
   supabase.from('marcheur_observations')
     .select('species_scientific_name, photo_url')
     .in('marche_id', marcheIds);
   ```
2. Pour chaque observation :
   - Matcher case-insensitive sur `scientificName` dans le `map` existant → `count += 1`, et prepend `photo_url` si absent (priorité photo marcheur).
   - Sinon créer une nouvelle entrée `{ scientificName, count: 1, imageUrl: photo_url, group: null, commonName: null }`.
3. Le `mergeGenusIntoSpecies` et l'enrichissement FR (`useFrenchSpeciesNames`) restent inchangés en aval.

## Pourquoi c'est le bon endroit

- **Source unique de vérité côté client** : tous les composants UI qui affichent une liste d'espèces (galerie biodiversité, drawer espèce, et maintenant pool chat) passeront par la même fusion → cohérence garantie avec « 92 ».
- **Pas de nouveau RPC** : on réutilise une requête déjà faite ailleurs, 0 surface DB nouvelle.
- **Frugalité préservée** : la liste compactée reste plafonnée à 200 dans `CommunityChatBotMount`. Le pool passera de 80 à ~92 items → +0.7 Ko.
- **Effet secondaire bonus** : le menu 📎 affichera désormais le bon décompte (« 🌿 Liste des espèces (92) »), ce qui *est* la même que le « 92 » de l'écran — l'utilisateur ne verra plus deux chiffres divergents.

## Détails techniques

- `marcheur_observations.species_scientific_name` est déjà la clé canonique (snake_case côté DB) ; pas de normalisation NFD nécessaire ici car le matching est sur le binôme latin (case-insensitive), conforme aux autres hooks.
- Quand une espèce marcheur est nouvelle (absente des snapshots), on n'a pas de `group`/`commonName` — `useFrenchSpeciesNames` tentera la résolution FR via le nom scientifique ; sinon `displayName` fallback sur le nom latin. C'est déjà le comportement de `useExplorationBiodiversitySummary`.
- `queryKey` du `useQuery` passe à `['exploration-species-pool-raw', explorationId, 'with-marcheur-obs']` pour invalider l'ancien cache.

## Hors scope

- Pas de modification du composant chat ni du store : ils consomment déjà la sortie enrichie.
- Pas de migration DB.
- Pas de retouche de `useExplorationBiodiversitySummary` (déjà correct).