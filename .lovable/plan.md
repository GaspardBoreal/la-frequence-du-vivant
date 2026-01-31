

## Probleme identifie

Le footer PDF apparait au milieu des pages au lieu d'etre en bas. La cause est technique :

**Dans `@react-pdf/renderer`, la prop `render` n'est supportee que sur les composants `<Text>` et `<Image>`, pas sur `<View>`.**

Le code actuel utilise :
```jsx
<View fixed style={...} render={({ pageNumber }) => (...)} />
```

Cela provoque un comportement imprevisible ou le contenu du `<View>` "flotte" au milieu de la page au lieu d'etre positionne en bas avec `position: absolute`.

---

## Solution technique

Restructurer le `PageFooter` pour utiliser uniquement des elements `<Text>` avec la prop `render`, tout en conservant le positionnement absolu en bas de page.

### Architecture proposee

Remplacer le `<View>` conteneur par deux elements `<Text fixed>` distincts :
1. **Texte de contexte** (a gauche) : affiche le nom de la partie ou de la marche
2. **Numero de page** (a droite) : utilise `render` pour obtenir le numero dynamique

### Details d'implementation

**Fichier : `src/utils/pdfPageComponents.tsx`**

Modification du composant `PageFooter` (lignes 362-389) :

```text
AVANT (problematique) :
<View fixed style={pageFooter} render={...}>
  <Text>{context}</Text>
  <Text>{pageNumber}</Text>
</View>

APRES (solution) :
<>
  <Text fixed style={footerContext}>{contextText}</Text>
  <Text fixed style={footerNumber} render={...}>{pageNumber}</Text>
</>
```

**Fichier : `src/utils/pdfStyleGenerator.ts`**

Ajuster les styles pour que les deux elements `<Text>` soient positionnes independamment :

| Style | Position | Alignement |
|-------|----------|------------|
| `pageFooterContext` | `position: absolute`, `bottom: 10mm`, `left: marginInner` | Texte a gauche |
| `pageNumberInline` | `position: absolute`, `bottom: 10mm`, `right: marginOuter` | Texte a droite |

---

## Fichiers a modifier

1. **`src/utils/pdfPageComponents.tsx`**
   - Refactoriser `PageFooter` pour utiliser deux `<Text fixed>` au lieu d'un `<View>`
   - Le contexte (partie/marche) n'a pas besoin de `render` car c'est une valeur statique
   - Le numero de page utilise `render` pour obtenir le numero dynamique

2. **`src/utils/pdfStyleGenerator.ts`**
   - S'assurer que `pageFooterContext` a `position: absolute` + ancrage gauche
   - S'assurer que `pageNumberInline` a `position: absolute` + ancrage droit
   - Les deux a `bottom: mmToPoints(10)` pour alignement vertical

---

## Resultat attendu

- Le contexte (nom de partie ou marche) apparait en bas a gauche de chaque page
- Le numero de page apparait en bas a droite de chaque page
- Les deux elements sont fixes et ne se deplacent pas avec le contenu

