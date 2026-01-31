
# Plan de Correction Définitif — Crash "unsupported number"

## Contexte

L'export PDF crashe systématiquement avec l'erreur `unsupported number: -1.3e+21` (Yoga layout engine overflow).

**Cause racine identifiée** : Les textes très longs ne sont pas correctement segmentés car le contenu HTML stocké en base utilise des simples sauts de ligne (`\n`) et des balises `<p>` / `<div>` / `<li>`, mais la logique de découpage actuelle cherche des **doubles sauts de ligne** (`\n\n`) qui n'existent pas. Tout le contenu reste donc dans un bloc unique qui dépasse la taille d'une page, ce qui crashe le moteur Yoga.

| Texte problématique | Longueur | Segmentation actuelle |
|---------------------|----------|----------------------|
| Constitution de Dordonia | 21 638 car. | 1 seul "paragraphe" (tout le texte) |
| Épilogue — Le Parlement | 10 377 car. | 1 seul "paragraphe" |
| La Grand-duc et l'Éolienne | 5 476 car. | 1 seul "paragraphe" |

## Plan d'action

### 1. Corriger la segmentation des paragraphes (cause principale)

**Fichier** : `src/utils/pdfPageComponents.tsx` (fonctions `TextePage` et `FablePage`)

**Problème actuel** : Le découpage utilise `content.split(/\n{2,}/)` qui cherche des doubles sauts de ligne. Mais le HTML sanitizé ne contient que des simples `\n`.

**Solution** : Découper sur **simples sauts de ligne** (`\n`) au lieu de doubles, et grouper intelligemment les lignes très courtes (haïkus, vers) pour éviter un paragraphe par ligne :

```typescript
// NOUVELLE LOGIQUE DE SEGMENTATION
const splitIntoParagraphs = (content: string): string[] => {
  // Split on any newline
  const lines = content.split(/\n/).map(l => l.trim()).filter(Boolean);
  
  // If very few lines, return as-is (short poems)
  if (lines.length <= 5) return [lines.join('\n')];
  
  // For long prose, treat each line as a paragraph to allow page breaks
  // But group consecutive short lines (under 80 chars) to avoid excessive fragmentation
  const paragraphs: string[] = [];
  let currentGroup: string[] = [];
  
  for (const line of lines) {
    if (line.length > 120) {
      // Long line = standalone paragraph
      if (currentGroup.length > 0) {
        paragraphs.push(currentGroup.join('\n'));
        currentGroup = [];
      }
      paragraphs.push(line);
    } else {
      // Short line = group with others
      currentGroup.push(line);
      if (currentGroup.length >= 5) {
        paragraphs.push(currentGroup.join('\n'));
        currentGroup = [];
      }
    }
  }
  
  if (currentGroup.length > 0) {
    paragraphs.push(currentGroup.join('\n'));
  }
  
  return paragraphs;
};
```

### 2. Limiter le contenu dans les blocs `wrap={false}`

**Fichier** : `src/utils/pdfPageComponents.tsx`

**Problème actuel** : Le bloc `<View wrap={false}>` contenant titre + premier paragraphe peut recevoir un paragraphe de 5 000+ caractères, ce qui dépasse la hauteur de page.

**Solution** : Limiter le premier paragraphe à maximum ~800 caractères dans le bloc unbreakable. Si le premier paragraphe est plus long, le découper davantage :

```typescript
// Dans TextePage et FablePage
const [rawFirst, ...rest] = paragraphs;

// Si le "premier paragraphe" est trop long pour tenir avec le titre sur une page,
// on le découpe encore pour éviter le crash
const MAX_FIRST_PARA_LENGTH = 800;
let firstParagraph = rawFirst || '';
let restParagraphs = rest;

if (firstParagraph.length > MAX_FIRST_PARA_LENGTH) {
  // Trouver un point de coupure naturel (., !, ?)
  const cutPoint = firstParagraph.slice(0, MAX_FIRST_PARA_LENGTH).lastIndexOf('.');
  if (cutPoint > 100) {
    restParagraphs = [firstParagraph.slice(cutPoint + 1).trim(), ...rest];
    firstParagraph = firstParagraph.slice(0, cutPoint + 1);
  } else {
    // Pas de point, couper brutalement
    restParagraphs = [firstParagraph.slice(MAX_FIRST_PARA_LENGTH), ...rest];
    firstParagraph = firstParagraph.slice(0, MAX_FIRST_PARA_LENGTH);
  }
}
```

### 3. Estimation automatique des pages pour TOC/Index

**Fichier** : `src/utils/pdfPageComponents.tsx`

**Fonctions concernées** : `buildTocEntries` et `buildPageMapping`

**Solution** : Estimer le nombre de pages par texte basé sur la longueur du contenu :

```typescript
// Constante : environ 2000 caractères par page A5 après marges
const CHARS_PER_PAGE = 2000;

const estimatePages = (texte: TexteExport): number => {
  const contentLength = sanitizeContentForPdf(texte.contenu).length;
  return Math.max(1, Math.ceil(contentLength / CHARS_PER_PAGE));
};

// Dans buildTocEntries et buildPageMapping :
// Remplacer pageNumber++ par :
if (item.type === 'texte' && item.texte) {
  pageNumber += estimatePages(item.texte);
} else {
  pageNumber++;
}
```

## Section technique

### Pourquoi le découpage par `\n\n` échoue

Le contenu HTML en base utilise des structures comme :
```html
<h1><b>MÉTADONNÉES</b></h1>
<ul><li><p>Opus: ...</p></li></ul>
<h2>PRÉAMBULE</h2>
<p>Dordonia n'est pas un capteur...</p>
```

La fonction `sanitizeContentForPdf` convertit les balises `<p>`, `<div>`, `<li>` en simples `\n`, produisant :
```
MÉTADONNÉES
Opus: ...
PRÉAMBULE
Dordonia n'est pas un capteur...
```

Le `.split(/\n{2,}/)` cherche `\n\n` (double saut), mais il n'y en a pas → **le texte entier reste dans un seul bloc**.

### Pourquoi limiter à 800 caractères le premier paragraphe

Une page A5 (148×210mm) avec marges typiques offre environ 400-500 points de hauteur utile. Avec une police de 10pt et un interligne de 1.4, on peut placer environ 25-30 lignes. À 60 caractères/ligne moyenne, cela donne ~1500-1800 caractères max.

Le titre + décoration prennent ~3-5 lignes, donc le premier paragraphe doit être limité à ~800-1000 caractères pour garantir que le bloc `wrap={false}` tienne toujours sur une page.

## Fichiers à modifier

| Fichier | Modifications |
|---------|--------------|
| `src/utils/pdfPageComponents.tsx` | Nouvelle fonction `splitIntoParagraphs()`, limitation du premier paragraphe à 800 chars, estimation des pages dans `buildTocEntries` et `buildPageMapping` |

## Résultat attendu

- Zéro crash "unsupported number"
- Le manifeste "Constitution de Dordonia" (21 638 car.) se répartit sur ~11 pages
- L'Épilogue (10 377 car.) se répartit sur ~5 pages  
- La Table des Matières affiche des numéros de page estimés cohérents
- Les haïkus/senryūs courts restent sur une seule page (pas de sur-découpage)

## Critères de validation

1. L'export PDF se génère sans erreur console
2. Le PDF produit contient tous les textes, y compris les très longs
3. Les textes longs s'étalent naturellement sur plusieurs pages
4. La numérotation de la TOC est cohérente avec le contenu réel
5. Aucune régression sur les poèmes courts (haïkus centrés sur une page)
