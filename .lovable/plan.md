

# Plan : Indices Professionnels pour l'Export PDF Pro

## Synthèse de l'existant (Export Word)

L'export Word actuel génère **3 types d'index** à la fin du document :

| Index | Contenu | Structure |
|-------|---------|-----------|
| **Index par Lieu** | Partie > Marche > Textes (titre + type + page) | Hiérarchique géopoétique |
| **Index par Genre Littéraire** | Haïkus, Senryūs, Fables... avec lieu + page | Par type prédéfini |
| **Index des Mots-Clés** | 7 familles thématiques (Faune, Hydrologie, Ouvrages, Flore, Temporalités, Poétique, Technologies) | Alphabétique par catégorie |

## État actuel du PDF Pro

- Options `includeIndexLieux` et `includeIndexGenres` présentes dans `PdfExportOptions`
- Composant `IndexPage` basique existe mais **non utilisé** dans le document final
- Aucune logique d'extraction de mots-clés

## Proposition : Index Ultra-Design pour lecture papier "Wahou"

### 1. Index par Lieu (Géographique)

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ─────  INDEX PAR LIEU  ─────                 │
│                                                                 │
│  I. LE CONTRE-COURANT                                           │
│                                                                 │
│     La Roque-Gageac (Dordogne)                                  │
│         Haïkus ........................ 12, 14, 15              │
│         Fables ........................ 18                      │
│         Poèmes ........................ 23, 24                  │
│                                                                 │
│     Domme (Dordogne)                                            │
│         Senryūs ....................... 28, 29, 30              │
│         Prose ......................... 35                      │
│                                                                 │
│  II. LA TRAVERSÉE LENTE                                         │
│     ...                                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Style** : Hiérarchie visuelle avec mouvements en chiffres romains, marches en gras, types indentés avec pointillés vers pages

### 2. Index par Genre Littéraire

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│               ─────  INDEX DES ŒUVRES  ─────                    │
│                                                                 │
│                       ✦  HAÏKUS  ✦                              │
│                                                                 │
│  Titre du haïku 1 ─ La Roque-Gageac ............... 12          │
│  Titre du haïku 2 ─ Domme ......................... 14          │
│  Titre du haïku 3 ─ Bergerac ...................... 15          │
│                                                                 │
│                      ✦  SENRYŪS  ✦                              │
│                                                                 │
│  Titre 1 ─ Lieu ................................... 28          │
│  ...                                                            │
│                                                                 │
│                       ✦  FABLES  ✦                              │
│                                                                 │
│  La Discorde et les cent-vingt témoins ─ Brantôme .. 67         │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Style** : Titres de genre en petites caps avec ornements, entrées avec titre + lieu + pointillés + page

### 3. Index Thématique (Mots-Clés) - NOUVEAU

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              ─────  INDEX THÉMATIQUE  ─────                     │
│                                                                 │
│  ╭──────────────────────────────────────╮                       │
│  │   FAUNE FLUVIALE ET MIGRATRICE       │                       │
│  ╰──────────────────────────────────────╯                       │
│                                                                 │
│  Aigrette ................................. 23, 45, 67          │
│  Anguille ................................. 12                  │
│  Lamproie ................................. 34, 56, 78          │
│  Martin-pêcheur ........................... 89, 102             │
│  Saumon ................................... 15, 23, 45          │
│                                                                 │
│  ╭──────────────────────────────────────╮                       │
│  │   HYDROLOGIE ET DYNAMIQUES           │                       │
│  ╰──────────────────────────────────────╯                       │
│                                                                 │
│  Confluence ............................... 12, 45              │
│  Étiage ................................... 23, 67              │
│  Mascaret ................................. 89                  │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Style** : 7 familles encadrées, mots-clés alphabétiques avec pointillés vers pages multiples

## Architecture technique

### Fichiers à modifier

1. **`src/utils/pdfExportUtils.ts`** - Ajouter option `includeIndexKeywords` et catégories
2. **`src/utils/pdfStyleGenerator.ts`** - Nouveaux styles d'index (titres ornés, pointillés, colonnes)
3. **`src/utils/pdfPageComponents.tsx`** - Nouveaux composants :
   - `IndexLieuxPage` - Index géographique hiérarchique
   - `IndexGenresPage` - Index par type littéraire
   - `IndexKeywordsPage` - Index thématique par mots-clés

### Nouvelles options dans `PdfExportOptions`

```typescript
// Indexes (existant mais non implémenté)
includeIndexLieux: boolean;      // Index par Lieu
includeIndexGenres: boolean;     // Index par Genre Littéraire
// NOUVEAU
includeIndexKeywords: boolean;   // Index Thématique
selectedKeywordCategories?: string[]; // Catégories à inclure
```

### Nouveaux styles dans `PdfStylesRaw`

```typescript
// Index styling
indexLieuxPage: Style;
indexGenresPage: Style;
indexKeywordsPage: Style;
indexSectionTitle: Style;        // "✦ HAÏKUS ✦"
indexPartieHeader: Style;        // "I. LE CONTRE-COURANT"
indexMarcheEntry: Style;         // "La Roque-Gageac"
indexTextEntry: Style;           // Titre + lieu + page
indexDotLeader: Style;           // Pointillés vers page
indexCategoryBox: Style;         // Encadré catégorie thématique
indexKeywordEntry: Style;        // Mot + pages
```

### Logique de pagination

1. **Calcul des pages réelles** : Parcourir tous les textes et calculer leur page finale
2. **Regroupement** : 
   - Par lieu : Partie > Marche > Types (avec pages)
   - Par genre : Type > Textes (avec lieu + page)
   - Par mot-clé : Catégorie > Mots (avec pages multiples)
3. **Rendu** : Générer les pages d'index avec wrap automatique

### Composant `IndexLieuxPage`

```tsx
interface IndexLieuxPageProps {
  textes: TexteExport[];
  parties: PartieData[];
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageMapping: Map<string, number>; // texteId -> pageNumber
  startPage: number;
}
```

### Composant `IndexGenresPage`

```tsx
interface IndexGenresPageProps {
  textes: TexteExport[];
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageMapping: Map<string, number>;
  startPage: number;
}
```

### Composant `IndexKeywordsPage`

```tsx
interface IndexKeywordsPageProps {
  textes: TexteExport[];
  selectedCategories: string[];
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageMapping: Map<string, number>;
  startPage: number;
}
```

## Séquence de génération finale

```text
1. Couverture
2. (Faux-titre - désactivé pour Galerie Fleuve)
3. Table des Matières (Mouvement > Marche + page)
4. Contenu (Parties, Textes...)
5. ─────────────────────────────
6. Index par Lieu (géographique)
7. Index des Œuvres (par genre)
8. Index Thématique (mots-clés) - optionnel
9. ─────────────────────────────
10. Colophon
```

## Bénéfices pour un éditeur national

| Critère | Impact |
|---------|--------|
| **Navigation papier** | 3 modes d'accès complémentaires au contenu |
| **Référencement** | Chaque texte trouvable par lieu, genre OU thème |
| **Prestige éditorial** | Standards des grandes maisons d'édition |
| **Cohérence visuelle** | Ornements et typographie alignés sur le reste du livre |
| **Valeur ajoutée** | Index thématique unique pour recueil géopoétique |

## Fichiers à modifier

1. `src/utils/pdfExportUtils.ts` - Options et types
2. `src/utils/pdfStyleGenerator.ts` - Styles des index
3. `src/utils/pdfPageComponents.tsx` - Composants d'index + intégration dans PdfDocument

