
## Objectif

1. Permettre de définir un **rayon d'observation par défaut** au niveau d'une exploration.
2. Permettre de **fixer/voir le rayon de chaque marche** (override du défaut).
3. Ajouter un **onglet Carte** (desktop/tablette) sur la page exploration, avec **repositionnement GPS** du centre de la marche pour les rôles ambassadeur / sentinelle / admin.

---

## 1. Base de données (migration)

Ajouter deux colonnes :

```sql
ALTER TABLE explorations ADD COLUMN default_radius_m integer NULL;
ALTER TABLE marches      ADD COLUMN radius_m         integer NULL;
```

- `NULL` signifie « pas d'override → fallback ».
- Cascade côté UI/edge : `marche.radius_m` → `exploration.default_radius_m` → **500 m** (constante actuelle).
- Aucune backfill : on garde `NULL` partout. Les snapshots existants ne sont pas modifiés.
- Changer un défaut d'exploration **n'écrase pas** les overrides marche.
- Aucune re-collecte automatique : la nouvelle valeur sera utilisée à la **prochaine collecte manuelle** (bouton « Rafraîchir » existant).

RLS : héritée des tables. Update GPS/radius des marches : limité aux rôles admin / sentinelle / ambassadeur via policy.

---

## 2. Helper partagé

`src/utils/marcheRadius.ts` :

```ts
export const DEFAULT_RADIUS_M = 500;
export const resolveRadiusM = (marche?: { radius_m?: number | null }, explo?: { default_radius_m?: number | null }) =>
  marche?.radius_m ?? explo?.default_radius_m ?? DEFAULT_RADIUS_M;
```

Utilisé partout où la collecte/affichage a besoin du rayon (edge functions `collect-biodiversity-*`, `EventBiodiversityTab`, `MarcheDetailModal`, nouvel onglet Carte).

---

## 3. UI — Page Événement / Fiche exploration

Dans `EventBiodiversityTab` (ou la fiche exploration équivalente) :

- En tête de l'onglet « Vivant ! » : un **bloc « Rayon par défaut de l'exploration »** avec `<RadiusSelector />`.
- Sous-titre explicatif : *« Appliqué aux marches sans rayon personnalisé. Ne déclenche pas de nouvelle collecte. »*
- Save immédiat (mutation `updateExplorationDefaultRadius`).
- Pour chaque marche listée : badge `{radius_m ?? default_radius_m}m` avec pastille discrète si override (« Personnalisé »).

---

## 4. UI — Onglet « Marches → Vivant ! » (par marche)

`MarcheDetailModal` (déjà existant avec `RadiusSelector` local) :

- Le `useState(0.5)` initial est remplacé par `resolveRadiusM(marche, exploration)`.
- Ajouter un bouton **« Définir comme rayon de cette marche »** qui persiste `marches.radius_m`.
- Ajouter **« Revenir au défaut de l'exploration »** (set NULL) si override actif.
- Visible uniquement pour ambassadeur / sentinelle / admin ; lecture seule sinon (`readOnly`).

---

## 5. Nouvel onglet « Carte » (desktop/tablette uniquement)

Inspiration : `https://la-frequence-du-vivant.com/bioacoustique/.../` (onglet Carte).

- Visible **uniquement** ≥ `md` (caché en mobile via `hidden md:flex` sur le `TabsTrigger`).
- Route : intégré aux onglets existants de `/marches-du-vivant/mon-espace/exploration/:id`.
- Composant : `ExplorationCarteRadiusTab.tsx` utilisant `<RichMap>` partagé.

Contenu :
- Polyline du parcours (déjà via `RichMap.marcheRoute`).
- Un marqueur par marche au point GPS courant.
- Un **cercle Leaflet** affichant le rayon résolu (couleur exploration, semi-transparent).
- Clic sur un marker → panneau latéral droit (Sheet desktop) :
  - Nom de la marche
  - `<RadiusSelector />` (même composant) avec persistance immédiate sur `marches.radius_m`.
  - Coordonnées éditables (deux champs lat/lng) **+** mode « Glisser le point » (draggable marker, comme cadastre).
  - Bouton « Centrer la carte ici ».
  - Bouton « Revenir au défaut de l'exploration ».

Permissions :
- Lecture pour tous (rayon + position visibles).
- **Édition** (drag + save lat/lng/radius) uniquement si rôle ∈ {admin, sentinelle, ambassadeur} (hook `useCommunityProfile` existant).
- Indicateur visuel quand le drag est actif (curseur, halo doré sur le marker).

Aucune re-collecte automatique au save ; un toast informe :
> *« Rayon/position enregistrés. Cliquez sur Rafraîchir dans l'onglet Vivant ! pour relancer la collecte. »*

---

## 6. Edge functions

Dans les edge functions de collecte (`collect-biodiversity-*`), récupérer le rayon en :
1. Lisant `marches.radius_m`, puis `explorations.default_radius_m` (jointure), puis fallback 500.
2. Le paramètre `radius` du request body reste prioritaire (utilisé par le bouton « Rafraîchir » avec valeur temporaire éventuelle).

---

## 7. Détails techniques

- **Conversion** : `RadiusSelector` travaille en **km** (0.05 → 5). Stockage en **mètres** (`integer`). Conversion utilitaire `kmToMeters` / `metersToKm`.
- **React Query** : nouveau hook `useUpdateMarcheRadiusAndGps()` et `useUpdateExplorationDefaultRadius()` ; invalide `['exploration', id]`, `['exploration-marches', id]`, `['marche', id]`.
- **RichMap** : ajouter un prop optionnel `radiusOverlays?: Array<{ lat, lng, radiusM, color? }>` qui rend des `<Circle />` Leaflet. Centralisé donc réutilisable dans le drawer espèce.
- **Drag** : `<Marker draggable eventHandlers={{ dragend }}>` natif Leaflet, comme dans `WaypointMarker.tsx` (déjà draggable côté cadastre).
- **Responsive** : `useIsMobile()` n'est pas suffisant car on veut tablette ; utiliser une media query `min-width: 768px` (Tailwind `md`).
- **Sobriété** : pas de bannière pédagogique, juste un petit `Info` icon avec tooltip expliquant le rayon.

---

## 8. Fichiers impactés

**Création**
- `supabase/migrations/<ts>_radius_columns.sql`
- `src/utils/marcheRadius.ts`
- `src/components/community/exploration/ExplorationCarteRadiusTab.tsx`
- `src/components/community/exploration/MarcheRadiusEditorSheet.tsx`
- `src/hooks/useUpdateMarcheRadiusAndGps.ts`
- `src/hooks/useUpdateExplorationDefaultRadius.ts`

**Édition**
- `src/components/maps/RichMap.tsx` (ajout `radiusOverlays`)
- `src/components/community/MarcheDetailModal.tsx` (init via `resolveRadiusM`, boutons set/clear override)
- `src/components/community/EventBiodiversityTab.tsx` (bloc rayon par défaut exploration + badges par marche)
- Page exploration `/mon-espace/exploration/:id` : ajout du `TabsTrigger`/`TabsContent` Carte (md+ only)
- Edge functions de collecte biodiversité (lecture du rayon résolu)

---

## Question ouverte mineure

- Souhaites-tu un **bouton « Recollecter maintenant »** directement dans le drawer Carte après un changement (en plus du rafraîchissement manuel dans l'onglet Vivant), ou on garde une seule porte d'entrée pour éviter les appels API multiples ?
