## Contexte

Le système Tags-Marcheurs est par espèce (scientific_name + marche_id facultatif). Après inspection des trois vues :

- **`OeilCuration.tsx`** — affiche des cartes espèces (`CuratedSpeciesCard` via `SpeciesGrid`). Cible **directement compatible** avec les pastilles + barre de filtre.
- **`MainCuration.tsx`** — pratiques emblématiques (titre + texte riche + médias + marcheurs liés). **Pas d'espèce** → le système actuel ne s'applique pas.
- **`OreilleCuration.tsx`** — playlist audio (récits, ambiances, chants). **Pas d'espèce** → idem.

Donc l'intégration concrète ne porte que sur **L'Œil**. Pour Main/Oreille, je documente ce qui serait nécessaire si tu veux étendre le système.

## 1. OeilCuration — intégration des Tags-Marcheurs

### Pastilles sur chaque carte espèce
Dans `SpeciesGrid` (lignes 696-737 de `OeilCuration.tsx`), wrapper chaque `CuratedSpeciesCard` avec `MarcheurSpeciesTagDots` :

```tsx
<MarcheurSpeciesTagDots
  scientificName={species.scientificName}
  marcheId={null}  // exploration multi-marches → tags globaux uniquement
  tags={tagsByScientific.get(species.scientificName?.toLowerCase()) ?? []}
>
  <CuratedSpeciesCard ... />
</MarcheurSpeciesTagDots>
```

Note importante sur le scope : une exploration agrège plusieurs marches. Comme une espèce peut venir de marches différentes, on n'a pas un `marche_id` unique pertinent ici. Deux options :

- **A (recommandé, simple)** : forcer `marche_id = null` → seuls les tags **globaux par espèce** sont utilisables/visibles. Comportement clair et prévisible pour l'utilisateur.
- **B (plus puissant)** : pour chaque espèce, déterminer la liste des `marche_id` concernés (depuis le pool/curations) et passer un tableau au popover, qui propose alors le scope par marche correspondant. Plus complexe côté UI, à garder pour plus tard si besoin.

→ J'implémente l'option **A** par défaut.

### Barre de filtre `MarcheurTagsFilterBar`
Insérer la barre **sous les chips de catégories** (après ligne 507), visible uniquement si l'utilisateur a au moins un tag sur les espèces du pool. Logique d'application :

- Récupérer en batch les tags pour toutes les espèces du `pool` via `useMarcheurSpeciesTags({ scientificNames: pool.map(s => s.scientificName) })` (déjà en place, à hooker une seule fois en haut du composant).
- Construire `tagsByScientific: Map<sciNameLower, Tag[]>`.
- Étendre `applyCategoryFilter` (ou créer `applyTagFilter`) pour filtrer ensuite par tags selon le mode ET/OU/SAUF.
- Étendre `categoryCounts` pour rester cohérent avec la liste filtrée.
- Inclure les filtres tags dans le snapshot `chatPageContext`/`useChatTabSnapshot` pour que l'IA voie l'écran filtré (cf. mémoire `chatbot-screen-awareness-architecture`).

### Onglets concernés
Le filtrage et les pastilles s'appliquent à **Sélection finale**, **Suggestions IA**, **À réviser**, **Pool/Observées**. Pas de tags sur l'onglet **Terrain** (espèces manuelles sans `scientific_name` garanti — vérifier ; si présent, on l'inclut aussi).

## 2. MainCuration & OreilleCuration — non applicable en l'état

Les "pratiques" (Main) et les pistes audio (Oreille) ne sont pas indexées par espèce. Le système Tags-Marcheurs actuel (`marcheur_species_tags.scientific_name NOT NULL`) ne peut donc pas s'y greffer tel quel.

Si tu veux des tags privés sur ces objets, il faudra une décision produit avant tout code :

- Étendre la table en `marcheur_curation_tags(curation_id, label, color_hash, ...)` — tags privés par curation `main`/`oreille`.
- Ou créer une seconde table générique `marcheur_object_tags(object_type, object_id, ...)`.
- Ou simplement réutiliser le champ `category`/`secondary_categories` existant côté curation (mais ce n'est pas privé).

Je ne touche **pas** à Main/Oreille dans ce lot. Je remonte la question avant d'aller plus loin.

## Détails techniques

- **Fichier édité** : `src/components/community/insights/curation/OeilCuration.tsx`
- Hook utilisé : `useMarcheurSpeciesTags` (déjà créé) — appel batch en haut du composant avec `pool.map(s => s.scientificName).filter(Boolean)`.
- Composants utilisés : `MarcheurSpeciesTagDots`, `MarcheurTagsFilterBar` (déjà créés).
- État local nouveau : `tagFilter: { mode: 'AND'|'OR'|'NOT', tagIds: string[] }`.
- Snapshot chat : ajouter `oeilTagFilter` aux `filters` publiés.
- Pas de migration BDD, pas de changement de RPC.

## Questions ouvertes

1. Pour Main/Oreille, veux-tu que je propose une migration séparée (table `marcheur_curation_tags`) après cette intégration ?
2. Pour L'Œil : option A (tags globaux uniquement) confirmée, ou tu préfères qu'on attaque l'option B (scope par marche) maintenant ?
