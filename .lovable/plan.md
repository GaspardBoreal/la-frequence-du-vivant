## Objectif

Appliquer aux widgets 4 (Refus assumés) et 5 (Mise en œuvre) de l'onglet Palette végétale le même rituel que les emplacements : repliés par défaut, avec un bandeau qui raconte l'essentiel d'un coup d'œil.

## 1. Rendre `AnalyzeCard` pliable (opt-in)

`src/components/propriete/analyze/AnalyzeCard.tsx` — ajouter des props optionnelles, sans rien changer pour les ~10 autres blocs qui l'utilisent :
- `collapsible?: boolean`, `open?: boolean`, `onToggleOpen?: () => void`, `signature?: React.ReactNode`
- Si `collapsible` : l'en-tête devient cliquable (bouton, `aria-expanded` / `aria-controls`), chevron animé à droite, `signature` affichée sous le sous-titre quand la carte est repliée.
- Corps (`hero` + `children`) enveloppé dans `AnimatePresence` + `motion.div` (height auto ↔ 0, 0,3 s ease-in-out).
- Comportement par défaut inchangé : sans `collapsible`, la carte reste toujours ouverte.

## 2. Bandeau « Refus assumés » (widget 4)

Indicateurs dérivés des `exclusions` + `excludedPresence` déjà calculés :
- Compteur : « N refus assumés »
- Alerte vivante si `onSiteCount > 0` : pastille ambre « ⚠ N déjà présent(s) sur site — à gérer », avec le nom de la première espèce concernée.
- Micro-vignettes : jusqu'à 3 photos rondes (`pres.firstPhoto`) des refus présents, empilées.
- Chips discrètes des noms français refusés (max 3, puis « +N »), teinte bordeaux existante `#8c3a2e`.
- Si aucun refus présent sur site : phrase inspirante « Aucun refus présent : le site part net. »

## 3. Bandeau « Mise en œuvre » (widget 5)

Indicateurs dérivés de `implementation` :
- Compteur : « N étapes »
- Fenêtre calendaire : période de la première → période de la dernière étape (ex. « Août–septembre → À la plantation »).
- Frise miniature : N petits segments dorés alignés (un par étape), avec tooltip = titre de l'étape.
- Chips des titres d'étapes (max 2, puis « +N »).

## 4. État de pli dans `TabPalette`

`src/components/propriete/tabs/TabPalette.tsx` :
- Deux états `openExcluded` / `openImplementation`, **repliés par défaut**.
- Persistance dans `localStorage` sous `palette-blocks-open:{proprieteId}` (même logique que les emplacements déjà en place).
- Sécurités d'ouverture automatique : ouvrir « Refus » si l'utilisateur clique « Situer » (carte d'espèce exclue) ou si une ancre `#palette-block-excluded` / `#palette-block-implementation` est visée par un scroll interne.
- Étendre le bouton existant « Tout déplier / Tout replier » pour piloter aussi ces deux blocs (un seul geste pour toute la partition).

## Notes techniques

- Aucune modification de données, de requête ou de moteur de palette : tout est dérivé de l'état déjà en mémoire.
- L'impression et la synthèse (`PaletteSummary`, `CombinedPrintLayout`) n'utilisent pas ces cartes en mode pliable — sortie PDF inchangée.
- Couleurs uniquement via les tokens `--ds-*` existants et les teintes bordeaux/ambre déjà utilisées dans ces blocs.
