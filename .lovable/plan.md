

# Correction de l'Erreur PDF — "unsupported number"

## Diagnostic

L'erreur `unsupported number: -2.3060650366753233e+22` survient lors du rendu PDF car le moteur de calcul génère des coordonnées de positionnement invalides.

**Cause racine identifiée :**

```
Footer actuel (problématique) :
┌────────────────────────────────────────────────────────────────┐
│ "La Source...        [40 espaces]                        42"  │
│                    ↑ DÉBORDEMENT → CRASH                      │
└────────────────────────────────────────────────────────────────┘
```

Le texte concaténé (nom du Mouvement + 40 espaces + numéro de page) dépasse la largeur physique de la page. Le moteur `@react-pdf` tente de centrer ce contenu et calcule des coordonnées négatives astronomiques.

## Solution

Remplacer la technique d'espacement texte par une structure flexbox propre qui laisse le moteur gérer le positionnement :

```
Footer corrigé (flexbox) :
┌────────────────────────────────────────────────────────────────┐
│ [View row justifyContent: space-between]                       │
│ ├── <Text>La Source...</Text>           <Text>42</Text> ──────│
│                    ↑ PLACEMENT AUTOMATIQUE                     │
└────────────────────────────────────────────────────────────────┘
```

## Modifications Techniques

### 1. Refonte du composant `PageFooter`

**Fichier** : `src/utils/pdfPageComponents.tsx`

**Avant (crash) :**
```tsx
<Text
  render={({ pageNumber }) => {
    return `${contextText}${' '.repeat(40)}${formattedPage}`;
  }}
/>
```

**Après (stable) :**
```tsx
<View style={styles.pageFooter} fixed>
  <Text 
    render={({ pageNumber }) => {
      const isOdd = pageNumber % 2 === 1;
      return isOdd ? (contextText || '') : formatPageNumber(pageNumber, options.pageNumberStyle);
    }} 
  />
  <Text 
    render={({ pageNumber }) => {
      const isOdd = pageNumber % 2 === 1;
      return isOdd ? formatPageNumber(pageNumber, options.pageNumberStyle) : (contextText || '');
    }} 
  />
</View>
```

### 2. Mise à jour des styles

**Fichier** : `src/utils/pdfStyleGenerator.ts`

- Supprimer `pageFooterDynamic` (plus nécessaire)
- Conserver `pageFooter` avec `flexDirection: 'row'` et `justifyContent: 'space-between'`
- Ajouter des styles pour les textes gauche et droite du footer

## Séquence d'Implémentation

| Étape | Fichier | Action |
|-------|---------|--------|
| 1 | `pdfPageComponents.tsx` | Refondre `PageFooter` avec deux éléments `<Text>` distincts |
| 2 | `pdfStyleGenerator.ts` | Nettoyer les styles — supprimer `pageFooterDynamic`, ajuster `pageFooter` |

## Résultat Attendu

- Le PDF se génère sans erreur de nombre invalide
- Le pied de page affiche correctement le contexte et le numéro de page aux extrémités
- La parité (page paire/impaire) détermine la position relative du contexte et du numéro

## Section Technique

### Pourquoi Flexbox est Plus Stable

`@react-pdf/renderer` gère nativement les layouts flexbox. En utilisant `justifyContent: 'space-between'` sur un `View` contenant deux `Text`, le moteur :

1. Calcule la largeur de chaque élément
2. Répartit l'espace restant automatiquement
3. Évite tout débordement ou coordonnées négatives

### Gestion de la Parité

Avec deux éléments `<Text>` séparés qui utilisent chacun un `render` prop, on peut inverser dynamiquement les contenus selon la parité :

```tsx
// Élément gauche
<Text render={({ pageNumber }) => {
  const isOdd = pageNumber % 2 === 1;
  return isOdd ? contextText : pageNumber.toString();
}} />

// Élément droit  
<Text render={({ pageNumber }) => {
  const isOdd = pageNumber % 2 === 1;
  return isOdd ? pageNumber.toString() : contextText;
}} />
```

