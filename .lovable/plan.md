
## Objectif

Insérer une 4ème carte dédiée au monde agricole entre "Pour les Entreprises et Collectivités" et "Devenez Marcheur du Vivant", dans la grille du fichier `src/pages/MarchesDuVivant.tsx` (section lignes 100-224).

## Adaptations visuelles

- Grille : passer de `md:grid-cols-3` à `md:grid-cols-2 lg:grid-cols-4` pour accueillir 4 cartes harmonieusement sur desktop (1377px → 4 colonnes), 2 sur tablette, 1 sur mobile.
- Conserver strictement le format des 3 cartes existantes : `bg-card/40 backdrop-blur-sm`, padding `p-8`, icône 14x14 dans pastille colorée, titre `font-crimson text-2xl`, tags pilules, paragraphe descriptif, CTA avec flèche.

## Nouvelle carte — Agriculture & Coopératives

- **Palette** : vert tendre / lime (`lime-500` / `lime-400` / `lime-950`) pour évoquer agroécologie et bandes enherbées, distincte des autres (emerald RSE, cyan B2C, amber asso).
- **Icône Lucide** : `Sprout` (pousse/agroécologie) — alternative `Wheat`.
- **Titre** : "Pour les Acteurs Agricoles"
- **Tags** (3) :
  - `Coopératives & CUMA` (lime)
  - `Agroécologie` (emerald)
  - `Bio & Bocage` (orange-clair / amber doux)
- **Description (≈2 lignes, ton pro & inspirant)** :
  > "Coopératives, CUMA, chambres d'agriculture, exploitants : organisez une marche sur vos parcelles pour révéler les services rendus par la biodiversité — pollinisateurs, auxiliaires, sols vivants, réseau bocager — et valoriser vos pratiques."
- **CTA** : "Organiser une marche agricole →" (lien `/marches-du-vivant/agriculture` — page dédiée à créer plus tard ; pour l'instant lien posé, page 404 acceptable côté plan, ou réutiliser temporairement `/marches-du-vivant/entreprises` — **à confirmer**).

## Animation

- `initial={{ opacity: 0, y: 20 }}` avec `transition={{ delay: 0.1 }}` pour s'intercaler entre l'entrée latérale gauche (Entreprises) et l'entrée verticale (Marcheur).

## Hors scope

- Pas de création de la page de destination `/marches-du-vivant/agriculture` dans cette itération (sauf demande).
- Pas de modification du Hero, du SEO, ni des sections suivantes.

## Question ouverte

Le CTA doit-il pointer vers une future page `/marches-du-vivant/agriculture` (lien posé mais 404 temporaire) ou ancrer vers le formulaire de contact entreprises existant ?
