# Changer « Le jardin qui vous ressemble »

Aujourd'hui la carte de l'onglet **Mon projet › Portrait › Intention** n'affiche que le choix figé par le parcours d'accueil : aucun moyen de le corriger, alors qu'il nourrit l'IA de jardin. On ajoute une galerie de choix réservée aux personnes qui peuvent déjà éditer l'intention (propriétaire, marcheur principal, admin).

## Ce que verra l'utilisateur

- Sur la carte « Le jardin qui vous ressemble » : un bouton **Changer** (et, quand rien n'est retenu ou que le choix a été refusé, **Choisir un jardin-exemple**).
- Une galerie plein écran (Sheet en bas sur mobile, Dialog sur desktop) :
  - bandeau de **filtres par type de jardin** (puces horizontales défilantes, « Tous » par défaut) ;
  - **grille visuelle** d'exemples publiés (vignette, titre, sous-titre, mots-clés), 1 colonne sur mobile / 2-3 au-delà ;
  - sélection au clic avec coche dorée sur la vignette retenue, aperçu de l'intention associée ;
  - actions : **Valider ce jardin**, **Aucun ne me ressemble** (enregistre un refus explicite), Annuler.
- Après validation : la carte se recompose immédiatement avec la nouvelle image, ses mots-clés et son profil IA, et affiche « Modifié le … ».
- Sans droit d'édition : aucune de ces actions n'apparaît, l'affichage reste tel quel.

## Effet sur les recommandations

Le choix est stocké dans les préférences d'accueil du jardin, à la même place que celui d'origine : l'IA de jardin (contexte « Intention du jardinier ») reprend donc aussitôt le nouveau jardin-exemple. On enrichit ce contexte, aujourd'hui limité aux priorités, avec le jardin-exemple retenu (titre, intention, mots-clés, profil IA) pour que les conseils s'y adossent explicitement. Les caches de la fiche jardin et de l'intention sont invalidés à l'enregistrement.

## Détails techniques

- **Lecture galerie** : `useOnboardingGallery` (`onboarding_garden_types` / `onboarding_garden_examples`) — les politiques existantes autorisent déjà la lecture publique des types `visible` et des exemples `publie`. Aucune migration.
- **Écriture** : nouvelle mutation `useSaveGardenExample` dans `src/hooks/propriete/usePropertyIntention.ts`, appelant la RPC existante `save_propriete_onboarding(_propriete_id, _patch)` avec `{ garden_example: {...}, updated_at }` (fusion `||` au niveau racine, donc `answers`, `gestures`, `portrait`, `persona` sont préservés). Autorisation déjà portée par `can_edit_propriete_onboarding`.
- **Forme stockée** : même contrat que l'OFJ — `id`, `stableId`, `titre`, `sousTitre`, `intention`, `keywords`, `aiProfile`, `vignette`, `chosenAt`, plus `source: 'lfdv_portrait'` pour tracer une modification côté LFDV ; refus = `{ refused: true, chosenAt }`.
- **Nouveaux fichiers** : `src/components/propriete/portrait/GardenExamplePicker.tsx` (galerie filtrable, mobile-first).
- **Fichiers modifiés** : `GardenExampleCard.tsx` (bouton Changer + état vide actionnable, props `canEdit`/`proprieteId`), `PortraitIntention.tsx` (passe `canEdit`, affiche la carte même hors parcours d'accueil), `useProprieteChatProviders.ts` (jardin-exemple dans le payload `site.intention`).
