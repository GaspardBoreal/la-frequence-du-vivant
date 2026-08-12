# Roadmap vivante : donner à voir, pas seulement à lire

Aujourd'hui les trois éditions publiées sont du texte en cartes. Rien ne se regarde. L'idée : que chaque semaine produise **automatiquement ses propres images** — dessinées à partir des données déjà en base (semaines, nouveautés, domaines, publics, médias). Aucun travail manuel supplémentaire à l'atelier.

## Le geste visuel

Une identité de dessin unique pour toute la roadmap : trait fin, encre + primaire, fonds transparents, animation d'apparition au scroll. Des croquis, pas des graphiques de tableur.

## Ce qu'on ajoute sur la page publique

**1. La Frise vivante (haut de page, plein cadre)**
Un ruban SVG horizontal : une nervure par semaine, dont l'épaisseur suit le nombre de nouveautés et dont les ramifications portent les domaines couverts. Survol = la semaine s'allume et affiche son titre ; clic = on ouvre l'édition. Remplace l'actuelle liste de vignettes en tête.

**2. La Constellation des domaines**
Croquis radial : chaque domaine (biodiversité, sols, capteurs, CRM, partage…) est un nœud dont le rayon suit le nombre de nouveautés, relié aux publics concernés par des fils. Rend visible d'un coup d'œil où le projet a poussé.

**3. Le Sismographe de cadence** (remplace `CadenceChart`, aujourd'hui réservé aux partenaires et masqué)
Aire empilée par public, semaine par semaine, tracée à la main en SVG plutôt qu'en barres Recharts. Visible pour tous les publics.

**4. La Planche de preuves**
Mosaïque des captures d'écran de la semaine en cadres inclinés légers (style planche contact), qui ouvre la lightbox existante. Donne enfin du relief aux médias déjà téléversés.

**5. Glyphe de nouveauté**
Chaque `EntryCard` sans média reçoit un petit pictogramme SVG généré depuis son domaine (sol, feuille, onde capteur, réseau, œil…) — plus jamais de carte « nue ».

**6. Chiffres tenus**
Les compteurs `LiveStats` deviennent une bande de cartouches avec micro-sparkline par indicateur.

## Ce qu'on ajoute à l'atelier admin

- Un onglet **Aperçu public** montrant la semaine telle qu'elle sera vue, avec ses schémas générés.
- Un bouton **Exporter la planche** : le visuel de la semaine (frise + constellation) en PNG 1200×630, prêt pour LinkedIn / Pinterest, réutilisable dans le Social Studio.

## Détails techniques

- Nouveau dossier `src/components/roadmap/viz/` : `FriseVivante.tsx`, `ConstellationDomaines.tsx`, `Sismographe.tsx`, `PlancheDePreuves.tsx`, `EntryGlyph.tsx`, plus `src/lib/roadmap/vizPalette.ts` (tokens de trait/couleur, uniquement des variables HSL du design system — pas de couleur en dur).
- Tout est du SVG calculé côté client à partir de `RoadmapWeek[]` / `RoadmapEntry[]` déjà chargés : aucune requête ni table supplémentaire.
- Animations : `animate-fade-in` existant + `stroke-dasharray` progressif au montage, désactivé sous `prefers-reduced-motion`.
- `CadenceChart.tsx` est remplacé par `Sismographe.tsx` (suppression de la dépendance Recharts sur cette page).
- Intégration dans `RoadmapPublic.tsx` (accueil et déclinaisons par public) et `RoadmapWeekPage.tsx` (frise contextuelle + planche de preuves).
- Export PNG via rendu SVG → canvas, sans nouvelle dépendance.
