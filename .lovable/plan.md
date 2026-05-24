## Objectif

Ajouter à la barre de filtres de `SpeciesExplorer` (vue Carnet / Liste des espèces) un **5ᵉ filtre dropdown « Niveaux trophiques »**, multi-sélection, avec compteurs dynamiques recalculés selon les autres filtres actifs et badges colorés par niveau.

## Périmètre

Un seul fichier modifié : `src/components/biodiversity/SpeciesExplorer.tsx`.
Aucun changement de logique métier, pas de DB, pas d'edge function — pur frontend, exploite la classification déjà en place dans `src/lib/trophicClassification.ts` (KB + heuristiques famille + iconic_taxon).

## UX / UI

### Emplacement
- Le `grid` actuel passe de **4 → 5 colonnes** sur desktop (`lg:grid-cols-5`), reste `grid-cols-2` mobile (le filtre trophique se place sur sa propre ligne pleine largeur en `col-span-2` mobile → meilleur tap target).

### Comportement
- **Multi-sélection** : `Set<TrophicGroup>` dans le state. Click toggle.
- **Compteurs dynamiques** : calculés à partir des espèces ayant déjà passé tous les *autres* filtres (recherche, source, audio, contributeur, tags, catégorie faune/flore). Le label trigger affiche le total filtré sélectionné (ex : « 2 niveaux · 42 espèces »).
- **Pas de sélection = pas de filtrage** (équivalent « tous niveaux »).

### Visuel (Badges code couleur)
- Chaque niveau possède déjà un token `--trophic-l1`…`--trophic-l5` + `--trophic-decomposer` dans `index.css`.
- Trigger du Select : icône pyramide + label compact « Niveaux (n) ».
- Contenu : 6 lignes, chacune avec
  - une **pastille colorée** (8px) du token du niveau,
  - le code court (L1…L5 / ⟲),
  - le libellé complet (Producteurs primaires…),
  - le compteur dynamique entre parenthèses,
  - une checkbox visuelle à droite (✓ si sélectionné).
- Ligne « Tout effacer » en bas si au moins un niveau actif.
- État sélectionné : fond `bg-{token}/10`, bord `border-{token}/30`.

### Mobile-first
- Le composant `Select` shadcn s'ouvre déjà en bottom-sheet adapté.
- Lignes ≥ 44px de hauteur, padding généreux, pastilles bien visibles.
- Le trigger garde un wording court (« Niveaux ») pour ne pas casser la grille à 2 colonnes.

## Logique de filtrage

```text
1. Pré-classifier toutes les espèces (useMemo)
   speciesWithGroup = species.map(s => ({ ...s, _group: classifyTrophic(s).group }))

2. Compteurs trophiques dynamiques
   Sur le pipeline existant filteredSpecies *sans* l'étape trophique :
   counts[group] = filteredBeforeTrophic.filter(s => s._group === group).length

3. Filtre final
   if (selectedTrophic.size > 0)
     filteredSpecies = filteredBeforeTrophic.filter(s => selectedTrophic.has(s._group))
```

`UNCLASSIFIED` n'apparaît pas dans le dropdown mais reste visible quand aucun filtre n'est actif (pas d'exclusion implicite).

## Détails techniques

- **State** : `const [selectedTrophic, setSelectedTrophic] = useState<Set<TrophicGroup>>(new Set())`.
- **Classification** : un seul `useMemo` qui mappe `species` → `{ species, group }[]`. Coût négligeable (≤ quelques centaines d'espèces).
- **Reset** : intégrer `selectedTrophic.clear()` dans le bouton « Réinitialiser » existant s'il y en a un, sinon ajouter un petit chip « × » à côté du trigger quand au moins un niveau est sélectionné.
- **Accessibilité** : chaque ligne `role="option" aria-selected`. Trigger annonce le nombre sélectionné via `aria-label`.
- **Tokens couleur** : utiliser `style={{ background: 'hsl(var(--trophic-l1))' }}` pour les pastilles (les classes Tailwind dynamiques ne fonctionnent pas en JIT pour des tokens custom).

## Hors périmètre

- Pas de modification de `SpeciesGalleryDetailModal` (la classification y est déjà affichée via `useTrophicChain`).
- Pas de persistance du filtre en localStorage (cohérent avec les autres filtres de la barre).
- Pas de filtre trophique sur la Carte ni la Synthèse (uniquement la Liste, comme demandé sur la copie d'écran).
