import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { 
  PdfExportOptions, 
  TexteExport, 
  sanitizeContentForPdf, 
  isHaiku, 
  isFable,
  formatPageNumber,
  generateColophonText,
  getPageDimensions,
  mmToPoints,
} from './pdfExportUtils';
import { generatePdfStyles, PdfStylesRaw, registerFonts } from './pdfStyleGenerator';

// ============================================================================
// TYPES
// ============================================================================

export interface PartieData {
  id: string;
  numeroRomain: string;
  titre: string;
  sousTitre?: string;
  ordre: number;
}

export interface MarcheData {
  id: string;
  nom: string;
  ville: string;
  region?: string;
  date?: string;
  ordre: number;
}

export interface TocEntry {
  type: 'partie' | 'marche' | 'texte';
  title: string;
  pageNumber: number;
  partieNumero?: string;
  indent?: number;
  ville?: string;
}

// Helper to merge styles
const mergeStyles = (...styles: (Style | undefined)[]): Style => {
  return styles.filter(Boolean).reduce((acc, style) => ({ ...acc, ...style }), {}) as Style;
};

// ============================================================================
// CONTENT SEGMENTATION UTILITIES
// ============================================================================

// Approximate characters per A5 page after margins (conservative estimate)
const CHARS_PER_PAGE = 2000;

// Maximum characters for ANY paragraph to prevent Yoga overflow crash
// Calculation: A5 page ~32 lines × ~60 chars = ~1920 chars max per page
// We use 1500 as safety margin to account for title, margins, etc.
const MAX_PARAGRAPH_LENGTH = 1500;

// Maximum characters for the first paragraph in wrap={false} blocks (title + first para)
const MAX_FIRST_PARA_LENGTH = 600;

// Maximum number of page references to display before truncating with "…"
const MAX_PAGES_DISPLAY = 5;

/**
 * Format a list of page numbers for index display.
 * Limits to MAX_PAGES_DISPLAY and adds "…" if truncated.
 * Prevents horizontal overflow in index entries.
 */
const formatPageList = (pages: number[]): string => {
  if (pages.length <= MAX_PAGES_DISPLAY) {
    return pages.join(', ');
  }
  // Show first 4 pages + "…" to indicate more
  return `${pages.slice(0, 4).join(', ')}…`;
};

/**
 * Estimate how many pages a text will occupy based on content length
 */
const estimatePages = (texte: TexteExport): number => {
  const contentLength = sanitizeContentForPdf(texte.contenu).length;
  return Math.max(1, Math.ceil(contentLength / CHARS_PER_PAGE));
};

/**
 * Force-chunk a very long text into pieces that won't exceed maxLen.
 * Looks for natural cut points (sentence boundaries, then spaces).
 */
const chunkLongText = (text: string, maxLen: number): string[] => {
  if (text.length <= maxLen) {
    return [text];
  }
  
  const chunks: string[] = [];
  let remaining = text;
  
  while (remaining.length > maxLen) {
    const searchRange = remaining.slice(0, maxLen);
    
    // Try sentence boundary first (. ! ?)
    let cutPoint = searchRange.lastIndexOf('. ');
    if (cutPoint < maxLen * 0.3) cutPoint = searchRange.lastIndexOf('! ');
    if (cutPoint < maxLen * 0.3) cutPoint = searchRange.lastIndexOf('? ');
    if (cutPoint < maxLen * 0.3) cutPoint = searchRange.lastIndexOf('\n');
    if (cutPoint < maxLen * 0.3) cutPoint = searchRange.lastIndexOf(' ');
    if (cutPoint < maxLen * 0.3) cutPoint = maxLen; // Force cut as last resort
    
    chunks.push(remaining.slice(0, cutPoint + 1).trim());
    remaining = remaining.slice(cutPoint + 1).trim();
  }
  
  if (remaining.length > 0) {
    chunks.push(remaining);
  }
  
  return chunks;
};

/**
 * Split content into paragraphs for multi-page flow.
 * 
 * CRITICAL: This function now uses AGGRESSIVE CHUNKING to ensure no paragraph
 * exceeds MAX_PARAGRAPH_LENGTH (1500 chars), which prevents the Yoga layout
 * engine "unsupported number" crash.
 * 
 * Strategy:
 * 1. Split on newlines
 * 2. For short poems (<=5 lines AND <500 chars), keep all together
 * 3. For long prose, group short lines but FORCE CHUNK any line/group > 1500 chars
 */
const splitIntoParagraphs = (content: string): string[] => {
  const lines = content.split(/\n/).map(l => l.trim()).filter(Boolean);
  
  // Short poem (haiku, short verse): keep together if small enough
  if (lines.length <= 5 && content.length < 500) {
    return [lines.join('\n')];
  }
  
  // Long prose: intelligently group lines with FORCED CHUNKING for safety
  const paragraphs: string[] = [];
  let currentGroup: string[] = [];
  let currentLength = 0;
  
  for (const line of lines) {
    // If a single line exceeds MAX_PARAGRAPH_LENGTH, chunk it immediately
    if (line.length > MAX_PARAGRAPH_LENGTH) {
      // Flush current group first
      if (currentGroup.length > 0) {
        paragraphs.push(currentGroup.join('\n'));
        currentGroup = [];
        currentLength = 0;
      }
      // Chunk the oversized line
      paragraphs.push(...chunkLongText(line, MAX_PARAGRAPH_LENGTH));
      continue;
    }
    
    // Would adding this line exceed our limit?
    if (currentLength + line.length + 1 > MAX_PARAGRAPH_LENGTH) {
      // Flush current group
      if (currentGroup.length > 0) {
        paragraphs.push(currentGroup.join('\n'));
      }
      currentGroup = [line];
      currentLength = line.length;
    } else {
      // Add to current group
      currentGroup.push(line);
      currentLength += line.length + 1; // +1 for newline
    }
  }
  
  // Flush remaining lines
  if (currentGroup.length > 0) {
    const finalGroup = currentGroup.join('\n');
    // Even the final group might need chunking
    if (finalGroup.length > MAX_PARAGRAPH_LENGTH) {
      paragraphs.push(...chunkLongText(finalGroup, MAX_PARAGRAPH_LENGTH));
    } else {
      paragraphs.push(finalGroup);
    }
  }
  
  return paragraphs.length > 0 ? paragraphs : [content.slice(0, MAX_PARAGRAPH_LENGTH)];
};

/**
 * Ensure the first paragraph doesn't exceed MAX_FIRST_PARA_LENGTH
 * to prevent wrap={false} blocks (title + first paragraph) from exceeding page height.
 * This is MORE CONSERVATIVE than MAX_PARAGRAPH_LENGTH because it includes the title.
 */
const limitFirstParagraph = (
  paragraphs: string[]
): { firstParagraph: string; restParagraphs: string[] } => {
  if (paragraphs.length === 0) {
    return { firstParagraph: '', restParagraphs: [] };
  }
  
  const [rawFirst, ...rest] = paragraphs;
  
  if (rawFirst.length <= MAX_FIRST_PARA_LENGTH) {
    return { firstParagraph: rawFirst, restParagraphs: rest };
  }
  
  // First paragraph too long - find natural cut point
  const searchRange = rawFirst.slice(0, MAX_FIRST_PARA_LENGTH);
  
  // Try sentence boundary first (. ! ?)
  let cutPoint = Math.max(
    searchRange.lastIndexOf('. '),
    searchRange.lastIndexOf('! '),
    searchRange.lastIndexOf('? ')
  );
  
  // If no sentence boundary, try newline
  if (cutPoint < 100) {
    cutPoint = searchRange.lastIndexOf('\n');
  }
  
  // If still no good cut point, try space
  if (cutPoint < 100) {
    cutPoint = searchRange.lastIndexOf(' ');
  }
  
  // Last resort: cut at MAX_FIRST_PARA_LENGTH
  if (cutPoint < 100) {
    cutPoint = MAX_FIRST_PARA_LENGTH;
  }
  
  const firstParagraph = rawFirst.slice(0, cutPoint + 1).trim();
  const remainder = rawFirst.slice(cutPoint + 1).trim();
  
  return {
    firstParagraph,
    restParagraphs: remainder ? [remainder, ...rest] : rest,
  };
};

// ============================================================================
// PAGE FOOTER COMPONENT (Context + Dynamic Page Number via Render Prop)
// ============================================================================

interface PageFooterProps {
  styles: PdfStylesRaw;
  options: PdfExportOptions;
  partieName?: string;
  marcheName?: string;
}

/**
 * Dynamic footer using @react-pdf/renderer's render prop
 * This ensures the page number reflects the ACTUAL rendered page,
 * not a manually computed counter that doesn't account for text wrapping.
 * 
 * Uses a flexbox layout with two separate Text elements to avoid
 * the "unsupported number" crash caused by text overflow when using
 * manual spacing (.repeat(40)).
 */
export const PageFooter: React.FC<PageFooterProps> = ({ 
  styles, 
  options, 
  partieName, 
  marcheName 
}) => {
  // NOTE: The "unsupported number" crash is thrown by the PDF engine when layout
  // produces invalid coordinates (often caused by unsupported sizing like % widths
  // or overflowing text). To make exports robust, we keep the footer strictly to
  // the dynamic page number using known-safe numeric styles.

  return (
    <>
      <Text
        fixed
        style={mergeStyles(styles.pageNumber, styles.pageNumberOdd)}
        render={({ pageNumber }) =>
          pageNumber % 2 === 1 ? formatPageNumber(pageNumber, options.pageNumberStyle) : ''
        }
      />
      <Text
        fixed
        style={mergeStyles(styles.pageNumber, styles.pageNumberEven)}
        render={({ pageNumber }) =>
          pageNumber % 2 === 0 ? formatPageNumber(pageNumber, options.pageNumberStyle) : ''
        }
      />
    </>
  );
};

// Legacy PageFooter for components that still pass pageNumber (backwards compatibility)
interface LegacyPageFooterProps extends PageFooterProps {
  pageNumber?: number; // Now optional, ignored in favor of render prop
}

export const LegacyPageFooter: React.FC<LegacyPageFooterProps> = (props) => {
  return <PageFooter {...props} />;
};

// ============================================================================
// COVER PAGE
// ============================================================================

interface CoverPageProps {
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

export const CoverPage: React.FC<CoverPageProps> = ({ options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={styles.coverPage as Style}>
      <View style={styles.coverContent as Style}>
        <View style={styles.coverDecoration as Style} />
        <Text style={styles.coverTitle as Style}>{options.title}</Text>
        {options.subtitle && (
          <Text style={styles.coverSubtitle as Style}>{options.subtitle}</Text>
        )}
        <View style={styles.coverDecoration as Style} />
        <Text style={styles.coverAuthor as Style}>{options.author}</Text>
        {options.publisher && (
          <Text style={styles.coverPublisher as Style}>{options.publisher}</Text>
        )}
      </View>
    </Page>
  );
};

// ============================================================================
// FAUX-TITRE PAGE
// ============================================================================

interface FauxTitrePageProps {
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

export const FauxTitrePage: React.FC<FauxTitrePageProps> = ({ options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)}>
      <View style={styles.fauxTitrePage as Style}>
        <View style={styles.fauxTitreContent as Style}>
          <Text style={styles.fauxTitreTitle as Style}>{options.title}</Text>
          <Text style={styles.fauxTitreAuthor as Style}>{options.author}</Text>
        </View>
      </View>
    </Page>
  );
};

// ============================================================================
// TABLE OF CONTENTS PAGE
// ============================================================================

interface TocPageProps {
  entries: TocEntry[];
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

export const TocPage: React.FC<TocPageProps> = ({ entries, options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)} wrap>
      <View style={styles.tocPage as Style}>
        <Text style={styles.tocTitle as Style}>
          {options.language === 'fr' ? 'Table des Matières' : 'Table of Contents'}
        </Text>
        
        {entries.map((entry, index) => (
          <View key={index} style={styles.tocEntry as Style}>
            {entry.type === 'partie' && (
              <Text style={styles.tocPartie as Style}>
                {entry.partieNumero && `${entry.partieNumero} · `}{entry.title}
              </Text>
            )}
            {entry.type === 'marche' && (
              <View style={{ flexDirection: 'row', alignItems: 'center' } as Style}>
                <Text style={styles.tocMarche as Style}>
                  {entry.title}{entry.ville ? ` (${entry.ville})` : ''}
                </Text>
                <View style={styles.tocDotLeader as Style} />
                <Text style={styles.tocPageNumber as Style}>{entry.pageNumber}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
      
      <PageFooter styles={styles} options={{...options, pageNumberStyle: 'roman-preface'}} />
    </Page>
  );
};

// ============================================================================
// PARTIE (MOVEMENT) PAGE
// ============================================================================

interface PartiePageProps {
  partie: PartieData;
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

export const PartiePage: React.FC<PartiePageProps> = ({ partie, options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)}>
      <View style={styles.partiePage as Style}>
        <View style={styles.partieContent as Style}>
          <Text style={styles.partieNumeral as Style}>{partie.numeroRomain}</Text>
          <Text style={styles.partieTitre as Style}>{partie.titre}</Text>
          {partie.sousTitre && (
            <Text style={styles.partieSousTitre as Style}>{partie.sousTitre}</Text>
          )}
          <Text style={styles.partieSeparator as Style}>───────────────────</Text>
        </View>
      </View>
    </Page>
  );
};

// ============================================================================
// MARCHE HEADER COMPONENT
// ============================================================================

interface MarcheHeaderProps {
  marche: MarcheData;
  styles: PdfStylesRaw;
}

export const MarcheHeader: React.FC<MarcheHeaderProps> = ({ marche, styles }) => (
  <View style={styles.marcheHeader as Style}>
    <Text style={styles.marcheTitre as Style}>{marche.nom || marche.ville}</Text>
    {marche.region && (
      <Text style={styles.marcheLocation as Style}>{marche.ville}, {marche.region}</Text>
    )}
    {marche.date && (
      <Text style={styles.marcheDate as Style}>{marche.date}</Text>
    )}
  </View>
);

// ============================================================================
// HAIKU PAGE - CENTERED LAYOUT
// ============================================================================

interface HaikuPageProps {
  texte: TexteExport;
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageNumber: number;
  content: string;
}

// Haiku/Senryu rendered inline (not as separate page) for space efficiency
export const HaikuBlock: React.FC<{ texte: TexteExport; styles: PdfStylesRaw; content: string }> = ({ texte, styles, content }) => {
  // Split haiku content into individual lines for proper centering
  const lines = content
    .split(/\r?\n+/)
    .map(line => line.trim())
    .filter(Boolean);
  
  return (
    <View style={styles.haikuBlock as Style}>
      <Text style={styles.haikuTitle as Style}>{texte.titre}</Text>
      <View style={styles.haikuSeparator as Style} />
      <View style={{ alignItems: 'center', marginTop: mmToPoints(4) } as Style}>
        {lines.map((line, idx) => (
          <Text key={idx} style={styles.haikuLine as Style}>{line}</Text>
        ))}
      </View>
    </View>
  );
};

// ============================================================================
// FABLE PAGE - FRAMED LAYOUT
// ============================================================================

interface FablePageProps {
  texte: TexteExport;
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  content: string;
  partieName?: string;
  marcheName?: string;
}

export const FablePage: React.FC<FablePageProps> = ({ texte, options, styles, content, partieName, marcheName }) => {
  const dimensions = getPageDimensions(options);
  
  // Detect and extract moral from content (common patterns: "Morale :", "MORALE", "La morale")
  const extractMoral = (text: string): { main: string; moral: string | null } => {
    const moralPatterns = [
      /\n\s*(Morale\s*:\s*.+)$/i,
      /\n\s*(MORALE\s*:\s*.+)$/i,
      /\n\s*(La morale\s*:\s*.+)$/i,
    ];
    
    for (const pattern of moralPatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          main: text.replace(match[0], '').trim(),
          moral: match[1].trim(),
        };
      }
    }
    return { main: text, moral: null };
  };
  
  const { main: mainContent, moral } = extractMoral(content);
  
  // Use smart paragraph splitting that handles single \n separators
  const rawParagraphs = splitIntoParagraphs(mainContent);
  
  // Limit first paragraph to prevent wrap={false} overflow crash
  const { firstParagraph, restParagraphs } = limitFirstParagraph(rawParagraphs);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)} wrap>
      <View style={styles.fableContainer as Style}>
        {/* Header with ornament and title - NO wrap={false} to prevent overflow crash */}
        <View style={styles.fableHeader as Style}>
          <Text style={styles.fableHeaderLabel as Style}>❦ FABLE ❦</Text>
          <Text style={styles.fableTitle as Style} minPresenceAhead={30}>{texte.titre}</Text>
        </View>
        
        {/* All paragraphs flow naturally across pages */}
        {[firstParagraph, ...restParagraphs].filter(Boolean).map((para, idx) => (
          <Text key={idx} style={styles.fableContent as Style}>{para}</Text>
        ))}
        
        {/* Moral section if detected */}
        {moral && (
          <Text style={styles.fableMoral as Style}>{moral}</Text>
        )}
      </View>
      
      <PageFooter 
        styles={styles} 
        options={options}
        partieName={partieName}
        marcheName={marcheName}
      />
    </Page>
  );
};

// ============================================================================
// TEXTE PAGE - STANDARD
// ============================================================================

interface TextePageProps {
  texte: TexteExport;
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  showMarcheHeader?: boolean;
  marche?: MarcheData;
  partieName?: string;
  marcheName?: string;
}

export const TextePage: React.FC<TextePageProps> = ({ 
  texte, 
  options,
  styles, 
  showMarcheHeader,
  marche,
  partieName,
  marcheName,
}) => {
  const dimensions = getPageDimensions(options);
  const content = sanitizeContentForPdf(texte.contenu);
  
  const isHaikuText = isHaiku(texte);
  const isFableText = isFable(texte);
  
  // Haikus are rendered inline (not as separate centered page)
  if (isHaikuText) {
    return (
      <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)}>
        <View style={styles.textePage as Style}>
          {showMarcheHeader && marche && (
            <MarcheHeader marche={marche} styles={styles} />
          )}
          <HaikuBlock texte={texte} styles={styles} content={content} />
        </View>
        
        <PageFooter 
          styles={styles} 
          options={options}
          partieName={partieName}
          marcheName={marcheName}
        />
      </Page>
    );
  }
  
  if (isFableText) {
    return (
      <FablePage 
        texte={texte} 
        options={options} 
        styles={styles} 
        content={content}
        partieName={partieName}
        marcheName={marcheName}
      />
    );
  }
  
  // Use smart paragraph splitting that handles single \n separators
  // This prevents "unsupported number" crash from massive single <Text> blocks
  const rawParagraphs = splitIntoParagraphs(content);
  
  // Limit first paragraph to prevent wrap={false} overflow crash
  const { firstParagraph, restParagraphs } = limitFirstParagraph(rawParagraphs);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)} wrap>
      <View style={styles.textePage as Style}>
        {showMarcheHeader && marche && (
          <MarcheHeader marche={marche} styles={styles} />
        )}
        
        <View style={styles.texteContainer as Style}>
          {/* Title alone is kept together - content flows naturally */}
          <Text style={styles.texteTitle as Style} minPresenceAhead={50}>{texte.titre}</Text>
          
          {/* All paragraphs flow naturally across pages - no wrap={false} to prevent crashes */}
          {[firstParagraph, ...restParagraphs].filter(Boolean).map((para, idx) => (
            <Text key={idx} style={styles.texteContent as Style}>{para}</Text>
          ))}
          
          {options.includeMetadata && texte.type_texte && (
            <Text style={styles.texteMetadata as Style}>
              {texte.type_texte}
              {texte.marche_ville && ` · ${texte.marche_ville}`}
            </Text>
          )}
        </View>
      </View>
      
      <PageFooter 
        styles={styles} 
        options={options}
        partieName={partieName}
        marcheName={marcheName}
      />
    </Page>
  );
};

// ============================================================================
// INDEX PAR LIEU (Hierarchical: Partie > Marche > Types with pages)
// ============================================================================

interface IndexLieuxEntry {
  partieId?: string;
  partieNumero?: string;
  partieTitre?: string;
  marches: {
    nom: string;
    ville?: string;
    region?: string;
    types: {
      type: string;
      pages: number[];
    }[];
  }[];
}

interface IndexLieuxPageProps {
  entries: IndexLieuxEntry[];
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

export const IndexLieuxPage: React.FC<IndexLieuxPageProps> = ({ entries, options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)} wrap>
      <View style={styles.indexPage as Style}>
        <Text style={styles.indexTitle as Style}>
          ─────  INDEX PAR LIEU  ─────
        </Text>
        
        {entries.map((partieEntry, pIndex) => (
          <View key={pIndex}>
            {/* Partie header (Movement) */}
            {partieEntry.partieTitre && (
              <Text style={styles.indexLieuxPartieHeader as Style}>
                {partieEntry.partieNumero && `${partieEntry.partieNumero}. `}{partieEntry.partieTitre}
              </Text>
            )}
            
            {partieEntry.marches.map((marche, mIndex) => {
              const [firstType, ...restTypes] = marche.types;
              return (
                <View key={mIndex}>
                  {/* Keep marche header + first type together to avoid orphans */}
                  <View style={styles.indexLieuxMarcheBlock as Style}>
                    <Text style={styles.indexLieuxMarcheEntry as Style}>
                      {marche.nom}
                    </Text>
                    {firstType && (
                      <View style={styles.indexLieuxTypeRow as Style}>
                        <Text style={styles.indexLieuxTypeName as Style}>{firstType.type}</Text>
                        <View style={styles.indexLieuxDotLeader as Style} />
                        <Text style={styles.indexLieuxPages as Style}>{formatPageList(firstType.pages)}</Text>
                      </View>
                    )}
                  </View>
                  {/* Rest of types can flow to next page if needed */}
                  {restTypes.map((typeEntry, tIndex) => (
                    <View key={tIndex} style={styles.indexLieuxTypeRow as Style}>
                      <Text style={styles.indexLieuxTypeName as Style}>{typeEntry.type}</Text>
                      <View style={styles.indexLieuxDotLeader as Style} />
                      <Text style={styles.indexLieuxPages as Style}>{formatPageList(typeEntry.pages)}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      
      <PageFooter styles={styles} options={options} />
    </Page>
  );
};

// ============================================================================
// INDEX PAR GENRE (with ornaments: ✦ HAÏKUS ✦)
// ============================================================================

interface IndexGenreEntry {
  genre: string;
  textes: {
    titre: string;
    lieu: string;
    page: number;
  }[];
}

interface IndexGenresPageProps {
  entries: IndexGenreEntry[];
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

// Predefined order for genres (matching Word export)
const GENRE_ORDER = ['Haïku', 'Senryū', 'Fable', 'Poème', 'Manifeste', 'Prose', 'Autre'];

export const IndexGenresPage: React.FC<IndexGenresPageProps> = ({ entries, options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  // Sort entries by predefined genre order
  const sortedEntries = [...entries].sort((a, b) => {
    const aIndex = GENRE_ORDER.findIndex(g => a.genre.toLowerCase().includes(g.toLowerCase()));
    const bIndex = GENRE_ORDER.findIndex(g => b.genre.toLowerCase().includes(g.toLowerCase()));
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)} wrap>
      <View style={styles.indexPage as Style}>
        <Text style={styles.indexTitle as Style}>
          ─────  INDEX DES ŒUVRES  ─────
        </Text>
        
        {sortedEntries.map((genreEntry, gIndex) => {
          // IMPORTANT: avoid page breaks between a title line and its (lieu + dots + page) line.
          // If React-PDF splits inside the entry, it produces “orphan” lines at the top of the next page,
          // which visually overlaps with the next section header (MANIFESTE / POÈME / HAIKU).
          const [first, ...rest] = genreEntry.textes;

          // Truncate long titles to prevent horizontal overflow
          const truncateTitle = (title: string, maxLen = 60) =>
            title.length > maxLen ? title.slice(0, maxLen - 1) + '…' : title;
          
          const renderEntry = (texte: any, key: React.Key) => (
            <View key={key} style={styles.indexGenreEntryBlock as Style}>
              {/* Line 1: Title only (bold) - truncated to prevent overflow */}
              <Text style={styles.indexGenreTitle as Style}>{truncateTitle(texte.titre)}</Text>
              {/* Line 2: Lieu with dot leader and page */}
              <View style={styles.indexGenreDetailRow as Style}>
                <Text style={styles.indexGenreLieu as Style}>{texte.lieu}</Text>
                <View style={styles.indexGenreDotLeader as Style} />
                <Text style={styles.indexGenrePage as Style}>{texte.page}</Text>
              </View>
            </View>
          );

          return (
            <View key={gIndex}>
              {/* Keep the section header with at least the first entry to avoid lonely headers at the bottom */}
              <View>
                <View style={styles.indexGenreSection as Style}>
                  <Text style={styles.indexGenreOrnament as Style}>
                    &  {genreEntry.genre.toUpperCase()}  &
                  </Text>
                </View>
                {first ? renderEntry(first, 'first') : null}
              </View>

              {/* Remaining entries can flow across pages normally, but each entry stays unbreakable */}
              {rest.map((texte, tIndex) => renderEntry(texte, tIndex))}
            </View>
          );
        })}
      </View>
      
      <PageFooter styles={styles} options={options} />
    </Page>
  );
};

// ============================================================================
// INDEX THÉMATIQUE (Keywords by category)
// ============================================================================

interface IndexKeywordEntry {
  category: string;
  keywords: {
    name: string;
    pages: number[];
  }[];
}

interface IndexKeywordsPageProps {
  entries: IndexKeywordEntry[];
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

export const IndexKeywordsPage: React.FC<IndexKeywordsPageProps> = ({ entries, options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  // Truncate long keyword names to avoid horizontal overflow (Yoga crash prevention)
  const truncateName = (name: string, maxLen = 50) => 
    name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)} wrap>
      <View style={styles.indexPage as Style}>
        <Text style={styles.indexTitle as Style}>
          ─────  INDEX THÉMATIQUE  ─────
        </Text>
        
        {entries.map((categoryEntry, cIndex) => {
          // Strategy: keep category header with first keyword together, allow rest to wrap
          const [firstKeyword, ...restKeywords] = categoryEntry.keywords;
          
          return (
            <View key={cIndex}>
              {/* Category header + first keyword stay together (unbreakable) */}
              <View>
                <View style={styles.indexKeywordCategoryBox as Style}>
                  <Text style={styles.indexKeywordCategoryTitle as Style}>{categoryEntry.category}</Text>
                </View>
                
                {firstKeyword && (
                  <View style={styles.indexKeywordEntry as Style}>
                    <Text style={styles.indexKeywordName as Style}>{truncateName(firstKeyword.name)}</Text>
                    <View style={styles.indexKeywordDotLeader as Style} />
                    <Text style={styles.indexKeywordPages as Style}>{formatPageList(firstKeyword.pages)}</Text>
                  </View>
                )}
              </View>
              
              {/* Remaining keywords can flow across pages normally */}
              {restKeywords.map((keyword, kIndex) => (
                <View key={kIndex} style={styles.indexKeywordEntry as Style}>
                  <Text style={styles.indexKeywordName as Style}>{truncateName(keyword.name)}</Text>
                  <View style={styles.indexKeywordDotLeader as Style} />
                  <Text style={styles.indexKeywordPages as Style}>{formatPageList(keyword.pages)}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
      
      <PageFooter styles={styles} options={options} />
    </Page>
  );
};

// ============================================================================
// INDEX PAGE (Legacy - kept for backwards compatibility)
// ============================================================================

interface IndexEntry {
  title: string;
  pages: number[];
}

interface IndexPageProps {
  title: string;
  entries: IndexEntry[];
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageNumber: number;
}

export const IndexPage: React.FC<IndexPageProps> = ({ title, entries, options, styles, pageNumber }) => {
  const dimensions = getPageDimensions(options);
  const isOdd = pageNumber % 2 === 1;
  
  const midpoint = Math.ceil(entries.length / 2);
  const leftColumn = entries.slice(0, midpoint);
  const rightColumn = entries.slice(midpoint);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, isOdd ? styles.pageOdd : styles.pageEven)}>
      <View style={styles.indexPage as Style}>
        <Text style={styles.indexTitle as Style}>{title}</Text>
        
        <View style={styles.indexColumns as Style}>
          <View style={styles.indexColumn as Style}>
            {leftColumn.map((entry, index) => (
              <View key={index} style={styles.indexEntry as Style}>
                <Text style={styles.indexEntryTitle as Style}>{entry.title}</Text>
                <Text style={styles.indexEntryPage as Style}>
                  {entry.pages.join(', ')}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.indexColumn as Style}>
            {rightColumn.map((entry, index) => (
              <View key={index} style={styles.indexEntry as Style}>
                <Text style={styles.indexEntryTitle as Style}>{entry.title}</Text>
                <Text style={styles.indexEntryPage as Style}>
                  {entry.pages.join(', ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      <Text style={mergeStyles(styles.pageNumber, isOdd ? styles.pageNumberOdd : styles.pageNumberEven)}>
        {formatPageNumber(pageNumber, options.pageNumberStyle)}
      </Text>
    </Page>
  );
};

// ============================================================================
// COLOPHON PAGE
// ============================================================================

interface ColophonPageProps {
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  texteCount: number;
}

export const ColophonPage: React.FC<ColophonPageProps> = ({ options, styles, texteCount }) => {
  const dimensions = getPageDimensions(options);
  const colophonText = generateColophonText(options, texteCount);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageEven)}>
      <View style={styles.colophonPage as Style}>
        <View style={styles.colophonContent as Style}>
          <View style={styles.separator as Style} />
          <Text style={styles.colophonText as Style}>{colophonText}</Text>
        </View>
      </View>
    </Page>
  );
};

// ============================================================================
// BLANK PAGE (for verso pages)
// ============================================================================

interface BlankPageProps {
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

export const BlankPage: React.FC<BlankPageProps> = ({ options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageEven)}>
      <View />
    </Page>
  );
};

// ============================================================================
// MAIN PDF DOCUMENT COMPONENT
// ============================================================================

interface PdfDocumentProps {
  textes: TexteExport[];
  options: PdfExportOptions;
  parties?: PartieData[];
}

export const PdfDocument: React.FC<PdfDocumentProps> = ({ textes, options, parties = [] }) => {
  const styles = generatePdfStyles(options);
  
  const groupedContent = groupTextesByStructure(textes, parties, options);
  const tocEntries = buildTocEntries(groupedContent, options);
  
  // Build page mapping for indexes (texteId -> pageNumber)
  const pageMapping = buildPageMapping(groupedContent, options);
  
  // Build index data
  const indexLieuxEntries = options.includeIndexLieux 
    ? buildIndexLieuxData(textes, parties, pageMapping)
    : [];
  const indexGenresEntries = options.includeIndexGenres
    ? buildIndexGenresData(textes, pageMapping)
    : [];
  const indexKeywordsEntries = options.includeIndexKeywords
    ? buildIndexKeywordsData(textes, pageMapping, options.selectedKeywordCategories)
    : [];
  
  // Note: Manual page counting removed - @react-pdf/renderer's render prop 
  // now handles dynamic page numbering automatically in PageFooter
  
  return (
    <Document
      title={options.title}
      author={options.author}
      subject={options.description}
      language={options.language}
      creator="La Fréquence du Vivant - Export PDF Pro"
    >
      {options.includeCover && (
        <CoverPage options={options} styles={styles} />
      )}
      
      {options.includeFauxTitre && (
        <FauxTitrePage options={options} styles={styles} />
      )}
      
      {options.includeTableOfContents && tocEntries.length > 0 && (
        <TocPage 
          entries={tocEntries} 
          options={options} 
          styles={styles} 
        />
      )}
      
      {groupedContent.map((item) => {
        if (item.type === 'partie' && item.partie) {
          return (
            <PartiePage 
              key={`partie-${item.partie.id}`}
              partie={item.partie}
              options={options}
              styles={styles}
            />
          );
        }
        
        if (item.type === 'texte' && item.texte) {
          const partieName = item.currentPartie?.titre;
          const marcheName = item.marche?.nom || item.marche?.ville;
          
          return (
            <TextePage
              key={`texte-${item.texte.id}`}
              texte={item.texte}
              options={options}
              styles={styles}
              showMarcheHeader={item.isFirstInMarche}
              marche={item.marche}
              partieName={partieName}
              marcheName={marcheName}
            />
          );
        }
        
        return null;
      })}
      
      {/* Index par Lieu */}
      {options.includeIndexLieux && indexLieuxEntries.length > 0 && (
        <IndexLieuxPage
          entries={indexLieuxEntries}
          options={options}
          styles={styles}
        />
      )}
      
      {/* Index des Œuvres (par genre) */}
      {options.includeIndexGenres && indexGenresEntries.length > 0 && (
        <IndexGenresPage
          entries={indexGenresEntries}
          options={options}
          styles={styles}
        />
      )}
      
      {/* Index Thématique (mots-clés) */}
      {options.includeIndexKeywords && indexKeywordsEntries.length > 0 && (
        <IndexKeywordsPage
          entries={indexKeywordsEntries}
          options={options}
          styles={styles}
        />
      )}
      
      {options.includeColophon && (
        <ColophonPage 
          options={options} 
          styles={styles} 
          texteCount={textes.length}
        />
      )}
    </Document>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface GroupedItem {
  type: 'partie' | 'texte';
  partie?: PartieData;
  texte?: TexteExport;
  marche?: MarcheData;
  isFirstInMarche?: boolean;
  currentPartie?: PartieData; // Track current partie for footer context
}

function groupTextesByStructure(
  textes: TexteExport[], 
  parties: PartieData[],
  options: PdfExportOptions
): GroupedItem[] {
  const result: GroupedItem[] = [];
  
  if (options.organizationMode === 'marche') {
    const partiesMap = new Map<string, TexteExport[]>();
    
    textes.forEach(texte => {
      const partieId = texte.partie_id || 'no-partie';
      if (!partiesMap.has(partieId)) {
        partiesMap.set(partieId, []);
      }
      partiesMap.get(partieId)!.push(texte);
    });
    
    const sortedParties = [...parties].sort((a, b) => a.ordre - b.ordre);
    
    sortedParties.forEach(partie => {
      if (options.includePartiePages) {
        result.push({ type: 'partie', partie });
      }
      
      const partieTextes = partiesMap.get(partie.id) || [];
      
      const marcheGroups = new Map<string, { textes: TexteExport[]; marcheOrdre: number }>();
      partieTextes.forEach(texte => {
        const marcheKey = texte.marche_nom || texte.marche_ville || 'no-marche';
        if (!marcheGroups.has(marcheKey)) {
          marcheGroups.set(marcheKey, { textes: [], marcheOrdre: texte.marche_ordre || 999 });
        }
        marcheGroups.get(marcheKey)!.textes.push(texte);
      });
      
      // Sort marches by marche_ordre (like Word export)
      const sortedMarcheEntries = Array.from(marcheGroups.entries())
        .sort((a, b) => a[1].marcheOrdre - b[1].marcheOrdre);
      
      sortedMarcheEntries.forEach(([marcheName, marcheData]) => {
        // Sort textes within marche by ordre
        const sortedTextes = marcheData.textes.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
        
        sortedTextes.forEach((texte, index) => {
          const marche: MarcheData = {
            id: texte.marche_nom || marcheName,
            nom: texte.marche_nom || marcheName,
            ville: texte.marche_ville || '',
            region: texte.marche_region,
            date: texte.marche_date,
            ordre: texte.marche_ordre || 0,
          };
          
          result.push({
            type: 'texte',
            texte,
            marche,
            isFirstInMarche: index === 0,
            currentPartie: partie, // Pass partie for footer context
          });
        });
      });
    });
    
    const noPartieTextes = partiesMap.get('no-partie') || [];
    if (noPartieTextes.length > 0) {
      noPartieTextes.forEach((texte, index) => {
        const marche: MarcheData = {
          id: texte.marche_nom || 'unknown',
          nom: texte.marche_nom || texte.marche_ville || '',
          ville: texte.marche_ville || '',
          region: texte.marche_region,
          date: texte.marche_date,
          ordre: texte.marche_ordre || 0,
        };
        
        result.push({
          type: 'texte',
          texte,
          marche,
          isFirstInMarche: index === 0,
          // No currentPartie - footer will show marche name
        });
      });
    }
  } else {
    const typeGroups = new Map<string, TexteExport[]>();
    textes.forEach(texte => {
      const type = texte.type_texte || 'Autre';
      if (!typeGroups.has(type)) {
        typeGroups.set(type, []);
      }
      typeGroups.get(type)!.push(texte);
    });
    
    typeGroups.forEach((typeTextes) => {
      typeTextes.forEach((texte, index) => {
        const marche: MarcheData = {
          id: texte.marche_nom || 'unknown',
          nom: texte.marche_nom || texte.marche_ville || '',
          ville: texte.marche_ville || '',
          region: texte.marche_region,
          date: texte.marche_date,
          ordre: texte.marche_ordre || 0,
        };
        
        result.push({
          type: 'texte',
          texte,
          marche,
          isFirstInMarche: index === 0,
        });
      });
    });
  }
  
  return result;
}

function buildTocEntries(groupedContent: GroupedItem[], options: PdfExportOptions): TocEntry[] {
  const entries: TocEntry[] = [];
  let pageNumber = options.startPageNumber;
  
  // Simplified page counting: cover + faux-titre are single pages now (no blanks)
  if (options.includeCover) pageNumber += 1;
  if (options.includeFauxTitre) pageNumber += 1;
  if (options.includeTableOfContents) pageNumber += 1;
  
  // Track which marches we've already added to ToC
  const seenMarches = new Set<string>();
  
  groupedContent.forEach(item => {
    if (item.type === 'partie' && item.partie) {
      entries.push({
        type: 'partie',
        title: item.partie.titre,
        pageNumber,
        partieNumero: item.partie.numeroRomain,
      });
      // Partie pages are always single pages
      pageNumber += 1;
    } else if (item.type === 'texte' && item.texte) {
      // Only add marche entry for first text in that marche
      if (item.isFirstInMarche && item.marche) {
        const marcheKey = item.marche.nom || item.marche.ville;
        if (!seenMarches.has(marcheKey)) {
          seenMarches.add(marcheKey);
          entries.push({
            type: 'marche',
            title: marcheKey,
            pageNumber,
            indent: 1,
            ville: item.marche.ville || undefined,
          });
        }
      }
      
      // CRITICAL: Estimate pages for long texts (multi-page flow)
      const estimatedPages = estimatePages(item.texte);
      pageNumber += estimatedPages;
    }
  });
  
  return entries;
}

// ============================================================================
// INDEX BUILDING FUNCTIONS
// ============================================================================

/**
 * Build page mapping: texteId -> pageNumber
 */
function buildPageMapping(
  groupedContent: GroupedItem[],
  options: PdfExportOptions
): Map<string, number> {
  const mapping = new Map<string, number>();
  let pageNumber = options.startPageNumber;
  
  if (options.includeCover) pageNumber++;
  if (options.includeFauxTitre) pageNumber++;
  if (options.includeTableOfContents) pageNumber++;
  
  groupedContent.forEach(item => {
    if (item.type === 'partie') {
      // Partie pages are always single pages
      pageNumber += 1;
    } else if (item.type === 'texte' && item.texte) {
      // Store the starting page for this text
      mapping.set(item.texte.id, pageNumber);
      
      // CRITICAL: Estimate pages for long texts (multi-page flow)
      const estimatedPages = estimatePages(item.texte);
      pageNumber += estimatedPages;
    }
  });
  
  return mapping;
}

/**
 * Build Index par Lieu data: Partie > Marche > Types with pages
 */
function buildIndexLieuxData(
  textes: TexteExport[],
  parties: PartieData[],
  pageMapping: Map<string, number>
): Array<{
  partieId?: string;
  partieNumero?: string;
  partieTitre?: string;
  marches: {
    nom: string;
    ville?: string;
    region?: string;
    types: { type: string; pages: number[] }[];
  }[];
}> {
  const result: Array<{
    partieId?: string;
    partieNumero?: string;
    partieTitre?: string;
    marches: {
      nom: string;
      ville?: string;
      region?: string;
      types: { type: string; pages: number[] }[];
    }[];
  }> = [];
  
  // Group textes by partie
  const partiesMap = new Map<string, TexteExport[]>();
  textes.forEach(texte => {
    const partieId = texte.partie_id || 'no-partie';
    if (!partiesMap.has(partieId)) {
      partiesMap.set(partieId, []);
    }
    partiesMap.get(partieId)!.push(texte);
  });
  
  // Sort parties
  const sortedParties = [...parties].sort((a, b) => a.ordre - b.ordre);
  
  sortedParties.forEach(partie => {
    const partieTextes = partiesMap.get(partie.id) || [];
    if (partieTextes.length === 0) return;
    
    // Group by marche
    const marcheMap = new Map<string, { textes: TexteExport[]; ville?: string; region?: string; ordre: number }>();
    partieTextes.forEach(texte => {
      const marcheKey = texte.marche_nom || texte.marche_ville || 'Sans lieu';
      if (!marcheMap.has(marcheKey)) {
        marcheMap.set(marcheKey, {
          textes: [],
          ville: texte.marche_ville,
          region: texte.marche_region,
          ordre: texte.marche_ordre || 999,
        });
      }
      marcheMap.get(marcheKey)!.textes.push(texte);
    });
    
    // Sort marches and build entry
    const marches = Array.from(marcheMap.entries())
      .sort((a, b) => a[1].ordre - b[1].ordre)
      .map(([nom, data]) => {
        // Group by type within marche
        const typeMap = new Map<string, number[]>();
        data.textes.forEach(texte => {
          const type = texte.type_texte || 'Autre';
          const page = pageMapping.get(texte.id);
          if (page) {
            if (!typeMap.has(type)) typeMap.set(type, []);
            typeMap.get(type)!.push(page);
          }
        });
        
        const types = Array.from(typeMap.entries())
          .map(([type, pages]) => ({ type, pages: pages.sort((a, b) => a - b) }));
        
        return {
          nom,
          ville: data.ville,
          region: data.region,
          types,
        };
      });
    
    result.push({
      partieId: partie.id,
      partieNumero: partie.numeroRomain,
      partieTitre: partie.titre,
      marches,
    });
  });
  
  // Handle textes without partie
  const noPartieTextes = partiesMap.get('no-partie') || [];
  if (noPartieTextes.length > 0) {
    const marcheMap = new Map<string, { textes: TexteExport[]; ville?: string; region?: string }>();
    noPartieTextes.forEach(texte => {
      const marcheKey = texte.marche_nom || texte.marche_ville || 'Sans lieu';
      if (!marcheMap.has(marcheKey)) {
        marcheMap.set(marcheKey, { textes: [], ville: texte.marche_ville, region: texte.marche_region });
      }
      marcheMap.get(marcheKey)!.textes.push(texte);
    });
    
    const marches = Array.from(marcheMap.entries()).map(([nom, data]) => {
      const typeMap = new Map<string, number[]>();
      data.textes.forEach(texte => {
        const type = texte.type_texte || 'Autre';
        const page = pageMapping.get(texte.id);
        if (page) {
          if (!typeMap.has(type)) typeMap.set(type, []);
          typeMap.get(type)!.push(page);
        }
      });
      
      return {
        nom,
        ville: data.ville,
        region: data.region,
        types: Array.from(typeMap.entries()).map(([type, pages]) => ({ type, pages: pages.sort((a, b) => a - b) })),
      };
    });
    
    result.push({ marches });
  }
  
  return result;
}

/**
 * Build Index par Genre data: Genre > Textes with lieu + page
 */
function buildIndexGenresData(
  textes: TexteExport[],
  pageMapping: Map<string, number>
): Array<{
  genre: string;
  textes: { titre: string; lieu: string; page: number }[];
}> {
  // Group by genre
  const genreMap = new Map<string, Array<{ titre: string; lieu: string; page: number }>>();
  
  textes.forEach(texte => {
    const genre = texte.type_texte || 'Autre';
    const page = pageMapping.get(texte.id);
    if (!page) return;
    
    if (!genreMap.has(genre)) {
      genreMap.set(genre, []);
    }
    
    genreMap.get(genre)!.push({
      titre: texte.titre,
      lieu: texte.marche_nom || texte.marche_ville || 'Lieu inconnu',
      page,
    });
  });
  
  // Convert to array and sort textes within each genre by page
  return Array.from(genreMap.entries()).map(([genre, items]) => ({
    genre,
    textes: items.sort((a, b) => a.page - b.page),
  }));
}

// ============================================================================
// THEMATIC KEYWORD DEFINITIONS (7 families)
// ============================================================================

const KEYWORD_CATEGORIES: Record<string, string[]> = {
  'Faune Fluviale et Migratrice': [
    'lamproie', 'saumon', 'alose', 'truite', 'anguille', 'brochet', 'sandre', 'silure',
    'esturgeon', 'barbeau', 'goujon', 'ablette', 'carpe', 'tanche', 'perche',
    'aigrette', 'héron', 'martin-pêcheur', 'cormoran', 'canard', 'cygne', 'grèbe',
    'loutre', 'castor', 'ragondin', 'grenouille', 'triton', 'libellule', 'éphémère',
  ],
  'Hydrologie et Dynamiques Fluviales': [
    'étiage', 'crue', 'marnage', 'mascaret', 'confluence', 'méandre', 'bras mort',
    'débit', 'courant', 'flux', 'reflux', 'onde', 'vague', 'remous', 'tourbillon',
    'source', 'résurgence', 'nappe', 'aquifère', 'infiltration', 'ruissellement',
    'berge', 'rive', 'lit', 'chenal', 'estuaire', 'delta', 'embouchure',
  ],
  'Ouvrages Humains': [
    'barrage', 'ascenseur', 'pont', 'écluse', 'digue', 'quai', 'ponton', 'gabarre',
    'moulin', 'usine', 'centrale', 'turbine', 'seuil', 'passe', 'échelle',
    'cale', 'port', 'halage', 'chemin', 'belvédère', 'observatoire', 'passerelle',
  ],
  'Flore et Paysages': [
    'aulne', 'saule', 'peuplier', 'séquoia', 'renoncule', 'nénuphar', 'roseau',
    'jonc', 'iris', 'carex', 'phragmite', 'massette', 'menthe', 'cresson',
    'ripisylve', 'forêt', 'prairie', 'bocage', 'falaise', 'grotte', 'gouffre',
  ],
  'Temporalités et Projections': [
    '2050', '2035', '2045', 'holocène', 'anthropocène', 'mémoire', 'avenir',
    'projection', 'cycle', 'saison', 'migration', 'génération', 'extinction',
    'résilience', 'adaptation', 'évolution', 'héritage', 'transmission',
  ],
  'Geste Poétique': [
    'remonter', 'fréquence', 'spectre', 'géopoétique', 'écoute', 'observation',
    'marche', 'traversée', 'contemplation', 'silence', 'murmure', 'chant',
    'trace', 'empreinte', 'signe', 'cartographie', 'atlas', 'territoire',
  ],
  'Technologies et Médiations': [
    'IA', 'intelligence artificielle', 'drone', 'ADN', 'capteur', 'hydrophone',
    'satellite', 'radar', 'sonar', 'bioacoustique', 'télédétection', 'modélisation',
    'data', 'algorithme', 'simulation', 'prédiction', 'monitoring',
  ],
};

/**
 * Build Index Thématique data: Category > Keywords with pages
 */
function buildIndexKeywordsData(
  textes: TexteExport[],
  pageMapping: Map<string, number>,
  selectedCategories?: string[]
): Array<{
  category: string;
  keywords: { name: string; pages: number[] }[];
}> {
  const result: Array<{
    category: string;
    keywords: { name: string; pages: number[] }[];
  }> = [];
  
  // Filter categories if specified
  const categoriesToUse = selectedCategories && selectedCategories.length > 0
    ? Object.entries(KEYWORD_CATEGORIES).filter(([cat]) => selectedCategories.includes(cat))
    : Object.entries(KEYWORD_CATEGORIES);
  
  for (const [category, keywords] of categoriesToUse) {
    const keywordPages = new Map<string, number[]>();
    
    // Search each texte for keywords
    textes.forEach(texte => {
      const page = pageMapping.get(texte.id);
      if (!page) return;
      
      // Search in title and content (case-insensitive)
      const searchText = `${texte.titre} ${texte.contenu}`.toLowerCase();
      
      keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (searchText.includes(keywordLower)) {
          if (!keywordPages.has(keyword)) {
            keywordPages.set(keyword, []);
          }
          const pages = keywordPages.get(keyword)!;
          if (!pages.includes(page)) {
            pages.push(page);
          }
        }
      });
    });
    
    // Only include categories with found keywords
    if (keywordPages.size > 0) {
      const sortedKeywords = Array.from(keywordPages.entries())
        .sort((a, b) => a[0].localeCompare(b[0], 'fr'))
        .map(([name, pages]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
          pages: pages.sort((a, b) => a - b),
        }));
      
      result.push({
        category,
        keywords: sortedKeywords,
      });
    }
  }
  
  return result;
}

// ============================================================================
// EXPORT FUNCTION
// ============================================================================

export { registerFonts };
