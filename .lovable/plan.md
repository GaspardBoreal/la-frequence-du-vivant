

# Plan : Haiku seul sur sa page + Parties centrées en hauteur

## Diagnostic

### 1. Haiku : situation actuelle par format

| Format | Page isolée ? | Centré verticalement ? |
|--------|--------------|----------------------|
| **PDF** | Oui (chaque haiku a sa propre `<Page>`) | Non - `textePage` utilise `justifyContent: 'flex-start'` |
| **EPUB** | Non - `page-break-inside: avoid` seulement | Non - centré horizontalement mais pas verticalement |
| **Word** | Non - rendu identique aux autres textes | Non - pas de traitement specifique |

### 2. Parties : situation actuelle par format

| Format | Page isolée ? | Centré verticalement ? |
|--------|--------------|----------------------|
| **PDF** | Oui (composant `PartiePage` dedie) | Partiellement - `partiePage` a `justifyContent: 'center'` mais est imbriquee dans le layout de page |
| **EPUB** | Oui (`page-break-before/after: always`) | Non - utilise `padding-top: 35%` (decalage fixe, pas un vrai centrage) |
| **Word** | Oui (page break avant/apres) | Approximatif - `spacing: { before: 3000 }` (spacer fixe) |

---

## Corrections a apporter

### A. PDF (`pdfPageComponents.tsx` + `pdfStyleGenerator.ts`)

**Haiku** : Le haiku a deja sa propre page, mais il n'est pas centre verticalement. Le probleme vient du style `textePage` qui est `justifyContent: 'flex-start'`. La correction consiste a utiliser `haikuContainer` (qui a `flex: 1, justifyContent: 'center'`) comme wrapper au lieu de `textePage` quand on rend un haiku.

Dans `pdfPageComponents.tsx`, modifier le rendu haiku dans `TextePage` :
- Remplacer le wrapper `styles.textePage` par `styles.haikuContainer` pour les haikus
- Cela active `justifyContent: 'center'` et `alignItems: 'center'`

**Partie** : Le style est deja correct (`justifyContent: 'center'`). Verifier que `flexGrow: 1` fonctionne bien avec le layout de page. Si necessaire, ajouter `flex: 1` pour s'assurer que le conteneur prend toute la hauteur disponible.

### B. EPUB (`epubExportUtils.ts`)

**Haiku** : Ajouter des regles CSS pour forcer chaque haiku sur sa propre page et le centrer verticalement :
- `page-break-before: always` et `page-break-after: always` sur `.haiku-container`
- Utiliser `display: flex; align-items: center; justify-content: center; min-height: 80vh` pour le centrage vertical

**Partie** : Remplacer le `padding-top: 35%` par un vrai centrage vertical flex :
- `display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh`

### C. Word (`wordExportUtils.ts`)

**Haiku** : Le Word est plus complexe car la librairie `docx` ne supporte pas nativement le centrage vertical de contenu. La strategie est :
- Ajouter un `PageBreak` avant chaque haiku pour l'isoler sur sa page
- Utiliser la propriete `verticalAlign: VerticalAlign.CENTER` sur la section, ou a defaut, ajouter un spacer `spacing: { before: 4000 }` genereux pour simuler le centrage
- Ajouter un `PageBreak` apres le contenu du haiku

**Partie** : Le spacer actuel de `3000` twips est insuffisant. Augmenter a environ `4500` twips pour mieux centrer sur une page A4, ou utiliser `verticalAlign` si possible.

---

## Details techniques des modifications

### Fichier 1 : `src/utils/pdfPageComponents.tsx`

**Haiku** (lignes ~727-745) : Remplacer `styles.textePage` par `styles.haikuContainer` dans le wrapper View du rendu haiku. Cela change le layout de `flex-start` a `center` verticalement.

```text
Avant:
  <View style={styles.textePage}>
    {marcheHeader}
    <HaikuBlock ... />
  </View>

Apres:
  <View style={styles.haikuContainer}>
    <HaikuBlock ... />
  </View>
```

Note : Le `MarcheHeader` est retire du rendu haiku pour ne pas perturber le centrage vertical. L'identite du lieu est conservee dans le footer.

### Fichier 2 : `src/utils/pdfStyleGenerator.ts`

Verifier que `partiePage` a bien `flex: 1` en plus de `flexGrow: 1` pour garantir l'occupation de toute la hauteur disponible.

### Fichier 3 : `src/utils/epubExportUtils.ts`

**CSS Haiku** : Modifier les styles `.haiku-container` :
```css
.haiku-container {
  text-align: center;
  max-width: 80%;
  margin: 0 auto;
  page-break-before: always;
  page-break-after: always;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}
```

**CSS Partie** : Modifier `.partie-cover` :
```css
.partie-cover {
  page-break-before: always;
  page-break-after: always;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90vh;
}
```
(Remplacement du `padding-top: 35%` par un vrai centrage flex)

### Fichier 4 : `src/utils/wordExportUtils.ts`

**Haiku** : Modifier `createTexteEntry` pour detecter les haikus et ajouter :
1. Un `PageBreak` avant le contenu
2. Un spacer vertical (`spacing: { before: 4500 }`) pour simuler le centrage
3. Un alignement centre pour le contenu
4. Un `PageBreak` apres le separateur

**Partie** : Ajuster le spacer dans `createPartieCoverPage` de `3000` a `4500` twips pour un meilleur centrage visuel.

---

## Recapitulatif des fichiers modifies

| Fichier | Modification |
|---------|--------------|
| `src/utils/pdfPageComponents.tsx` | Wrapper haiku : `textePage` remplace par `haikuContainer` pour centrage vertical |
| `src/utils/pdfStyleGenerator.ts` | Verification `flex: 1` sur `partiePage` |
| `src/utils/epubExportUtils.ts` | CSS haiku : page isolee + centrage flex. CSS partie : centrage flex |
| `src/utils/wordExportUtils.ts` | Haiku : page break + spacer centrage. Partie : spacer augmente |

---

## Resultat attendu

- **Haiku/Senryu** : Toujours isole sur une page dediee, contenu centre verticalement dans les 3 formats
- **Parties** : Titre toujours positionne au centre vertical de la page dans les 3 formats
- Pas d'impact sur les autres types de textes (fables, prose, poemes longs)

