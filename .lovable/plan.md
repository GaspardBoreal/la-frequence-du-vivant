# Étape 5 — La palette végétale

Objectif : transformer l'onglet actuel (une simple grille des plantes déjà vues, `src/components/propriete/tabs/TabPalette.tsx`, 50 lignes) en un outil de décision par emplacement, nourri par les Étapes 2, 3 et 4, imprimable comme les étapes précédentes.

## 1. Factoriser la carte des révélations

`RevealMapBlock.tsx` (789 lignes) porte aujourd'hui à la fois la donnée, les filtres, le plein écran, le géofence cadastral, la console GPS et le rendu carte. On en extrait un socle réutilisable, sans changer le rendu de l'Étape 3 :

```text
identify/blocks/RevealMapBlock.tsx        (Étape 3 — consomme le socle)
palette/blocks/ZonesMapBlock.tsx          (Étape 5 — consomme le socle + calque dessin)
        ↑
components/propriete/map/
  ObservationMapShell.tsx    carte + fond Géo/Sat/Relief/Cadastre + plein écran + recadrage
  useObservationLayer.ts     waypoints, géofence, filtres règne/source/périmètre, noms FR
  ObservationMarkers.tsx     marqueurs, popups, lightbox
```

Le socle est durci au passage : un seul point d'entrée pour le comptage d'espèces (déjà aligné sur `usePropertySpeciesCount`) et pour la résolution des noms français.

## 2. Dessiner et nommer les emplacements

Nouveau calque de dessin sur le socle (polygones à main levée, clic-à-clic + fermeture, poignées déplaçables, annuler/supprimer), rendu par-dessus les parcelles cadastrales existantes.

Chaque zone porte : nom d'usage libre saisi par le propriétaire (« Sous les marronniers »), une icône/couleur, une note, et le polygone. Maximum 5 zones actives.

Dès qu'une zone est fermée, on lui rattache automatiquement les observations situées à l'intérieur (test point-dans-polygone côté client, comme le géofence actuel) : c'est ce qui fait dire à chaque palette « constaté ici, le 14 mai ».

## 3. Base de connaissance végétale (V1, sans API)

Nouveau `src/lib/plantPaletteKb.ts` — environ 120 espèces plantables, chacune décrite dans le même langage chiffré que `plantIndicatorKb.ts` (axes humidité / pH / texture / nutrition, plus lumière), afin que l'Étape 3 et l'Étape 5 parlent bien la même langue :

- nom vernaculaire + binôme latin, strate (arbre, arbuste, liane, herbacée, couvre-sol)
- services rendus : pollinisateurs, structure du sol, ombrage, comestible, intérêt hivernal, brise-vent, fixation d'azote
- origine : indigène / horticole, et disponibilité sous label Végétal local par région biogéographique
- fenêtre de plantation, préparation du sol type, couverture 1ʳᵉ année, geste à proscrire
- motifs d'exclusion (calcifuge strict, envahissante, gourmande en eau…)

Les valeurs sont saisies au format Baseflor / Catminat pour que la V2 puisse les remplacer par l'appel `api.tela-botanica.org · service:eflore:0.1` sans toucher au moteur.

## 4. Moteur de recommandation

`src/lib/paletteEngine.ts` construit un profil de site à partir des données déjà en base, puis un profil par zone :

```text
profil site  = sol Étape 2 (pH, texture, structure, vie)  → normalisé via soilVocabulary
             + indices flore Étape 3 (eau, texture, nutri, pH)
             + Étape 4 (exposition, vent, humidité)
profil zone  = profil site  ± observations tombant dans le polygone
```

Sorties, exactement dans la structure demandée :

1. **La règle du site** — une phrase-filtre générée par règle déterministe à partir de l'axe le plus discriminant (« Sur ce sol, on plante calcicole ou on ne plante pas. »), éditable.
2. **Une palette par emplacement** — 6 à 12 espèces, réparties en strates, sous le nom d'usage du lieu.
3. **Trois lignes par espèce** — nom + latin ; raison écologique rattachée à une observation datée du carnet ; service rendu.
4. **Ce que l'on écarte** — 3 espèces plausiblement demandées, avec le motif de refus tiré du profil.
5. **Origine** — pastille indigène / horticole + mention Végétal local.
6. **Mise en œuvre** — fenêtre de plantation, préparation du sol par zone, couverture la première année, le geste à ne surtout pas faire.

Toutes les propositions restent éditables : ajout, retrait, réécriture d'une ligne.

## 5. Interface (design)

- **Bandeau règle du site** : typographie éditoriale pleine largeur, sceau végétal, ton des autres étapes.
- **Carte-atelier** : la carte factorisée en grand, plein écran disponible, vignettes de zones sur le côté ; survol d'une zone = surbrillance du polygone.
- **Palettes** : une carte par emplacement, aquarelle sobre comme `ObservationCard`, espèces en lignes-strates avec pastilles de services, photo issue du cortège si l'espèce a déjà été vue sur place.
- **Bloc « Ce que j'écarte »** : contre-champ visuel (fond tuilé rouge sourd), 3 refus argumentés.
- **Note de sources** en pied de section, au format de l'Étape 4, citant Baseflor / Catminat — Ph. Julve · Tela Botanica, version du 1ᵉʳ juin 2024, et CNPF 2018.

## 6. Verrouillage et impression, à l'identique

- Bandeau « Palette verrouillée · prête pour le rapport client » + Imprimer + Rouvrir en édition.
- `PaletteSummary.tsx` (vue scellée) et `PalettePrintLayout.tsx` (A4 : page de garde « Étape 5 · Palette végétale », plan des zones, une page par emplacement, page des écarts, page mise en œuvre + sources).
- `PrintChoiceDialog` gagne l'option « J'établis la palette (seul) » et le cahier complet devient Portrait + J'observe + J'analyse + J'identifie + Je synthétise + Palette.

## Détails techniques

Migration Supabase (validation demandée séparément) :

- `public.propriete_zones` — propriete_id, nom d'usage, couleur, note, `geometry jsonb` (polygone GeoJSON), ordre ; GRANT authenticated/service_role, RLS alignée sur `propriete_parcelles` (propriétaire + curateurs via la logique existante `can_curate_propriete_parcelles`).
- `public.propriete_palette` — propriete_id, `site_rule text`, `zones jsonb` (espèces retenues par zone), `excluded jsonb`, `implementation jsonb`, `completed_at`, timestamps ; même modèle que `propriete_synthesis`.
- RPC `upsert_propriete_palette` et `list_propriete_zones` / `upsert_propriete_zone` / `delete_propriete_zone`, sur le modèle de `upsert_propriete_synthesis`.

Hooks : `usePropertyZones.ts`, `usePropertyPalette.ts` (même schéma optimiste que `usePropertySoil` / `usePropertySynthesis`).

Aucun appel API externe en V1 : le moteur et la KB sont locaux, la V2 Tela Botanica se branchera derrière la même interface `getSpeciesOptima()`.
