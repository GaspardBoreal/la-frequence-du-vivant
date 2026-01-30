
# Plan : Fusion Couverture + Faux-Titre sur une seule page

## Analyse du problème

Actuellement, le PDF génère 2 pages liminaires distinctes :

| Page 1 (Couverture) | Page 2 (Faux-titre) |
|---------------------|---------------------|
| Décoration émeraude | Décoration émeraude |
| **Titre principal** | — |
| *Sous-titre* | — |
| Décoration émeraude | — |
| Auteur | Auteur |
| Éditeur | Éditeur |

Les éléments "Auteur" et "Éditeur" sont **dupliqués** sur les deux pages, ce qui est redondant et coûte 1 page.

## Solution proposée

Supprimer complètement la page "Faux-titre" et intégrer tous les éléments sur la **page de couverture unique** :

```text
┌─────────────────────────────┐
│                             │
│      ───────────────        │ ← Décoration émeraude
│                             │
│   Fréquences de la          │
│   rivière Dordogne —        │ ← Titre principal (gras)
│     atlas des vivants       │
│                             │
│  16 lieux traversés —       │ ← Sous-titre (italique)
│  Haïkus, fables, textes...  │
│                             │
│      ───────────────        │ ← Décoration émeraude
│                             │
│       Gaspard Boréal        │ ← Auteur
│                             │
│  La Comédie des Mondes      │ ← Éditeur
│         Hybrides            │
│                             │
└─────────────────────────────┘
```

## Modifications techniques

### 1. Désactiver l'option "Faux-titre" par défaut

**Fichier** : `src/utils/pdfExportUtils.ts`

Modifier le preset "Galerie Fleuve" pour désactiver le faux-titre :

```typescript
galerie_fleuve: {
  // ...
  includeFauxTitre: false,  // Était true
}
```

### 2. Améliorer la mise en page de la couverture

**Fichier** : `src/utils/pdfStyleGenerator.ts`

Ajuster les styles de la page de couverture pour une disposition plus équilibrée :
- Réduire le `padding` global (30mm → 25mm)
- Augmenter légèrement l'espacement vertical entre les éléments
- Assurer que titre + sous-titre + auteur + éditeur tiennent élégamment sur une page

### 3. Ajustement des espacements

Modifier les `marginTop` et `marginBottom` des éléments de couverture :
- `coverSubtitle.marginBottom` : 20mm → 15mm
- `coverAuthor.marginTop` : 30mm → 25mm  
- `coverPublisher.marginTop` : 40mm → 25mm

## Résultat attendu

- **Gain** : 1 page (P2 supprimée)
- **Esthétique** : tous les éléments éditoriaux regroupés sur une page de couverture cohérente
- **Option conservée** : l'utilisateur peut réactiver le faux-titre manuellement si nécessaire pour d'autres directions artistiques

## Fichiers à modifier

1. `src/utils/pdfExportUtils.ts` — Désactiver `includeFauxTitre` pour le preset Galerie Fleuve
2. `src/utils/pdfStyleGenerator.ts` — Ajuster les espacements de la couverture
