

# Rendre le MarchesTab lisible en mode clair

## Probleme

Le composant `MarchesTab` utilise exclusivement des couleurs hardcodees pour le dark mode : `text-white`, `bg-white/5`, `text-emerald-200/50`, `text-emerald-100/60`, etc. En mode clair, le texte blanc sur fond creme est invisible.

## Approche

Remplacer chaque couleur hardcodee par des classes theme-aware (`dark:` prefix) tout en preservant exactement le rendu actuel en mode sombre.

## Fichier : `src/components/community/tabs/MarchesTab.tsx`

| Element | Actuel (illisible en clair) | Corrige |
|---------|---------------------------|---------|
| Titre evenement | `text-white` | `text-foreground` |
| Countdown badge registered | `bg-amber-500/20 text-amber-300` | `bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300` |
| Countdown badge default | `bg-emerald-500/20 text-emerald-300` | `bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300` |
| Description | `text-emerald-100/60` | `text-muted-foreground` |
| Date | `text-emerald-300/70` | `text-emerald-700 dark:text-emerald-300/70` |
| Lieu | `text-emerald-200/40` | `text-muted-foreground` |
| Exploration name | `text-sky-300/60` | `text-sky-600 dark:text-sky-300/60` |
| Pillar badges | `bg-white/5` | `bg-emerald-50 dark:bg-white/5` |
| Pillar colors | `text-emerald-400` / `text-sky-400` / `text-amber-400` | `text-emerald-600 dark:text-emerald-400` / `text-sky-600 dark:text-sky-400` / `text-amber-600 dark:text-amber-400` |
| Card bg registered | `bg-emerald-500/10 border-amber-400/30` | `bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-amber-400/30` |
| Card bg default | `bg-white/5 border-white/10` | `bg-card border-border dark:bg-white/5 dark:border-white/10` |
| Inscrit badge | `text-emerald-400 bg-emerald-500/10` | `text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10` |
| Button inscrire | `bg-emerald-600/80 text-white` | Garder tel quel (lisible dans les deux modes) |
| Section titles | `text-white` | `text-foreground` |
| Section subtitles | `text-emerald-200/50` | `text-muted-foreground` |
| Empty state | `bg-white/5 border-white/10` | `bg-card border-border dark:bg-white/5 dark:border-white/10` |
| Empty text | `text-emerald-200/60` | `text-muted-foreground` |
| Bravo message | `text-white/90` | `text-foreground` |
| QR row | `bg-white/5 border-white/10` | `bg-card border-border dark:bg-white/5 dark:border-white/10` |
| QR text | `text-white/80` | `text-foreground` |

## Principe

Chaque element obtient une couleur lisible en clair (tons fonces sur fond creme) + un `dark:` override qui preserve exactement le rendu actuel. Le mode sombre reste strictement identique.

