## Constat

Sur `/propriete/:slug`, le bouton « Explorer votre diagnostic vivant » amène bien au bloc diagnostic, mais la barre d'onglets (Portrait / J'observe / …) n'est pas collée en haut : elle apparaît plus bas dans l'écran (copie 1). Elle ne se colle qu'après avoir continué à défiler (copie 2).

## Cause (vérifiée dans `src/pages/ProprieteEspace.tsx`)

- Le défilement vise l'ancre `#diagnostic` (ligne 103) avec un décalage codé en dur `DIAGNOSTIC_SCROLL_OFFSET = 64` (ligne 123), hérité d'un ancien header fixe qui n'existe plus (le header est `absolute` dans le hero, il défile).
- Entre le haut de `#diagnostic` et la barre d'onglets s'intercalent : le `py-10` du `<main>`, puis le `NudgeMarcheBanner` (ligne 356) et l'espacement `space-y-5`. La barre se retrouve donc à ~100–250 px sous le haut de la fenêtre à l'arrivée, hauteur variable selon que la bannière s'affiche ou non et selon le format.
- La barre est bien `sticky top-0 z-[60]` (ligne 361) : elle ne « colle » qu'une fois que la page a défilé au-delà de sa position naturelle — d'où le comportement observé.

## Correctifs prévus

1. **Cibler la barre elle-même** : donner un identifiant/ref au conteneur sticky des onglets et faire pointer le défilement sur la position naturelle de ce conteneur, au lieu de `#diagnostic`.
2. **Supprimer le décalage de 64 px** obsolète : la cible devient le haut exact de la barre (offset 0, moins `env(safe-area-inset-top)` sur iOS), pour qu'elle se retrouve immédiatement en position collée en haut.
3. **Robustesse asynchrone** : conserver le mécanisme `scrollToDiagnosticPersistent` (rejeu sur quelques centaines de ms + ResizeObserver) mais recalculer la cible à partir de la barre, afin que l'apparition tardive du `NudgeMarcheBanner` ou d'un contenu d'onglet ne décale plus le résultat.
4. **Cohérence des ancres** : ajuster `scroll-mt` du `<main>` pour rester aligné sur la nouvelle logique, et appliquer la même cible au changement d'onglet (`handleTabChange`) et à l'événement `propriete:goto-tab`.

Aucun changement de logique métier : uniquement positionnement/défilement.

## Vérification

Contrôle Playwright sur `/propriete/jardin-monde-deviat` en 390 px (mobile), 834 px (tablette) et 1440 px (desktop) : clic sur « Explorer votre diagnostic vivant », capture immédiate + après stabilisation, pour confirmer que la barre d'onglets est bien plaquée en haut (top = 0) dans les trois formats, avec et sans bannière.

## Fichiers touchés

- `src/pages/ProprieteEspace.tsx` (cible de défilement, offset, ref sur la barre sticky)
