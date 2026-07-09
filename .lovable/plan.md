
# Page `/offre-VDT-MDV` — Argumentaire commercial « wahouhh »

## Contexte

Ver de Terre Production (VDT) lance une formation e-learning **« À la racine du paysage : diagnostiquer et valoriser la santé des sols en paysage »** (agroécologie paysagère, MSV, GIEP, résilience climatique). Cible : **paysagistes concepteurs, chargés d'affaire, bureaux d'études, collectivités**. Enjeu : sensibiliser le client au vivant, vendre le temps long, prouver l'intérêt économique du sol vivant.

Objectif de la page : démontrer en une page unique, très visuelle, que **Les Marches du Vivant (MDV) est LE compagnon digital + IA qui prolonge, incarne et opérationnalise la formation VDT sur le terrain**.

## Structure de la page (public, sans auth, mobile-first)

Route publique `/offre-VDT-MDV` — ajoutée dans `App.tsx`, SEO propre (title/description/OG).

### 1. Hero — « De la salle e-learning au terrain vivant »
- Logo VDT × MDV, baseline : *« Le prolongement digital & IA de votre formation Agroécologie Paysagère »*.
- Mention discrète : « Proposition confidentielle — Ver de Terre Production ».
- CTA doux : « Découvrir la démonstration ».

### 2. Bandeau preuves live (données réelles)
Réutilise `usePublicGlobalStats` (source de vérité déjà branchée sur `/agent-ia`, `/marches-du-vivant`) :
- Espèces tracées · Domaines documentés · Marches organisées · Marcheurs · Observations citoyennes · Photos collectées.
- Compteurs animés (pattern `AnimatedStat` / `ProofBar` existants).
- Badge « Données certifiées GBIF ».

### 3. Miroir des objectifs VDT → réponse MDV
Grille 4 cartes qui reprennent **mot pour mot** les objectifs de la formation VDT et y répondent avec une capacité MDV concrète :

| Objectif VDT | Réponse MDV |
|---|---|
| Diagnostic rapide (tests terrain, bio-indicatrices) | **Marche diagnostic géolocalisée + IA d'identification d'espèces** (iNaturalist + GBIF) → herbier vivant instantané du site |
| Argumentaire commercial technico-économique | **Pack Vivant exportable** (PDF + Excel + GeoJSON + KML) → livrable RSE opposable pour le client |
| Conception résiliente & nourricière | **Fréquence du Vivant** (score biodiversité + fonctions écologiques) → aide à la palette végétale résiliente |
| Pérennité & suivi MSV | **Snapshots datés + réverbérations saisonnières** → suivi longitudinal du site avant/après aménagement |

### 4. Démonstration visuelle — captures d'écran
Section « La plateforme en action » avec captures réelles (routes existantes) :
- Carte biodiversité d'une marche (`/m/:slug`)
- Drawer espèce avec photos marcheurs + iNat + fonctions écologiques
- Fiche Fréquence du Vivant (score + critères)
- Pack Vivant / export RSE
- Chatbot IA contextuel (aware du périmètre affiché)

**Méthode capture** : screenshots via Playwright headless sur le preview local, sauvés en `src/assets/offre-vdt/*.jpg` (fichiers versionnés). Fallback : références visuelles stylisées si un rendu n'est pas satisfaisant.

### 5. Le « + » IA disruptif
Trois blocs qui font la différence :
- **IA d'identification & classification** : iconic_taxon + 12 tags écologiques auto (mellifère, fixateur azote, arbre pionnier…) → l'apprenant/paysagiste voit *quelle fonction* joue chaque espèce sur son site.
- **Chatbot géo-contextuel** : voit l'écran filtré, la marche, les waypoints → répond « quelle vivace planter ici sachant que le sol accueille déjà X, Y, Z ? ».
- **Diagnostic 5km automatique** (moteur Dordonia) : rapport biodiversité instantané autour d'une parcelle client — argument commercial imparable en RDV.

### 6. Cas d'usage terrain — parcours paysagiste
Storyboard 5 étapes illustrées :
1. Avant RDV client → diagnostic 5km auto.
2. Sur site → marche géolocalisée, photos = observations.
3. Restitution → Pack Vivant PDF au client.
4. Conception → palette végétale nourrie par les fonctions écologiques observées.
5. Suivi → snapshots saisonniers = preuve MSV dans le temps.

### 7. Chiffres clés « wahouhh »
Reprise `usePublicGlobalStats` en gros formats + trois métriques qualitatives :
- 3 sources scientifiques fusionnées (GBIF, iNaturalist, observations marcheurs).
- 12 fonctions écologiques auto-classifiées.
- Export multi-format (PDF, Excel, CSV, GeoJSON, KML).

### 8. Modèle de collaboration proposé VDT × MDV
Trois pistes concrètes, sobres :
- **Module complémentaire** : accès MDV offert aux stagiaires VDT (parcours terrain).
- **Co-marquage** : marches diagnostic labellisées « VDT × MDV » sur territoires pilotes.
- **OAD digital** : intégration du livrable OAD (matrices diagnostic sol, herbier bio-indicatrices) dans la plateforme MDV.

### 9. Closing
Citation manifeste + CTA `mailto:` vers le contact commercial MDV + lien discret vers `/marches-du-vivant`.

## Design

Respect strict du design system existant (thème sombre Forêt Émeraude par défaut, glassmorphism, tokens sémantiques `--primary`, `--accent`, dégradés emerald/lime déjà utilisés dans `ProofBar` et `AnimatedStat`). Aucune couleur hardcodée. Fonts : Crimson (titres) + sans (body) — cohérent avec `AnimatedStat`.

Ton : sobriété informationnelle (memory `sobriete-informationnelle`), un seul KPI dominant par bloc, respirations généreuses, animations `framer-motion` déjà en place.

## Détails techniques

- **Fichiers créés** :
  - `src/pages/OffreVdtMdv.tsx` (page complète, sections en composants internes).
  - `src/assets/offre-vdt/hero.jpg` + 4-5 captures d'écran (générées via Playwright sur le preview).
- **Fichiers modifiés** :
  - `src/App.tsx` : ajout de la route publique `/offre-VDT-MDV`.
  - `index.html` : rien (SEO géré via `react-helmet-async` déjà présent, ou balises statiques dans la page).
- **Réutilisation** : `usePublicGlobalStats`, `AnimatedStat`, `ProofBar` (ou style dérivé), `motion` / `useInView`.
- **Pas de backend, pas de migration, pas d'edge function.** Page 100% frontend qui consomme la RPC publique déjà en place.

## Hors périmètre

- Pas de nouveau système d'auth, pas de formulaire de contact backend (juste `mailto:`).
- Pas de modification des pages `/marches-du-vivant` ou `/agent-ia`.
- Pas de génération PDF côté serveur (la page elle-même est le pitch).

## QA

- Vérifier build TS + rendu Playwright de `/offre-VDT-MDV` en mobile 375px et desktop 1440px.
- Vérifier chargement des stats publiques (network `get_public_global_stats`).
- Vérifier qu'aucune couleur hardcodée n'est introduite (grep `text-white|bg-black|#[0-9a-f]{6}` sur le nouveau fichier).
