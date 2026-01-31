import { EPUB_PRESETS, EpubColorScheme, EpubTypography, TexteExport, EpubPreset } from './epubExportUtils';

// ============================================================================
// TYPES & INTERFACES - PDF SPECIFIC
// ============================================================================

export interface PdfExportOptions {
  // Editorial metadata (inherited from EPUB)
  title: string;
  author: string;
  subtitle?: string;
  publisher?: string;
  isbn?: string;
  language: 'fr' | 'en';
  description?: string;
  
  // Artistic direction (same as EPUB)
  format: 'classique' | 'poesie_poche' | 'livre_art' | 'contemporain' | 'galerie_fleuve' | 'frequence_vivant' | 'dordonia';
  colorScheme: EpubColorScheme;
  typography: EpubTypography;
  
  // PDF-specific page settings
  pageSize: 'A5' | 'A4' | 'Letter' | 'Custom';
  customWidth?: number;  // mm
  customHeight?: number; // mm
  orientation: 'portrait' | 'landscape';
  
  // Margins (mm) - asymmetric for binding
  marginInner: number;   // Côté reliure (left on odd pages, right on even)
  marginOuter: number;   // Côté externe
  marginTop: number;
  marginBottom: number;
  
  // Print-ready options
  bleed: boolean;        // Fond perdu (3mm)
  bleedSize: number;     // mm, typically 3
  cropMarks: boolean;    // Traits de coupe
  
  // Content options
  includeCover: boolean;
  coverImageUrl?: string;
  includeFauxTitre: boolean;
  includeTableOfContents: boolean;
  includePartiePages: boolean;
  includeIllustrations: boolean;
  includeColophon: boolean;
  colophonText?: string;
  
  // Indexes
  includeIndexLieux: boolean;
  includeIndexGenres: boolean;
  includeIndexKeywords: boolean;
  selectedKeywordCategories?: string[];
  
  // Structure
  organizationMode: 'type' | 'marche';
  includeMetadata: boolean;
  
  // Page numbering
  pageNumberStyle: 'arabic' | 'roman-preface' | 'none';
  pageNumberPosition: 'bottom-center' | 'bottom-outer' | 'top-outer';
  startPageNumber: number;
}

// ============================================================================
// PAGE SIZE CONSTANTS (in points, 1pt = 1/72 inch)
// ============================================================================

export const PAGE_SIZES = {
  A5: { width: 148, height: 210 },      // mm
  A4: { width: 210, height: 297 },      // mm
  Letter: { width: 215.9, height: 279.4 }, // mm
} as const;

// Convert mm to points (1 inch = 25.4mm = 72pt)
export const mmToPoints = (mm: number): number => (mm / 25.4) * 72;
export const pointsToMm = (pt: number): number => (pt / 72) * 25.4;

// ============================================================================
// PDF PRESETS (extending EPUB presets)
// ============================================================================

export interface PdfPreset extends EpubPreset {
  // PDF-specific defaults
  pageSize: 'A5' | 'A4' | 'Letter' | 'Custom';
  customWidth?: number;
  customHeight?: number;
  marginInner: number;
  marginOuter: number;
  marginTop: number;
  marginBottom: number;
  includeFauxTitre: boolean;
  includeColophon: boolean;
}

export const PDF_PRESETS: Record<string, PdfPreset> = {
  // Edition Nationale - Format A5 classique pour éditeurs français
  edition_nationale: {
    ...EPUB_PRESETS.classique,
    name: 'Édition Nationale',
    description: 'Format A5 classique pour éditeurs professionnels',
    pageSize: 'A5',
    marginInner: 25,
    marginOuter: 18,
    marginTop: 28,
    marginBottom: 22,
    includeFauxTitre: true,
    includeColophon: true,
  },
  
  // Collection Poche - Format compact
  collection_poche: {
    ...EPUB_PRESETS.poesie_poche,
    name: 'Collection Poche',
    description: 'Format compact pour poésie intimiste (110×178mm)',
    pageSize: 'Custom',
    customWidth: 110,
    customHeight: 178,
    marginInner: 15,
    marginOuter: 12,
    marginTop: 20,
    marginBottom: 18,
    includeFauxTitre: false,
    includeColophon: true,
  },
  
  // Livre d'Art - Grand format luxueux
  livre_art: {
    ...EPUB_PRESETS.livre_art,
    name: "Livre d'Art",
    description: 'Format A4 pour mise en page visuelle immersive',
    pageSize: 'A4',
    marginInner: 35,
    marginOuter: 25,
    marginTop: 40,
    marginBottom: 30,
    includeFauxTitre: true,
    includeColophon: true,
  },
  
  // Contemporain - Design épuré moderne
  contemporain: {
    ...EPUB_PRESETS.contemporain,
    name: 'Contemporain',
    description: 'Design épuré moderne, marges généreuses',
    pageSize: 'A5',
    marginInner: 28,
    marginOuter: 20,
    marginTop: 35,
    marginBottom: 25,
    includeFauxTitre: true,
    includeColophon: true,
  },
  
  // Galerie Fleuve - Style galerie d'art (OPTIMIZED margins for space efficiency)
  galerie_fleuve: {
    ...EPUB_PRESETS.galerie_fleuve,
    name: 'Galerie Fleuve',
    description: 'Style galerie d\'art épuré, accents émeraude',
    pageSize: 'A5',
    marginInner: 20,  // Was 24mm - reduced for more text area
    marginOuter: 15,  // Was 18mm - reduced for more text area
    marginTop: 22,    // Was 30mm - reduced for more text area
    marginBottom: 18, // Was 24mm - reduced for more text area
    includeFauxTitre: false,  // Faux-titre fusionné sur couverture unique
    includeColophon: true,
  },
  
  // La Fréquence du Vivant - Thème forêt nocturne
  frequence_vivant: {
    ...EPUB_PRESETS.frequence_vivant,
    name: 'La Fréquence du Vivant',
    description: 'Thème sombre forêt, bioacoustique & poésie',
    pageSize: 'A5',
    marginInner: 24,
    marginOuter: 18,
    marginTop: 30,
    marginBottom: 24,
    includeFauxTitre: true,
    includeColophon: true,
  },
  
  // Dordonia - Thème rivière nocturne
  dordonia: {
    ...EPUB_PRESETS.dordonia,
    name: 'Dordonia',
    description: 'Thème nocturne rivière, accents cyan',
    pageSize: 'A5',
    marginInner: 26,
    marginOuter: 18,
    marginTop: 32,
    marginBottom: 24,
    includeFauxTitre: true,
    includeColophon: true,
  },
};

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

export const getDefaultPdfOptions = (preset: keyof typeof PDF_PRESETS = 'edition_nationale'): PdfExportOptions => {
  const presetData = PDF_PRESETS[preset];
  return {
    // Metadata
    title: 'Recueil Poétique',
    author: 'Gaspard Boréal',
    subtitle: '',
    publisher: 'La Comédie des Mondes Hybrides',
    isbn: '',
    language: 'fr',
    description: '',
    
    // Artistic direction
    format: presetData.id as PdfExportOptions['format'],
    colorScheme: { ...presetData.colorScheme },
    typography: { ...presetData.typography },
    
    // Page settings
    pageSize: presetData.pageSize,
    customWidth: presetData.customWidth,
    customHeight: presetData.customHeight,
    orientation: 'portrait',
    
    // Margins
    marginInner: presetData.marginInner,
    marginOuter: presetData.marginOuter,
    marginTop: presetData.marginTop,
    marginBottom: presetData.marginBottom,
    
    // Print options
    bleed: false,
    bleedSize: 3,
    cropMarks: false,
    
    // Content
    includeCover: true,
    coverImageUrl: undefined,
    includeFauxTitre: presetData.includeFauxTitre,
    includeTableOfContents: true,
    includePartiePages: true,
    includeIllustrations: true,
    includeColophon: presetData.includeColophon,
    colophonText: '',
    
    // Indexes
    includeIndexLieux: true,
    includeIndexGenres: true,
    includeIndexKeywords: true,
    selectedKeywordCategories: [
      'Faune Fluviale et Migratrice',
      'Hydrologie et Dynamiques Fluviales',
      'Ouvrages Humains',
      'Flore et Paysages',
      'Temporalités et Projections',
      'Geste Poétique',
      'Technologies et Médiations',
    ],
    
    // Structure
    organizationMode: 'marche',
    includeMetadata: true,
    
    // Page numbering
    pageNumberStyle: 'arabic',
    pageNumberPosition: 'bottom-center',
    startPageNumber: 1,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get page dimensions in points based on options
 */
export const getPageDimensions = (options: PdfExportOptions): { width: number; height: number } => {
  let width: number;
  let height: number;

  if (options.pageSize === 'Custom' && options.customWidth && options.customHeight) {
    width = mmToPoints(options.customWidth);
    height = mmToPoints(options.customHeight);
  } else {
    const size = PAGE_SIZES[options.pageSize as keyof typeof PAGE_SIZES] || PAGE_SIZES.A5;
    width = mmToPoints(size.width);
    height = mmToPoints(size.height);
  }

  // Apply orientation
  if (options.orientation === 'landscape') {
    return { width: height, height: width };
  }

  return { width, height };
};

/**
 * Get margins in points for a specific page (odd/even for book binding)
 */
export const getPageMargins = (options: PdfExportOptions, isOddPage: boolean) => {
  const bleedOffset = options.bleed ? mmToPoints(options.bleedSize) : 0;
  
  return {
    top: mmToPoints(options.marginTop) + bleedOffset,
    bottom: mmToPoints(options.marginBottom) + bleedOffset,
    left: isOddPage 
      ? mmToPoints(options.marginInner) + bleedOffset  // Odd pages: inner margin on left
      : mmToPoints(options.marginOuter) + bleedOffset,
    right: isOddPage 
      ? mmToPoints(options.marginOuter) + bleedOffset 
      : mmToPoints(options.marginInner) + bleedOffset, // Even pages: inner margin on right
  };
};

/**
 * Convert roman numerals
 */
export const toRomanNumeral = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  
  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result.toLowerCase();
};

/**
 * Format page number based on style
 */
export const formatPageNumber = (
  pageNumber: number, 
  style: PdfExportOptions['pageNumberStyle'],
  isPrefacePage: boolean = false
): string => {
  if (style === 'none') return '';
  if (style === 'roman-preface' && isPrefacePage) {
    return toRomanNumeral(pageNumber);
  }
  return pageNumber.toString();
};

/**
 * Detect if text is a haiku (3 lines, specific syllable pattern)
 */
export const isHaiku = (texte: TexteExport): boolean => {
  const type = texte.type_texte?.toLowerCase() || '';
  return type === 'haïku' || type === 'haiku' || type === 'senryu' || type === 'senryū';
};

/**
 * Detect if text is a fable
 */
export const isFable = (texte: TexteExport): boolean => {
  return texte.type_texte?.toLowerCase() === 'fable' ||
         texte.titre?.toLowerCase().includes('fable');
};

/**
 * Insert soft breaks (zero-width spaces) into long tokens to prevent horizontal overflow.
 * This prevents Yoga "unsupported number" crashes caused by unbreakable long strings.
 * 
 * CRITICAL: This is the primary defense against Yoga layout crashes.
 * Any word longer than MAX_TOKEN_LENGTH (25 chars) gets zero-width spaces inserted.
 */
const MAX_TOKEN_LENGTH = 25;
const SOFT_BREAK_INTERVAL = 15;

export const softBreakLongTokens = (text: string): string => {
  if (!text || text.length < MAX_TOKEN_LENGTH) return text || '';
  
  // Split by spaces, check each word
  return text.split(' ').map(word => {
    if (word.length <= MAX_TOKEN_LENGTH) return word;
    
    // Insert zero-width space every SOFT_BREAK_INTERVAL chars
    const chunks: string[] = [];
    for (let i = 0; i < word.length; i += SOFT_BREAK_INTERVAL) {
      chunks.push(word.slice(i, i + SOFT_BREAK_INTERVAL));
    }
    return chunks.join('\u200B');
  }).join(' ');
};

/**
 * Clean HTML content for PDF (strip tags, preserve line breaks)
 * 
 * CRITICAL: This function now includes softBreakLongTokens as FINAL step
 * to prevent Yoga layout crashes from unbreakable long strings.
 */
export const sanitizeContentForPdf = (html: string): string => {
  if (!html) return '';

  // NOTE:
  // The database sometimes stores poetic lines as:
  //   "ligne 1<div>ligne 2</div><div>ligne 3</div>"
  // We must handle ALL block-level HTML elements to ensure proper newline insertion.
  // This includes headings (h1-h6), lists (ul, ol, li), and other block elements
  // that the "Constitution de Dordonia" manifesto uses extensively.

  let text = html.replace(/\r\n/g, '\n');

  // ===== STEP 1: Insert newlines BEFORE opening block tags =====
  // This ensures text before a block doesn't get glued to text inside
  text = text.replace(/<(div|p|section|article|h[1-6]|ul|ol|li|blockquote|pre|header|footer|aside|nav|main|figure|figcaption|address|details|summary)\b[^>]*>/gi, '\n');

  // ===== STEP 2: Insert DOUBLE newline after closing headings (section breaks) =====
  // This creates visual paragraph separation between major sections
  text = text.replace(/<\/(h[1-6])>/gi, '\n\n');

  // ===== STEP 3: Insert newline after closing list/block elements =====
  text = text.replace(/<\/(ul|ol|li|blockquote|pre|div|p|section|article|header|footer|aside|nav|main|figure|figcaption|address|details|summary)>/gi, '\n');

  // ===== STEP 4: Replace <br> with newlines =====
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // ===== STEP 5: Strip all remaining HTML tags =====
  text = text.replace(/<[^>]+>/g, '');
  
  // ===== STEP 6: Decode HTML entities =====
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&rsquo;/g, "'");
  text = text.replace(/&lsquo;/g, "'");
  text = text.replace(/&rdquo;/g, '"');
  text = text.replace(/&ldquo;/g, '"');
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');
  text = text.replace(/&hellip;/g, '…');
  text = text.replace(/&oelig;/g, 'œ');
  text = text.replace(/&OElig;/g, 'Œ');
  text = text.replace(/&aelig;/g, 'æ');
  text = text.replace(/&AElig;/g, 'Æ');
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  
  // ===== STEP 7: Clean up excessive whitespace while preserving intentional line breaks =====
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/[ \t]+\n/g, '\n');
  // Reduce excessive newlines to max 2 (paragraph break)
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // ===== STEP 8: CRITICAL - Break long tokens to prevent Yoga crashes =====
  // This is the final safety net against "unsupported number" layout crashes
  text = softBreakLongTokens(text.trim());
  
  return text;
};

/**
 * Generate colophon text
 */
export const generateColophonText = (options: PdfExportOptions, texteCount: number): string => {
  if (options.colophonText) return options.colophonText;
  
  const date = new Date();
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  const formattedDate = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  
  return `Achevé d'imprimer le ${formattedDate}
pour le compte des Éditions ${options.publisher || 'La Comédie des Mondes Hybrides'}

Ce recueil contient ${texteCount} textes poétiques.

${options.isbn ? `ISBN : ${options.isbn}` : ''}

Composition typographique :
${options.typography.headingFont} pour les titres
${options.typography.bodyFont} pour le corps du texte

Mise en page réalisée avec La Fréquence du Vivant.`;
};

// ============================================================================
// RE-EXPORT SHARED TYPES
// ============================================================================

export type { TexteExport, EpubColorScheme, EpubTypography };
