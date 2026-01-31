import { StyleSheet, Font } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { PdfExportOptions, mmToPoints, getPageDimensions, getPageMargins } from './pdfExportUtils';

// ============================================================================
// FONT REGISTRATION
// ============================================================================

// Stable CDN URLs for fonts.
// IMPORTANT: @react-pdf/renderer requires TTF/OTF files.
// We use the jsDelivr "fontsource" endpoint which serves actual .ttf files.
const FONTSOURCE_CDN = 'https://cdn.jsdelivr.net/fontsource/fonts';

const FONT_URLS: Record<string, { regular: string; bold?: string; italic?: string; boldItalic?: string }> = {
  // Using Lora as fallback for Georgia (similar serif characteristics)
  Georgia: {
    regular: `${FONTSOURCE_CDN}/lora@latest/latin-400-normal.ttf`,
    bold: `${FONTSOURCE_CDN}/lora@latest/latin-700-normal.ttf`,
    italic: `${FONTSOURCE_CDN}/lora@latest/latin-400-italic.ttf`,
    boldItalic: `${FONTSOURCE_CDN}/lora@latest/latin-700-italic.ttf`,
  },
  'Playfair Display': {
    regular: `${FONTSOURCE_CDN}/playfair-display@latest/latin-400-normal.ttf`,
    bold: `${FONTSOURCE_CDN}/playfair-display@latest/latin-700-normal.ttf`,
    italic: `${FONTSOURCE_CDN}/playfair-display@latest/latin-400-italic.ttf`,
    boldItalic: `${FONTSOURCE_CDN}/playfair-display@latest/latin-700-italic.ttf`,
  },
  'Cormorant Garamond': {
    regular: `${FONTSOURCE_CDN}/cormorant-garamond@latest/latin-400-normal.ttf`,
    bold: `${FONTSOURCE_CDN}/cormorant-garamond@latest/latin-700-normal.ttf`,
    italic: `${FONTSOURCE_CDN}/cormorant-garamond@latest/latin-400-italic.ttf`,
    boldItalic: `${FONTSOURCE_CDN}/cormorant-garamond@latest/latin-700-italic.ttf`,
  },
  Lora: {
    regular: `${FONTSOURCE_CDN}/lora@latest/latin-400-normal.ttf`,
    bold: `${FONTSOURCE_CDN}/lora@latest/latin-700-normal.ttf`,
    italic: `${FONTSOURCE_CDN}/lora@latest/latin-400-italic.ttf`,
    boldItalic: `${FONTSOURCE_CDN}/lora@latest/latin-700-italic.ttf`,
  },
  'EB Garamond': {
    regular: `${FONTSOURCE_CDN}/eb-garamond@latest/latin-400-normal.ttf`,
    bold: `${FONTSOURCE_CDN}/eb-garamond@latest/latin-700-normal.ttf`,
    italic: `${FONTSOURCE_CDN}/eb-garamond@latest/latin-400-italic.ttf`,
    boldItalic: `${FONTSOURCE_CDN}/eb-garamond@latest/latin-700-italic.ttf`,
  },
  'Crimson Pro': {
    regular: `${FONTSOURCE_CDN}/crimson-pro@latest/latin-400-normal.ttf`,
    bold: `${FONTSOURCE_CDN}/crimson-pro@latest/latin-700-normal.ttf`,
    italic: `${FONTSOURCE_CDN}/crimson-pro@latest/latin-400-italic.ttf`,
    boldItalic: `${FONTSOURCE_CDN}/crimson-pro@latest/latin-700-italic.ttf`,
  },
  'Libre Baskerville': {
    regular: `${FONTSOURCE_CDN}/libre-baskerville@latest/latin-400-normal.ttf`,
    bold: `${FONTSOURCE_CDN}/libre-baskerville@latest/latin-700-normal.ttf`,
    italic: `${FONTSOURCE_CDN}/libre-baskerville@latest/latin-400-italic.ttf`,
  },
  'DM Serif Display': {
    regular: `${FONTSOURCE_CDN}/dm-serif-display@latest/latin-400-normal.ttf`,
    italic: `${FONTSOURCE_CDN}/dm-serif-display@latest/latin-400-italic.ttf`,
  },
  Fraunces: {
    regular: `${FONTSOURCE_CDN}/fraunces@latest/latin-400-normal.ttf`,
    bold: `${FONTSOURCE_CDN}/fraunces@latest/latin-700-normal.ttf`,
    italic: `${FONTSOURCE_CDN}/fraunces@latest/latin-400-italic.ttf`,
    boldItalic: `${FONTSOURCE_CDN}/fraunces@latest/latin-700-italic.ttf`,
  },
  Merriweather: {
    regular: `${FONTSOURCE_CDN}/merriweather@latest/latin-400-normal.ttf`,
    bold: `${FONTSOURCE_CDN}/merriweather@latest/latin-700-normal.ttf`,
    italic: `${FONTSOURCE_CDN}/merriweather@latest/latin-400-italic.ttf`,
    boldItalic: `${FONTSOURCE_CDN}/merriweather@latest/latin-700-italic.ttf`,
  },
};

// Track registered fonts to avoid duplicates
const registeredFonts = new Set<string>();

/**
 * Register fonts for PDF generation
 */
export const registerFonts = async (options: PdfExportOptions): Promise<void> => {
  const fontsToRegister = [options.typography.bodyFont, options.typography.headingFont];
  
  for (const fontName of fontsToRegister) {
    if (registeredFonts.has(fontName)) continue;
    
    const fontData = FONT_URLS[fontName];
    if (!fontData) {
      console.warn(`Font ${fontName} not found in registry, falling back to system font`);
      continue;
    }
    
    try {
      const fonts: Array<{ src: string; fontWeight?: 'normal' | 'bold'; fontStyle?: 'normal' | 'italic' }> = [
        { src: fontData.regular, fontWeight: 'normal', fontStyle: 'normal' },
      ];
      
      if (fontData.bold) {
        fonts.push({ src: fontData.bold, fontWeight: 'bold', fontStyle: 'normal' });
      }
      if (fontData.italic) {
        fonts.push({ src: fontData.italic, fontWeight: 'normal', fontStyle: 'italic' });
      }
      if (fontData.boldItalic) {
        fonts.push({ src: fontData.boldItalic, fontWeight: 'bold', fontStyle: 'italic' });
      }
      
      Font.register({
        family: fontName,
        fonts,
      });
      registeredFonts.add(fontName);
    } catch (error) {
      console.error(`Failed to register font ${fontName}:`, error);
    }
  }
};

// ============================================================================
// STYLE GENERATION - Returns raw style objects for use with inline styles
// ============================================================================

export interface PdfStylesRaw {
  // Page styles
  page: Style;
  pageOdd: Style;
  pageEven: Style;
  
  // Cover
  coverPage: Style;
  coverContent: Style;
  coverTitle: Style;
  coverSubtitle: Style;
  coverAuthor: Style;
  coverPublisher: Style;
  coverDecoration: Style;
  
  // Faux-titre
  fauxTitrePage: Style;
  fauxTitreContent: Style;
  fauxTitreTitle: Style;
  fauxTitreAuthor: Style;
  
  // Table of contents
  tocPage: Style;
  tocTitle: Style;
  tocEntry: Style;
  tocPartie: Style;
  tocMarche: Style;
  tocTexte: Style;
  tocPageNumber: Style;
  tocDotLeader: Style;
  
  // Partie (Movement)
  partiePage: Style;
  partieContent: Style;
  partieNumeral: Style;
  partieTitre: Style;
  partieSousTitre: Style;
  partieSeparator: Style;
  
  // Marche header
  marcheHeader: Style;
  marcheTitre: Style;
  marcheLocation: Style;
  marcheDate: Style;
  
  // Text pages
  textePage: Style;
  texteContainer: Style;
  texteTitle: Style;
  texteContent: Style;
  texteMetadata: Style;
  
  // Haiku specific
  haikuContainer: Style;
  haikuContent: Style;
  haikuBlock: Style;
  haikuTitle: Style;
  haikuSeparator: Style;
  haikuLine: Style;
  
  // Fable specific (Style "Carnet de Naturaliste")
  fableContainer: Style;
  fableHeader: Style;
  fableHeaderLabel: Style;
  fableTitle: Style;
  fableContent: Style;
  fableMoral: Style;
  fableSection: Style;
  
  // Index styles (ultra-design professional)
  indexPage: Style;
  indexTitle: Style;
  indexColumns: Style;
  indexColumn: Style;
  indexEntry: Style;
  indexEntryTitle: Style;
  indexEntryPage: Style;
  
  // Index par Lieu (hierarchical)
  indexLieuxPartieHeader: Style;
  indexLieuxMarcheBlock: Style;
  indexLieuxMarcheEntry: Style;
  indexLieuxTypeRow: Style;
  indexLieuxTypeName: Style;
  indexLieuxDotLeader: Style;
  indexLieuxPages: Style;
  
  // Index par Genre (with ornaments)
  indexGenreSection: Style;
  indexGenreOrnament: Style;
  indexGenreEntryBlock: Style;
  indexGenreEntry: Style;
  indexGenreTitle: Style;
  indexGenreDetailRow: Style;
  indexGenreLieu: Style;
  indexGenreDotLeader: Style;
  indexGenrePage: Style;
  
  // Index Thématique (keyword categories)
  indexKeywordCategoryBox: Style;
  indexKeywordCategoryTitle: Style;
  indexKeywordEntry: Style;
  indexKeywordName: Style;
  indexKeywordDotLeader: Style;
  indexKeywordPages: Style;
  
  // Colophon
  colophonPage: Style;
  colophonContent: Style;
  colophonText: Style;
  
  // Page footer (context + number)
  pageFooter: Style;
  pageFooterOdd: Style;
  pageFooterEven: Style;
  pageFooterContext: Style;
  pageNumber: Style;
  pageNumberOdd: Style;
  pageNumberEven: Style;
  pageNumberInline: Style;
  
  // NEW: Fixed footer bar (container approach for stable positioning)
  pageFooterBar: Style;
  pageFooterContextInline: Style;
  pageNumberInlineText: Style;
  
  // NEW: Direct-child approach for page number with render prop (most reliable)
  pageNumberRenderFixedRight: Style;
  
  // Decorations
  separator: Style;
  ornament: Style;
}

/**
 * Generate PDF styles from export options
 */
export const generatePdfStyles = (options: PdfExportOptions): PdfStylesRaw => {
  const { colorScheme, typography } = options;
  const dimensions = getPageDimensions(options);
  const marginsOdd = getPageMargins(options, true);
  const marginsEven = getPageMargins(options, false);
  
  // OPTIMIZED: Base 10pt for long poems (was 11pt), haikus keep special sizing
  const baseFontSize = typography.baseFontSize * 10;
  const headingFontSize = baseFontSize * 1.5;
  const titleFontSize = baseFontSize * 2.2;
  
  // STABLE NUMERIC WIDTHS: Avoid percentages which can cause Yoga "unsupported number" crashes
  const contentWidth = dimensions.width - mmToPoints(40); // Safe content width (numeric, not %)
  const narrowContentWidth = dimensions.width - mmToPoints(60); // Narrower for index columns
  
  return {
    // =========== PAGE STYLES ===========
    page: {
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: colorScheme.background,
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize,
      lineHeight: typography.lineHeight,
      color: colorScheme.text,
    },
    pageOdd: {
      paddingTop: marginsOdd.top,
      paddingBottom: marginsOdd.bottom,
      paddingLeft: marginsOdd.left,
      paddingRight: marginsOdd.right,
    },
    pageEven: {
      paddingTop: marginsEven.top,
      paddingBottom: marginsEven.bottom,
      paddingLeft: marginsEven.left,
      paddingRight: marginsEven.right,
    },
    
    // =========== COVER (Optimized: all elements on single page) ===========
    coverPage: {
      backgroundColor: colorScheme.background,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: mmToPoints(20),
    },
    coverContent: {
      textAlign: 'center',
      maxWidth: contentWidth, // FIXED: Numeric value instead of '85%'
    },
    coverTitle: {
      fontFamily: typography.headingFont,
      fontSize: titleFontSize * 1.6,  // LARGER title (was 1.2)
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginBottom: mmToPoints(6),
      letterSpacing: 0.5,
      // REMOVED: hyphens/wordBreak are unsupported by react-pdf and can cause instability
    },
    coverSubtitle: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize * 0.85,
      fontWeight: 'normal',
      fontStyle: 'italic',
      color: colorScheme.secondary,
      marginBottom: mmToPoints(8),  // Reduced from 15mm
    },
    coverAuthor: {
      fontFamily: typography.bodyFont,
      fontSize: headingFontSize,
      color: colorScheme.text,
      marginTop: mmToPoints(18),  // Reduced from 25mm
      letterSpacing: 2,
    },
    coverPublisher: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.85,
      color: colorScheme.secondary,
      marginTop: mmToPoints(15),  // Reduced from 25mm
    },
    coverDecoration: {
      marginVertical: mmToPoints(8),  // Reduced from 12mm
      width: mmToPoints(40),
      height: 1,
      backgroundColor: colorScheme.accent,
    },
    
    // =========== FAUX-TITRE ===========
    fauxTitrePage: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      flexGrow: 1, // FIXED: Use flexGrow instead of height: '100%' for Yoga stability
    },
    fauxTitreContent: {
      textAlign: 'center',
    },
    fauxTitreTitle: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize * 1.1,
      color: colorScheme.primary,
      marginBottom: mmToPoints(10),
    },
    fauxTitreAuthor: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize,
      color: colorScheme.secondary,
      fontStyle: 'italic',
    },
    
    // =========== TABLE OF CONTENTS (ULTRA-COMPACT for space savings) ===========
    tocPage: {
      paddingTop: mmToPoints(18),
    },
    tocTitle: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize * 0.85,
      color: colorScheme.primary,
      marginBottom: mmToPoints(6),
      textAlign: 'center',
    },
    tocEntry: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: mmToPoints(0.8),
    },
    tocPartie: {
      fontFamily: typography.headingFont,
      fontSize: baseFontSize * 0.95,
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginTop: mmToPoints(3),
      marginBottom: mmToPoints(1),
      flexShrink: 1, // ADDED: Prevent overflow on long titles
    },
    tocMarche: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.8,
      fontWeight: 'bold',
      color: colorScheme.secondary,
      marginTop: mmToPoints(0.5),
      paddingLeft: mmToPoints(3),
      flexShrink: 1, // ADDED: Prevent overflow on long titles
    },
    tocTexte: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.75,
      color: colorScheme.text,
      paddingLeft: mmToPoints(6),
    },
    tocPageNumber: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.7,
      color: colorScheme.secondary,
    },
    tocDotLeader: {
      // FIXED: Use fixed width instead of flex: 1 to prevent negative width crashes
      width: mmToPoints(25),
      flexGrow: 0,
      flexShrink: 0,
      marginHorizontal: mmToPoints(1),
      borderBottomWidth: 0.5,
      borderBottomStyle: 'dotted',
      borderBottomColor: colorScheme.secondary,
      marginBottom: 2,
    },
    
    // =========== PARTIE (MOVEMENT) ===========
    partiePage: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      flexGrow: 1,
    },
    partieContent: {
      textAlign: 'center',
    },
    partieNumeral: {
      fontFamily: typography.headingFont,
      fontSize: titleFontSize * 1.5,
      fontWeight: 'bold',
      color: colorScheme.accent,
      marginBottom: mmToPoints(10),
      letterSpacing: 4,
    },
    partieTitre: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize * 1.2,
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginBottom: mmToPoints(6),
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    partieSousTitre: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize,
      fontStyle: 'italic',
      color: colorScheme.secondary,
      marginTop: mmToPoints(4),
    },
    partieSeparator: {
      marginTop: mmToPoints(15),
      color: colorScheme.accent,
      fontSize: baseFontSize * 0.8,
      letterSpacing: 4,
    },
    
    // =========== MARCHE HEADER ===========
    marcheHeader: {
      marginBottom: mmToPoints(12),
      paddingBottom: mmToPoints(6),
      borderBottomWidth: 0.5,
      borderBottomColor: colorScheme.accent,
    },
    marcheTitre: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize * 0.9,
      fontWeight: 'bold',
      color: colorScheme.primary,
    },
    marcheLocation: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.85,
      color: colorScheme.secondary,
      fontStyle: 'italic',
      marginTop: mmToPoints(2),
    },
    marcheDate: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.8,
      color: colorScheme.secondary,
    },
    
    // =========== TEXT PAGES ===========
    textePage: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    texteContainer: {
      marginTop: mmToPoints(8),
    },
    texteTitle: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize * 0.85,
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginBottom: mmToPoints(8),
    },
    texteContent: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize,
      lineHeight: typography.lineHeight,
      color: colorScheme.text,
      textAlign: 'left',
      flexShrink: 1, // Prevent horizontal overflow
      marginBottom: mmToPoints(2), // Space between paragraphs when split
    },
    texteMetadata: {
      marginTop: mmToPoints(10),
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.75,
      color: colorScheme.secondary,
      fontStyle: 'italic',
    },
    
    // =========== HAIKU SPECIFIC (Keep original sizing for artistic quality) ===========
    haikuContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: mmToPoints(15),
      paddingHorizontal: mmToPoints(12),
    },
    haikuContent: {
      textAlign: 'center',
      fontFamily: typography.bodyFont,
      fontSize: 11.5, // Fixed 11.5pt for haikus (artistic decision)
      lineHeight: typography.lineHeight * 1.3,
      color: colorScheme.text,
      letterSpacing: 0.5,
    },
    // Compact inline block style for haiku (Galerie Fleuve inspired)
    haikuBlock: {
      alignItems: 'center',
      marginVertical: mmToPoints(4),
      paddingVertical: mmToPoints(6),
    },
    haikuTitle: {
      fontFamily: typography.headingFont,
      fontSize: 12, // Fixed 12pt for haiku titles
      fontWeight: 'bold',
      color: colorScheme.primary,
      textAlign: 'center',
      marginBottom: mmToPoints(3),
    },
    haikuSeparator: {
      width: mmToPoints(18),
      height: 0.5,
      backgroundColor: colorScheme.accent,
      marginVertical: mmToPoints(2),
    },
    haikuLine: {
      fontFamily: typography.bodyFont,
      fontSize: 11, // Fixed 11pt for haiku lines
      fontStyle: 'italic',
      color: colorScheme.text,
      textAlign: 'center',
      lineHeight: typography.lineHeight * 1.15,
    },
    
    // =========== FABLE SPECIFIC (Style "Carnet de Naturaliste") ===========
    fableContainer: {
      flex: 1,
      paddingHorizontal: mmToPoints(4),   // Utilise toute la largeur
      paddingVertical: mmToPoints(6),
    },
    fableHeader: {
      textAlign: 'center',
      marginBottom: mmToPoints(6),
      paddingBottom: mmToPoints(4),
      borderBottomWidth: 0.75,
      borderBottomColor: colorScheme.accent,
    },
    fableHeaderLabel: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.7,
      color: colorScheme.accent,
      letterSpacing: 3,
      marginBottom: mmToPoints(3),
      textAlign: 'center',
    },
    fableTitle: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize * 0.85,
      fontWeight: 'bold',
      color: colorScheme.primary,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    fableContent: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize,
      lineHeight: typography.lineHeight * 1.05,
      color: colorScheme.text,
      textAlign: 'left',
      marginTop: mmToPoints(6),
      flexShrink: 1, // Prevent horizontal overflow
      marginBottom: mmToPoints(2), // Space between paragraphs when split
    },
    fableMoral: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.9,
      fontStyle: 'italic',
      color: colorScheme.secondary,
      marginTop: mmToPoints(8),
      paddingTop: mmToPoints(5),
      borderTopWidth: 0.5,
      borderTopColor: colorScheme.accent,
      textAlign: 'center',
    },
    fableSection: {
      fontFamily: typography.headingFont,
      fontSize: baseFontSize * 0.85,
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginTop: mmToPoints(6),
      marginBottom: mmToPoints(3),
    },
    
    // =========== INDEX COMMON ===========
    indexPage: {
      paddingTop: mmToPoints(18),
    },
    indexTitle: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize * 0.9,
      color: colorScheme.primary,
      marginBottom: mmToPoints(10),
      textAlign: 'center',
      letterSpacing: 2,
    },
    indexColumns: {
      flexDirection: 'row',
      gap: mmToPoints(10),
    },
    indexColumn: {
      flex: 1,
    },
    indexEntry: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: mmToPoints(1.5),
    },
    indexEntryTitle: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.85,
      color: colorScheme.text,
      flex: 1,
    },
    indexEntryPage: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.85,
      color: colorScheme.secondary,
      marginLeft: mmToPoints(3),
    },
    
    // =========== INDEX PAR LIEU (Hierarchical: Partie > Marche > Types) ===========
    indexLieuxPartieHeader: {
      fontFamily: typography.headingFont,
      fontSize: baseFontSize * 0.95,
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginTop: mmToPoints(8),
      marginBottom: mmToPoints(2),
      letterSpacing: 1,
    },
    indexLieuxMarcheBlock: {
      marginTop: mmToPoints(3),
      marginBottom: mmToPoints(4),
      paddingLeft: mmToPoints(4),
    },
    indexLieuxMarcheEntry: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.85,
      fontWeight: 'bold',
      color: colorScheme.text,
      marginBottom: mmToPoints(2),
    },
    indexLieuxTypeRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: mmToPoints(1),
      paddingLeft: mmToPoints(6),
    },
    indexLieuxTypeName: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.75,
      fontStyle: 'italic',
      color: colorScheme.secondary,
      flexShrink: 1,
    },
    indexLieuxDotLeader: {
      // FIXED: Use fixed width instead of flex: 1 to prevent negative width crashes
      width: mmToPoints(20),
      flexGrow: 0,
      flexShrink: 0,
      marginHorizontal: mmToPoints(1.5),
      borderBottomWidth: 0.5,
      borderBottomStyle: 'dotted',
      borderBottomColor: colorScheme.secondary,
      marginBottom: 2,
    },
    indexLieuxPages: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.75,
      color: colorScheme.secondary,
      flexShrink: 1, // ADDED: Allow text to shrink to prevent horizontal overflow
      maxWidth: mmToPoints(50), // ADDED: Limit width to prevent overflow
    },
    
    // =========== INDEX PAR GENRE (with ornaments) ===========
    indexGenreSection: {
      marginTop: mmToPoints(10),
      marginBottom: mmToPoints(4),
      textAlign: 'center',
    },
    indexGenreOrnament: {
      fontFamily: typography.headingFont,
      fontSize: baseFontSize * 0.9,
      color: colorScheme.accent,
      letterSpacing: 4,
      textAlign: 'center',
    },
    indexGenreEntryBlock: {
      flexDirection: 'column',
      // Critical: ensure each entry has enough vertical space to avoid overlap
      marginBottom: mmToPoints(3.5),
      paddingLeft: mmToPoints(2),
    },
    indexGenreEntry: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: mmToPoints(1.5),
    },
    indexGenreTitle: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.85,
      fontWeight: 'bold',
      color: colorScheme.text,
      // Compact line height for single-line title, but enough to be readable
      lineHeight: 1.25,
      marginBottom: mmToPoints(0.8),
      flexShrink: 1,
    },
    indexGenreDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: mmToPoints(0),
      paddingLeft: mmToPoints(4),
    },
    indexGenreLieu: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.75,
      fontStyle: 'italic',
      color: colorScheme.secondary,
      lineHeight: 1.2,
      flexShrink: 1,
      maxWidth: narrowContentWidth, // FIXED: Numeric value instead of '70%'
    },
    indexGenreDotLeader: {
      // FIXED: Use fixed width instead of flex: 1 to prevent negative width crashes
      width: mmToPoints(20),
      flexGrow: 0,
      flexShrink: 0,
      marginHorizontal: mmToPoints(2),
      borderBottomWidth: 0.5,
      borderBottomStyle: 'dotted',
      borderBottomColor: colorScheme.secondary,
      marginBottom: 2,
    },
    indexGenrePage: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.75,
      color: colorScheme.secondary,
      flexShrink: 0,
      lineHeight: 1.2,
    },
    
    // =========== INDEX THÉMATIQUE (keyword categories) ===========
    indexKeywordCategoryBox: {
      marginTop: mmToPoints(6),
      marginBottom: mmToPoints(4),
      paddingVertical: mmToPoints(2),
      paddingHorizontal: mmToPoints(4),
      borderWidth: 0.75,
      borderColor: colorScheme.accent,
      borderRadius: 2,
      alignSelf: 'flex-start',
    },
    indexKeywordCategoryTitle: {
      fontFamily: typography.headingFont,
      fontSize: baseFontSize * 0.8,
      fontWeight: 'bold',
      color: colorScheme.primary,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    indexKeywordEntry: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: mmToPoints(1),
      paddingLeft: mmToPoints(2),
    },
    indexKeywordName: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.8,
      color: colorScheme.text,
      flexShrink: 1, // ADDED: Allow text to shrink to prevent horizontal overflow
    },
    indexKeywordDotLeader: {
      // FIXED: Use fixed width instead of flex: 1 to prevent negative width crashes
      width: mmToPoints(20),
      flexGrow: 0,
      flexShrink: 0,
      marginHorizontal: mmToPoints(1.5),
      borderBottomWidth: 0.5,
      borderBottomStyle: 'dotted',
      borderBottomColor: colorScheme.secondary,
      marginBottom: 2,
    },
    indexKeywordPages: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.75,
      color: colorScheme.secondary,
      flexShrink: 1, // ADDED: Allow text to shrink to prevent horizontal overflow
      maxWidth: mmToPoints(50), // ADDED: Limit width to prevent overflow
    },
    
    // =========== COLOPHON ===========
    colophonPage: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      flexGrow: 1, // FIXED: Use flexGrow instead of height: '100%' for Yoga stability
      paddingBottom: mmToPoints(40),
    },
    colophonContent: {
      textAlign: 'center',
    },
    colophonText: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.85,
      lineHeight: typography.lineHeight * 1.2,
      color: colorScheme.secondary,
    },
    
    // =========== PAGE FOOTER (Context + Page Number) ===========
    // LEGACY: Kept for backwards compatibility
    pageFooter: {
      position: 'absolute',
      bottom: mmToPoints(10),
      left: mmToPoints(options.marginInner),
      right: mmToPoints(options.marginOuter),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pageFooterOdd: {
      left: mmToPoints(options.marginInner),
      right: mmToPoints(options.marginOuter),
    },
    pageFooterEven: {
      left: mmToPoints(options.marginOuter),
      right: mmToPoints(options.marginInner),
    },
    pageFooterContext: {
      // LEGACY: Absolute positioning (kept for compatibility)
      position: 'absolute',
      bottom: mmToPoints(10),
      left: mmToPoints(options.marginInner),
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.7,
      color: colorScheme.secondary,
      fontStyle: 'italic',
    },
    pageNumber: {
      position: 'absolute',
      bottom: mmToPoints(12),
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.8,
      color: colorScheme.secondary,
    },
    pageNumberOdd: {
      right: mmToPoints(options.marginOuter),
      textAlign: 'right',
    },
    pageNumberEven: {
      left: mmToPoints(options.marginOuter),
      textAlign: 'left',
    },
    pageNumberInline: {
      // LEGACY: Absolute positioning (kept for compatibility)
      position: 'absolute',
      bottom: mmToPoints(10),
      right: mmToPoints(options.marginOuter),
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.8,
      color: colorScheme.secondary,
      textAlign: 'right',
    },
    
    // =========== NEW: FIXED FOOTER BAR (Container approach) ===========
    // IMPORTANT: react-pdf's render prop on <Text> doesn't respect absolute positioning.
    // Solution: Use a <View fixed> container that IS absolutely positioned,
    // then place <Text> children inside with flexbox (no absolute needed on Text).
    pageFooterBar: {
      position: 'absolute',
      bottom: mmToPoints(10),
      left: mmToPoints(options.marginInner),
      right: mmToPoints(options.marginOuter),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    pageFooterContextInline: {
      // NO position:absolute - positioned by parent flexbox
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.7,
      color: colorScheme.secondary,
      fontStyle: 'italic',
    },
    pageNumberInlineText: {
      // NO position:absolute - positioned by parent flexbox
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.8,
      color: colorScheme.secondary,
      textAlign: 'right',
    },
    
    // =========== NEW: DIRECT CHILD PAGE NUMBER (Most reliable for render prop) ===========
    // CRITICAL: When <Text render={...}> is used, Yoga sometimes ignores position:absolute.
    // The ONLY reliable pattern is:
    // 1. Make it a DIRECT CHILD of <Page> (no intermediate <View>)
    // 2. Give it EXPLICIT NUMERIC WIDTH (not 'right:' which can be ignored)
    // 3. Use textAlign: 'right' to push the number to the right edge
    pageNumberRenderFixedRight: {
      position: 'absolute',
      bottom: mmToPoints(10),
      left: mmToPoints(options.marginInner),
      // CRITICAL: Use explicit width instead of 'right:' - Yoga handles this more reliably
      width: dimensions.width - mmToPoints(options.marginInner) - mmToPoints(options.marginOuter),
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.8,
      color: colorScheme.secondary,
      textAlign: 'right',
    },
    
    // =========== DECORATIONS ===========
    separator: {
      width: mmToPoints(20),
      height: 0.5,
      backgroundColor: colorScheme.accent,
      marginVertical: mmToPoints(8),
      alignSelf: 'center',
    },
    ornament: {
      fontFamily: typography.headingFont,
      fontSize: baseFontSize * 1.2,
      color: colorScheme.accent,
      textAlign: 'center',
      marginVertical: mmToPoints(10),
    },
  };
};

/**
 * Get page background style (for dark themes)
 */
export const getPageBackgroundStyle = (options: PdfExportOptions): Style => {
  const isDarkTheme = ['frequence_vivant', 'dordonia'].includes(options.format);
  
  return {
    backgroundColor: options.colorScheme.background,
    ...(isDarkTheme && {
      // Dark themes may need special handling
    }),
  };
};
