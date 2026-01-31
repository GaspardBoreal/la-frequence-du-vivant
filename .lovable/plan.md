
# Correction de la Pagination PDF — Numérotation Dynamique

## Problème Identifié

Le document PDF affiche **58** comme dernier numéro de page alors qu'il contient **157 pages** réelles. 

**Cause racine** : Le système compte 1 page par élément de contenu (`currentPage++`) mais les textes longs (fables, manifestes) s'étalent sur **plusieurs pages** grâce à `wrap={true}`. Le compteur manuel ne reflète pas la pagination réelle générée par @react-pdf/renderer.

```
Logique actuelle :
├── Couverture → page 1
├── Faux-titre → page 2  
├── TDM → page 3
├── Texte 1 → page 4 (mais peut faire 3 pages réelles !)
├── Texte 2 → page 5 (mais commence en réalité page 7...)
└── ...désynchronisation totale
```

## Solution Proposée

### Stratégie : Numérotation Dynamique Native

@react-pdf/renderer fournit un **render prop** natif qui injecte automatiquement le numéro de page réel pendant la génération :

```tsx
<Text render={({ pageNumber, totalPages }) => `${pageNumber}`} fixed />
```

### Modifications Techniques

#### 1. Refonte du `PageFooter` (prioritaire)

Remplacer le `pageNumber` passé en prop par le render prop dynamique :

```tsx
// AVANT (erroné)
<Text>{formatPageNumber(pageNumber, options.pageNumberStyle)}</Text>

// APRÈS (correct)
<Text 
  render={({ pageNumber }) => formatPageNumber(pageNumber, options.pageNumberStyle)} 
  fixed 
/>
```

**Fichier** : `src/utils/pdfPageComponents.tsx` (lignes 64-92)

#### 2. Suppression du Compteur Manuel

Retirer la logique `currentPage++` et `contentEndPage++` devenue obsolète :
- Lignes 797-804 : suppression du calcul de `contentEndPage`
- Lignes 839, 854, 872, 882, 892, 901 : suppression des incréments

#### 3. Pages d'Index avec Render Prop

Les pages d'index (`IndexLieuxPage`, `IndexGenresPage`, `IndexKeywordsPage`, `ColophonPage`) recevront leur numéro via le render prop au lieu d'un prop statique.

#### 4. Limitation Connue : Références dans les Index

**Problème insoluble côté client** : Les numéros de page affichés *dans* les index (ex: "Haïku du matin... p. 7") sont calculés **avant** le rendu, donc resteront approximatifs si des textes longs précèdent.

**Contournement pragmatique** : Améliorer l'estimation en comptant les caractères/lignes pour estimer les pages supplémentaires, ou accepter que les références soient indicatives (pratique courante dans les PDF générés dynamiquement).

---

## Séquence d'Implémentation

| Étape | Fichier | Action |
|-------|---------|--------|
| 1 | `pdfPageComponents.tsx` | Modifier `PageFooter` pour utiliser le render prop |
| 2 | `pdfPageComponents.tsx` | Supprimer tous les `pageNumber={currentPage++}` des composants |
| 3 | `pdfPageComponents.tsx` | Adapter les pages d'index pour le render prop |
| 4 | `pdfPageComponents.tsx` | Améliorer `buildPageMapping` avec estimation de longueur |

---

## Résultat Attendu

- **Pieds de page** : Affichent le numéro de page **réel** (1 à 157)
- **Parité alternée** : La logique pair/impair reste fonctionnelle via le render prop
- **Index** : Les références de page restent une estimation raisonnable

---

## Section Technique

### Signature du Render Prop (types @react-pdf)
```typescript
render?: (props: { 
  pageNumber: number; 
  totalPages: number; 
  subPageNumber: number; 
  subPageTotalPages: number; 
}) => React.ReactNode;
```

### Gestion de la Parité pour le Footer
Le contexte (nom du Mouvement/Marche) et la position du numéro de page (gauche/droite) dépendent de la parité. Avec le render prop :

```tsx
<View fixed>
  <Text render={({ pageNumber }) => {
    const isOdd = pageNumber % 2 === 1;
    // Affichage conditionnel selon parité
  }} />
</View>
```

### Estimation pour les Index (amélioration optionnelle)
Pour améliorer la précision des références, on peut estimer les pages consommées par texte :
```typescript
function estimateTextPages(texte: TexteExport, charsPerPage: number = 1800): number {
  const contentLength = sanitizeContentForPdf(texte.contenu).length;
  return Math.ceil(contentLength / charsPerPage);
}
```
