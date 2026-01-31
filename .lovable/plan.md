

# Plan de Correction — Résoudre définitivement le crash "unsupported number"

## Diagnostic Final

L'erreur `unsupported number: -1.3e+21` persiste car il reste des contraintes de layout problématiques :

| Problème | Fichier | Ligne | Impact |
|----------|---------|-------|--------|
| `height: '100%'` | `pdfStyleGenerator.ts` | 424 | Force Yoga à calculer des hauteurs relatives instables |
| `wrap={false}` global sur Marche | `pdfPageComponents.tsx` | 503 | Si une Marche contient beaucoup de types de textes, le bloc dépasse une page et crashe |
| `wrap={false}` sur TocEntry | `pdfPageComponents.tsx` | 187 | Risque mineur si titres très longs |
| Footer manuel dans TocPage | `pdfPageComponents.tsx` | 207-211 | Incohérence potentielle avec le reste du document |

## Plan d'Action

### Correction 1 : Remplacer `height: '100%'` dans `partiePage`

**Fichier** : `src/utils/pdfStyleGenerator.ts`

```typescript
// AVANT (ligne 419-425)
partiePage: {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',  // PROBLÈME
},

// APRÈS
partiePage: {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  flexGrow: 1,  // STABLE
},
```

### Correction 2 : Refactorer `IndexLieuxPage` pour autoriser les sauts de page

**Fichier** : `src/utils/pdfPageComponents.tsx`

**Problème actuel** : Tout le bloc Marche (nom + tous les types) est `wrap={false}`. Si une Marche a 10+ types, cela peut dépasser une page.

**Solution** : Appliquer la même stratégie que pour `IndexKeywordsPage` — garder uniquement l'en-tête avec le premier type ensemble, laisser le reste couler normalement.

```typescript
// AVANT (ligne 502-518)
{partieEntry.marches.map((marche, mIndex) => (
  <View key={mIndex} style={styles.indexLieuxMarcheBlock as Style} wrap={false}>
    <Text style={styles.indexLieuxMarcheEntry as Style}>{marche.nom}</Text>
    {marche.types.map((typeEntry, tIndex) => (
      <View key={tIndex} style={styles.indexLieuxTypeRow as Style}>
        {/* ... */}
      </View>
    ))}
  </View>
))}

// APRÈS
{partieEntry.marches.map((marche, mIndex) => {
  const [firstType, ...restTypes] = marche.types;
  return (
    <View key={mIndex}>
      {/* Garde le nom de la Marche avec le premier type ensemble */}
      <View wrap={false} style={styles.indexLieuxMarcheBlock as Style}>
        <Text style={styles.indexLieuxMarcheEntry as Style}>{marche.nom}</Text>
        {firstType && (
          <View style={styles.indexLieuxTypeRow as Style}>
            <Text style={styles.indexLieuxTypeName as Style}>{firstType.type}</Text>
            <View style={styles.indexLieuxDotLeader as Style} />
            <Text style={styles.indexLieuxPages as Style}>{firstType.pages.join(', ')}</Text>
          </View>
        )}
      </View>
      {/* Le reste des types peut couler normalement */}
      {restTypes.map((typeEntry, tIndex) => (
        <View key={tIndex} style={styles.indexLieuxTypeRow as Style}>
          <Text style={styles.indexLieuxTypeName as Style}>{typeEntry.type}</Text>
          <View style={styles.indexLieuxDotLeader as Style} />
          <Text style={styles.indexLieuxPages as Style}>{typeEntry.pages.join(', ')}</Text>
        </View>
      ))}
    </View>
  );
})}
```

### Correction 3 : Ajouter `flexShrink: 1` aux textes de lieu/type (protection overflow horizontal)

**Fichier** : `src/utils/pdfStyleGenerator.ts`

Ajouter `flexShrink: 1` aux styles suivants pour empêcher les textes longs de pousser le layout :

```typescript
indexLieuxTypeName: {
  // ... existing styles ...
  flexShrink: 1,  // AJOUTER
},
indexGenreTitle: {
  // ... existing styles ...
  flexShrink: 1,  // AJOUTER
},
```

### Correction 4 : Harmoniser le footer de TocPage avec PageFooter

**Fichier** : `src/utils/pdfPageComponents.tsx`

Remplacer le `<Text fixed>` manuel par le composant `PageFooter` standard :

```typescript
// AVANT (lignes 206-211)
<Text
  style={styles.pageNumber as Style}
  fixed
  render={({ pageNumber }) => formatPageNumber(pageNumber, options.pageNumberStyle, true)}
/>

// APRÈS
<PageFooter 
  styles={styles} 
  options={{...options, pageNumberStyle: 'roman-lower'}} 
/>
```

## Section Technique

### Pourquoi `height: '100%'` cause le crash

Le moteur Yoga (utilisé par `@react-pdf/renderer`) doit résoudre les dimensions de chaque élément. Quand un élément utilise `height: '100%'` dans un contexte flex complexe avec des pages multiples, Yoga peut :
1. Calculer une hauteur "infinie" s'il n'y a pas de contrainte parente explicite
2. Propager cette valeur invalide aux coordonnées de placement
3. Produire des nombres comme `-1.3e+21` qui crashent le moteur de rendu

### Pourquoi `wrap={false}` sur des blocs volumineux crash

`wrap={false}` dit à React-PDF : "Ne coupe pas ce bloc, même s'il dépasse la page". Si le bloc est plus grand que la zone disponible, le moteur tente de le placer quand même et calcule des coordonnées négatives impossibles.

## Fichiers à Modifier

| Fichier | Modifications |
|---------|--------------|
| `src/utils/pdfStyleGenerator.ts` | `height: '100%'` → `flexGrow: 1` dans `partiePage` ; ajouter `flexShrink: 1` |
| `src/utils/pdfPageComponents.tsx` | Refactorer `IndexLieuxPage` pour wrapper uniquement en-tête+premier type ; harmoniser `TocPage` footer |

## Résultat Attendu

- Zéro crash "unsupported number"
- Les index peuvent s'étaler sur plusieurs pages proprement
- L'en-tête de chaque section reste collé au premier élément (pas d'orphelins visuels)
- Cohérence du footer sur tout le document

