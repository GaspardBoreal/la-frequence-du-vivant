import QRCode from 'qrcode';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TexteExport {
  id: string;
  titre: string;
  contenu: string;
  type_texte: string;
  marche_nom?: string;
  marche_ville?: string;
  marche_region?: string;
  marche_date?: string;
  ordre?: number;
  created_at?: string;
  partie_id?: string;
  partie_numero_romain?: string;
  partie_titre?: string;
  partie_sous_titre?: string;
  partie_ordre?: number;
  marche_ordre?: number;
}

export interface EpubColorScheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface EpubTypography {
  bodyFont: 'Georgia' | 'Libre Baskerville' | 'EB Garamond' | 'Crimson Pro' | 'Lora' | 'Merriweather';
  headingFont: 'Playfair Display' | 'Cormorant Garamond' | 'Libre Baskerville' | 'DM Serif Display' | 'Fraunces';
  baseFontSize: number;
  lineHeight: number;
}

export interface EpubExportOptions {
  // Editorial metadata
  title: string;
  author: string;
  subtitle?: string;
  publisher?: string;
  isbn?: string;
  language: 'fr' | 'en';
  description?: string;
  
  // Artistic direction
  format: 'classique' | 'poesie_poche' | 'livre_art' | 'contemporain' | 'galerie_fleuve' | 'frequence_vivant';
  colorScheme: EpubColorScheme;
  typography: EpubTypography;
  
  // Content options
  includeCover: boolean;
  coverImageUrl?: string;
  includeTableOfContents: boolean;
  includePartiePages: boolean;
  includeIllustrations: boolean;
  
  // Structure
  organizationMode: 'type' | 'marche';
  includeMetadata: boolean;
  includeIndexes: boolean;
}

export interface EpubPreset {
  id: string;
  name: string;
  description: string;
  colorScheme: EpubColorScheme;
  typography: EpubTypography;
}

export interface IllustrationData {
  url: string;
  caption?: string;
  placement: 'before_texts' | 'after_texts' | 'inline';
}

export interface EpubChapter {
  title: string;
  content: string;
  excludeFromToc?: boolean;
}

// ============================================================================
// PRESETS
// ============================================================================

export const EPUB_PRESETS: Record<string, EpubPreset> = {
  classique: {
    id: 'classique',
    name: 'Classique Éditorial',
    description: 'Format traditionnel pour éditeurs professionnels',
    colorScheme: {
      primary: '#1a1a1a',
      secondary: '#666666',
      background: '#ffffff',
      text: '#333333',
      accent: '#8b7355',
    },
    typography: {
      bodyFont: 'Georgia',
      headingFont: 'Playfair Display',
      baseFontSize: 1.1,
      lineHeight: 1.7,
    },
  },
  poesie_poche: {
    id: 'poesie_poche',
    name: 'Recueil de Poche',
    description: 'Format compact pour poésie intimiste',
    colorScheme: {
      primary: '#2d3748',
      secondary: '#718096',
      background: '#f7fafc',
      text: '#1a202c',
      accent: '#4a5568',
    },
    typography: {
      bodyFont: 'Crimson Pro',
      headingFont: 'Cormorant Garamond',
      baseFontSize: 1.0,
      lineHeight: 1.8,
    },
  },
  livre_art: {
    id: 'livre_art',
    name: "Livre d'Art",
    description: 'Mise en page visuelle immersive',
    colorScheme: {
      primary: '#1e3a5f',
      secondary: '#3d6098',
      background: '#f0f4f8',
      text: '#0a1929',
      accent: '#5c8cc9',
    },
    typography: {
      bodyFont: 'EB Garamond',
      headingFont: 'Libre Baskerville',
      baseFontSize: 1.2,
      lineHeight: 1.6,
    },
  },
  contemporain: {
    id: 'contemporain',
    name: 'Contemporain Minimaliste',
    description: 'Design épuré moderne',
    colorScheme: {
      primary: '#000000',
      secondary: '#4a4a4a',
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#e53935',
    },
    typography: {
      bodyFont: 'Libre Baskerville',
      headingFont: 'Playfair Display',
      baseFontSize: 1.0,
      lineHeight: 1.9,
    },
  },
  galerie_fleuve: {
    id: 'galerie_fleuve',
    name: 'Galerie Fleuve',
    description: 'Style galerie d\'art épuré, accents émeraude',
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
  frequence_vivant: {
    id: 'frequence_vivant',
    name: 'La Fréquence du Vivant',
    description: 'Thème sombre forêt, accents menthe vive - bioacoustique & poésie',
    colorScheme: {
      primary: '#4ADE80',      // Menthe vive pour titres
      secondary: '#86EFAC',    // Vert clair pour sous-titres
      background: '#14281D',   // Vert forêt profond
      text: '#D1FAE5',         // Texte clair lumineux
      accent: '#22C55E',       // Vert émeraude vif pour CTA
    },
    typography: {
      bodyFont: 'Lora',
      headingFont: 'Playfair Display',
      baseFontSize: 1.05,
      lineHeight: 1.8,
    },
  },
};

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

export const getDefaultEpubOptions = (preset: keyof typeof EPUB_PRESETS = 'classique'): EpubExportOptions => {
  const presetData = EPUB_PRESETS[preset];
  return {
    title: 'Recueil Poétique',
    author: 'Gaspard Boréal',
    subtitle: '',
    publisher: 'Auto-édition',
    isbn: '',
    language: 'fr',
    description: '',
    format: preset as EpubExportOptions['format'],
    colorScheme: { ...presetData.colorScheme },
    typography: { ...presetData.typography },
    includeCover: true,
    coverImageUrl: undefined,
    includeTableOfContents: true,
    includePartiePages: true,
    includeIllustrations: true,
    organizationMode: 'marche',
    includeMetadata: true,
    includeIndexes: true,
  };
};

// ============================================================================
// TEXT TYPE LABELS
// ============================================================================

const TEXT_TYPE_LABELS: Record<string, string> = {
  haiku: 'Haïkus',
  senryu: 'Senryūs',
  haibun: 'Haïbuns',
  poeme: 'Poèmes',
  'texte-libre': 'Textes libres',
  'essai-bref': 'Essais brefs',
  'dialogue-polyphonique': 'Dialogues polyphoniques',
  fable: 'Fables',
  fragment: 'Fragments',
  'carte-poetique': 'Cartes poétiques',
  prose: 'Proses',
  carnet: 'Carnets de terrain',
  correspondance: 'Correspondances',
  manifeste: 'Manifestes',
  glossaire: 'Glossaires poétiques',
  protocole: 'Protocoles hybrides',
  synthese: 'Synthèses IA-Humain',
  'recit-donnees': 'Récits-données',
  recit: 'Récits',
};

// Define a preferred order for text types in the TOC
const TEXT_TYPE_ORDER: string[] = [
  'haiku', 'senryu', 'haibun', 'poeme', 'fable', 'fragment',
  'prose', 'recit', 'texte-libre', 'essai-bref', 'dialogue-polyphonique',
  'carte-poetique', 'carnet', 'correspondance', 'manifeste',
  'glossaire', 'protocole', 'synthese', 'recit-donnees'
];

const getTypeLabel = (type: string): string => {
  return TEXT_TYPE_LABELS[type.toLowerCase()] || type;
};

// ============================================================================
// CSS GENERATION
// ============================================================================

export const generateEpubCSS = (options: EpubExportOptions): string => {
  const { colorScheme, typography } = options;
  
  // Map font names to Google Fonts URL-safe format
  const formatFontName = (font: string) => font.replace(/\s+/g, '+');
  
  return `
@import url('https://fonts.googleapis.com/css2?family=${formatFontName(typography.bodyFont)}:ital,wght@0,400;0,700;1,400&display=swap');
@import url('https://fonts.googleapis.com/css2?family=${formatFontName(typography.headingFont)}:wght@400;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: '${typography.bodyFont}', Georgia, 'Times New Roman', serif;
  font-size: ${typography.baseFontSize}rem;
  line-height: ${typography.lineHeight};
  color: ${colorScheme.text};
  background-color: ${colorScheme.background};
  padding: 1.5rem;
  max-width: 100%;
}

h1, h2, h3, h4, h5, h6 {
  font-family: '${typography.headingFont}', serif;
  color: ${colorScheme.primary};
  margin-bottom: 0.5em;
  line-height: 1.3;
}

h1 {
  font-size: 2rem;
  margin-top: 1.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-top: 1.2rem;
}

h3 {
  font-size: 1.3rem;
  margin-top: 1rem;
}

p {
  margin-bottom: 0.8em;
  text-align: justify;
  hyphens: auto;
}

/* Cover page */
.cover-page {
  text-align: center;
  padding-top: 30%;
  page-break-after: always;
}

.cover-title {
  font-family: '${typography.headingFont}', serif;
  font-size: 2.5rem;
  color: ${colorScheme.primary};
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.cover-subtitle {
  font-size: 1.4rem;
  color: ${colorScheme.secondary};
  font-style: italic;
  margin-bottom: 2rem;
}

.cover-author {
  font-size: 1.2rem;
  color: ${colorScheme.text};
  margin-top: 3rem;
}

.cover-publisher {
  font-size: 1rem;
  color: ${colorScheme.secondary};
  margin-top: 1rem;
}

/* Partie (Movement) cover pages */
.partie-cover {
  page-break-before: always;
  text-align: center;
  padding-top: 35%;
  page-break-after: always;
}

.partie-numeral {
  font-family: '${typography.headingFont}', serif;
  font-size: 4rem;
  color: ${colorScheme.primary};
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.partie-titre {
  font-family: '${typography.headingFont}', serif;
  font-size: 1.8rem;
  color: ${colorScheme.primary};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.partie-sous-titre {
  font-size: 1.2rem;
  color: ${colorScheme.secondary};
  font-style: italic;
}

.partie-separator {
  color: ${colorScheme.accent};
  margin-top: 2rem;
  font-size: 1.5rem;
  letter-spacing: 0.5em;
}

/* Marche section */
.marche-header {
  margin-top: 2rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${colorScheme.accent};
}

.marche-name {
  font-family: '${typography.headingFont}', serif;
  font-size: 1.5rem;
  color: ${colorScheme.primary};
  margin-bottom: 0.25rem;
}

.marche-date {
  font-size: 0.9rem;
  color: ${colorScheme.secondary};
  font-style: italic;
}

/* Text type section */
.type-header {
  font-family: '${typography.headingFont}', serif;
  font-size: 1.2rem;
  color: ${colorScheme.secondary};
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Individual text */
.texte-container {
  margin-bottom: 1.5rem;
  page-break-inside: avoid;
}

.texte-titre {
  font-family: '${typography.headingFont}', serif;
  font-size: 1.1rem;
  color: ${colorScheme.primary};
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.texte-contenu {
  color: ${colorScheme.text};
}

/* Haiku specific styling */
.haiku-container {
  text-align: center;
  margin: 2rem auto;
  max-width: 80%;
  page-break-inside: avoid;
}

.haiku-container .texte-contenu {
  text-align: center;
}

.haiku-container .texte-contenu p {
  text-align: center;
  margin-bottom: 0.3em;
}

/* Fable prefix */
.fable-prefix {
  color: ${colorScheme.accent};
  font-weight: 600;
}

/* Illustrations */
.illustration {
  max-width: 100%;
  margin: 1.5rem auto;
  display: block;
}

.illustration-caption {
  text-align: center;
  font-size: 0.9rem;
  color: ${colorScheme.secondary};
  font-style: italic;
  margin-top: 0.5rem;
}

/* QR Code */
.qr-container {
  text-align: center;
  margin: 1.5rem 0;
}

.qr-code {
  width: 100px;
  height: 100px;
  margin: 0 auto;
}

.qr-label {
  font-size: 0.8rem;
  color: ${colorScheme.secondary};
  margin-top: 0.5rem;
}

/* Table of Contents */
.toc-container {
  page-break-after: always;
}

.toc-title {
  font-family: '${typography.headingFont}', serif;
  font-size: 1.8rem;
  color: ${colorScheme.primary};
  text-align: center;
  margin-bottom: 2rem;
}

.toc-entry {
  margin-bottom: 0.5rem;
  padding-left: 1rem;
}

.toc-entry-partie {
  font-weight: 700;
  margin-top: 1rem;
  padding-left: 0;
}

.toc-entry-marche {
  padding-left: 1.5rem;
  color: ${colorScheme.secondary};
}

/* Index pages */
.index-container {
  page-break-before: always;
}

.index-title {
  font-family: '${typography.headingFont}', serif;
  font-size: 1.5rem;
  color: ${colorScheme.primary};
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${colorScheme.accent};
}

.index-entry {
  margin-bottom: 0.3rem;
}

.index-entry-label {
  font-weight: 600;
  color: ${colorScheme.primary};
}

.index-entry-items {
  color: ${colorScheme.secondary};
  padding-left: 1rem;
}

/* Metadata footer */
.metadata-footer {
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid ${colorScheme.secondary};
  font-size: 0.85rem;
  color: ${colorScheme.secondary};
  text-align: center;
}
`.trim();
};

// ============================================================================
// HTML HELPERS
// ============================================================================

/**
 * Sanitize HTML content for EPUB
 * Preserves basic formatting while removing dangerous elements
 */
const sanitizeHtmlContent = (html: string): string => {
  if (!html) return '';
  
  // Normalize HTML entities
  let content = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Convert div/p/br to proper paragraph structure
  content = content
    .replace(/<div[^>]*>/gi, '<p>')
    .replace(/<\/div>/gi, '</p>')
    .replace(/<br\s*\/?>/gi, '</p><p>');
  
  // Remove span tags but keep content
  content = content.replace(/<\/?span[^>]*>/gi, '');
  
  // Ensure proper paragraph wrapping
  if (!content.trim().startsWith('<p>')) {
    content = `<p>${content}</p>`;
  }
  
  // Clean up empty paragraphs
  content = content.replace(/<p>\s*<\/p>/gi, '');
  
  return content;
};

/**
 * Format date in French
 */
const formatDateFr = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ============================================================================
// QR CODE GENERATION
// ============================================================================

export const generateQRCodeDataUrl = async (
  url: string,
  darkColor: string = '#333333',
  lightColor: string = '#ffffff'
): Promise<string> => {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 150,
      margin: 1,
      color: { dark: darkColor, light: lightColor },
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

// ============================================================================
// CHAPTER CREATION
// ============================================================================

/**
 * Create cover page chapter
 */
const createCoverChapter = (options: EpubExportOptions): EpubChapter => {
  const coverImageHtml = options.coverImageUrl
    ? `<img src="${options.coverImageUrl}" alt="Couverture" style="max-width: 100%; max-height: 60%; object-fit: contain; margin-bottom: 2rem;" />`
    : '';
  
  return {
    title: 'Couverture',
    excludeFromToc: true,
    content: `
      <div class="cover-page">
        ${coverImageHtml}
        <h1 class="cover-title">${options.title}</h1>
        ${options.subtitle ? `<p class="cover-subtitle">${options.subtitle}</p>` : ''}
        <p class="cover-author">${options.author}</p>
        ${options.publisher ? `<p class="cover-publisher">${options.publisher}</p>` : ''}
      </div>
    `.trim(),
  };
};

/**
 * Create table of contents chapter
 */
const createTocChapter = (
  textes: TexteExport[],
  options: EpubExportOptions
): EpubChapter => {
  const groups = groupTextesByPartie(textes);
  
  let tocHtml = '<div class="toc-container">';
  tocHtml += '<h1 class="toc-title">Table des Matières</h1>';
  
  for (const group of groups) {
    if (group.partie && options.includePartiePages) {
      tocHtml += `<p class="toc-entry toc-entry-partie">${group.partie.numeroRomain}. ${group.partie.titre}</p>`;
    }
    
    for (const [marcheName, marcheData] of group.marches) {
      tocHtml += `<p class="toc-entry toc-entry-marche">• ${marcheName}</p>`;
    }
  }
  
  tocHtml += '</div>';
  
  return {
    title: 'Table des Matières',
    content: tocHtml,
    excludeFromToc: true,
  };
};

/**
 * Create partie (movement) cover chapter
 */
const createPartieChapter = (
  partie: { numeroRomain: string; titre: string; sousTitre?: string },
  options: EpubExportOptions
): EpubChapter => {
  return {
    title: `${partie.numeroRomain}. ${partie.titre}`,
    content: `
      <div class="partie-cover">
        <p class="partie-numeral">${partie.numeroRomain}</p>
        <h1 class="partie-titre">${partie.titre}</h1>
        ${partie.sousTitre ? `<p class="partie-sous-titre">${partie.sousTitre}</p>` : ''}
        <p class="partie-separator">───────────────────</p>
      </div>
    `.trim(),
  };
};

/**
 * Create marche chapter with all its texts
 */
const createMarcheChapter = (
  marcheName: string,
  marcheData: { date: string | null; textes: TexteExport[] },
  options: EpubExportOptions,
  illustrations?: IllustrationData[]
): EpubChapter => {
  let html = '<div class="marche-chapter">';
  
  // Marche header
  html += '<div class="marche-header">';
  html += `<h2 class="marche-name">${marcheName}</h2>`;
  if (marcheData.date) {
    html += `<p class="marche-date">${formatDateFr(marcheData.date)}</p>`;
  }
  html += '</div>';
  
  // Add illustrations before texts if specified
  if (illustrations && options.includeIllustrations) {
    const beforeIllustrations = illustrations.filter(i => i.placement === 'before_texts');
    for (const ill of beforeIllustrations) {
      html += `
        <figure>
          <img class="illustration" src="${ill.url}" alt="${ill.caption || 'Illustration'}" />
          ${ill.caption ? `<figcaption class="illustration-caption">${ill.caption}</figcaption>` : ''}
        </figure>
      `;
    }
  }
  
  // Group texts by type for organized presentation
  const textsByType = new Map<string, TexteExport[]>();
  marcheData.textes.forEach(texte => {
    const type = texte.type_texte.toLowerCase();
    if (!textsByType.has(type)) {
      textsByType.set(type, []);
    }
    textsByType.get(type)!.push(texte);
  });
  
  // Sort types by preferred order
  const sortedTypes = Array.from(textsByType.keys()).sort((a, b) => {
    const indexA = TEXT_TYPE_ORDER.indexOf(a);
    const indexB = TEXT_TYPE_ORDER.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  // Render texts by type
  for (const type of sortedTypes) {
    const textes = textsByType.get(type)!;
    const isHaiku = type === 'haiku' || type === 'senryu';
    const isFable = type === 'fable';
    
    html += `<h3 class="type-header">${getTypeLabel(type)}</h3>`;
    
    for (const texte of textes) {
      const containerClass = isHaiku ? 'texte-container haiku-container' : 'texte-container';
      const title = isFable ? `<span class="fable-prefix">Fable : </span>${texte.titre}` : texte.titre;
      
      html += `
        <div class="${containerClass}">
          <h4 class="texte-titre">${title}</h4>
          <div class="texte-contenu">
            ${sanitizeHtmlContent(texte.contenu)}
          </div>
        </div>
      `;
    }
  }
  
  // Add illustrations after texts if specified
  if (illustrations && options.includeIllustrations) {
    const afterIllustrations = illustrations.filter(i => i.placement === 'after_texts');
    for (const ill of afterIllustrations) {
      html += `
        <figure>
          <img class="illustration" src="${ill.url}" alt="${ill.caption || 'Illustration'}" />
          ${ill.caption ? `<figcaption class="illustration-caption">${ill.caption}</figcaption>` : ''}
        </figure>
      `;
    }
  }
  
  html += '</div>';
  
  return {
    title: marcheName,
    content: html,
  };
};

/**
 * Create index by location chapter
 */
const createIndexByLocationChapter = (
  textes: TexteExport[],
  options: EpubExportOptions
): EpubChapter => {
  // Group texts by location
  const locationMap = new Map<string, Set<string>>();
  
  textes.forEach(texte => {
    const location = texte.marche_nom || texte.marche_ville || 'Sans lieu';
    const type = getTypeLabel(texte.type_texte);
    
    if (!locationMap.has(location)) {
      locationMap.set(location, new Set());
    }
    locationMap.get(location)!.add(type);
  });
  
  let html = '<div class="index-container">';
  html += '<h2 class="index-title">Index par Lieu</h2>';
  
  const sortedLocations = Array.from(locationMap.keys()).sort();
  for (const location of sortedLocations) {
    const types = Array.from(locationMap.get(location)!).sort().join(', ');
    html += `
      <p class="index-entry">
        <span class="index-entry-label">${location}</span>
        <span class="index-entry-items"> — ${types}</span>
      </p>
    `;
  }
  
  html += '</div>';
  
  return {
    title: 'Index par Lieu',
    content: html,
  };
};

/**
 * Create index by genre chapter
 */
const createIndexByGenreChapter = (
  textes: TexteExport[],
  options: EpubExportOptions
): EpubChapter => {
  // Group locations by text type
  const genreMap = new Map<string, Set<string>>();
  
  textes.forEach(texte => {
    const type = texte.type_texte.toLowerCase();
    const location = texte.marche_nom || texte.marche_ville || 'Sans lieu';
    
    if (!genreMap.has(type)) {
      genreMap.set(type, new Set());
    }
    genreMap.get(type)!.add(location);
  });
  
  let html = '<div class="index-container">';
  html += '<h2 class="index-title">Index par Genre Littéraire</h2>';
  
  // Sort by preferred order
  const sortedTypes = Array.from(genreMap.keys()).sort((a, b) => {
    const indexA = TEXT_TYPE_ORDER.indexOf(a);
    const indexB = TEXT_TYPE_ORDER.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  for (const type of sortedTypes) {
    const locations = Array.from(genreMap.get(type)!).sort().join(', ');
    html += `
      <p class="index-entry">
        <span class="index-entry-label">${getTypeLabel(type)}</span>
        <span class="index-entry-items"> — ${locations}</span>
      </p>
    `;
  }
  
  html += '</div>';
  
  return {
    title: 'Index par Genre',
    content: html,
  };
};

// ============================================================================
// GROUPING LOGIC
// ============================================================================

interface PartieInfo {
  id: string;
  numeroRomain: string;
  titre: string;
  sousTitre?: string;
  ordre: number;
}

interface MarcheGroup {
  date: string | null;
  textes: TexteExport[];
  marche_ordre: number;
}

interface PartieGroup {
  partie: PartieInfo | null;
  marches: Map<string, MarcheGroup>;
}

/**
 * Group texts by partie (movement) and marche
 */
export const groupTextesByPartie = (textes: TexteExport[]): PartieGroup[] => {
  const partiesMap = new Map<string, PartieGroup>();
  const unassignedMarches = new Map<string, MarcheGroup>();

  textes.forEach(texte => {
    const marcheKey = texte.marche_nom || texte.marche_ville || 'Sans lieu';
    
    if (texte.partie_id && texte.partie_numero_romain && texte.partie_titre) {
      // Assigned to a partie
      if (!partiesMap.has(texte.partie_id)) {
        partiesMap.set(texte.partie_id, {
          partie: {
            id: texte.partie_id,
            numeroRomain: texte.partie_numero_romain,
            titre: texte.partie_titre,
            sousTitre: texte.partie_sous_titre,
            ordre: texte.partie_ordre ?? 999,
          },
          marches: new Map(),
        });
      }
      
      const partieGroup = partiesMap.get(texte.partie_id)!;
      if (!partieGroup.marches.has(marcheKey)) {
        partieGroup.marches.set(marcheKey, { 
          date: texte.marche_date || null, 
          textes: [],
          marche_ordre: texte.marche_ordre ?? 999,
        });
      }
      partieGroup.marches.get(marcheKey)!.textes.push(texte);
    } else {
      // Not assigned to any partie
      if (!unassignedMarches.has(marcheKey)) {
        unassignedMarches.set(marcheKey, { 
          date: texte.marche_date || null, 
          textes: [],
          marche_ordre: texte.marche_ordre ?? 999,
        });
      }
      unassignedMarches.get(marcheKey)!.textes.push(texte);
    }
  });

  // Sort textes within each marche by texte.ordre
  partiesMap.forEach(partieGroup => {
    partieGroup.marches.forEach(marcheGroup => {
      marcheGroup.textes.sort((a, b) => (a.ordre ?? 999) - (b.ordre ?? 999));
    });
  });
  unassignedMarches.forEach(group => {
    group.textes.sort((a, b) => (a.ordre ?? 999) - (b.ordre ?? 999));
  });

  // Convert to array and sort by partie ordre
  const sortedParties = Array.from(partiesMap.values())
    .filter(group => group.partie !== null)
    .sort((a, b) => (a.partie!.ordre) - (b.partie!.ordre));

  // Sort marches within each partie by marche_ordre
  sortedParties.forEach(partieGroup => {
    const sortedMarches = new Map(
      Array.from(partieGroup.marches.entries())
        .sort((a, b) => a[1].marche_ordre - b[1].marche_ordre)
    );
    partieGroup.marches = sortedMarches;
  });

  // Add unassigned marches at the end if any exist
  if (unassignedMarches.size > 0) {
    const sortedUnassigned = new Map(
      Array.from(unassignedMarches.entries())
        .sort((a, b) => a[1].marche_ordre - b[1].marche_ordre)
    );
    sortedParties.push({
      partie: null,
      marches: sortedUnassigned,
    });
  }

  return sortedParties;
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export interface EpubGenerationResult {
  blob: Blob;
  filename: string;
}

/**
 * Generate EPUB from texts and options
 * Uses dynamic import for epub-gen-memory to avoid bundling issues
 */
export const exportToEpub = async (
  textes: TexteExport[],
  options: EpubExportOptions,
  illustrations?: Map<string, IllustrationData[]>
): Promise<EpubGenerationResult> => {
  // Dynamic import of epub-gen-memory BROWSER BUNDLE (not the Node entry)
  // The browser bundle includes shims for path/fs and uses JSZip with Blob output
  console.log('[EPUB] Loading browser bundle: epub-gen-memory/dist/bundle.min.js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const epubGenModule = await import('epub-gen-memory/dist/bundle.min.js') as any;
  const EPub = epubGenModule.default || epubGenModule;
  console.log('[EPUB] Browser bundle loaded successfully');
  
  // Generate custom CSS
  const customCSS = generateEpubCSS(options);
  
  // Prepare chapters array
  const chapters: EpubChapter[] = [];
  
  // 1. Cover page
  if (options.includeCover) {
    chapters.push(createCoverChapter(options));
  }
  
  // 2. Table of Contents
  if (options.includeTableOfContents) {
    chapters.push(createTocChapter(textes, options));
  }
  
  // 3. Content chapters organized by partie/marche
  const partieGroups = groupTextesByPartie(textes);
  
  for (const group of partieGroups) {
    // Partie cover page
    if (group.partie && options.includePartiePages) {
      chapters.push(createPartieChapter(group.partie, options));
    }
    
    // Marche chapters
    for (const [marcheName, marcheData] of group.marches) {
      // Find marche ID from first text to get illustrations
      const marcheId = marcheData.textes[0]?.id?.split('_')[0]; // Adjust based on actual ID structure
      const marcheIllustrations = illustrations?.get(marcheName);
      
      chapters.push(createMarcheChapter(marcheName, marcheData, options, marcheIllustrations));
    }
  }
  
  // 4. Indexes
  if (options.includeIndexes) {
    chapters.push(createIndexByLocationChapter(textes, options));
    chapters.push(createIndexByGenreChapter(textes, options));
  }
  
  // Generate the EPUB content
  const epubContent = chapters.map(chapter => ({
    title: chapter.title,
    content: chapter.content,
    excludeFromToc: chapter.excludeFromToc || false,
  }));
  
  const epubOptions = {
    title: options.title,
    author: options.author,
    publisher: options.publisher || 'Auto-édition',
    lang: options.language,
    description: options.description || '',
    css: customCSS,
    cover: options.coverImageUrl,
  };
  
  console.log('[EPUB] Generating EPUB with', epubContent.length, 'chapters');
  
  // Generate EPUB using epub-gen-memory browser bundle
  // The browser bundle returns a Blob directly (JSZip type='blob')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const epubResult = await (EPub as any)(epubOptions, epubContent);
  
  // Handle different return types (Blob from browser bundle, ArrayBuffer/Buffer fallback)
  let blob: Blob;
  if (epubResult instanceof Blob) {
    console.log('[EPUB] Result is Blob, size:', epubResult.size);
    blob = epubResult;
  } else if (epubResult instanceof ArrayBuffer) {
    console.log('[EPUB] Result is ArrayBuffer, size:', epubResult.byteLength);
    blob = new Blob([new Uint8Array(epubResult)], { type: 'application/epub+zip' });
  } else if (epubResult?.buffer instanceof ArrayBuffer) {
    // Buffer-like object (Node.js Buffer)
    console.log('[EPUB] Result is Buffer-like, length:', epubResult.length);
    blob = new Blob([new Uint8Array(epubResult.buffer)], { type: 'application/epub+zip' });
  } else {
    // Try direct conversion as last resort
    console.log('[EPUB] Unknown result type, attempting conversion');
    blob = new Blob([epubResult], { type: 'application/epub+zip' });
  }
  
  console.log('[EPUB] Final EPUB blob size:', blob.size, 'bytes');
  
  // Generate filename
  const safeTitle = options.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `${safeTitle}-${new Date().toISOString().split('T')[0]}.epub`;
  
  console.log('[EPUB] Generated filename:', filename);
  
  return { blob, filename };
};

/**
 * Download EPUB file
 */
export const downloadEpub = async (
  textes: TexteExport[],
  options: EpubExportOptions,
  illustrations?: Map<string, IllustrationData[]>
): Promise<void> => {
  const { saveAs } = await import('file-saver');
  const result = await exportToEpub(textes, options, illustrations);
  saveAs(result.blob, result.filename);
};
