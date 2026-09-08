# Plan : bouton d’aide sur chaque alerte API & MCP

## Objectif
Sur la page admin **API & MCP**, ajouter à chaque ligne d’alerte un bouton d’information qui ouvre une popup explicative. L’administrateur doit pouvoir statuer avant de cliquer sur « Relancer la collecte ». La popup précise concrètement :

1. **Ce qui est critique** — pourquoi l’alerte s’affiche et quel risque métier elle représente.
2. **Ce que va exécuter la relance** — quelle fonction est appelée, quelles données sont traitées, et quel résultat attendre.

## État actuel
- `src/pages/AdminApiMcp.tsx` affiche les alertes dans une liste avec le nom de l’API, la fraîcheur et le bouton `ApiRemediateButton`.
- `ApiRemediateButton.tsx` ne contient qu’un libellé statique « Pas de relance automatique » quand l’API n’est pas relançable.
- `ApiStoryDrawer.tsx` possède déjà une section admin avec le même bouton de relance, mais sans explication détaillée.

## Travail prévu

### 1. Nouveau composant `ApiRemediateInfo.tsx`
Créer un composant réutilisable dans `src/components/api-mcp/` qui affiche :
- un bouton icône `Info` à côté du bouton de relance ;
- une `Popover` (desktop) / `Dialog` (mobile) ou un `Sheet` déclenché au clic, selon le viewport, pour rester lisible en mobile-first.

Le contenu de la popup est structuré en deux blocs :
- **Bloc « Ce qui est critique »** : texte spécifique au `slug` de l’API.
- **Bloc « Ce que va exécuter la relance »** : texte spécifique au `slug`, décrivant la fonction edge appelée et son comportement.

Les textes seront stockés dans un mapping statique côté front, par exemple :

```text
inaturalist / gbif
- Critique : les données de biodiversité ne sont plus fraîches ; les cartes, synthèses et fiches espèces risquent de manquer des observations récentes.
- Exécution : appel de la fonction edge `batch-data-collector` en mode `manual` pour relancer la collecte des snapshots sur les marches configurées.

lovable-ai
- Critique : la base de connaissances des étiquettes écologiques n’a pas été actualisée ; les espèces récemment observées peuvent apparaître sans leurs fonctions écologiques.
- Exécution : appel de la fonction edge `classify-species-eco-tags` sur un lot d’espèces observées mais pas encore présentes dans `species_eco_tags_kb`.
```

### 2. Intégration dans `AdminApiMcp.tsx`
Dans la liste des alertes, ajouter `ApiRemediateInfo` à côté de `ApiRemediateButton` sur chaque ligne. L’info reste visible même quand l’API n’a pas de relance automatique, avec un texte adapté indiquant qu’aucune action automatique n’est disponible.

### 3. Intégration dans `ApiStoryDrawer.tsx`
Ajouter le même composant `ApiRemediateInfo` dans la section admin du tiroir, juste avant le bouton de relance, pour garder une expérience cohérente entre la liste et la fiche détaillée.

### 4. Ajustements visuels mineurs
- Garder le style existant (vert émeraude, bordures subtiles, typographie sobre).
- S’assurer que la popup s’affiche bien sur petit écran (largeur max, scroll interne si le texte est long).
- Ajouter un `aria-label` explicite sur le bouton info.

## Fichiers modifiés ou créés
- `src/components/api-mcp/ApiRemediateInfo.tsx` — création.
- `src/pages/AdminApiMcp.tsx` — insertion du composant info sur chaque ligne d’alerte.
- `src/components/api-mcp/ApiStoryDrawer.tsx` — insertion du composant info dans la section admin.

## Non inclus
- Aucun changement de backend, de fonction edge, de seuil d’alerte ou de logique de relance.
- Pas de modification des permissions ou de la table `api_mcp_incidents`.

## Validation prévue
- Vérification TypeScript (`npx tsgo --noEmit -p tsconfig.app.json`).
- Capture desktop et mobile de la page admin pour s’assurer que la popup reste lisible et que le bouton de relance reste bien visible.
