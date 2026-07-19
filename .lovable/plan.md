# Vue Carte "Constellation des Doublons" — Admin / Taxonomie

Ajouter à `/admin/outils/taxonomie` un **mode Carte** immersif qui révèle spatialement les doublons probables et permet de trancher en une seule vue (visuel + son + GPS ultra-précis), au niveau qu'attendent des pros de la donnée biodiversité.

## Intention design

**Métaphore** : une constellation. Chaque cluster de doublons = une constellation d'étoiles reliées par un halo lumineux. L'admin "aligne les étoiles" en fusionnant.

**Palette** : hérite du thème (Papier Crème / Forêt Émeraude). Halos ambre pour les doublons non résolus, vert émeraude pour ceux résolus dans la session, gris translucide pour les singletons de contrôle.

**Registre** : sobre, aéré, cinématographique. Zéro chrome inutile. Le fond de carte porte le sens.

## Structure de la page

Nouveau switch en haut du bandeau : **Liste ↔ Carte** (à côté du tri et de la recherche déjà présents). Les filtres actuels (Marche, Événement, Recherche nom, Tri) restent actifs et pilotent la carte.

```text
┌─ FiltersBar (existant) ─────────────────────────────────────┐
│  [Marche ▾] [Event ▾] [Recherche…] [Tri ▾]  [◧ Liste │ Carte]│
└──────────────────────────────────────────────────────────────┘
┌─ Carte (RichMap) ─────────────────┬─ Panneau contextuel ────┐
│                                    │  Cluster sélectionné    │
│   • Halos ambre = doublons         │  ┌──────┬──────┐       │
│     - Lantana ×3                   │  │photo │photo │       │
│     - Lantana camara ×7            │  ├──────┼──────┤       │
│                                    │  │ ♪ son│ GPS  │       │
│   • Filaments reliant les points   │  └──────┴──────┘       │
│     d'un même cluster              │  [Écouter tout]         │
│                                    │  [Fusionner ce cluster] │
│   Fond cadastre / satellite / géo  │  [Marquer non-doublon]  │
└────────────────────────────────────┴─────────────────────────┘
```

## Détection des clusters de doublons (côté carte)

Pour la marche/event filtré, agréger les observations (`marcheur_observations` ∪ snapshots iNat déjà normalisés). Regrouper par **similarité nom + proximité GPS** :

- Similarité nom : même canonical alias, ou lemme identique (`lantana` ⊂ `lantana camara`), ou distance Levenshtein ≤ 2 sur le binôme.
- Proximité GPS : rayon paramétrable (défaut **25 m**, curseur 10 m → 500 m), calculé Haversine.
- Un cluster = ≥ 2 observations qui matchent les 2 critères mais portent des étiquettes taxonomiques différentes → candidat doublon.

Un badge en haut de la carte : `12 clusters de doublons détectés · 47 observations concernées`.

## Rendu carte — le "wahouhh"

Basé sur `<RichMap>` (réutilise DynamicTileLayer, style toggle, cadastre, zoom, geolocate — cohérent avec Mon Espace) :

1. **Marqueurs GPS ultra-précis** : chaque observation = un point vectoriel (pas d'icône Leaflet par défaut). Rayon 6 px, halo lumineux 18 px, couleur = teinte du cluster.
2. **Halos de cluster** : cercle SVG translucide ambre (`hsl(var(--accent) / 0.15)`), stroke pointillé animé (dashoffset), qui englobe les points d'un cluster. Hover = le halo pulse doucement (2s ease-in-out infinite).
3. **Filaments** : polyline courbe (Bézier quadratique) reliant chaque point au centroïde du cluster, opacité 0.35, épaisseur 1 px, couleur or/ambre → effet constellation.
4. **Curseur de rayon** : slider glassmorphique flottant en bas-gauche (10 m → 500 m), met à jour le clustering en live avec transition 300 ms.
5. **Loupe hyper-précise** : au zoom ≥ 18, révèle les coordonnées GPS exactes (lat/lng à 6 décimales) sous chaque point, en typo mono, avec le cadastre visible dessous.
6. **Photo-halos** : chaque marqueur non-iNat porte une mini-vignette 32 px de la photo marcheur en overlay (border ambre 2 px). Effet mosaïque au dézoom.
7. **Son embarqué** : point avec `sound_recordings` → petit ⓢ pulsant, clic = lecture inline (WaveSurfer mini-player 40 px de haut).

## Panneau contextuel (Sheet latéral droit)

À l'ouverture d'un cluster (clic sur un halo) :

- **En-tête** : nom canonique proposé + nb obs + fourchette de dates.
- **Grille photos** : 2 colonnes, photos triées par observateur, chaque tuile affiche nom brut, date, distance au centroïde, GPS (6 déc.), source (marcheur / iNat).
- **Lecteur audio** groupé si sons présents (bouton "Écouter les 4 enregistrements en séquence").
- **Mini-carte** zoomée sur le cluster (fond cadastre) avec les points numérotés.
- **Actions** :
  - `Fusionner ce cluster` → ouvre le dialog de merge existant pré-rempli (canonical + variantes détectées).
  - `Marquer comme non-doublon` → persiste dans une nouvelle table `species_taxonomy_alias_dismissals` pour ne plus proposer.
  - `Aller à la Liste` → bascule vue Liste filtrée sur ces espèces.

Après merge : les halos passent au vert émeraude, filaments épaissis, léger flash → feedback immédiat.

## Données & filtrage

- Réutilise `get_exploration_species_pool` (déjà normalisé aliases) + un nouveau RPC `get_taxonomy_duplicate_candidates(marche_ids[], event_id, radius_m, name_threshold)` qui retourne : `cluster_id`, `centroid`, `variants[]`, `observations[] {id, lat, lng, name_raw, photo_url, sound_url, source, observer, date}`.
- RPC `SECURITY DEFINER` avec `has_role(auth.uid(), 'admin')`.
- Coord GPS lues telles quelles (pas d'arrondi) — on veut la précision terrain.

## Détails techniques

- Nouveau composant `src/components/admin/taxonomy/DuplicatesMapView.tsx` monté conditionnellement dans `AdminTaxonomyCuration.tsx`.
- Toggle Liste/Carte stocké dans l'URL (`?view=map`) pour deep-linking.
- Clustering côté client (rapide sur < 5k obs) via un simple union-find sur (nom-similaire) × (Haversine ≤ radius).
- Halos + filaments dessinés via `react-leaflet` `<Circle>` + `<Polyline>` avec `pathOptions` animés en CSS.
- Vignettes photos via `<SpeciesThumb />` (cascade locale → iNat) déjà en place.
- Audio via composant existant `MarcheurAudioPlayer`.
- Nouvelle table `species_taxonomy_alias_dismissals(marche_id, name_a, name_b, dismissed_by, at)` + policies admin.
- Fond de carte cadastre par défaut sur cette vue (le plus parlant pour la précision parcellaire).

## Livrables

1. Migration : RPC `get_taxonomy_duplicate_candidates` + table `species_taxonomy_alias_dismissals` + GRANTs + RLS.
2. `DuplicatesMapView.tsx` (carte + clustering + halos + filaments + curseur rayon).
3. `DuplicateClusterSheet.tsx` (panneau photos/sons/actions).
4. Toggle Liste/Carte dans `AdminTaxonomyCuration.tsx` avec sync URL.
5. Mémoire projet : `mem://features/admin/taxonomy-duplicates-map-view`.

## Hors-scope (proposé pour V2 si validé)

- Suggestions IA de merge (Lovable AI ranking les clusters les plus probables).
- Export GeoJSON des clusters non résolus pour audit externe.
- Historique de décisions par admin (audit trail dédié).