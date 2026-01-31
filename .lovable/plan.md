
# Plan de Correction Express — Crash PDF "layout overflow"

## Objectif
Éliminer toutes les sources de dépassement restantes dans les Index et la Table des Matières, garantissant un export PDF stable quel que soit le volume de contenu.

---

## Corrections Immédiates (3 fichiers, 6 modifications)

### 1. Limiter les listes de pages avec "..."

**Fichier** : `src/utils/pdfPageComponents.tsx`

Créer une fonction utilitaire pour formater les listes de pages :

```typescript
const MAX_PAGES_DISPLAY = 5;

const formatPageList = (pages: number[]): string => {
  if (pages.length <= MAX_PAGES_DISPLAY) {
    return pages.join(', ');
  }
  // Affiche les 4 premiers et "..."
  return `${pages.slice(0, 4).join(', ')}…`;
};
```

Appliquer cette fonction aux 4 endroits où `pages.join(', ')` est utilisé :
- Ligne 707 : `indexLieuxPages`
- Ligne 716 : `indexLieuxPages` (restTypes)
- Ligne 861 : `indexKeywordPages`
- Ligne 871 : `indexKeywordPages` (restKeywords)

### 2. Retirer `wrap={false}` des blocs potentiellement dangereux

**Fichier** : `src/utils/pdfPageComponents.tsx`

| Composant | Ligne | Action |
|-----------|-------|--------|
| `TocPage` | 364 | Retirer `wrap={false}` de `tocEntry` |
| `HaikuBlock` | 459 | Retirer `wrap={false}` du bloc haiku |
| `IndexLieuxPage` | 699 | Retirer `wrap={false}` du bloc marche+first |
| `IndexGenresPage` | 792 | Retirer `wrap={false}` du bloc header+first |
| `IndexKeywordsPage` | 852 | Retirer `wrap={false}` du bloc category+first |

### 3. Ajouter `flexShrink: 1` aux éléments de texte des index

**Fichier** : `src/utils/pdfStyleGenerator.ts`

Ajouter `flexShrink: 1` et `maxWidth` aux styles manquants :
- `tocMarche` : ajouter `flexShrink: 1`
- `tocPartie` : ajouter `flexShrink: 1`
- `indexLieuxPages` : ajouter `flexShrink: 1`
- `indexKeywordPages` : ajouter `flexShrink: 1`

### 4. Tronquer les titres trop longs dans les Index

**Fichier** : `src/utils/pdfPageComponents.tsx`

Appliquer `truncateName` (déjà existant ligne 835) aux titres d'œuvres dans l'Index des Genres :

```typescript
// Dans renderEntry (ligne 779)
<Text style={styles.indexGenreTitle as Style}>
  {truncateName(texte.titre, 60)}
</Text>
```

---

## Section Technique

### Pourquoi retirer `wrap={false}` est sûr

1. **TOC** : Les entrées sont déjà courtes (titre + numéro de page). Même sans `wrap={false}`, elles ne seront jamais coupées car elles font < 30pt de haut.

2. **Haiku** : Les haïkus ont max 3-5 lignes courtes. Sans `wrap={false}`, le pire cas est qu'un haïku à cheval sur deux pages — acceptable.

3. **Index** : Chaque entrée individuelle (marche, genre, keyword) est petite. Le risque de coupure au milieu d'une entrée est minimal. Le gain en stabilité est immense.

### Pourquoi limiter à 5 pages max

Une ligne d'index typique :
```
Lamproie ..................... 12, 18, 24, 31, 45, 52, 67, 78, 89, 102, 115, 128
```

À 8pt avec 60+ caractères, cette ligne déborde la largeur A5 (~280pt utilisables). Limiter à 5 pages (`12, 18, 24, 31, 45…`) garantit < 20 caractères pour les numéros.

---

## Fichiers à Modifier

| Fichier | Modifications |
|---------|--------------|
| `src/utils/pdfPageComponents.tsx` | Ajouter `formatPageList()`, retirer 5× `wrap={false}`, appliquer `truncateName` aux titres d'index |
| `src/utils/pdfStyleGenerator.ts` | Ajouter `flexShrink: 1` à 4 styles d'index |

---

## Résultat Attendu

- Zéro crash "unsupported number" ou "layout overflow"
- Les listes de pages longues affichent `12, 18, 24, 31…` au lieu de 50 numéros
- Les titres très longs sont tronqués avec "…"
- Export PDF stable pour n'importe quel volume de contenu

---

## Critères de Validation

1. L'export PDF se génère sans erreur console
2. Aucun warning "Node of type VIEW can't wrap"
3. Les Index s'affichent correctement avec pagination naturelle
4. La TOC reste lisible même avec des titres longs
