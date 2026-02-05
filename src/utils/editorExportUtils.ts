/**
 * Editor Export Utilities
 * 
 * Generates sober, professional Word manuscripts for submission to national poetry publishers.
 * Follows strict editorial guidelines: no design, no ornamentation, clean typography.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx';
import { saveAs } from 'file-saver';

// ============================================================================
// TYPES
// ============================================================================

export interface TexteExportEditor {
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

export interface EditorExportOptions {
  // Metadata
  title: string;
  subtitle?: string;
  author: string;
  email?: string;
  phone?: string;
  showContactOnCover: boolean;
  
  // Content options
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  showLocationDate: boolean;
  pageBreakBetweenTexts: boolean;
  
  // Typography cleaning
  disableHyphenation: boolean;
  fixPunctuationSpacing: boolean;
  normalizeQuotes: boolean;
  normalizeApostrophes: boolean;
  protectProperNouns: boolean;
  removeInvisibleChars: boolean;
}

export interface SanitizationReport {
  punctuationSpacesFixed: number;
  quotesNormalized: number;
  apostrophesNormalized: number;
  invisibleCharsRemoved: number;
  softHyphensRemoved: number;
  properNounsProtected: number;
  warnings: string[];
}

// ============================================================================
// PROTECTED WORDS LIST
// ============================================================================

export const PROTECTED_WORDS = [
  // Noms propres géographiques
  'Dordogne', 'Dordonia', 'Périgord', 'Garonne', 'Gironde', 'Corrèze', 'Limousin',
  'Bergerac', 'Sarlat', 'Brive', 'Périgueux', 'Bordeaux', 'Libourne',
  'Beynac', 'Castelnaud', 'Domme', 'Rocamadour', 'Terrasson', 'Argentat',
  'Carennac', 'Martel', 'Souillac', 'Beaulieu', 'Vézère', 'Dronne', 'Isle',
  
  // Espèces protégées
  'Acipenser', 'sturio', 'Alosa', 'alosa', 'Petromyzon', 'marinus',
  'Salmo', 'salar', 'trutta', 'Anguilla', 'anguilla',
  
  // Noms propres du projet
  'Gaspard', 'Boréal', 'Laurent', 'Tripied',
  
  // Termes spécifiques
  'Parlement', 'Constitution', 'Fréquence',
];

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Remove invisible characters that cause rendering issues
 */
const removeInvisibleCharacters = (text: string): { result: string; count: number } => {
  let count = 0;
  
  // BiDi control characters
  const bidiChars = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
  
  // Zero-width characters
  const zeroWidth = /[\u200B\u200C\u200D\uFEFF]/g;
  
  // Word joiner and other invisible formatters
  const invisibles = /[\u2060\u2061\u2062\u2063\u2064]/g;
  
  let result = text;
  
  const bidiMatches = result.match(bidiChars);
  if (bidiMatches) count += bidiMatches.length;
  result = result.replace(bidiChars, '');
  
  const zwMatches = result.match(zeroWidth);
  if (zwMatches) count += zwMatches.length;
  result = result.replace(zeroWidth, '');
  
  const invMatches = result.match(invisibles);
  if (invMatches) count += invMatches.length;
  result = result.replace(invisibles, '');
  
  return { result, count };
};

/**
 * Remove soft hyphens that cause incorrect word breaks
 */
const removeSoftHyphens = (text: string): { result: string; count: number } => {
  const softHyphen = /\u00AD/g;
  const matches = text.match(softHyphen);
  const count = matches ? matches.length : 0;
  const result = text.replace(softHyphen, '');
  return { result, count };
};

/**
 * Fix punctuation spacing according to French typography rules
 * - No space before: . , ) ] }
 * - Non-breaking space before: ; : ? ! 
 * - Space after: . , ; : ? ! ) ] }
 */
const fixPunctuationSpacingFn = (text: string): { result: string; count: number } => {
  let count = 0;
  let result = text;
  
  // Remove erroneous spaces before simple punctuation
  const spaceBefore = / +([.,)\]}])/g;
  const matches1 = result.match(spaceBefore);
  if (matches1) count += matches1.length;
  result = result.replace(spaceBefore, '$1');
  
  // Fix double punctuation with French rules (non-breaking thin space before)
  // For now, just ensure no double spaces
  const doubleSpaces = /  +/g;
  const matches2 = result.match(doubleSpaces);
  if (matches2) count += matches2.length;
  result = result.replace(doubleSpaces, ' ');
  
  // Ensure space after punctuation (except at end of text)
  const noSpaceAfter = /([.,;:?!])([A-Za-zÀ-ÿ])/g;
  const matches3 = result.match(noSpaceAfter);
  if (matches3) count += matches3.length;
  result = result.replace(noSpaceAfter, '$1 $2');
  
  return { result, count };
};

/**
 * Normalize quotes to French guillemets
 */
const normalizeQuotesFn = (text: string): { result: string; count: number } => {
  let count = 0;
  let result = text;
  
  // Opening quotes - use RegExp constructor to avoid string literal issues
  const openQuotes = new RegExp('["\\u201E\\u201C\\u00AB]', 'g');
  const openMatches = result.match(openQuotes);
  if (openMatches) count += openMatches.length;
  result = result.replace(openQuotes, '\u00AB ');
  
  // Closing quotes  
  const closeQuotes = new RegExp('[\\u201D\\u201C](?=\\s|$|[.,;:?!])', 'g');
  const closeMatches = result.match(closeQuotes);
  if (closeMatches) count += closeMatches.length;
  result = result.replace(closeQuotes, ' \u00BB');
  
  // Clean up double spaces around guillemets
  result = result.replace(/\u00AB {2,}/g, '\u00AB ');
  result = result.replace(/ {2,}\u00BB/g, ' \u00BB');
  
  return { result, count };
};

/**
 * Normalize apostrophes to typographic apostrophe
 */
const normalizeApostrophesFn = (text: string): { result: string; count: number } => {
  const wrongApostrophe = /'/g;
  const matches = text.match(wrongApostrophe);
  const count = matches ? matches.length : 0;
  const result = text.replace(wrongApostrophe, '\u2019'); // Typographic apostrophe
  return { result, count };
};

/**
 * Protect proper nouns from incorrect breaking by using non-breaking spaces
 * This is mainly useful for compound names
 */
const protectProperNounsFn = (text: string, words: string[]): { result: string; count: number } => {
  let count = 0;
  let result = text;
  
  words.forEach(word => {
    // Check if word appears in text
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = result.match(regex);
    if (matches) count += matches.length;
  });
  
  return { result, count };
};

/**
 * Main sanitization function combining all cleaning operations
 */
export const sanitizeForEditor = (
  content: string, 
  options: Partial<EditorExportOptions> = {}
): { result: string; report: SanitizationReport } => {
  const report: SanitizationReport = {
    punctuationSpacesFixed: 0,
    quotesNormalized: 0,
    apostrophesNormalized: 0,
    invisibleCharsRemoved: 0,
    softHyphensRemoved: 0,
    properNounsProtected: 0,
    warnings: [],
  };
  
  let result = content;
  
  // 1. Remove invisible characters
  if (options.removeInvisibleChars !== false) {
    const invResult = removeInvisibleCharacters(result);
    result = invResult.result;
    report.invisibleCharsRemoved = invResult.count;
  }
  
  // 2. Remove soft hyphens
  if (options.disableHyphenation !== false) {
    const shResult = removeSoftHyphens(result);
    result = shResult.result;
    report.softHyphensRemoved = shResult.count;
  }
  
  // 3. Fix punctuation spacing
  if (options.fixPunctuationSpacing !== false) {
    const psResult = fixPunctuationSpacingFn(result);
    result = psResult.result;
    report.punctuationSpacesFixed = psResult.count;
  }
  
  // 4. Normalize quotes
  if (options.normalizeQuotes !== false) {
    const qResult = normalizeQuotesFn(result);
    result = qResult.result;
    report.quotesNormalized = qResult.count;
  }
  
  // 5. Normalize apostrophes
  if (options.normalizeApostrophes !== false) {
    const aResult = normalizeApostrophesFn(result);
    result = aResult.result;
    report.apostrophesNormalized = aResult.count;
  }
  
  // 6. Protect proper nouns (for reporting only - actual protection is in Word)
  if (options.protectProperNouns !== false) {
    const pnResult = protectProperNounsFn(result, PROTECTED_WORDS);
    report.properNounsProtected = pnResult.count;
  }
  
  return { result, report };
};

/**
 * Aggregate reports from multiple sanitization runs
 */
export const aggregateSanitizationReports = (reports: SanitizationReport[]): SanitizationReport => {
  return {
    punctuationSpacesFixed: reports.reduce((sum, r) => sum + r.punctuationSpacesFixed, 0),
    quotesNormalized: reports.reduce((sum, r) => sum + r.quotesNormalized, 0),
    apostrophesNormalized: reports.reduce((sum, r) => sum + r.apostrophesNormalized, 0),
    invisibleCharsRemoved: reports.reduce((sum, r) => sum + r.invisibleCharsRemoved, 0),
    softHyphensRemoved: reports.reduce((sum, r) => sum + r.softHyphensRemoved, 0),
    properNounsProtected: reports.reduce((sum, r) => sum + r.properNounsProtected, 0),
    warnings: reports.flatMap(r => r.warnings),
  };
};

// ============================================================================
// HTML PARSING (Simplified for manuscript)
// ============================================================================

interface ParsedLine {
  text: string;
  italic?: boolean;
  bold?: boolean;
}

/**
 * Parse HTML content into plain text lines, preserving basic formatting
 */
const parseHtmlToLines = (html: string): ParsedLine[][] => {
  if (!html) return [];
  
  // Normalize HTML entities
  let content = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Convert block elements to line markers
  const LINE_MARKER = '§§LINE§§';
  content = content
    .replace(/<div[^>]*>/gi, LINE_MARKER)
    .replace(/<p[^>]*>/gi, LINE_MARKER)
    .replace(/<\/div>/gi, '')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, LINE_MARKER)
    .replace(/\n/g, LINE_MARKER);
  
  // Strip span tags
  content = content.replace(/<\/?span[^>]*>/gi, '');
  
  // Split into lines
  const rawLines = content.split(LINE_MARKER);
  
  const parsedLines: ParsedLine[][] = [];
  
  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    
    const runs = parseFormattedTextEditor(trimmed);
    if (runs.length > 0) {
      parsedLines.push(runs);
    }
  }
  
  return parsedLines;
};

/**
 * Parse inline formatting (bold, italic)
 */
const parseFormattedTextEditor = (text: string): ParsedLine[] => {
  const runs: ParsedLine[] = [];
  const formatRegex = /<(em|i|strong|b)>([\s\S]*?)<\/\1>/gi;
  
  let lastIndex = 0;
  let workingText = text;
  
  const segments: { start: number; end: number; content: string; italic: boolean; bold: boolean }[] = [];
  
  let match;
  while ((match = formatRegex.exec(workingText)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      content: stripHtmlTags(content),
      italic: tag === 'em' || tag === 'i',
      bold: tag === 'strong' || tag === 'b',
    });
  }
  
  segments.sort((a, b) => a.start - b.start);
  
  let currentPos = 0;
  for (const segment of segments) {
    if (segment.start > currentPos) {
      const plainText = stripHtmlTags(workingText.substring(currentPos, segment.start));
      if (plainText) {
        runs.push({ text: plainText });
      }
    }
    
    if (segment.content) {
      runs.push({
        text: segment.content,
        italic: segment.italic,
        bold: segment.bold,
      });
    }
    
    currentPos = segment.end;
  }
  
  if (currentPos < workingText.length) {
    const remaining = stripHtmlTags(workingText.substring(currentPos));
    if (remaining) {
      runs.push({ text: remaining });
    }
  }
  
  if (runs.length === 0) {
    const cleanText = stripHtmlTags(text);
    if (cleanText) {
      runs.push({ text: cleanText });
    }
  }
  
  return runs;
};

const stripHtmlTags = (text: string): string => {
  return text.replace(/<[^>]*>/g, '').trim();
};

// ============================================================================
// WORD DOCUMENT GENERATION
// ============================================================================

/**
 * Create a sober cover page for manuscript submission
 */
const createSoberCoverPage = (options: EditorExportOptions): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  
  // Vertical spacing at top
  paragraphs.push(
    new Paragraph({
      children: [],
      spacing: { before: 3000, after: 600 },
    })
  );
  
  // Title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: options.title.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );
  
  // Subtitle if present
  if (options.subtitle) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: options.subtitle,
            italics: true,
            size: 24, // 12pt
            font: 'Times New Roman',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    );
  }
  
  // Author
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: options.author,
          size: 28, // 14pt
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    })
  );
  
  // "Manuscrit inédit" mention
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Manuscrit inédit',
          italics: true,
          size: 24,
          font: 'Times New Roman',
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 2000 },
    })
  );
  
  // Contact info at bottom (if enabled)
  if (options.showContactOnCover) {
    if (options.email) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: options.email,
              size: 20, // 10pt
              font: 'Times New Roman',
              color: '888888',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      );
    }
    
    if (options.phone) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: options.phone,
              size: 20,
              font: 'Times New Roman',
              color: '888888',
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );
    }
  }
  
  // Page break
  paragraphs.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );
  
  return paragraphs;
};

/**
 * Create simple table of contents placeholder
 */
const createSimpleTableOfContents = (): Paragraph[] => {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: 'TABLE DES MATIÈRES',
          bold: true,
          size: 28,
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '(Sélectionnez tout le document et appuyez sur F9 dans Word pour mettre à jour)',
          italics: true,
          size: 20,
          font: 'Times New Roman',
          color: '888888',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];
};

/**
 * Create text entry with sober formatting
 */
const createSoberTextEntry = (
  texte: TexteExportEditor,
  options: EditorExportOptions,
  isFirst: boolean
): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  
  // Page break before (except first text)
  if (!isFirst && options.pageBreakBetweenTexts) {
    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  } else if (!isFirst) {
    // Just add vertical spacing
    paragraphs.push(
      new Paragraph({
        children: [],
        spacing: { before: 600, after: 0 },
      })
    );
  }
  
  // Title - clean up any text counts in brackets
  const cleanTitle = texte.titre.replace(/\s*\(\d+\s*textes?\)$/i, '').trim();
  
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: cleanTitle,
          bold: true,
          size: 24, // 12pt
          font: 'Times New Roman',
        }),
      ],
      spacing: { after: options.showLocationDate && texte.marche_ville ? 100 : 300 },
    })
  );
  
  // Location/Date subtitle (optional)
  if (options.showLocationDate && texte.marche_ville) {
    let locationDate = texte.marche_ville;
    if (texte.marche_date) {
      const formattedDate = new Date(texte.marche_date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      locationDate += ` — ${formattedDate}`;
    }
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: locationDate,
            italics: true,
            size: 22, // 11pt
            font: 'Times New Roman',
            color: '666666',
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }
  
  // Content - sanitize first
  const { result: sanitizedContent } = sanitizeForEditor(texte.contenu, options);
  const lines = parseHtmlToLines(sanitizedContent);
  
  lines.forEach((lineRuns, lineIndex) => {
    const textRuns = lineRuns.map(run => 
      new TextRun({
        text: run.text,
        italics: run.italic,
        bold: run.bold,
        size: 24, // 12pt
        font: 'Times New Roman',
      })
    );
    
    paragraphs.push(
      new Paragraph({
        children: textRuns,
        spacing: { 
          after: lineIndex === lines.length - 1 ? 400 : 150,
          line: 360, // 1.5 line spacing (240 = single, 360 = 1.5, 480 = double)
        },
        alignment: AlignmentType.LEFT, // Fer à gauche, not justified
      })
    );
  });
  
  return paragraphs;
};

/**
 * Generate the complete manuscript document
 */
export const generateEditorManuscript = async (
  textes: TexteExportEditor[],
  options: EditorExportOptions
): Promise<{ blob: Blob; report: SanitizationReport }> => {
  const allParagraphs: Paragraph[] = [];
  const reports: SanitizationReport[] = [];
  
  // Cover page
  if (options.includeCoverPage) {
    allParagraphs.push(...createSoberCoverPage(options));
  }
  
  // Table of contents
  if (options.includeTableOfContents) {
    allParagraphs.push(...createSimpleTableOfContents());
  }
  
  // Text entries
  textes.forEach((texte, index) => {
    // Sanitize and collect report
    const { report } = sanitizeForEditor(texte.contenu, options);
    reports.push(report);
    
    allParagraphs.push(...createSoberTextEntry(texte, options, index === 0));
  });
  
  // Create document with sober settings
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch = 1440 twips (2.54cm)
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      headers: {
        default: new Header({
          children: [], // No header for manuscript
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 20,
                  font: 'Times New Roman',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children: allParagraphs,
    }],
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24, // 12pt default
          },
          paragraph: {
            spacing: {
              line: 360, // 1.5 line spacing
            },
          },
        },
      },
    },
  });
  
  const blob = await Packer.toBlob(doc);
  const aggregatedReport = aggregateSanitizationReports(reports);
  
  return { blob, report: aggregatedReport };
};

/**
 * Export and download the manuscript
 */
export const exportEditorManuscript = async (
  textes: TexteExportEditor[],
  options: EditorExportOptions
): Promise<SanitizationReport> => {
  const { blob, report } = await generateEditorManuscript(textes, options);
  
  // Generate filename
  const sanitizedTitle = options.title
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  const date = new Date().toISOString().split('T')[0];
  const filename = `MANUSCRIT_${sanitizedTitle}_${date}.docx`;
  
  saveAs(blob, filename);
  
  return report;
};

/**
 * Preview sanitization without generating document
 */
export const previewSanitization = (
  textes: TexteExportEditor[],
  options: Partial<EditorExportOptions> = {}
): SanitizationReport => {
  const reports: SanitizationReport[] = textes.map(texte => {
    const { report } = sanitizeForEditor(texte.contenu, options);
    return report;
  });
  
  // Also check titles
  textes.forEach(texte => {
    const { report } = sanitizeForEditor(texte.titre, options);
    reports.push(report);
  });
  
  return aggregateSanitizationReports(reports);
};
