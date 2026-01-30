
# Plan : Export PDF Ultra-Design pour Éditeurs et Lecteurs Partenaires

## Vision
Créer un système d'export PDF de référence pour la poésie contemporaine du XXIe siècle, capable de produire des documents prêts pour l'impression professionnelle et la distribution aux éditeurs nationaux.

## Analyse de l'existant

### Architecture actuelle
Le projet dispose déjà d'un système d'export sophistiqué :
- **EPUB Pro** (`epubExportUtils.ts`) : 1176 lignes avec presets artistiques, génération de chapitres, CSS dynamique
- **Word** (`wordExportUtils.ts`) : 1543 lignes pour manuscrits éditoriaux
- **Panel de configuration** (`EpubExportPanel.tsx`) : UI complète avec 7 presets artistiques

### Atouts à réutiliser
- Les 7 presets de direction artistique (Galerie Fleuve, Fréquence du Vivant, Dordonia, etc.)
- La logique de regroupement par Partie/Marche (`groupTextesByPartie`)
- Le système de métadonnées et génération IA
- Le parsing HTML vers structure formatée (`parseHtmlContent`)

## Spécifications du PDF "Ultra-Design"

### Caractéristiques techniques
- **Format** : A5 (148 x 210 mm) - format standard poésie française
- **Résolution** : 300 DPI minimum pour impression offset
- **Polices embarquées** : Conformité PDF/A pour archivage
- **Marges** : Intérieures/extérieures asymétriques (reliure)
- **Numérotation** : Romains pour liminaires, arabes pour corps

### Éléments de mise en page premium
1. **Page de titre** : Composition typographique sophistiquée
2. **Page de faux-titre** : Minimaliste, nom + titre seuls
3. **Achevé d'imprimer** : Colophon professionnel
4. **Pages de mouvement** : Grandes capitales romaines centrées
5. **Haïkus** : Centrage vertical + horizontal, espace généreux
6. **Fables** : Encadrement décoratif subtil
7. **Index** : Deux colonnes, renvois de pages

## Architecture technique proposée

### Nouvelle dépendance
```bash
npm install @react-pdf/renderer
```

Cette bibliothèque permet un contrôle typographique précis via des composants React, idéal pour la poésie où chaque espace compte.

### Nouveaux fichiers

```text
src/utils/
├── pdfExportUtils.ts          # Logique principale (types, presets, génération)
├── pdfStyleGenerator.ts       # Générateur de styles PDF depuis presets
└── pdfPageComponents.tsx      # Composants React-PDF (Cover, Toc, Partie, Texte, Index)

src/components/admin/
├── PdfExportPanel.tsx         # Panel de configuration PDF
└── PdfPreview.tsx             # Aperçu temps réel du PDF
```

### Structure de `pdfExportUtils.ts`

```typescript
// Types spécifiques PDF (héritant des types EPUB)
export interface PdfExportOptions extends Omit<EpubExportOptions, 'format'> {
  format: EpubExportOptions['format'];
  
  // Options spécifiques PDF
  pageSize: 'A5' | 'A4' | 'Letter' | 'Custom';
  customWidth?: number;
  customHeight?: number;
  orientation: 'portrait' | 'landscape';
  
  // Marges (mm)
  marginInner: number;   // Côté reliure
  marginOuter: number;
  marginTop: number;
  marginBottom: number;
  
  // Options impression
  bleed: boolean;        // Fond perdu (3mm)
  cropMarks: boolean;    // Traits de coupe
  
  // Éléments optionnels
  includeFauxTitre: boolean;
  includeColophon: boolean;
  colophonText?: string;
  
  // Numérotation
  pageNumberStyle: 'arabic' | 'roman-preface' | 'none';
  startPageNumber: number;
}

// Presets PDF (étendent les presets EPUB)
export const PDF_PRESETS = {
  edition_nationale: {
    ...EPUB_PRESETS.classique,
    pageSize: 'A5',
    marginInner: 25,
    marginOuter: 20,
    marginTop: 30,
    marginBottom: 25,
    includeFauxTitre: true,
    includeColophon: true,
  },
  collection_poche: {
    ...EPUB_PRESETS.poesie_poche,
    pageSize: 'Custom',
    customWidth: 110,
    customHeight: 178,
    marginInner: 15,
    marginOuter: 12,
  },
  // ... autres presets
};
```

### Composants React-PDF

```typescript
// pdfPageComponents.tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Enregistrement des polices (Google Fonts)
Font.register({
  family: 'Playfair Display',
  src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiunDYbtU.ttf'
});

// Composant page de couverture
const CoverPage = ({ options, colorScheme, typography }) => (
  <Page size={options.pageSize} style={styles.coverPage}>
    <View style={styles.coverContent}>
      <Text style={[styles.coverTitle, { color: colorScheme.primary }]}>
        {options.title}
      </Text>
      {options.subtitle && (
        <Text style={[styles.coverSubtitle, { color: colorScheme.secondary }]}>
          {options.subtitle}
        </Text>
      )}
      <Text style={[styles.coverAuthor, { color: colorScheme.text }]}>
        {options.author}
      </Text>
    </View>
  </Page>
);

// Composant page de mouvement (Partie)
const PartiePage = ({ partie, colorScheme }) => (
  <Page size="A5" style={styles.partiePage}>
    <View style={styles.partieContent}>
      <Text style={styles.partieNumeral}>{partie.numeroRomain}</Text>
      <Text style={styles.partieTitre}>{partie.titre}</Text>
      {partie.sousTitre && (
        <Text style={styles.partieSousTitre}>{partie.sousTitre}</Text>
      )}
      <Text style={styles.partieSeparator}>───────────────────</Text>
    </View>
  </Page>
);

// Composant texte (avec gestion haïku/fable/poème)
const TextePage = ({ texte, isHaiku, isFable, colorScheme, pageNumber }) => (
  <Page size="A5" style={styles.textePage}>
    <View style={isHaiku ? styles.haikuContainer : styles.texteContainer}>
      <Text style={styles.texteTitle}>
        {isFable ? `Fable : ${texte.titre}` : texte.titre}
      </Text>
      <Text style={styles.texteContent}>
        {sanitizeContent(texte.contenu)}
      </Text>
    </View>
    <Text style={styles.pageNumber}>{pageNumber}</Text>
  </Page>
);
```

### Intégration dans l'interface

Le `PdfExportPanel.tsx` reprendra la structure de `EpubExportPanel.tsx` avec :

1. **Section Métadonnées** : Identique à l'EPUB (réutilisation)
2. **Section Direction Artistique** : Mêmes 7 presets + options PDF spécifiques
3. **Section Format d'impression** :
   - Choix du format (A5, A4, personnalisé)
   - Configuration des marges
   - Options de prépresse (fond perdu, traits de coupe)
4. **Section Contenu** : Identique à l'EPUB
5. **Aperçu PDF** : Miniatures des premières pages

### Position dans ExportationsAdmin.tsx

Ajouter une nouvelle `Card` après l'EPUB Pro :

```tsx
{/* PDF Export Card - Full Width */}
<Card className="border-dashed border-2 border-amber-600/30 bg-amber-950/10">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <FileText className="h-5 w-5 text-amber-500" />
      Export PDF Professionnel
    </CardTitle>
    <CardDescription>
      Créez un PDF ultra-design pour éditeurs et lecteurs partenaires
    </CardDescription>
  </CardHeader>
  <CardContent>
    <PdfExportPanel
      textes={filteredTextes}
      explorationCoverUrl={...}
      explorationName={...}
      onRefresh={() => loadData(true)}
    />
  </CardContent>
</Card>
```

## Fonctionnalités avancées

### Génération côté client
Comme pour l'EPUB, tout se fait dans le navigateur :
```typescript
import { pdf } from '@react-pdf/renderer';

export const downloadPdf = async (textes, options) => {
  const document = <PdfDocument textes={textes} options={options} />;
  const blob = await pdf(document).toBlob();
  saveAs(blob, `${options.title}.pdf`);
};
```

### Table des matières avec liens internes
React-PDF supporte les ancres et liens internes pour une ToC cliquable dans le PDF.

### Gestion des polices
Chargement dynamique depuis Google Fonts avec mise en cache :
```typescript
const loadFonts = async (typography) => {
  await Font.register({
    family: typography.bodyFont,
    src: getFontUrl(typography.bodyFont),
  });
  await Font.register({
    family: typography.headingFont,
    src: getFontUrl(typography.headingFont),
  });
};
```

## Plan d'implémentation

### Étape 1 : Infrastructure de base
- Installer `@react-pdf/renderer`
- Créer `pdfExportUtils.ts` avec types et presets
- Créer `pdfStyleGenerator.ts` pour convertir les presets EPUB en styles PDF

### Étape 2 : Composants de page
- Créer `pdfPageComponents.tsx` avec :
  - CoverPage, FauxTitrePage
  - TocPage (table des matières)
  - PartiePage (mouvements)
  - MarchePage (en-tête de marche)
  - TextePage (textes avec variantes haïku/fable)
  - IndexPage (lieu/genre)
  - ColophonPage

### Étape 3 : Panel de configuration
- Créer `PdfExportPanel.tsx` en réutilisant la structure de `EpubExportPanel.tsx`
- Ajouter les options spécifiques PDF (format, marges, prépresse)

### Étape 4 : Aperçu en temps réel
- Créer `PdfPreview.tsx` avec rendu miniature des pages
- Intégrer le composant `@react-pdf/renderer` viewer

### Étape 5 : Intégration finale
- Ajouter le panel dans `ExportationsAdmin.tsx`
- Tests de génération avec différents presets
- Optimisation des performances

## Résultat attendu

Un système d'export PDF qui :
- Génère des documents prêts pour l'impression professionnelle
- Respecte les standards typographiques de la poésie française
- S'adapte aux 7 directions artistiques existantes
- Produit des fichiers conformes pour soumission aux maisons d'édition nationales
- Fonctionne entièrement côté client (pas de serveur)

