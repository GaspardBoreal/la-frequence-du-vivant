# Gérer le bouclage du tracé (étape N → étape 1)

## Le problème

Aujourd'hui, le tracé est strictement linéaire : on ne crée des segments qu'entre `étape i` et `étape i+1`. Le segment de fermeture entre la **dernière étape** (point 13) et la **première étape** (point 1) n'existe pas dans `detectSegmentCandidates` / `findSegmentByEndpoints`. Résultat : impossible d'insérer un point intermédiaire sur ce tronçon, d'où le message *« Ces 2 points ne sont pas voisins sur le tracé »*.

## Solution proposée — simple et explicite

Introduire un **mode "Boucle fermée"** activable depuis l'onglet Carte (toggle visible à côté des boutons "+ point de marche" / "point intermédiaire"). Quand le mode est ON :

1. Une polyline de fermeture (dernière étape → première étape) s'affiche, avec le même style pointillé/flèches que le reste du tracé.
2. Le segment virtuel `lastStep → firstStep` est ajouté aux fonctions de détection, donc :
   - on peut cliquer dans cette zone pour insérer un point intermédiaire ;
   - la sélection manuelle des 2 voisins fonctionne aussi (dernière étape ↔ point 1, ou avec d'autres waypoints du même tronçon).
3. Les waypoints insérés sur ce tronçon sont stockés avec `after_marche_id = id(dernière étape)`, ce qui s'intègre naturellement au modèle existant (pas de migration).
4. Le calcul de distance affichée (`~8.2 km estimés`) inclut ce segment de fermeture quand la boucle est active.

Le toggle est persistant via une colonne `is_loop boolean default false` sur `explorations` (migration légère, valeur par défaut sûre = pas de régression sur les tracés ouverts existants).

## UX

- Pastille "Boucle : OFF/ON" près des contrôles d'édition de la carte (mode édition uniquement).
- Quand ON : un petit indicateur visuel (icône ⟳) apparaît sur le segment de fermeture pour bien signaler qu'il s'agit d'un retour vers le point 1.
- Quand OFF : comportement actuel inchangé.

## Détails techniques

**Migration**
```sql
alter table public.explorations
  add column if not exists is_loop boolean not null default false;
```

**`WaypointMarker.tsx`** — `detectSegmentCandidates` et `findSegmentByEndpoints`
- Nouveau paramètre `isLoop: boolean`.
- Si `isLoop && geoMarches.length >= 2`, ajouter une itération supplémentaire avec `a = geoMarches[last]`, `b = geoMarches[0]`, en utilisant les waypoints de `byAfter.get(a.id)` (mêmes règles d'ordre).

**`ExplorationCarteTab.tsx`**
- Lire `exploration.is_loop` ; passer aux deux fonctions ci-dessus.
- Ajouter une `<Polyline>` de fermeture quand `isLoop` (mêmes options de style que la principale + `ArrowDecorators`).
- Ajouter le toggle UI (mutation update sur `explorations.is_loop`).
- Ajuster le calcul `~X km estimés` pour inclure le segment de fermeture.

**Aucun changement** nécessaire dans `useCreateWaypoint` : le stockage `(after_marche_id = dernière étape, ordre = k)` reste cohérent.

## Fichiers à modifier

- `supabase/migrations/<new>.sql` (ajout colonne `is_loop`)
- `src/components/community/exploration/WaypointMarker.tsx` (param `isLoop` dans les deux helpers)
- `src/components/community/exploration/ExplorationCarteTab.tsx` (toggle, polyline de fermeture, propagation `isLoop`, distance)
- `src/types/exploration.ts` (ajout `is_loop?: boolean`)
- `src/hooks/useExplorations.ts` (mutation pour basculer le toggle, ou réutiliser un hook update existant)
