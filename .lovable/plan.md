# Immersion Vignoble — Template public /m/:slug

Un template dédié à la catégorie **vignoble** pour les pages publiques de marches, appliqué en premier à Château Boutinet puis réplicable (Rioublanc…). Double lecture 50/50 : séduire le marcheur ET servir le vigneron dans la même page.

## Palette & signature (Terroir noble)

Tokens sémantiques ajoutés à `index.css` + variante `.theme-vignoble` :
- `--vignoble-ink` `#2b1810` (bordeaux profond, fonds nocturnes)
- `--vignoble-wine` `#6b2c2c` (lie-de-vin, accents structurants)
- `--vignoble-gold` `#c9a84c` (or antique, filets & chiffres clés)
- `--vignoble-paper` `#f0ead6` (papier crème, fond dominant)
- Typo : **Cormorant Garamond** (titres, italique éditorial) + **Inter** (courant) — cohérent avec l'existant.

Motif signature : **filet doré fin + capitale ornée** en début de chapitre (codes étiquette grand cru), séparateurs organiques (branche de vigne SVG) entre sections.

## Structure de la page (scroll narratif, 7 actes)

```text
┌─────────────────────────────────────────────────┐
│ ACTE 0 — CARTEL D'OUVERTURE (hero pleine hauteur)│
│  Photo pleine largeur des vignes                 │
│  Cartouche doré : "Château Boutinet · Villegouge"│
│  Titre Cormorant XL · date marche 26/09/2026     │
│  Double CTA : [S'inscrire] [Écouter le domaine]  │
│  Indice discret : ↓ 6 chapitres                  │
├─────────────────────────────────────────────────┤
│ ACTE 1 — LE DOMAINE EN CHIFFRES                  │
│  Bandeau or : 28 ha · 8 vignes · 10 forêt ·      │
│  10 prairies · 50 brebis South Down · bio 2020   │
│  Mini-carte parcellaire stylisée (SVG)           │
├─────────────────────────────────────────────────┤
│ ACTE 2 — CE QUE VOUS ALLEZ RENCONTRER (marcheur) │
│  Grille éditoriale 4 vignettes "pépites" :       │
│  Brebis South Down · Grand capricorne ·          │
│  Cerf-volant · Orchidées du tertre de Touille    │
│  Chaque vignette : illustration + micro-récit    │
├─────────────────────────────────────────────────┤
│ ACTE 3 — LA FICHE VIGNE/MOUTON (double lecture)  │
│  Composant phare — inventaire faune-flore avec   │
│  toggle Vigne ↔ Mouton. Chaque espèce = ligne    │
│  éditoriale (nom vernaculaire XL + scientifique) │
│  + 2 pastilles : "Bon pour la vigne" ↔ "À        │
│  surveiller" ; idem côté brebis.                 │
│  38 espèces GBIF déjà en base.                   │
│  Encart discret "Données certifiées GBIF"        │
├─────────────────────────────────────────────────┤
│ ACTE 4 — LA STORY DU MILLÉSIME                   │
│  Long-form éditorial : Jérôme & Nathalie, la     │
│  bascule bio, les brebis, les aléas climatiques. │
│  Citations en italique doré pleine largeur.      │
├─────────────────────────────────────────────────┤
│ ACTE 5 — LE VIN (bascule vente directe)          │
│  Bouteille 3D légère (image) + étiquette         │
│  générée depuis les pépites de l'acte 2.         │
│  CTA discret : "Emporter une bouteille après     │
│  la marche" (préparation P4 storytelling).       │
├─────────────────────────────────────────────────┤
│ ACTE 6 — REJOINDRE LA MARCHE                     │
│  Bloc inscription + infos pratiques + carte      │
│  d'accès. Rappel jauge/date.                     │
└─────────────────────────────────────────────────┘
```

Une **barre de progression verticale dorée** à droite (6 chapitres) sert de sommaire cliquable — codes livre-objet, pas dashboard.

## Composant phare : `<FicheVigneMouton />`

Réutilisable pour tous les clients viticoles. Colonne unique :
- En-tête : toggle segmenté **Vigne · Mouton · Les deux** (état par défaut : Les deux).
- Filtres eco-tags secondaires (auxiliaire, ravageur, pollinisateur, mellifère…) issus du système existant `species_eco_tags_kb`.
- Chaque espèce : ligne éditoriale (vignette carrée + nom FR grand + latin italique + 2 chips utilité) ; clic → drawer avec photo, description, source GBIF, observations locales datées.
- Micro-visualisation : mini barre stackée par eco-fonction en haut ("sur 38 espèces : 12 auxiliaires, 6 pollinisateurs…") — sert la démo P2 sans sur-promettre.

## Double lecture assumée (50/50)

Signaux visuels différenciés pour ne pas casser l'immersion marcheur :
- **Trace marcheur** : Cormorant, images pleines, verticalité éditoriale.
- **Trace vigneron / preuve** : petits filets or + micro-typo bas-de-casse en aparté ("Données certifiées GBIF", "Utile dossier HVE", "Argument étiquette"). Une **pastille or 🥂** dans la marge marque les blocs à double valeur — pédagogique sans être intrusif.

## Détails techniques

- Nouvelle route resolver : `MarcheDetail` détecte `marche.category === 'vignoble'` (ou tag) et bascule sur le layout `VignobleImmersionLayout` au lieu du layout générique. Fallback = layout actuel.
- Nouveaux fichiers :
  - `src/pages/vignoble/VignobleImmersionLayout.tsx`
  - `src/components/vignoble/VignobleHero.tsx`
  - `src/components/vignoble/DomaineChiffres.tsx`
  - `src/components/vignoble/PepitesGrid.tsx`
  - `src/components/vignoble/FicheVigneMouton.tsx` (composant phare, réutilisable)
  - `src/components/vignoble/MillesimeStory.tsx`
  - `src/components/vignoble/BouteilleCTA.tsx`
  - `src/components/vignoble/ChapterProgress.tsx` (barre verticale dorée)
  - `src/components/vignoble/OrnementalDivider.tsx` (branche vigne SVG)
- Tokens `--vignoble-*` ajoutés dans `src/index.css`, mappés Tailwind dans `tailwind.config.ts`.
- Données : réutilise `useMarcheEditorial` + `useExplorationSpeciesCount` + KB eco-tags existants ; ajout d'un champ optionnel `marche.metadata.pepites: string[]` (jusqu'à 4 espèces mises en avant, éditables admin).
- Progressive enhancement : la page reste lisible sans JS (SSR-ready) — les toggles sont progressive-enhanced.

## Ce que ce plan NE fait PAS

- Pas de génération PDF HVE/PAC (= P3, projet séparé).
- Pas de PSE Carbone (= P6).
- Pas de mécanique ferme pédagogique (= P5).
- Pas de nouveau schéma BDD lourd — juste un champ metadata pour les pépites.

## Livraison

1. Tokens + palette Terroir noble.
2. `FicheVigneMouton` (composant réutilisable, testable isolément).
3. Layout complet + wiring resolver sur `cat=vignoble`.
4. Application à Château Boutinet avec les 38 espèces GBIF déjà en base.
