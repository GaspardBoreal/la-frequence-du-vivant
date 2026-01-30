import { StyleSheet, Font } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { PdfExportOptions, mmToPoints, getPageDimensions, getPageMargins } from './pdfExportUtils';

// ============================================================================
// FONT REGISTRATION
// ============================================================================

// Google Fonts URLs for common editorial fonts
const FONT_URLS: Record<string, { regular: string; bold?: string; italic?: string; boldItalic?: string }> = {
  // Note: Georgia is a system font, we use Merriweather as a fallback with similar characteristics
  'Georgia': {
    regular: 'https://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l5OeyxNV-bnrw.ttf',
    bold: 'https://fonts.gstatic.com/s/merriweather/v30/u-4n0qyriQwlOrhSvowK_l52xwNZWMf6.ttf',
    italic: 'https://fonts.gstatic.com/s/merriweather/v30/u-4m0qyriQwlOrhSvowK_l5-eSZJdeP3.ttf',
    boldItalic: 'https://fonts.gstatic.com/s/merriweather/v30/u-4l0qyriQwlOrhSvowK_l5-eR7lXff4jvzDP3WGO5g.ttf',
  },
  'Playfair Display': {
    regular: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtXK-F2qC0usEw.ttf',
    bold: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtXK-F2qO0ysEw.ttf',
    italic: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtbK-F2qA0s.ttf',
    boldItalic: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTXtHK-F2qA0s.ttf',
  },
  'Cormorant Garamond': {
    regular: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYrEPjuw-NxBKL_y94.ttf',
    bold: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjQEl5fsQ-5xLQB_l-7.ttf',
    italic: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrHtPky2F7g7ixBK8.ttf',
    boldItalic: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3WmX5slCNuHLi8bLeY9MK7whWMhyjYqXtlJfSoxLDo.ttf',
  },
  'Lora': {
    regular: 'https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkq0.ttf',
    bold: 'https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787z5vBJBkq0.ttf',
    italic: 'https://fonts.gstatic.com/s/lora/v35/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFoq92nA.ttf',
    boldItalic: 'https://fonts.gstatic.com/s/lora/v35/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-PoCoq92nA.ttf',
  },
  'EB Garamond': {
    regular: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUA4V-e6yHgQ.ttf',
    bold: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-2fNUA4V-e6yHgQ.ttf',
    italic: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7e8QI96WamXgXFI.ttf',
    boldItalic: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7fMQ496WamXgXFI.ttf',
  },
  'Crimson Pro': {
    regular: 'https://fonts.gstatic.com/s/crimsonpro/v24/q5uUsoa5M_tv7IihmnkabC5XiXCAlXGks1WZzm1MP5s7.ttf',
    bold: 'https://fonts.gstatic.com/s/crimsonpro/v24/q5uUsoa5M_tv7IihmnkabC5XiXCAlXGks1WZFGpMP5s7.ttf',
    italic: 'https://fonts.gstatic.com/s/crimsonpro/v24/q5uSsoa5M_tv7IihmnkabAReu49Y_Bo-HVKMBi4Ue5s7dtC4yZNE.ttf',
    boldItalic: 'https://fonts.gstatic.com/s/crimsonpro/v24/q5uSsoa5M_tv7IihmnkabAReu49Y_Bo-HVKMBi5Uf5s7dtC4yZNE.ttf',
  },
  'Libre Baskerville': {
    regular: 'https://fonts.gstatic.com/s/librebaskerville/v14/kmKnZrc3Hgbbcjq75U4uslyuy4kqN1NF.ttf',
    bold: 'https://fonts.gstatic.com/s/librebaskerville/v14/kmKiZrc3Hgbbcjq75U4uslyuy4kqNSNbPbCo.ttf',
    italic: 'https://fonts.gstatic.com/s/librebaskerville/v14/kmKhZrc3Hgbbcjq75U4uslyuy4kqNcKP.ttf',
  },
  'DM Serif Display': {
    regular: 'https://fonts.gstatic.com/s/dmserifdisplay/v15/-nFnOHM81r4j6k0gjAW3mujVU2B2K_d7.ttf',
    italic: 'https://fonts.gstatic.com/s/dmserifdisplay/v15/-nFhOHM81r4j6k0gjAW3mujVU2B2G_Bx1w.ttf',
  },
  'Fraunces': {
    regular: 'https://fonts.gstatic.com/s/fraunces/v31/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib.ttf',
    bold: 'https://fonts.gstatic.com/s/fraunces/v31/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN78TZUPJH58nib.ttf',
    italic: 'https://fonts.gstatic.com/s/fraunces/v31/6NVf8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChJdt9vIVYX9G37.ttf',
    boldItalic: 'https://fonts.gstatic.com/s/fraunces/v31/6NVf8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChJ9N5vIVYX9G37.ttf',
  },
  'Merriweather': {
    regular: 'https://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l5OeyxNV-bnrw.ttf',
    bold: 'https://fonts.gstatic.com/s/merriweather/v30/u-4n0qyriQwlOrhSvowK_l52xwNZWMf6.ttf',
    italic: 'https://fonts.gstatic.com/s/merriweather/v30/u-4m0qyriQwlOrhSvowK_l5-eSZJdeP3.ttf',
    boldItalic: 'https://fonts.gstatic.com/s/merriweather/v30/u-4l0qyriQwlOrhSvowK_l5-eR7lXff4jvzDP3WGO5g.ttf',
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
  
  // Fable specific
  fableContainer: Style;
  fableFrame: Style;
  fableTitle: Style;
  fableContent: Style;
  
  // Index
  indexPage: Style;
  indexTitle: Style;
  indexColumns: Style;
  indexColumn: Style;
  indexEntry: Style;
  indexEntryTitle: Style;
  indexEntryPage: Style;
  
  // Colophon
  colophonPage: Style;
  colophonContent: Style;
  colophonText: Style;
  
  // Page number
  pageNumber: Style;
  pageNumberOdd: Style;
  pageNumberEven: Style;
  
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
  
  const baseFontSize = typography.baseFontSize * 11; // Base 11pt for poetry
  const headingFontSize = baseFontSize * 1.5;
  const titleFontSize = baseFontSize * 2.2;
  
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
    
    // =========== COVER ===========
    coverPage: {
      backgroundColor: colorScheme.background,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: mmToPoints(30),
    },
    coverContent: {
      textAlign: 'center',
      maxWidth: '80%',
    },
    coverTitle: {
      fontFamily: typography.headingFont,
      fontSize: titleFontSize * 1.2,
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginBottom: mmToPoints(8),
      letterSpacing: 1,
    },
    coverSubtitle: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize * 0.9,
      fontWeight: 'normal',
      fontStyle: 'italic',
      color: colorScheme.secondary,
      marginBottom: mmToPoints(20),
    },
    coverAuthor: {
      fontFamily: typography.bodyFont,
      fontSize: headingFontSize,
      color: colorScheme.text,
      marginTop: mmToPoints(30),
      letterSpacing: 2,
    },
    coverPublisher: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.9,
      color: colorScheme.secondary,
      marginTop: mmToPoints(40),
    },
    coverDecoration: {
      marginVertical: mmToPoints(15),
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
      height: '100%',
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
    
    // =========== TABLE OF CONTENTS ===========
    tocPage: {
      paddingTop: mmToPoints(40),
    },
    tocTitle: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize,
      color: colorScheme.primary,
      marginBottom: mmToPoints(15),
      textAlign: 'center',
    },
    tocEntry: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: mmToPoints(2),
    },
    tocPartie: {
      fontFamily: typography.headingFont,
      fontSize: baseFontSize * 1.1,
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginTop: mmToPoints(8),
      marginBottom: mmToPoints(4),
    },
    tocMarche: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.95,
      fontWeight: 'bold',
      color: colorScheme.secondary,
      marginTop: mmToPoints(4),
      paddingLeft: mmToPoints(5),
    },
    tocTexte: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.9,
      color: colorScheme.text,
      paddingLeft: mmToPoints(10),
    },
    tocPageNumber: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.85,
      color: colorScheme.secondary,
    },
    tocDotLeader: {
      flex: 1,
      marginHorizontal: mmToPoints(2),
      borderBottomWidth: 0.5,
      borderBottomStyle: 'dotted',
      borderBottomColor: colorScheme.secondary,
      marginBottom: 3,
    },
    
    // =========== PARTIE (MOVEMENT) ===========
    partiePage: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
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
    },
    texteMetadata: {
      marginTop: mmToPoints(10),
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 0.75,
      color: colorScheme.secondary,
      fontStyle: 'italic',
    },
    
    // =========== HAIKU SPECIFIC ===========
    haikuContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: mmToPoints(40),
    },
    haikuContent: {
      textAlign: 'center',
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize * 1.15,
      lineHeight: typography.lineHeight * 1.3,
      color: colorScheme.text,
      letterSpacing: 0.5,
    },
    
    // =========== FABLE SPECIFIC ===========
    fableContainer: {
      flex: 1,
      padding: mmToPoints(8),
    },
    fableFrame: {
      borderWidth: 0.5,
      borderColor: colorScheme.accent,
      borderRadius: 2,
      padding: mmToPoints(10),
    },
    fableTitle: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize * 0.9,
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginBottom: mmToPoints(10),
      textAlign: 'center',
    },
    fableContent: {
      fontFamily: typography.bodyFont,
      fontSize: baseFontSize,
      lineHeight: typography.lineHeight,
      color: colorScheme.text,
      fontStyle: 'italic',
    },
    
    // =========== INDEX ===========
    indexPage: {
      paddingTop: mmToPoints(30),
    },
    indexTitle: {
      fontFamily: typography.headingFont,
      fontSize: headingFontSize,
      color: colorScheme.primary,
      marginBottom: mmToPoints(12),
      textAlign: 'center',
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
    
    // =========== COLOPHON ===========
    colophonPage: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      height: '100%',
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
    
    // =========== PAGE NUMBER ===========
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
