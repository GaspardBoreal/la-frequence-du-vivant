

## Probleme identifie

Le footer PDF affiche le **numero de page au milieu de la page** au lieu d'etre ancre en bas. Le texte de contexte (Partie/Marche) s'affiche correctement en bas a gauche, mais le numero dynamique (via `render`) "flotte" dans le flux du document.

### Cause racine
Dans `@react-pdf/renderer`, la prop `render` sur un `<Text>` declenche une passe de layout supplementaire qui peut ignorer les contraintes de positionnement (`position: 'absolute'`, `bottom`, etc.). Meme avec des largeurs explicites et des strategies de contournement, le moteur Yoga peut "detacher" le noeud et le replacer au point d'insertion dans le flux.

### Pourquoi les tentatives precedentes ont echoue
1. **View avec render**: Non supporte (`render` ne fonctionne que sur `<Text>` et `<Image>`)
2. **Text avec render + absolute**: Le positionnement absolu est ignore lors de la passe de rendu dynamique
3. **Text avec render + width explicite**: Toujours instable car la boite de texte est recalculee apres le layout initial

---

## Solution proposee : Numeros de page statiques

Abandonner completement la prop `render` pour le pied de page et passer a un systeme de **numerotation statique**:
- Calculer le numero de page de chaque element au moment de l'assemblage du document
- Passer ce numero en prop a chaque composant de page
- Afficher un simple `<Text>` sans `render` qui respectera le positionnement absolu

Cette approche est 100% deterministe et elimine toute instabilite liee au moteur Yoga.

---

## Modifications techniques

### 1. Interface PdfExportOptions
**Fichier**: `src/utils/pdfExportUtils.ts`

Aucun changement necessaire - l'interface supporte deja `startPageNumber`.

### 2. Interface PdfStylesRaw
**Fichier**: `src/utils/pdfStyleGenerator.ts`

Ajouter un nouveau style `pageNumberStatic` pour le numero de page statique:
```text
pageNumberStatic: {
  position: 'absolute',
  bottom: mmToPoints(10),
  right: mmToPoints(options.marginOuter),
  fontFamily: typography.bodyFont,
  fontSize: baseFontSize * 0.8,
  color: colorScheme.secondary,
  textAlign: 'right',
}
```

### 3. Composant PageFooter (refactoring majeur)
**Fichier**: `src/utils/pdfPageComponents.tsx`

Modifier l'interface et l'implementation:

```text
interface PageFooterProps {
  styles: PdfStylesRaw;
  options: PdfExportOptions;
  partieName?: string;
  marcheName?: string;
  pageNumber: number;        // NOUVEAU: numero calcule en amont
  isPrefacePage?: boolean;   // NOUVEAU: pour style romain si TOC
}
```

Implementation:
```text
export const PageFooter = ({ styles, options, partieName, marcheName, pageNumber, isPrefacePage }) => {
  const contextText = partieName || marcheName || '';
  const formattedNumber = formatPageNumber(pageNumber, options.pageNumberStyle, isPrefacePage);

  return (
    <>
      <Text fixed style={styles.pageFooterContext}>{contextText}</Text>
      <Text fixed style={styles.pageNumberStatic}>{formattedNumber}</Text>
    </>
  );
};
```

### 4. Composant PdfDocument (calculateur de pages)
**Fichier**: `src/utils/pdfPageComponents.tsx`

Modifier `PdfDocument` pour:
1. Calculer le numero de page initial apres Cover/FauxTitre/TOC
2. Injecter le numero de page dans chaque composant de page
3. Incrementer le compteur apres chaque page

Pseudo-logique:
```text
let currentPage = options.startPageNumber;
if (includeCover) currentPage++;
if (includeFauxTitre) currentPage++;
if (includeTOC) { /* TOC utilise le numero actuel, puis increment */ }

// Pour chaque item du groupedContent:
// - PartiePage: passe currentPage, puis currentPage++
// - TextePage: passe currentPage pour la premiere page, 
//   puis currentPage += estimatePages(texte)

// Pour les index: passe currentPage, puis currentPage++
// Pour le colophon: passe currentPage
```

### 5. Composants de page individuels
**Fichier**: `src/utils/pdfPageComponents.tsx`

Modifier chaque composant pour accepter et transmettre `pageNumber`:

| Composant | Modification |
| :--- | :--- |
| `TocPage` | Ajouter prop `pageNumber`, passer a `PageFooter` |
| `PartiePage` | Ajouter prop `pageNumber`, ajouter `PageFooter` |
| `TextePage` | Modifier la boucle de pagination pour passer `basePageNumber + pageIndex` |
| `FablePage` | Ajouter prop `pageNumber`, passer a `PageFooter` |
| `HaikuPage` | Deja integre via `TextePage` |
| `IndexLieuxPage` | Ajouter prop `pageNumber`, passer a `PageFooter` |
| `IndexGenresPage` | Ajouter prop `pageNumber`, passer a `PageFooter` |
| `IndexKeywordsPage` | Ajouter prop `pageNumber`, passer a `PageFooter` |
| `ColophonPage` | Ajouter prop `pageNumber` et `PageFooter` optionnel |

### 6. Suppression du code obsolete
**Fichier**: `src/utils/pdfStyleGenerator.ts`

Supprimer ou marquer comme deprecated:
- `pageNumberRenderFixedRight`
- `pageFooterBar`
- `pageFooterContextInline`
- `pageNumberInlineText`

---

## Flux de pages calcule

```text
Page 1:  Couverture        (pas de footer)
Page 2:  Faux-titre        (pas de footer)
Page 3:  Table des matieres (footer: iii)
Page 4:  Partie I          (footer: 1)
Page 5:  Texte 1           (footer: 2)
Page 6:  Texte 1 suite     (footer: 3)
Page 7:  Texte 2           (footer: 4)
...
Page N:  Index Lieux       (footer: N)
Page N+1: Colophon         (pas de footer)
```

---

## Estimation de pages pour textes longs

La fonction `estimatePages()` existe deja et sera reutilisee pour calculer combien de pages physiques un texte occupe. Cela garantit que les numeros restent synchronises avec la pagination manuelle de `TextePage`.

---

## Fichiers a modifier

| Fichier | Type de modification |
| :--- | :--- |
| `src/utils/pdfStyleGenerator.ts` | Ajouter `pageNumberStatic`, deprecier styles dynamiques |
| `src/utils/pdfPageComponents.tsx` | Refactoriser `PageFooter`, `PdfDocument`, et tous les composants de page |
| `src/utils/pdfExportUtils.ts` | Aucun changement necessaire |

---

## Avantages de cette approche

1. **Stabilite garantie**: Plus aucune dependance a la prop `render` pour le positionnement
2. **Coherence**: Le numero affiche correspond exactement au numero calcule pour la TOC et les index
3. **Maintenabilite**: Logique centralisee dans `PdfDocument`
4. **Debugging**: Facile de tracer les numeros de page car ils sont explicites

---

## Verification (acceptance)

1. Exporter un PDF avec plusieurs types de pages (TOC, Parties, Textes longs, Index)
2. Verifier que:
   - Le contexte (Partie/Marche) est en bas a gauche
   - Le numero de page est en bas a droite
   - Les deux elements sont sur la meme ligne horizontale
3. Verifier que les numeros correspondent aux references dans la TOC et les index
4. Tester avec un document long (ex: "Constitution de Dordonia") pour valider la pagination

