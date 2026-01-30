
# Plan : Système de Directions Artistiques pour l'EPUB Pro

## Objectif
Permettre l'application de directions artistiques complètes (palette, typographie, mise en page) via des presets personnalisés, en commençant par "Galerie Fleuve" issu de l'analyse de votre image.

## Analyse de la Direction "Galerie Fleuve"

### Palette de couleurs extraite
| Role | Couleur | Hex |
|------|---------|-----|
| Primary | Noir profond | `#1A1A1A` |
| Secondary | Gris neutre | `#666666` |
| Background | Blanc pur | `#FFFFFF` |
| Text | Gris charbon | `#333333` |
| Accent | Vert emeraude | `#10B981` |

### Typographie
- **Police titres** : Playfair Display (elegant, serieux)
- **Police corps** : Georgia (classique, lisible)
- **Taille de base** : 1.1rem
- **Interligne** : 1.75 (genereux, aere)

### Caracteristiques visuelles
- Style "galerie d'art" : epure, minimaliste, blanc dominant
- Accents de couleur vive (vert) sur les elements interactifs
- Badges de localisation colores
- Icone livre en en-tete de page texte
- Separateurs discrets

## Modifications techniques

### 1. Etendre les types pour accepter plus de polices

**Fichier** : `src/utils/epubExportUtils.ts`

Modifier les types `EpubTypography` pour inclure les polices supplementaires necessaires :

```typescript
export interface EpubTypography {
  bodyFont: 'Georgia' | 'Libre Baskerville' | 'EB Garamond' | 'Crimson Pro' | 'Lora' | 'Merriweather';
  headingFont: 'Playfair Display' | 'Cormorant Garamond' | 'Libre Baskerville' | 'DM Serif Display' | 'Fraunces';
  baseFontSize: number;
  lineHeight: number;
}
```

### 2. Ajouter le preset "Galerie Fleuve"

**Fichier** : `src/utils/epubExportUtils.ts`

Ajouter le nouveau preset dans `EPUB_PRESETS` :

```typescript
galerie_fleuve: {
  id: 'galerie_fleuve',
  name: 'Galerie Fleuve',
  description: 'Style galerie d'art epure, accents emeraude',
  colorScheme: {
    primary: '#1A1A1A',
    secondary: '#666666',
    background: '#FFFFFF',
    text: '#333333',
    accent: '#10B981',
  },
  typography: {
    bodyFont: 'Georgia',
    headingFont: 'Playfair Display',
    baseFontSize: 1.1,
    lineHeight: 1.75,
  },
},
```

### 3. Etendre le type format

**Fichier** : `src/utils/epubExportUtils.ts`

Modifier le type `format` dans `EpubExportOptions` pour accepter les nouveaux presets :

```typescript
format: 'classique' | 'poesie_poche' | 'livre_art' | 'contemporain' | 'galerie_fleuve';
```

### 4. Adapter les renderers pour le style "Galerie Fleuve"

Les renderers existants utilisent deja dynamiquement `colorScheme` et `typography`, donc ils appliqueront automatiquement le nouveau preset. Cependant, on peut ajouter des variantes specifiques si necessaire.

**Fichier** : `src/components/admin/livre-vivant/renderers/TexteRenderer.tsx`

Ameliorations optionnelles pour le style Galerie Fleuve :
- Icone livre en en-tete (deja visible dans l'image)
- Badges de lieu avec fond colore (accent)
- Separateur plus discret

```typescript
// Badge de localisation avec style accent
<span 
  className="px-3 py-1 rounded-full text-xs font-medium"
  style={{ 
    backgroundColor: colorScheme.accent + '15',
    color: colorScheme.accent,
  }}
>
  {marche.ville}
</span>
```

### 5. Mettre a jour le panel de selection

**Fichier** : `src/components/admin/EpubExportPanel.tsx`

Le panel utilise deja `Object.values(EPUB_PRESETS)`, donc le nouveau preset apparaitra automatiquement dans la grille de selection.

## Structure pour les 3 directions artistiques

Vous avez mentionne 3 scenarios d'identite. Pour preparer le systeme :

```typescript
// Presets a implementer
galerie_fleuve: { ... }     // Style 1 - Galerie d'art, vert emeraude
// style_2: { ... }          // A definir avec l'image suivante
// style_3: { ... }          // A definir avec l'image suivante
```

## Resultat attendu

Apres implementation :
1. Un nouveau bouton "Galerie Fleuve" apparaitra dans la section "Direction artistique"
2. Cliquer dessus appliquera instantanement :
   - La palette vert emeraude sur fond blanc
   - La typographie Playfair Display / Georgia
   - L'interligne aere (1.75)
3. Le "Livre Vivant" s'adaptera en temps reel avec ces couleurs
4. L'export EPUB utilisera ce style

## Prochaines etapes

Une fois "Galerie Fleuve" implemente, vous pourrez fournir les 2 autres images de direction artistique pour :
- **Style 2** : A analyser
- **Style 3** : A analyser

Chacun sera ajoute comme preset supplementaire suivant la meme structure.
