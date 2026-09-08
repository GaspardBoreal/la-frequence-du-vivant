# Console Propriétés — deux vues « Tableau de bord » et « Analyse »

## Où cela se place

Dans `/admin/proprietes`, la bascule actuelle **Table | Carte** devient **Table | Carte | Tableau de bord | Analyse** (même barre, même style, `?vue=kpi` / `?vue=analyse` dans l'URL pour être partageable).

Les deux nouvelles vues respectent **l'ensemble des filtres déjà sélectionnés** (recherche, statut, région, département, entreprise, GPS, période, sondes) : la même fonction de filtrage que la table et la carte est réutilisée, et un bandeau rappelle « n jardins retenus, dont m ayant répondu au parcours d'accueil ».

## Source des chiffres

Les réponses du parcours d'accueil sont déjà stockées jardin par jardin (`proprietes.onboarding_preferences`). Vérifié en base : 10 jardins, 6 avec des réponses, au format `answers` + `garden_example`. Aucune migration, aucune écriture : les deux vues sont en lecture seule.

Les libellés affichés (options, vignettes) proviennent du parcours livré dans l'application et de la galerie des jardins-exemples, jamais de codes bruts. Une réponse dont le code n'existe plus est affichée telle quelle et signalée « ancienne réponse ».

## Vue « Tableau de bord »

Une carte par question, dans l'ordre du parcours, mobile d'abord (une colonne sous `sm`, deux au-delà). Chaque carte indique le nombre de jardins ayant répondu et le taux de réponse.

Questions à barres classées (nombre + %, décroissant, seules les valeurs choisies au moins une fois) :

- Qui êtes-vous ? (particulier / entreprise / collectivité)
- Où jardinez-vous ? (balcon-terrasse / terrain nu / jardin en place)
- Quelle est votre priorité ?
- Confirmez les espaces que vous souhaitez (choix multiple : % calculé sur les répondants)
- Où en êtes-vous ?
- Pouvez-vous arroser ?
- Combien de soleil ?
- Qu'est-ce qui vous freine ? (choix multiple)
- Que souhaitez-vous investir ?
- Quel premier objectif ?

Questions en vignettes classées (image, titre, nombre + %) :

- Quel jardin vous fait rêver ? — vignettes de la famille de jardin retenue
- Lequel vous ressemble le plus ? — jardins-exemples choisis, plus une ligne « aucun ne me ressemble » quand le cas s'est produit

Questions chiffrées, en histogramme de répartition :

- Quelle place avez-vous ? — surfaces en m², tranches lisibles (moins de 50, 50-200, 200-500, 500-1 000, 1 000-5 000, plus de 5 000), avec médiane
- Combien de temps par semaine ? — tranches en heures (moins d'1 h, 1-2, 3-5, 6-10, plus de 10), avec médiane

Chaque barre et chaque vignette est cliquable : elle ouvre la liste des jardins concernés (nom, ville, lien vers la fiche).

Un bouton « Exporter » télécharge le tableau de bord filtré en CSV.

## Vue « Analyse »

Quatre analyses, calculées à partir des mêmes réponses filtrées, chacune avec un bouton « Rédiger la synthèse » qui appelle l'IA de Jardin pour un texte d'accompagnement (les chiffres restent calculés, l'IA ne fait que commenter).

1. **Les personae vivantes** — regroupement des jardins par affinité (lieu, surface, temps disponible, priorité, expérience, contraintes). Chaque persona reçoit un nom évocateur, une carte-portrait (part du parc, surface et temps médians, trois freins dominants, jardin-rêve dominant, vignette représentative) et la liste des jardins qui la composent. Une « constellation » place les jardins sur deux axes — temps disponible et ambition — pour voir d'un coup d'œil où se concentre la communauté.

2. **Boucles d'emails** — pour chaque persona, une séquence proposée : déclencheur, moment d'envoi, objet, angle du message, geste concret attendu, relié au premier objectif à six mois et aux contraintes déclarées. Vue en calendrier de saison (ce qu'on envoie en mars, en juin…) et bouton de copie du plan.

3. **Notifications dans l'application** — matrice « moment de vie du jardin × persona » : quel signal envoyer, avec quelle fréquence maximale, et quelle valeur perçue (utile, inspirant, rassurant). Chaque ligne indique la donnée déjà disponible qui déclenche le signal (météo, sonde, saison, tour de jardin, observation) et signale les personae exposées à la sur-sollicitation.

4. **Écarts entre rêve et moyens (indice de réussite)** — score par jardin croisant l'ambition déclarée (jardin rêvé, espaces souhaités, objectif) avec les moyens réels (temps, budget, arrosage, exposition, expérience). Le tableau classe les jardins en « accompagnement prioritaire », « à conforter », « autonomes », donne le levier le plus efficace pour chacun, et une jauge globale résume la santé du parc. C'est la vue qui dit où mettre l'effort pour que le projet réussisse.

Chaque analyse affiche en clair sa règle de calcul (repliable) : aucune boîte noire.

## Détails techniques

- `src/pages/AdminProprietes.tsx` : ajout des valeurs `kpi` et `analyse` à `vue`, deux requêtes React Query réutilisant `applyFilters` sur `id, nom, ville, departement, created_at, onboarding_preferences` (limite 1 000, comme la carte).
- Nouveaux fichiers sous `src/components/admin/proprietes/dashboard/` : `OnboardingDashboard.tsx`, `QuestionBarCard.tsx`, `QuestionVignetteCard.tsx`, `NumericDistributionCard.tsx`, `RespondentsDrawer.tsx` ; sous `analyse/` : `AnalyseView.tsx`, `PersonaeAnalysis.tsx`, `EmailLoopsAnalysis.tsx`, `NotificationsAnalysis.tsx`, `ReadinessAnalysis.tsx`.
- Agrégation pure et testable dans `src/lib/onboardingStats.ts` (comptage, tri décroissant, %, tranches, médianes) et `src/lib/onboardingSegments.ts` (personae, indice de réussite).
- Libellés : `DEFAULT_SEQUENCE` (`src/config/onboarding/defaultSequence.ts`) + `useOnboardingGallery` pour les vignettes.
- Synthèse IA : nouvelle fonction edge `admin-onboarding-analyse` (vérification admin, agrégats envoyés déjà anonymisés, Lovable AI Gateway, gestion explicite des refus 402/403/429).
- Graphiques avec `recharts`, déjà utilisé dans le projet. Aucune migration.
