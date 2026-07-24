# Refonte de l'étape « 1 · J'observe le site » (Méthode D.S.)

## Intention

Le PDF Ver de Terre × Alliance Paysage propose une esthétique très reconnaissable : cartes crème arrondies, gros badge chiffré vert forêt, illustrations aquarellées, pictos aérés avec cases à cocher, ligne verte fine sous le titre, points de progression. Actuellement `TabObserve.tsx` n'affiche que des KPI biodiversité — on passe totalement à côté de la méthode. On remplace cette page par une **veillée d'observation guidée** qui reprend fidèlement les 8 blocs de la page 4, tout en gardant la data biodiversité existante en support.

## Structure visuelle de la page (aligné page 4 PDF)

```text
┌─ En-tête méthode ─────────────────────────────────────┐
│ Œil ·  1 J'OBSERVE LE SITE       Étape 1/5 · 20%      │
│ ────────●─────○─────○─────○─────○                     │
│ « Recueillir les informations essentielles du site   │
│   avant d'analyser le sol. »                          │
└───────────────────────────────────────────────────────┘

Grille "carnet de terrain" — 2 colonnes desktop, 1 mobile
┌─────────────────┐ ┌─────────────────┐
│ ① Contexte      │ │ ② Relief        │
│ ③ Ensoleillement│ │ ④ Vent          │
│ ⑤ Eau           │ │ ⑥ Végétation    │
│ ⑦ Particularités│ │ ⑧ Sensoriel     │
└─────────────────┘ └─────────────────┘

┌─ Ce que le site raconte déjà ────────────────────────┐
│ (KPI biodiv actuels — espèces, règnes, dernière obs) │
└───────────────────────────────────────────────────────┘

[ Enregistrer mes observations ]   → Étape 2 · J'analyse le sol
```

## Le composant « ObservationCard » (design system D.S.)

Chaque bloc est une carte crème (`bg-[#f7f3ea]` en clair, glass émeraude en dark) au coin arrondi 2xl, ombre douce, bordure fine `#d9d0b8`. Structure :

- **Badge chiffré** en pastille verte forêt (52px) en haut à gauche, chiffre serif blanc.
- **Titre** en small-caps verte foncée, souligné d'un trait vert 60px qui se termine par un point rond animé (grow au hover).
- **Illustration héro** aquarellée à gauche (généré via imagegen, style aquarelle botanique) — une par carte.
- **Grille de pictos-choix** : chaque option est une mini-vignette illustrée avec label + case à cocher stylée (rond vide → coche verte animée).
- État sélectionné : halo vert + ombre intérieure + tick animé (framer motion scale-in).

## Les 8 blocs à implémenter

| # | Titre | Choix (checkboxes multiples) | Illustration héro |
|---|-------|------------------------------|---------------------|
| 1 | Le contexte général — *Où se situe le jardin ?* | Ville · Campagne · Littoral · Montagne · Zone boisée · Autre | Paysagiste tablette |
| 2 | Le relief — *Le terrain est-il ?* | Plat · Légère pente · Pentu · En terrasse | Coupes topographiques |
| 3 | L'ensoleillement — *Exposition & ombres portées* | Mur · Arbre · Haie · Talus (+ boussole N/S/E/O) | Soleil + ombres |
| 4 | Le vent — *Exposition au vent* | Haie · Mur · Bâtiment · Talus (+ intensité 3 crans) | Manche à air + arbres pliés |
| 5 | L'eau — *Sous quelle forme ?* | Stagnation · Humide · Sec · Ruissellement · Sortie gouttière | Gouttes / flaque |
| 6 | Végétation présente — *Que raconte-t-elle ?* | Dense · Clairsemée · Mousse · Adventice · Saine · Malade | Feuillage varié |
| 7 | Particularités du terrain — *Le terrain subit ?* | Piétinement · Tassement · Pollution · Ombre permanente · Sécheresse · Inondation · Sel · Vent salin | Terre stratifiée |
| 8 | Analyse sensorielle — *Sons · Odeurs · Textures · Vues · Ambiance* | 5 champs micro-textarea avec pictos (oreille, nez, main, œil, âme) + slider ambiance calme↔vivante | Silhouette qui écoute |

## Bandeau bas — pont vers la data existante

Sous les 8 cartes, un bloc discret « Ce que la Fréquence du Vivant sait déjà de ce site » qui recycle les KPI actuels (espèces, marches, règnes, dernière obs, top espèces). Ainsi on ne perd rien de la valeur biodiv, mais elle passe en **preuves** de l'observation et non en cœur de page.

## Persistance & état

- Nouvelle table `propriete_observations` (JSONB `answers`, `sensorial`, `notes`, `completed_at`, `updated_by`, `propriete_id`) + RLS (lecture pour membres de la propriété, écriture pour walker référent / admin).
- RPC `upsert_propriete_observation(p_propriete_id uuid, p_payload jsonb)`.
- Hook `usePropriete Observation(id)` avec autosave debounced (2s) — badge « Enregistré » discret en haut à droite.
- Bouton final `Étape suivante →` mène à `?step=analyse` (préparation Phase 5, non implémentée ici).

## Détails design (à respecter)

- Palette : crème `#f7f3ea`, vert forêt `#2f5d3a`, vert clair accent `#7fa87f`, terre `#8b6f4e`, filet doré `#c9a84c` sur badges d'étape uniquement.
- Typo : titres serif (Cormorant/Instrument Serif si dispo dans le projet), corps sans (déjà en place).
- Micro-animations Motion : cartes en fade-in staggered, coche scale-in, trait vert grow au mount, illustration Ken Burns très léger au hover.
- Mode sombre : glass émeraude conservé, illustrations passent en `mix-blend-luminosity` + opacity 0.85.
- Accessible : `role="group"`, `aria-labelledby`, focus rings verts, cases à cocher pilotables clavier.

## Fichiers touchés

- `src/components/propriete/observe/ObservationCard.tsx` (nouveau — primitive carte D.S.)
- `src/components/propriete/observe/ChoicePicto.tsx` (nouveau — vignette illustrée + checkbox)
- `src/components/propriete/observe/SensorialBlock.tsx` (nouveau — bloc 8)
- `src/components/propriete/observe/StepHeader.tsx` (nouveau — bandeau étape/progress)
- `src/components/propriete/observe/observeConfig.ts` (nouveau — schéma des 8 blocs + labels)
- `src/components/propriete/tabs/TabObserve.tsx` (refonte complète — orchestration + bloc data biodiv en bas)
- `src/hooks/propriete/usePropertyObservation.ts` (nouveau — CRUD + autosave)
- `src/assets/observe/*.jpg` (8 illustrations aquarellées générées via imagegen)
- Migration SQL : table `propriete_observations` + GRANT + RLS + RPC upsert
- `src/index.css` : tokens `--ds-cream`, `--ds-forest`, `--ds-forest-soft`, `--ds-earth` (théâtralisent le carnet sans casser le brand kit global)

## Ce qui reste inchangé

- Onglets J'analyse / J'identifie / Je synthétise / Palette (traités en Phase 5 quand tu diras go).
- Hero immersif de la propriété (déjà validé).
- RPC `get_propriete_biodiversity` : réutilisée telle quelle en bloc bas de page.

## À valider avant build

Tu confirmes qu'on peut :
1. Créer la table `propriete_observations` + RPC (persistance côté serveur, pas juste local).
2. Générer les 8 illustrations aquarellées via imagegen (env. 8 appels standard).
3. Laisser les autres onglets inchangés pour cette itération.
