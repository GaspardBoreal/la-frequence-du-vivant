## Problème

L'export événement (Word + CSV) affiche **208 espèces** pour Château Boutinet alors que la plateforme (Carte / Carnet / Synthèse) en compte **38**.

Cause racine dans `src/components/admin/EventExportPanel.tsx` (lignes 172-269) :

1. **Dédup faible** : les espèces sont dédupliquées par `commonName || scientificName`. Le même taxon apparaît plusieurs fois si :
   - le commonName varie (`brambles` vs `Ronces` vs vide → `Rubus`)
   - le rang taxonomique diffère (`Rubus` genre vs `Rubus ulmifolius` espèce)
   - accentuation / casse différente
2. **Rayons chevauchants ignorés** : les marches proches (ex. Yourte + Vigne arrivée Droite à ~100 m) partagent leurs snapshots iNat. Chaque snapshot est compté séparément → double comptage massif.
3. **Rangs supra-spécifiques comptés comme espèces** : « Dicots (Magnoliopsida) », « Birds (Aves) », « Asteraceae » gonflent le total sans être des espèces.
4. **Source divergente** : l'export lit directement `biodiversity_snapshots.species_data`, alors que Carte/Carnet/Synthèse consomment la **RPC unifiée `get_exploration_species_count`** (fusion snapshots ∪ marcheur_observations, dédup `lower(unaccent(trim(scientific_name)))`).

## Solution proposée

### 1. Source de vérité unique : brancher l'export sur la RPC unifiée

Réécrire le bloc biodiversité de `EventExportPanel.tsx` pour :

- appeler `supabase.rpc('get_exploration_species_count', { p_exploration_id })` — même source que Carte/Carnet/Synthèse
- utiliser `total`, `by_kingdom`, `species[]` retournés → `totalSpecies`, `speciesByKingdom`, `topSpecies` **strictement alignés** avec le reste de la plateforme

Résultat immédiat : l'export affichera **38 espèces · Faune X · Flore Y · Champi Z · Autres W** identiques à la Carte.

### 2. Enrichir la RPC pour l'export (commonName + observations)

La RPC actuelle retourne `{ sci, kingdom, in_snapshot, in_marcheur }` sans nom commun ni compte d'observations. Ajouter dans une nouvelle RPC compagnon `get_exploration_species_export(p_exploration_id)` :

```
sci, common_name_fr, kingdom, rank,
observations_count,           -- nb attributions dédupliquées géographiquement
first_seen, last_seen,
sources text[]                -- ['snapshot','marcheur']
```

Dédup géographique côté SQL : `GROUP BY normalized_sci`, `SUM` sur les attributions **après** dédup par `(observer_login, observed_on, round(lat,4), round(lng,4))` — supprime le double comptage entre marches à rayons chevauchants.

### 3. Filtre rang-espèce optionnel

Ajouter une case à cocher dans le panel : **« Exclure les rangs supra-spécifiques (genre, famille, classe) »** (activée par défaut). Filtre sur `rank IN ('species','subspecies','variety')` ou heuristique 2 mots quand `rank` est nul. Évite les « Birds / Dicots / Asteraceae » gonflants.

### 4. Deux niveaux de CSV, clairement libellés

- **CSV Synthèse** (par défaut) : 1 ligne par espèce unique de l'événement — colonnes : `Espèce, Nom scientifique, Royaume, Rang, Observations, Sources, Première obs, Dernière obs`. Total lignes = 38.
- **CSV Données brutes** (opt-in, renommé **« Observations brutes par marche »**) : garde le comportement actuel mais avec une bannière en tête de fichier + colonne `⚠ Doublons attendus (rayons chevauchants)` pour éviter toute confusion analytique.

### 5. Rapport Word enrichi

- Bloc « Biodiversité » : conserve `38 espèces · Faune · Flore · Champi · Autres` (RPC)
- Ajouter une **note méthodo** discrète :
  > *Comptage dédupliqué par nom scientifique normalisé, aligné avec la Carte et le Carnet. Les rayons d'observations chevauchants entre marches proches ne créent pas de doublon.*
- Ajouter un mini-tableau **« Sources »** : X depuis snapshots iNat, Y depuis observations marcheurs, Z partagés (from `by_source`)

### 6. Vérification

- Comparer côté UI : ouvrir l'exploration Château Boutinet → nombre affiché dans le bandeau Carte (38) = nombre dans le Word exporté
- Rejouer l'export CSV Synthèse : ligne count = 38
- CSV brut conserve les 208 lignes mais avec bannière explicative

## Détails techniques

- **Fichiers modifiés** :
  - `src/components/admin/EventExportPanel.tsx` — remplacement du bloc biodiversité (lignes 173-269) par appel RPC
  - `src/utils/eventExportUtils.ts` — nouvelles colonnes CSV, note méthodo Word, section Sources, nouvelle option `includeRawBiodiversity` renommée
  - `src/integrations/supabase/types.ts` — régénéré par la migration
- **Nouvelle migration SQL** :
  - `get_exploration_species_export(p_exploration_id uuid)` — `SECURITY DEFINER`, dédup par `lower(unaccent(trim(scientific_name)))`, sortie JSON `{ species: [...] }` avec compteurs
  - `GRANT EXECUTE ... TO authenticated`
- **Pas de changement UI** en dehors du panel admin export
- **Compatibilité** : la RPC actuelle `get_exploration_species_count` reste inchangée (pas de régression Carte/Carnet)

## Résumé pour l'utilisateur

L'export sera **strictement aligné** sur ce que voit le marcheur dans la Carte/Carnet (38 espèces), grâce à la RPC unifiée déjà en place. Le CSV brut reste disponible pour l'analyse fine (par marche, avec GPS) mais clairement libellé comme tel. Ajout d'un filtre « rang espèce » pour ne pas gonfler avec des taxons supra-spécifiques, et d'une note méthodo dans le Word pour transparence scientifique.
