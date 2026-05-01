# Correction des deux problèmes — onglet Carte de l'exploration

## Diagnostic

### A/ Icône appareil photo sans info-bulle
Dans `src/components/community/exploration/PhotoGpsDropTool.tsx` (ligne 44), le bouton `PhotoGpsButton` ne s'appuie que sur l'attribut HTML `title="Déposer une photo pour voir sa position GPS"`. Cet attribut **ne s'affiche jamais sur mobile** (le viewport actuel fait 390 px) et reste très peu découvrable sur desktop. Il faut un vrai composant de tooltip + une mini-étiquette persistante au premier affichage pour que l'usage du bouton soit explicite.

### B/ Bouton « Créer une marche » invisible
Dans `src/components/community/exploration/ExplorationCarteTab.tsx` (ligne 1033), la condition d'affichage est :
```ts
const userCanCreate = canCreateMarche(userLevel); // true seulement si 'ambassadeur' | 'sentinelle'
{userCanCreate && explorationId && !isCreatingMarche && ( … )}
```
Et `userLevel` provient de `community_profiles.role` (`ExplorationMarcheurPage.tsx` ligne 95), avec un fallback à `'marcheur'`.

Deux causes probables, cumulables :
1. **L'utilisateur courant n'a pas le rôle Ambassadeur/Sentinelle** dans `community_profiles` (il est admin, ou son rôle n'a pas été promu) → le bouton n'est tout simplement pas rendu. Or vous testez depuis l'admin et avez besoin de voir/utiliser cette fonctionnalité.
2. **Encombrement à droite** : les 3 boutons existants se positionnent à `right-[10.5rem]` (créer), `right-[7.5rem]` (photo GPS) et `right-[4.5rem]` (géoloc). Sur un viewport de 390 px, le bouton « créer » se retrouve à environ x = 222 px → théoriquement visible, mais l'enchaînement des 3 pastilles côte à côte est fragile et peut être masqué par le panneau de stats du bas qui chevauche partiellement la zone tactile.

La RLS serveur, déjà en place via `can_create_marche()`, **autorise déjà** les admins à insérer une marche. Il manque juste la cohérence côté UI.

## Plan de correction

### 1. Corriger A — vraie info-bulle sur l'icône photo GPS

Fichier : `src/components/community/exploration/PhotoGpsDropTool.tsx`

- Remplacer le simple `<button title="…">` par le composant `Tooltip` de shadcn (`@/components/ui/tooltip`), avec `TooltipProvider`, `TooltipTrigger asChild`, `TooltipContent` côté gauche pour rester visible.
- Sur mobile (où le hover n'existe pas), ajouter une **étiquette « Photo GPS » qui apparaît 4 secondes au premier affichage** puis se replie, en utilisant `framer-motion` et un flag `localStorage` (`photo-gps-hint-seen`) pour ne la montrer qu'une seule fois par utilisateur.
- Ajouter `aria-label` explicite (« Localiser une photo via ses données GPS ») et conserver le `title` HTML comme fallback.
- Conserver le visuel actuel (icône `Camera` + petit point `MapPin` rose).

### 2. Corriger B — visibilité et placement du bouton « Créer une marche »

Fichier : `src/components/community/exploration/createMarcheUtils.ts`

- Élargir `canCreateMarche` pour accepter aussi le rôle **administrateur**. Comme la table de rôles admin est séparée de `community_profiles`, exposer une nouvelle signature :
  ```ts
  canCreateMarche(role: string | null, isAdmin?: boolean): boolean
  ```
  Renvoie `true` si `isAdmin === true` ou si `role ∈ {ambassadeur, sentinelle}`.

Fichier : `src/components/community/ExplorationMarcheurPage.tsx`

- Récupérer le statut admin via le hook existant `useIsAdmin()` (ou `check_is_admin_user` RPC selon ce qui est déjà câblé dans le projet).
- Passer une nouvelle prop `isAdmin` au composant `ExplorationCarteTab`.

Fichier : `src/components/community/exploration/ExplorationCarteTab.tsx`

- Ajouter la prop `isAdmin?: boolean` à l'interface `ExplorationCarteTabProps`.
- Calculer `const userCanCreate = canCreateMarche(userLevel, isAdmin);`.
- **Repositionner le bouton « Créer une marche »** pour le rendre incontournable : sortir de la rangée droite encombrée et le placer en **bouton flottant rond (FAB) en bas-centre/droite**, au-dessus du panneau de stats, avec :
  - Pastille amber pulsante existante conservée
  - Libellé textuel « Créer » visible à côté de l'icône `Plus` (rendu sur ≥ 360 px)
  - Tooltip identique au point 1 pour la cohérence UX
  - Sur mobile, première apparition accompagnée d'un mini-onboarding (« Vous pouvez ajouter une marche ici »).
- Conserver Photo GPS et Géolocalisation dans la rangée droite actuelle (inchangés), et conserver toute la logique `handleStartCreate` / `DraggableCreateMarker` / `CreateMarcheDrawer`.

### 3. Vérification

- Recharger `/marches-du-vivant/mon-espace/exploration/70fcd8d1-...` :
  - L'icône appareil photo affiche un tooltip au survol et une étiquette éphémère au premier affichage mobile.
  - Le bouton « Créer une marche » est visible (en tant qu'admin / Ambassadeur / Sentinelle), avec libellé et tooltip, et ouvre toujours le mode création + drawer existant.

## Détails techniques

- Aucune migration SQL nécessaire : la RLS `can_create_marche()` couvre déjà admin + ambassadeur + sentinelle.
- Pas de changement d'API entre composants au-delà de la prop `isAdmin` ajoutée.
- Pas d'impact sur les URLs publiques ni sur les autres onglets.
- Respect de la sobriété informationnelle : les hints éphémères ne s'affichent qu'une seule fois par appareil.
