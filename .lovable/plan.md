
# Plan : Export EPUB Professionnel "Ultra-Design"

## Resume Executif

Implementation d'un systeme d'export EPUB natif offrant une direction artistique complete, le support des visuels, et des presets de format pour produire des eBooks de qualite editoriale professionnelle.

---

## Architecture Proposee

```text
src/
├── utils/
│   └── epubExportUtils.ts        # Nouveau: Generation EPUB native
├── components/admin/
│   └── EpubExportPanel.tsx       # Nouveau: Interface de configuration artistique
│   └── EpubPreview.tsx           # Nouveau: Previsualisation EPUB live
│   └── CoverEditor.tsx           # Nouveau: Editeur de couverture
└── pages/
    └── ExportationsAdmin.tsx     # Extension: Nouvel onglet EPUB
```

---

## Phase 1 : Infrastructure de Base

### 1.1 Dependances

Ajout de la bibliotheque `epub-gen-memory` pour la generation EPUB en memoire cote client.

```text
npm install epub-gen-memory qrcode
```

**Pourquoi cette bibliotheque ?**
- Generation 100% client-side (pas d'Edge Function requise)
- Support complet des images, CSS personnalise, metadonnees
- Compatible avec le flux d'export existant (similar a docx + file-saver)

### 1.2 Nouveau Fichier : `src/utils/epubExportUtils.ts`

Structure principale :

```text
Interface EpubExportOptions {
  // Metadonnees editoriales
  title: string
  author: string
  subtitle?: string
  publisher?: string
  isbn?: string
  language: 'fr' | 'en'
  description?: string
  
  // Direction artistique
  format: 'classique' | 'poesie_poche' | 'livre_art' | 'contemporain'
  colorScheme: {
    primary: string      // Couleur titres
    secondary: string    // Couleur sous-titres
    background: string   // Couleur fond
    text: string         // Couleur texte
    accent: string       // Couleur decorations
  }
  typography: {
    bodyFont: 'Garamond' | 'Libre Baskerville' | 'EB Garamond' | 'Crimson Pro'
    headingFont: 'Playfair Display' | 'Cormorant Garamond' | 'Libre Baskerville'
    baseFontSize: number // en rem
    lineHeight: number
  }
  
  // Contenu
  includeCover: boolean
  coverImageUrl?: string
  includeTableOfContents: boolean
  includePartiePages: boolean
  includeIllustrations: boolean
  
  // Structure
  organizationMode: 'type' | 'marche'
  includeMetadata: boolean
  includeIndexes: boolean
}
```

### 1.3 Presets de Format

Quatre directions artistiques pre-configurees :

```text
EPUB_PRESETS = {
  classique: {
    name: "Classique Editorial"
    description: "Format traditionnel pour editeurs"
    colorScheme: { primary: '#1a1a1a', secondary: '#666666', background: '#ffffff', text: '#333333', accent: '#8b7355' }
    typography: { bodyFont: 'Garamond', headingFont: 'Playfair Display', baseFontSize: 1.1, lineHeight: 1.7 }
  },
  poesie_poche: {
    name: "Recueil de Poche"
    description: "Format compact pour poesie"
    colorScheme: { primary: '#2d3748', secondary: '#718096', background: '#f7fafc', text: '#1a202c', accent: '#4a5568' }
    typography: { bodyFont: 'Crimson Pro', headingFont: 'Cormorant Garamond', baseFontSize: 1.0, lineHeight: 1.8 }
  },
  livre_art: {
    name: "Livre d'Art"
    description: "Mise en page visuelle immersive"
    colorScheme: { primary: '#1e3a5f', secondary: '#3d6098', background: '#f0f4f8', text: '#0a1929', accent: '#5c8cc9' }
    typography: { bodyFont: 'EB Garamond', headingFont: 'Libre Baskerville', baseFontSize: 1.2, lineHeight: 1.6 }
  },
  contemporain: {
    name: "Contemporain Minimaliste"
    description: "Design epure moderne"
    colorScheme: { primary: '#000000', secondary: '#4a4a4a', background: '#ffffff', text: '#1a1a1a', accent: '#e53935' }
    typography: { bodyFont: 'Libre Baskerville', headingFont: 'Playfair Display', baseFontSize: 1.0, lineHeight: 1.9 }
  }
}
```

---

## Phase 2 : Generation CSS Dynamique

### 2.1 Feuilles de Style EPUB

Chaque EPUB generera un CSS personnalise base sur les options :

```text
generateEpubCSS(options: EpubExportOptions) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=${options.typography.bodyFont}');
    @import url('https://fonts.googleapis.com/css2?family=${options.typography.headingFont}');
    
    body {
      font-family: '${options.typography.bodyFont}', Georgia, serif;
      font-size: ${options.typography.baseFontSize}rem;
      line-height: ${options.typography.lineHeight};
      color: ${options.colorScheme.text};
      background: ${options.colorScheme.background};
    }
    
    h1, h2, h3 {
      font-family: '${options.typography.headingFont}', serif;
      color: ${options.colorScheme.primary};
    }
    
    .partie-cover {
      page-break-before: always;
      text-align: center;
      padding-top: 40%;
    }
    
    .partie-numeral {
      font-size: 4rem;
      color: ${options.colorScheme.primary};
    }
    
    .haiku-container {
      text-align: center;
      margin: 2rem auto;
      max-width: 80%;
    }
    
    .illustration {
      max-width: 100%;
      margin: 1.5rem auto;
      display: block;
    }
    
    .qr-code {
      width: 80px;
      height: 80px;
      margin: 1rem auto;
    }
  `;
}
```

---

## Phase 3 : Integration des Visuels

### 3.1 Sources d'Images

Le systeme exploitera les images existantes :

```text
Sources disponibles :
1. exploration.cover_image_url      -> Couverture principale
2. marche_photos (table)            -> Illustrations par marche
3. marche_photo_tags                -> Filtrage par categorie (croquis, paysage, etc.)
4. Storage bucket: marche-photos    -> URLs publiques
```

### 3.2 Gestion des Couvertures

```text
Interface CoverConfig {
  type: 'image' | 'generated'
  imageUrl?: string            // URL existante ou upload
  generatedOptions?: {
    layout: 'centered' | 'full_bleed' | 'split'
    showAuthor: boolean
    showSubtitle: boolean
    overlayColor?: string
    overlayOpacity?: number
  }
}
```

### 3.3 Integration des Illustrations

Pour chaque marche, possibilite d'inclure les photos associees :

```text
async function fetchMarcheIllustrations(marcheId: string) {
  const { data } = await supabase
    .from('marche_photos')
    .select('id, url_supabase, titre, description, ordre')
    .eq('marche_id', marcheId)
    .order('ordre');
    
  return data.map(photo => ({
    url: getPhotoUrl(photo),
    caption: photo.titre || '',
    placement: 'after_texts' // ou 'before_texts', 'inline'
  }));
}
```

### 3.4 QR Codes

Generation de QR codes pour liens interactifs :

```text
import QRCode from 'qrcode';

async function generateQRCode(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 150,
    margin: 1,
    color: { dark: '#333333', light: '#ffffff' }
  });
}

// Usage : QR vers audio de la marche, carte interactive, etc.
```

---

## Phase 4 : Interface Utilisateur

### 4.1 Nouveau Composant : `EpubExportPanel.tsx`

Structure de l'interface :

```text
<Card className="border-emerald-500/30 bg-emerald-50/10">
  <CardHeader>
    <CardTitle>Export EPUB Professionnel</CardTitle>
    <CardDescription>Creez un eBook haute qualite pour lecteurs et plateformes</CardDescription>
  </CardHeader>
  
  <CardContent>
    {/* Section 1: Metadonnees */}
    <MetadataSection>
      - Titre du livre
      - Sous-titre
      - Auteur
      - Editeur (optionnel)
      - ISBN (optionnel)
      - Description
    </MetadataSection>
    
    {/* Section 2: Direction Artistique */}
    <DesignSection>
      - Selection du preset (4 cartes visuelles)
      - Personnalisation des couleurs (color pickers)
      - Selection des polices
      - Taille de base et interligne
    </DesignSection>
    
    {/* Section 3: Couverture */}
    <CoverSection>
      - Upload d'image personnalisee
      - Ou selection depuis cover_image_url de l'exploration
      - Ou generation automatique stylisee
    </CoverSection>
    
    {/* Section 4: Contenu */}
    <ContentSection>
      - Inclure table des matieres interactive
      - Inclure pages de parties (mouvements)
      - Inclure illustrations des marches
      - Inclure QR codes audio
      - Mode d'organisation (type/marche)
    </ContentSection>
    
    {/* Section 5: Previsualisation */}
    <EpubPreview />
    
    {/* Action */}
    <Button onClick={generateEpub}>
      Generer l'EPUB
    </Button>
  </CardContent>
</Card>
```

### 4.2 Previsualisation Live

Composant affichant un apercu de la mise en page avec les styles selectionnes :

```text
<EpubPreview 
  textes={filteredTextes}
  options={currentOptions}
  previewMode="cover" | "partie" | "texte" | "illustration"
/>
```

---

## Phase 5 : Structure EPUB Generee

### 5.1 Chapitres EPUB

L'EPUB sera structure en chapitres NCX :

```text
epub-structure:
  ├── cover.xhtml          # Page de couverture
  ├── toc.xhtml            # Table des matieres interactive
  ├── partie-1.xhtml       # Page Partie I (si active)
  │   ├── marche-1.xhtml   # Contenus marche 1
  │   └── marche-2.xhtml   # Contenus marche 2
  ├── partie-2.xhtml       # Page Partie II
  │   └── ...
  ├── index-lieux.xhtml    # Index par lieu (optionnel)
  └── index-genres.xhtml   # Index par genre (optionnel)
```

### 5.2 Fonction Principale

```text
async function exportToEpub(
  textes: TexteExport[],
  options: EpubExportOptions,
  illustrations?: Map<string, IllustrationData[]>
): Promise<Blob> {
  
  // 1. Generer le CSS personnalise
  const customCSS = generateEpubCSS(options);
  
  // 2. Preparer les chapitres
  const chapters = [];
  
  // 2a. Couverture
  if (options.includeCover) {
    chapters.push(await createCoverChapter(options));
  }
  
  // 2b. Table des matieres
  if (options.includeTableOfContents) {
    chapters.push(createTOCChapter(textes, options));
  }
  
  // 2c. Contenu par partie/marche
  const partieGroups = groupTextesByPartie(textes);
  for (const { partie, marches } of partieGroups) {
    if (options.includePartiePages && partie) {
      chapters.push(createPartieChapter(partie, options));
    }
    
    for (const [marcheName, { textes }] of marches) {
      const marcheIllustrations = illustrations?.get(marcheId);
      chapters.push(createMarcheChapter(marcheName, textes, marcheIllustrations, options));
    }
  }
  
  // 2d. Index
  if (options.includeIndexes) {
    chapters.push(createIndexChapter(textes, 'lieu'));
    chapters.push(createIndexChapter(textes, 'genre'));
  }
  
  // 3. Generer l'EPUB
  const epub = await new EPub({
    title: options.title,
    author: options.author,
    publisher: options.publisher || 'Auto-edition',
    lang: options.language,
    description: options.description,
    css: customCSS,
    cover: options.coverImageUrl,
    content: chapters
  }).genEpub();
  
  return new Blob([epub], { type: 'application/epub+zip' });
}
```

---

## Phase 6 : Integration dans ExportationsAdmin.tsx

### 6.1 Nouvel Onglet

Ajout d'un onglet "EPUB" dans le systeme de tabs existant :

```text
<Tabs defaultValue="word">
  <TabsList>
    <TabsTrigger value="word">Word</TabsTrigger>
    <TabsTrigger value="csv">CSV</TabsTrigger>
    <TabsTrigger value="stats">Statistiques</TabsTrigger>
    <TabsTrigger value="vocabulary">Vocabulaire</TabsTrigger>
    <TabsTrigger value="epub">EPUB</TabsTrigger>  {/* Nouveau */}
  </TabsList>
  
  <TabsContent value="epub">
    <EpubExportPanel 
      textes={filteredTextes}
      explorations={explorations}
      selectedExploration={selectedExploration}
    />
  </TabsContent>
</Tabs>
```

---

## Section Technique : Details d'Implementation

### Fichiers a Creer

| Fichier | Description |
|---------|-------------|
| `src/utils/epubExportUtils.ts` | Logique de generation EPUB, presets, CSS dynamique |
| `src/components/admin/EpubExportPanel.tsx` | Interface complete de configuration |
| `src/components/admin/EpubPreview.tsx` | Previsualisation live des styles |
| `src/components/admin/CoverEditor.tsx` | Editeur de couverture avec upload |

### Fichiers a Modifier

| Fichier | Modification |
|---------|-------------|
| `src/pages/ExportationsAdmin.tsx` | Ajout onglet EPUB + import composants |
| `package.json` | Ajout dependances epub-gen-memory, qrcode |

### Dependances NPM

```text
epub-gen-memory : Generation EPUB en memoire
qrcode         : Generation QR codes
```

### Requetes Supabase Supplementaires

```text
1. Fetch cover image depuis explorations.cover_image_url
2. Fetch illustrations depuis marche_photos par marche_id
3. (Optionnel) Fetch tags depuis marche_photo_tags pour filtrer
```

---

## Fonctionnalites Cles

| Fonctionnalite | Description |
|----------------|-------------|
| 4 Presets Artistiques | Classique, Poche, Art, Contemporain |
| Couleurs Personnalisables | Primary, secondary, background, text, accent |
| Typographie Variable | 4 polices corps, 3 polices titres, taille/interligne |
| Couverture Visuelle | Upload, URL existante, ou generation stylisee |
| Illustrations | Integration photos depuis marche_photos |
| QR Codes | Liens vers audio/cartes interactives |
| TOC Interactive | Navigation NCX native |
| Pages Parties | Separation visuelle des mouvements |
| Index Dynamiques | Par lieu et par genre litteraire |
| Previsualisation | Apercu live avant generation |

---

## Estimation

| Phase | Complexite |
|-------|------------|
| Phase 1 : Infrastructure | Moyenne |
| Phase 2 : CSS Dynamique | Faible |
| Phase 3 : Visuels | Moyenne |
| Phase 4 : Interface | Moyenne |
| Phase 5 : Generation | Moyenne |
| Phase 6 : Integration | Faible |

---

## Resultat Attendu

Un systeme d'export EPUB permettant de :
- Produire des eBooks de qualite editoriale professionnelle
- Tester differentes directions artistiques instantanement
- Integrer visuels et QR codes sans outil externe
- Exporter directement pour Amazon KDP, Kobo, Apple Books
- Envoyer un fichier pro aux editeurs de poesie
