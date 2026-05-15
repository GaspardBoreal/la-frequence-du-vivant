# Pop-up carte espèce : photos manquantes & superposition avec la barre de styles

## Diagnostic

### PB 1 — La pop-up passe sous la barre Géo/Sat/Relief/Cadastre
Dans `SpeciesGpsDrawer.tsx`, la pop-up Leaflet s'ouvre au-dessus du marqueur, mais le bouton « style » de `RichMap` (Géo/Sat/Relief/Cadastre) est positionné en `absolute top-right` avec un `z-index` supérieur à celui par défaut de `.leaflet-popup` (700). Résultat : la fiche est tronquée par la barre.

De plus, la pop-up n'a pas d'`autoPanPadding` configuré, donc Leaflet ne décale pas la carte pour éviter la zone occupée par les contrôles.

### PB 2 — « Pas de photo disponible » alors que Taxons en montre 4
La pop-up lit uniquement `attribution.photoUrl`, qui n'est renseigné **que** pour les lignes `marcheur_observations` (cf. `EventBiodiversityTab.tsx`). Les **observations citoyennes iNat**, elles, n'ont pas ce champ : leurs photos vivent dans `biodiversity_snapshots.species_data[].photos[]` et sont extraites par le hook `useSpeciesMarcheurPhotos` utilisé dans le modal Taxons (`SpeciesPhotoCarousel`).

→ Il faut que la pop-up consomme **le même hook** que le modal Taxons (source unique de vérité) et apparie les photos aux clusters par `observationDate + observerName` (les deux champs sont communs aux attributions et aux photos).

## Plan UX/UI

### Étape 1 — Z-index & auto-pan de la pop-up
**Fichier :** `src/components/community/synthese/indices/SpeciesGpsDrawer.tsx`

1. Ajouter dans le `<style>` injecté :
   ```css
   .leaflet-popup { z-index: 1000 !important; }
   .leaflet-popup-content-wrapper { box-shadow: 0 12px 32px rgba(0,0,0,0.35); }
   ```
2. Sur chaque `<Popup>`, passer :
   ```tsx
   autoPan
   autoPanPaddingTopLeft={[12, 80]}   // évite d'arriver sous les KPI / titre
   autoPanPaddingBottomRight={[12, 60]} // évite la barre Leaflet en bas
   keepInView
   ```
   Le padding top de 80 px garantit que, lorsqu'un cluster proche du haut est ouvert, la carte recule pour libérer la zone des contrôles Géo/Sat/Relief/Cadastre.

### Étape 2 — Réutiliser `useSpeciesMarcheurPhotos` (source unique)
**Fichier :** `src/components/community/synthese/indices/SpeciesGpsDrawer.tsx`

1. Importer `useSpeciesMarcheurPhotos` et l'appeler dans le composant :
   ```ts
   const { data: fieldPhotos = [] } = useSpeciesMarcheurPhotos(scientificName, explorationId);
   ```
2. Construire un index de matching `dateKey|observerKey → photo[]` :
   ```ts
   const photosByKey = useMemo(() => {
     const map = new Map<string, MarcheurSpeciesPhoto[]>();
     fieldPhotos.forEach((p) => {
       const dateKey = p.observationDate ? p.observationDate.slice(0, 10) : '';
       const obsKey = (p.observerName || '').toLowerCase().trim();
       const k = `${dateKey}|${obsKey}`;
       if (!map.has(k)) map.set(k, []);
       map.get(k)!.push(p);
     });
     return map;
   }, [fieldPhotos]);
   ```
3. Dans le rendu de chaque cluster, remplacer la lecture de `(a as any).photoUrl` par :
   - Pour chaque attribution du cluster, calculer la même clé `dateKey|observerKey` et récupérer toutes les photos correspondantes.
   - Dédupliquer par `url`.
   - Fallback en cascade :
     1. Photos appariées par date+observateur
     2. Photos appariées seulement par date du cluster (si aucune)
     3. Photo cover globale `photos[0]` (libellé « Photo générique de l'espèce »)
     4. Bloc « Pas de photo disponible » (cas vraiment rare)

### Étape 3 — Mini-galerie pop-up soignée
**Fichier :** `src/components/community/synthese/indices/SpeciesGpsDrawer.tsx`

Refondre légèrement le bloc photos (lignes 280-336) :

- **1 photo** → vignette 100 % × 144 px, badge en bas-gauche selon source : « 📷 Marcheur · {prénom} » (vert émeraude) ou « 🔭 Citoyen · {pseudo} » (cyan), cliquable vers `originalUrl` ou la photo en taille réelle.
- **2-4 photos** → grille 2 colonnes carrées (compacte, lisible), badge mini source en coin haut-gauche de chaque vignette, click → ouvre source iNat / image.
- **5+ photos** → grille 2×2 + overlay « +N » sur la dernière vignette, click sur n'importe laquelle → ouvre un mode plein-écran réutilisant `SpeciesPhotoCarousel` (déjà existant) filtré sur ce cluster.
- Largeur pop-up : `min-w-[260px] max-w-[320px]` conservée.

### Étape 4 — Vérification visuelle
- Cluster Orchidée pyramidale (4 obs, 2 observateurs) → 4 vignettes en grille avec badges Marcheur/Citoyen.
- Cluster mono-obs avec photo → grande vignette + badge.
- Cluster sans match (cas iNat sans média) → photo générique de l'espèce.
- Ouvrir une pop-up sur un marqueur situé dans le quart haut-droit de la carte : la carte doit auto-pan pour que la fiche n'empiète pas sur la barre Géo/Sat/Relief/Cadastre.

## Hors-périmètre
- Pas de modification de `useSpeciesMarcheurPhotos` (le hook est déjà la source utilisée par Taxons, on le réutilise tel quel).
- Pas de changement du clustering ni des KPI.
- Pas de modification de `EventBiodiversityTab` (la propagation `photoUrl` reste pour le chemin marcheur, mais devient secondaire au profit du hook unifié).
