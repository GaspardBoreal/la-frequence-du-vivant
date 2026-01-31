

## Probleme identifie

Les titres dans l'Index des Genres du PDF affichent **"Senrykdu soir"** au lieu de **"Senryū du soir"**. Le caractere `ū` (U+016B, Latin Extended-A) est corrompu et l'espace suivant disparait.

### Cause racine

Les polices TTF chargees depuis jsDelivr utilisent uniquement le subset **"latin"** (`latin-400-normal.ttf`) qui ne contient **pas** le glyphe `ū`:

```
Lora: {
  regular: `${FONTSOURCE_CDN}/lora@latest/latin-400-normal.ttf`,
  bold: `${FONTSOURCE_CDN}/lora@latest/latin-700-normal.ttf`,
  ...
}
```

Le caractere `ū` appartient au jeu **Latin Extended-A** (U+0100-U+017F), qui n'est pas inclus dans les fichiers `latin-*.ttf`.

Quand `@react-pdf/renderer` rencontre un glyphe manquant, le comportement est imprevisible: parfois un carre de remplacement, parfois un caractere "similaire" base sur le codepoint, parfois une suppression pure et simple. Dans ce cas, le `ū` devient `k` et l'espace suivant est absorbe.

### Pourquoi ce n'est pas un probleme de sanitization

Les donnees en base sont **parfaitement correctes**:
- `Senryū du matin` (hex: `53656e7279c5ab206475206d6174696e`)
- Le caractere `ū` est bien encode en UTF-8 (`c5ab`)

Le probleme survient **uniquement au rendu PDF** quand la police ne contient pas le glyphe.

---

## Solution proposee: Charger les polices Latin Extended

Modifier les URLs des polices pour utiliser le subset **"latin-ext"** au lieu de **"latin"**. Ce subset inclut:
- Latin Extended-A (U+0100-U+017F) → contient `ū`, `ō`, `ā`, `ī`, etc.
- Latin Extended-B (partiellement)

### Modifications techniques

**Fichier**: `src/utils/pdfStyleGenerator.ts`

Remplacer toutes les occurrences de `latin-*-normal.ttf` et `latin-*-italic.ttf` par `latin-ext-*-normal.ttf` et `latin-ext-*-italic.ttf`:

| Avant | Apres |
|-------|-------|
| `latin-400-normal.ttf` | `latin-ext-400-normal.ttf` |
| `latin-700-normal.ttf` | `latin-ext-700-normal.ttf` |
| `latin-400-italic.ttf` | `latin-ext-400-italic.ttf` |
| `latin-700-italic.ttf` | `latin-ext-700-italic.ttf` |

Exemple pour Lora:
```text
Avant:
Lora: {
  regular: `${FONTSOURCE_CDN}/lora@latest/latin-400-normal.ttf`,
  bold: `${FONTSOURCE_CDN}/lora@latest/latin-700-normal.ttf`,
  ...
}

Apres:
Lora: {
  regular: `${FONTSOURCE_CDN}/lora@latest/latin-ext-400-normal.ttf`,
  bold: `${FONTSOURCE_CDN}/lora@latest/latin-ext-700-normal.ttf`,
  ...
}
```

### Polices a modifier

| Police | Regular | Bold | Italic | Bold-Italic |
|--------|---------|------|--------|-------------|
| Georgia (Lora) | `latin-ext-400-normal` | `latin-ext-700-normal` | `latin-ext-400-italic` | `latin-ext-700-italic` |
| Playfair Display | `latin-ext-400-normal` | `latin-ext-700-normal` | `latin-ext-400-italic` | `latin-ext-700-italic` |
| Cormorant Garamond | `latin-ext-400-normal` | `latin-ext-700-normal` | `latin-ext-400-italic` | `latin-ext-700-italic` |
| Lora | `latin-ext-400-normal` | `latin-ext-700-normal` | `latin-ext-400-italic` | `latin-ext-700-italic` |
| EB Garamond | `latin-ext-400-normal` | `latin-ext-700-normal` | `latin-ext-400-italic` | `latin-ext-700-italic` |
| Crimson Pro | `latin-ext-400-normal` | `latin-ext-700-normal` | `latin-ext-400-italic` | `latin-ext-700-italic` |
| Libre Baskerville | `latin-ext-400-normal` | `latin-ext-700-normal` | `latin-ext-400-italic` | - |
| DM Serif Display | `latin-ext-400-normal` | - | `latin-ext-400-italic` | - |
| Fraunces | `latin-ext-400-normal` | `latin-ext-700-normal` | `latin-ext-400-italic` | `latin-ext-700-italic` |
| Merriweather | `latin-ext-400-normal` | `latin-ext-700-normal` | `latin-ext-400-italic` | `latin-ext-700-italic` |

---

## Fichier a modifier

| Fichier | Modification |
|---------|--------------|
| `src/utils/pdfStyleGenerator.ts` | Remplacer `latin-*` par `latin-ext-*` dans tous les URLs de polices (lignes 14-72) |

---

## Avantages de cette solution

1. **Correction complete**: Tous les caracteres accentues etendus (ū, ō, ā, ī, ę, ą, etc.) seront correctement rendus
2. **Compatibilite**: Les polices latin-ext sont disponibles sur le meme CDN jsDelivr/Fontsource
3. **Impact minimal**: Les fichiers latin-ext sont legerement plus gros (~10-20Ko de plus) mais cela n'affecte pas les performances de maniere significative
4. **Pas de changement de logique**: Seules les URLs changent, pas le code de rendu

---

## Verification (acceptance)

1. Exporter un PDF contenant des textes avec "Senryū" dans le titre
2. Verifier que:
   - Le titre affiche correctement **"Senryū du soir"** avec le `ū` visible
   - L'espace entre "Senryū" et "du" est preserve
3. Tester d'autres caracteres etendus si presents (œ, æ, etc.)

