## Pourquoi tu ne vois pas le lien

1. **Sur `/m/:slug`** — le bouton existe bien (PublicEventPage ligne 235-241), MAIS il est masqué quand la marche a une **scénographie custom** activée : le composant fait un `return` précoce ligne 107 qui affiche uniquement le `ScenographyRuntime` sans la top-bar. Donc sur les marches scénographiées, le lien n'apparaît jamais.
2. **Sur ton espace marcheur** (`/marches-du-vivant/mon-espace/exploration/:id`) — le bouton n'a jamais été ajouté ; tu es actuellement sur cette page, d'où ton « je ne vois pas ».

## Ce que je vais faire

### 1. Page publique `/m/:slug` — rendre le bouton visible aussi en mode scénographie
Ajouter un petit bouton flottant glassmorphism en haut à droite du `ScenographyRuntime` (overlay z-index 50), avec le même style que les contrôles existants : icône `BookOpen` + « Apprendre cette marche » → `/apprendre/${slug}`. Visible sur toutes les marches publiques sans casser la scénographie immersive.

### 2. Espace marcheur — ajouter le bouton dans le header sticky
Dans `ExplorationMarcheurPage.tsx` (header lignes 394-431) :
- Étendre la requête `marcheEvent` pour récupérer `is_public, public_slug`
- Ajouter à droite du `HeaderSearchTrigger` un petit bouton compact (icône `GraduationCap` + label court « Apprendre » sur mobile, « Apprendre cette marche » dès `sm:`) → `/apprendre/${marcheEvent.public_slug}`
- N'afficher le bouton **que si** `marcheEvent.is_public && marcheEvent.public_slug` (sinon la page `/apprendre/:slug` n'a pas de données à servir, puisqu'elle dépend de `usePublicEvent`)
- Tooltip discret « Outil pédagogique public » pour expliquer le contexte

### Détails techniques

```
PublicEventPage.tsx (mode scénographie)
  └── nouveau composant inline <ApprendreFloatingLink slug={slug} />
       position: fixed top-4 right-4 z-50
       backdrop-blur-xl bg-card/60 border border-primary/30

ExplorationMarcheurPage.tsx
  └── select étendu: 'id, title, date_marche, lieu, event_type, is_public, public_slug'
  └── header: bouton Link conditionnel à droite du HeaderSearchTrigger
```

Aucune modif sur `ApprendreMarchePage` ni sur les routes.

### Hors scope
- Pas de modif des autres pages publiques (ex: `/lecteurs/...`)
- Pas de tracking analytics dédié (le `logPublicEventCtaClick` est déjà déclenché côté `/apprendre/:slug`)
