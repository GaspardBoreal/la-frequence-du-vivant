## Objectif

Depuis la vignette d'un prélèvement (popup carte, aujourd'hui limitée à 3 lignes), ouvrir une **fiche carotte** plein écran, hyper graphique et navigable : tests réalisés, résultats, mesures, indices de vie, et preuves photo/vidéo de terrain.

## 1. La vignette devient une porte d'entrée

Le popup actuel gagne :
- une **mini-carotte SVG** (anneaux texture + arc pH) au lieu du texte brut ;
- 4 pastilles-statut Structure / Texture / pH / Vie (pleine = renseignée, creuse = à faire) ;
- un compteur de preuves (📷 n) ;
- un bouton « Ouvrir la carotte » qui déclenche le drawer.

## 2. Le drawer « Carotte » — navigation disruptive

Plein écran (portal + scroll-lock, comme le mode plein écran de la Carte des révélations), fond crème, deux colonnes en desktop / empilé en mobile.

```text
┌───────────────────────────────────────────────┐
│  ●C  Prélèvement C — Potager      ‹ B  C  D ›  ✕│
├──────────────┬────────────────────────────────┤
│              │  STRUCTURE  ·  test bêche      │
│   CAROTTE    │  ▸ grumeleuse   [lecture]      │
│   verticale  │  ▤▤▤ 3 preuves                 │
│   interactive│────────────────────────────────│
│  (strates    │  TEXTURE · boudin → limoneux   │
│   cliquables)│  pH · 6,4  ▁▂▃▅▇  légère acidité│
│              │  VIE · 1 vers · 2 indices      │
├──────────────┴────────────────────────────────┤
│  Phrase agronomique de synthèse (serif ital.) │
└───────────────────────────────────────────────┘
```

- **Carotte verticale interactive** : un cylindre stratifié dessiné en SVG (horizon de surface → profondeur), chaque strate colorée par la dimension correspondante ; survol/clic sur une strate = scroll magnétique vers la section, et inversement la strate s'illumine quand on scrolle. C'est le fil de navigation, pas un menu.
- **Navigation entre prélèvements** : flèches ‹ A B C › en tête + swipe horizontal mobile, sans fermer le drawer.
- **4 sections rythmées** (Structure, Texture, Acidité, Vie), chacune avec : picto du test réalisé (réutilise `StructureTestPictos` / `TexturePictos` / `PhPictos` / `LifePictos`), résultat en gros caractères, jauge dédiée (échelle pH colorée, compteur de vers en pictos, chips d'indices de vie), et la lecture agronomique existante.
- **Bande de preuves** par section : vignettes des médias `propriete_test_medias` filtrés sur ce prélèvement × ce test, date sous chaque vignette, clic = lightbox zoom/pan (réutilise `VideoLightbox` / la loupe de terrain existante).
- **Pied de fiche** : phrase de synthèse issue de `buildSoilReading`, badge « complet / à compléter » listant les dimensions manquantes, et raccourci « Compléter à l'étape J'analyse ».

## 3. Où la fiche est accessible

Le même drawer est branché partout où une carotte apparaît, sans duplication :
- popup de `SoilSamplesLayer` (Atelier + carte Palette),
- carte des prélèvements de l'étape « J'analyse »,
- tableau `SamplesRegisterTable` (clic sur une ligne).

## Détails techniques

- Nouveau `src/components/propriete/analyze/sample/SampleCoreDrawer.tsx` (portal, `AnimatePresence`, scroll-lock) + `SampleCoreSvg.tsx` (carotte stratifiée) + `SampleSection.tsx`.
- Données 100 % existantes : `SoilSample` (usePropertySoil / useSoilSamples) pour les tests et résultats, `usePropertyTestMedias` pour les preuves, `soilTestCatalog` pour libellés/accents, `structureTests` / `textureTests` / `phTests` / `lifeTests` pour les lectures. Aucune migration DB.
- Ouverture pilotée par un petit contexte `SampleDrawerContext` (ou prop `onOpenSample`) pour que la popup Leaflet, la table et la carte partagent la même instance.
- Couleurs strictement via tokens `--ds-*` et les accents `SOIL_BLOCKS`, mode sombre respecté.
