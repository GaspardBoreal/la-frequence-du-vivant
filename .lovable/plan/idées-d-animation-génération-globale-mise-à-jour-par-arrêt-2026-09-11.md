# Idées d'animation : génération globale + mise à jour par arrêt

## Objectif

Aujourd'hui les idées d'animation se génèrent arrêt par arrêt, depuis la fiche d'un point. Il faut un bouton unique qui les produit pour tous les arrêts du parcours, avec une barre de progression rassurante, puis conserver la possibilité de retoucher ou régénérer un arrêt seul quand on y revient.

## Ce qui change pour l'utilisateur

1. **Bouton « Générer toutes les idées d'animation »** dans la barre d'outils du parcours (visible seulement pour un administrateur connecté, comme la création des arrêts).
2. **Indicateur de progression** pendant la génération : « Arrêt 4 / 12 — Le carrelet », barre de remplissage, et compte des idées déjà créées. Le bouton reste bloqué pendant l'opération.
3. **Traitement arrêt par arrêt, sans écraser le travail humain** : un arrêt qui a déjà des idées est ignoré par défaut. Une case « Régénérer aussi les arrêts déjà remplis » permet de tout refaire ; dans ce cas seules les idées de l'Assistant sont remplacées, les idées ajoutées ou modifiées à la main sont conservées.
4. **Résultat lisible en fin de course** : « 9 arrêts complétés, 3 déjà remplis, 0 échec ». Si l'Assistant est indisponible sur certains arrêts, des propositions de secours sont enregistrées et signalées.
5. **Reprise possible** : en cas d'interruption ou d'échec partiel, relancer le bouton ne traite que les arrêts restants.
6. **Mise à jour unitaire inchangée et enrichie** : en rouvrant la fiche d'un arrêt, on retrouve ses idées enregistrées, on peut les modifier, en supprimer, en ajouter à la main, ou régénérer cet arrêt seul. La date de dernière génération est affichée.

## Détails techniques

- Nouveau hook `src/hooks/sauniers/useGenerationIdeesGlobale.ts` :
  - lit les arrêts depuis `useParcoursSauniers` et le nombre d'idées existantes par arrêt en une requête sur `marche_animation_idees` (filtrée sur `marche_event_id = SAUNIERS_EVENT_ID`) ;
  - boucle séquentiellement (une invocation `sauniers-animation-ideas` à la fois pour ne pas saturer la fonction), expose `{ enCours, index, total, nomCourant, resultats, lancer, annuler }` ;
  - réutilise exactement la logique d'un arrêt déjà présente dans `useIdeesArret.generer` (repli `fallbackIdees`, insertion des six lignes, `source: 'assistant'`), factorisée dans une fonction partagée `genererIdeesPourArret(waypoint, contexte, remplacer)` pour éviter deux implémentations divergentes ;
  - invalide la clé `['sauniers-idees', waypointId]` de chaque arrêt traité pour que les fiches déjà ouvertes se rafraîchissent.
- `ParcoursPlanner.tsx` : ajout du bouton, de la case « régénérer », de la barre de progression (même style que la progression d'amorçage existante) et du récapitulatif final ; un drapeau global empêche la génération unitaire pendant la génération globale.
- `PointWidget.tsx` : pastille indiquant le nombre d'idées enregistrées et l'horodatage de la dernière génération ; bouton de régénération de l'arrêt seul conservé.
- Aucune migration : la table `marche_animation_idees` et ses règles d'accès suffisent. La suppression d'un arrêt continue de supprimer ses idées en cascade.
- Vérifications : contrôle TypeScript, puis passage Playwright sur `/sauniers` pour confirmer l'absence d'erreur console et l'affichage de la progression.
