## Section « J'analyse » — refonte layout + bloc 2 cartographique + Cadastre propriété

### 1. Layout des vignettes 1→4 en pleine largeur

`src/components/propriete/tabs/TabAnalyze.tsx` — actuellement grille `md:grid-cols-2`. On sépare :

- Bloc 1 (Terrain), Bloc 2 (Prélèvements), Bloc 3 (Structure), Bloc 4 (Texture/Boudin) → chacun sur **une ligne pleine largeur** en desktop / tablette / mobile.
- Bloc 5 (pH) + Bloc 6 (Signes de vie) → conservés en grille 2 colonnes (desktop) comme aujourd'hui.
- Adapter les hero internes des blocs 1→4 pour tirer parti de la largeur (hero plus panoramique, grille interne d'options qui respire).

### 2. Bloc 2 « Prélèvements » — carte interactive de pose des points A→E

Nouvelle expérience inspirée de `identify/blocks/RevealMapBlock.tsx` et de `RichMap`.

Comportement :

- Carte centrée sur la propriété (centroïde des parcelles cadastrales si dispo, sinon centroïde des events liés, sinon fallback GPS marches).
- **3 points par défaut** (A, B, C) posés automatiquement selon un pattern « triangle représentatif » à l'intérieur de l'enveloppe des parcelles.
- L'utilisateur peut : **glisser** chaque marqueur, **cliquer sur la carte** pour ajouter un point (max 5 : A→E), supprimer via bouton sur le pin.
- Marqueurs poétiques : pastille cream + lettre forêt + halo animé (cohérent avec la charte D.S.).
- En dessous de la carte, la liste éditable des emplacements (`SoilSample.location`) — chaque ligne reliée au marqueur (hover = highlight sur la carte).
- Fond carto : basculement Plan / Satellite + couche cadastre allumable (réutilise `MapStyleToggle` + `CadastreLayer`).
- Persistence : on étend `SoilSample` avec `lat?: number; lng?: number` (rétro-compatible, déjà stocké en JSON dans `propriete_soil_diagnostics.samples`).

Nouveau fichier `src/components/propriete/analyze/blocks/SamplesMapBlock.tsx` qui remplace l'usage de `SamplesBlock` dans `TabAnalyze.tsx` (l'ancien reste disponible en fallback).

### 3. Onglet Portrait → sous-onglets « Galerie » + « Cadastre »

**UI** : `src/components/propriete/tabs/TabPortrait.tsx` gagne un segmented control (`Galerie` | `Cadastre`) dans son en-tête. Galerie = contenu actuel intact.

**Nouveau sous-onglet Cadastre** — `src/components/propriete/portrait/PortraitCadastre.tsx` :

- Carte plein cadre (`RichMap`) avec couche cadastre + fond Plan/Satellite (reprend `MapStyleToggle`, `ZoomControls`, `CadastreLayer`, `ParcelPopup` de la vue événement).
- Barre de recherche adresse (`geocodeAddress`) pour recentrer la carte.
- **Clic sur une parcelle IGN → ajout à la collection propriété** (toggle : reclic = retrait). Parcelles retenues surlignées en vert forêt, autres en gris translucide.
- Panneau latéral listant les parcelles sélectionnées : commune, section, numéro, contenance, surface calculée cumulée, bouton supprimer, note libre par parcelle.
- Export : bouton « Copier la liste » + « Télécharger GeoJSON ».

**Utilisation transverse** : le centroïde de l'ensemble des parcelles devient la source de vérité pour centrer la carte du Bloc 2 « Prélèvements » et pour dessiner l'enveloppe de la propriété sur `SiteSignature`.

### 4. Détails techniques

**Nouvelle table Supabase** (migration séparée présentée après approbation du plan, pas dans ce plan) :

```
public.propriete_parcelles (
  id uuid pk, propriete_id uuid fk → proprietes,
  parcel_id text,          -- id IGN (commune+section+numero)
  commune_code text, commune_nom text,
  section text, numero text,
  contenance_m2 integer,
  geometry jsonb,          -- polygon GeoJSON tel que renvoyé par cadastre-proxy
  centroid_lat double precision, centroid_lng double precision,
  note text,
  created_at, updated_at, created_by uuid
)
```

- GRANTs (authenticated + service_role), RLS (owner/paysagiste/admin via `has_role`), trigger `updated_at`, unique `(propriete_id, parcel_id)`.

**Hook** `src/hooks/propriete/usePropertyParcelles.ts` : list / toggle / update note / delete + invalidation React Query.

**Réutilisation carte** : import direct de `src/components/cadastre/CadastreLayer.tsx`, `ParcelPopup.tsx`, `src/components/maps/RichMap.tsx`, `MapStyleToggle`, `ZoomControls`, `DynamicTileLayer`. Aucune duplication de code carto — on branche des callbacks `onParcelClick`.

**Extension `SoilSample**` :

```ts
export interface SoilSample {
  id: string; label: string; location?: string;
  photo_url?: string | null;
  lat?: number | null; lng?: number | null;  // ← nouveau
}
```

La RPC `upsert_propriete_soil` accepte déjà `samples jsonb` — pas de migration DB nécessaire pour ce point.

### 5. Ordre d'exécution après validation

1. Refonte layout `TabAnalyze.tsx` (blocs 1→4 pleine largeur, 5→6 inchangés).
2. Nouveau `SamplesMapBlock.tsx` + extension type `SoilSample` (lat/lng).
3. Segmented Galerie/Cadastre dans `TabPortrait.tsx` + squelette `PortraitCadastre.tsx`.
4. Migration table `propriete_parcelles` (call séparé `supabase--migration`).
5. Hook `usePropertyParcelles` + branchement carte cadastre (sélection persistée).
6. Alimentation du centroïde propriété vers `SamplesMapBlock` et `SiteSignature`.

### Questions ouvertes (facultatives — à confirmer si besoin, sinon je prends les défauts ci-dessus)

- OK pour **max 5 points de prélèvement** (A→E), 3 posés d'office
- OK pour ajouter **une nouvelle table `propriete_parcelles**` (plutôt qu'un champ JSON sur `proprietes`) ? Une table dédiée permet le multi-parcelles propre + requêtes géo + partage futur.
- Sur le Bloc 2, priorité au **drag-and-drop des pins** ou à un mode « clic pour poser » ? Défaut retenu : les deux, drag + clic pour ajouter.