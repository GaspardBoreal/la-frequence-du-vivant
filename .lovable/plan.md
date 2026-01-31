
## RÉSOLU: Numérotation statique des pages PDF

### Problème initial
Le footer PDF affichait le **numéro de page au milieu de la page** au lieu d'être ancré en bas. La prop `render` de `@react-pdf/renderer` causait l'instabilité du positionnement absolu.

### Solution implémentée: Numéros de page statiques

Abandon complet de la prop `render` pour le pied de page. Le système calcule les numéros de page au moment de l'assemblage du document et les passe comme props statiques.

### Modifications apportées

#### 1. `src/utils/pdfStyleGenerator.ts`
- Ajout du style `pageNumberStatic` avec positionnement absolu simple
- Suppression des styles dynamiques obsolètes (`pageNumberRenderFixedRight`, `pageFooterBar`, etc.)

#### 2. `src/utils/pdfPageComponents.tsx`

**PageFooter** (refactorisé):
```typescript
interface PageFooterProps {
  styles: PdfStylesRaw;
  options: PdfExportOptions;
  partieName?: string;
  marcheName?: string;
  pageNumber: number;        // Statique, calculé en amont
  isPrefacePage?: boolean;   // Pour style romain si TOC
}
```

**PdfDocument** (nouveau calculateur de pages):
```typescript
let currentPageNumber = options.startPageNumber;
if (options.includeCover) currentPageNumber++;
if (options.includeFauxTitre) currentPageNumber++;
// TOC, Parties, Textes, Index...
```

**Composants mis à jour**:
- `TocPage`: prop `pageNumber` + `isPrefacePage={true}`
- `PartiePage`: prop `pageNumber`
- `TextePage`: prop `basePageNumber` (incrémenté pour multi-pages)
- `FablePage`: prop `pageNumber`
- `IndexLieuxPage`, `IndexGenresPage`, `IndexKeywordsPage`: prop `pageNumber`

### Flux de pages
```
Page 1:  Couverture        (pas de footer)
Page 2:  Faux-titre        (pas de footer)
Page 3:  Table des matières (footer: iii - romain)
Page 4:  Partie I          (footer: 1)
Page 5+: Textes            (footer: 2, 3, 4...)
Page N:  Index             (footer: N)
Page N+1: Colophon         (pas de footer)
```

### Avantages
1. ✅ Stabilité garantie: plus de dépendance à `render`
2. ✅ Cohérence: numéros identiques dans TOC et index
3. ✅ Maintenabilité: logique centralisée dans `PdfDocument`
4. ✅ Debugging: numéros explicites et traçables
