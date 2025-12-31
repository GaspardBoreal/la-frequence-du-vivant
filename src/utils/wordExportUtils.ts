import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';

interface TexteExport {
  id: string;
  titre: string;
  contenu: string;
  type_texte: string;
  marche_nom?: string;
  marche_ville?: string;
  marche_region?: string;
  marche_date?: string;
  created_at?: string;
}

interface ExportOptions {
  title: string;
  includeTableOfContents: boolean;
  includeCoverPage: boolean;
  organizationMode: 'type' | 'marche';
  includeMetadata: boolean;
}

// Parsed content structures for HTML to Word conversion
interface ParsedRun {
  text: string;
  italic?: boolean;
  bold?: boolean;
}

interface ParsedParagraph {
  runs: ParsedRun[];
}

/**
 * Parse HTML content into structured paragraphs with formatting
 * Handles: <div>, <br>, <p> for line breaks
 *          <em>, <i> for italics
 *          <strong>, <b> for bold
 *          &nbsp; for spaces
 *          strips <span> while keeping content
 */
const parseHtmlContent = (html: string): ParsedParagraph[] => {
  if (!html) return [];

  // Step 1: Normalize HTML entities
  let content = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Step 2: Convert block elements to paragraph markers
  // Replace </div>, </p>, <br>, <br/>, <br /> with a special marker
  const PARA_MARKER = '§§PARA§§';
  content = content
    .replace(/<\/div>/gi, PARA_MARKER)
    .replace(/<\/p>/gi, PARA_MARKER)
    .replace(/<br\s*\/?>/gi, PARA_MARKER)
    .replace(/<div[^>]*>/gi, '')
    .replace(/<p[^>]*>/gi, '')
    .replace(/\n/g, PARA_MARKER);

  // Step 3: Strip span tags but keep content
  content = content.replace(/<\/?span[^>]*>/gi, '');

  // Step 4: Split into paragraphs
  const rawParagraphs = content.split(PARA_MARKER);

  const parsedParagraphs: ParsedParagraph[] = [];

  for (const rawPara of rawParagraphs) {
    const trimmed = rawPara.trim();
    if (!trimmed) continue;

    // Parse formatting within this paragraph
    const runs = parseFormattedText(trimmed);
    if (runs.length > 0) {
      parsedParagraphs.push({ runs });
    }
  }

  return parsedParagraphs;
};

/**
 * Parse text with inline formatting (bold, italic)
 * Handles nested and sequential tags
 */
const parseFormattedText = (text: string): ParsedRun[] => {
  const runs: ParsedRun[] = [];
  
  // Regex to find formatting tags
  // Matches: <em>...</em>, <i>...</i>, <strong>...</strong>, <b>...</b>
  const formatRegex = /<(em|i|strong|b)>([\s\S]*?)<\/\1>/gi;
  
  let lastIndex = 0;
  let match;

  // Create a working copy to process
  let workingText = text;
  
  // First pass: extract all formatted segments with their positions
  const segments: { start: number; end: number; content: string; italic: boolean; bold: boolean }[] = [];
  
  // Reset regex
  formatRegex.lastIndex = 0;
  
  while ((match = formatRegex.exec(workingText)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    const isItalic = tag === 'em' || tag === 'i';
    const isBold = tag === 'strong' || tag === 'b';
    
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      content: stripAllTags(content),
      italic: isItalic,
      bold: isBold,
    });
  }

  // Sort segments by position
  segments.sort((a, b) => a.start - b.start);

  // Build runs from segments and gaps
  let currentPos = 0;
  for (const segment of segments) {
    // Add plain text before this segment
    if (segment.start > currentPos) {
      const plainText = stripAllTags(workingText.substring(currentPos, segment.start));
      if (plainText.trim()) {
        runs.push({ text: plainText });
      }
    }
    
    // Add the formatted segment
    if (segment.content.trim()) {
      runs.push({
        text: segment.content,
        italic: segment.italic,
        bold: segment.bold,
      });
    }
    
    currentPos = segment.end;
  }

  // Add remaining plain text
  if (currentPos < workingText.length) {
    const remaining = stripAllTags(workingText.substring(currentPos));
    if (remaining.trim()) {
      runs.push({ text: remaining });
    }
  }

  // If no formatting was found, return the whole text as a single run
  if (runs.length === 0) {
    const cleanText = stripAllTags(text);
    if (cleanText.trim()) {
      runs.push({ text: cleanText });
    }
  }

  return runs;
};

/**
 * Strip all remaining HTML tags from text
 */
const stripAllTags = (text: string): string => {
  return text.replace(/<[^>]*>/g, '').trim();
};

/**
 * Convert parsed paragraphs to Word Paragraph objects
 */
const createParagraphsFromParsed = (
  parsedParagraphs: ParsedParagraph[],
  baseSpacing: number = 100,
  lastSpacing: number = 300
): Paragraph[] => {
  return parsedParagraphs.map((para, index) => {
    const isLast = index === parsedParagraphs.length - 1;
    
    const textRuns = para.runs.map(run => 
      new TextRun({
        text: run.text,
        size: 22,
        italics: run.italic,
        bold: run.bold,
      })
    );

    return new Paragraph({
      children: textRuns,
      spacing: { after: isLast ? lastSpacing : baseSpacing },
    });
  });
};

const TEXT_TYPE_LABELS: Record<string, string> = {
  haiku: 'Haïkus',
  poeme: 'Poèmes',
  senryu: 'Senryūs',
  haibun: 'Haïbuns',
  'texte-libre': 'Textes libres',
  fable: 'Fables',
  prose: 'Proses',
  recit: 'Récits',
};

const getTypeLabel = (type: string): string => {
  return TEXT_TYPE_LABELS[type.toLowerCase()] || type;
};

const createCoverPage = (title: string, textCount: number): Paragraph[] => {
  return [
    new Paragraph({
      children: [],
      spacing: { before: 4000, after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'GASPARD BORÉAL',
          bold: true,
          size: 28,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 56,
          color: '1a1a1a',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Textes Littéraires',
          italics: true,
          size: 32,
          color: '888888',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${textCount} textes`,
          size: 24,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          size: 20,
          color: '888888',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];
};

const createTableOfContentsSection = (): Paragraph[] => {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Table des Matières',
          bold: true,
          size: 36,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '(La table des matières sera générée automatiquement dans Word)',
          italics: true,
          size: 20,
          color: '888888',
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];
};

const createSectionHeader = (title: string, count: number, date?: string): Paragraph[] => {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: `${title} (${count})`,
          bold: true,
          size: 32,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: date ? 100 : 300 },
      border: {
        bottom: {
          color: 'cccccc',
          style: BorderStyle.SINGLE,
          size: 6,
          space: 10,
        },
      },
    }),
  ];

  // Add date subtitle if available
  if (date) {
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
            italics: true,
            size: 20,
            color: '888888',
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  return paragraphs;
};

const createTexteEntry = (texte: TexteExport, includeMetadata: boolean): Paragraph[] => {
  const paragraphs: Paragraph[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: texte.titre,
          bold: true,
          size: 26,
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    })
  );

  // Metadata (location) - improved formatting
  if (includeMetadata && (texte.marche_nom || texte.marche_ville)) {
    const locationParts: string[] = [];
    
    // Format location nicely
    if (texte.marche_nom) {
      locationParts.push(texte.marche_nom);
    }
    if (texte.marche_ville && texte.marche_ville !== texte.marche_nom) {
      locationParts.push(texte.marche_ville);
    }

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: locationParts.join(' – '),
            italics: true,
            size: 20,
            color: '666666',
          }),
        ],
        spacing: { after: texte.marche_region ? 50 : 200 },
      })
    );

    // Region on separate line if available
    if (texte.marche_region) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: texte.marche_region,
              italics: true,
              size: 18,
              color: '888888',
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }

  // Content - parse HTML and create properly formatted paragraphs
  const parsedContent = parseHtmlContent(texte.contenu);
  paragraphs.push(...createParagraphsFromParsed(parsedContent, 100, 300));

  // Separator
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '• • •',
          size: 18,
          color: 'aaaaaa',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
    })
  );

  return paragraphs;
};

const groupTextesByType = (textes: TexteExport[]): Map<string, TexteExport[]> => {
  const groups = new Map<string, TexteExport[]>();
  
  textes.forEach(texte => {
    const type = texte.type_texte.toLowerCase();
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type)!.push(texte);
  });

  return groups;
};

const groupTextesByMarche = (textes: TexteExport[]): Map<string, TexteExport[]> => {
  // Group textes by marche with date info
  const groupsWithDate = new Map<string, { date: string | null, textes: TexteExport[] }>();
  
  textes.forEach(texte => {
    const key = texte.marche_nom || texte.marche_ville || 'Sans lieu';
    if (!groupsWithDate.has(key)) {
      groupsWithDate.set(key, { date: texte.marche_date || null, textes: [] });
    }
    groupsWithDate.get(key)!.textes.push(texte);
  });

  // Sort groups by date chronologically
  const sortedEntries = Array.from(groupsWithDate.entries())
    .sort((a, b) => {
      const dateA = a[1].date || '9999-12-31';
      const dateB = b[1].date || '9999-12-31';
      return dateA.localeCompare(dateB);
    });

  // Rebuild sorted Map
  const sortedMap = new Map<string, TexteExport[]>();
  sortedEntries.forEach(([key, value]) => {
    sortedMap.set(key, value.textes);
  });

  return sortedMap;
};

export const exportTextesToWord = async (
  textes: TexteExport[],
  options: ExportOptions
): Promise<void> => {
  const children: Paragraph[] = [];

  // Cover page
  if (options.includeCoverPage) {
    children.push(...createCoverPage(options.title, textes.length));
  }

  // Table of contents
  if (options.includeTableOfContents) {
    children.push(...createTableOfContentsSection());
  }

  // Group and organize textes
  if (options.organizationMode === 'type') {
    const groups = groupTextesByType(textes);
    
    // Sort by predefined order
    const typeOrder = ['haiku', 'senryu', 'poeme', 'haibun', 'texte-libre', 'fable', 'prose', 'recit'];
    const sortedTypes = Array.from(groups.keys()).sort((a, b) => {
      const indexA = typeOrder.indexOf(a);
      const indexB = typeOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    for (const type of sortedTypes) {
      const groupTextes = groups.get(type)!;
      children.push(...createSectionHeader(getTypeLabel(type), groupTextes.length));
      
      groupTextes.forEach(texte => {
        children.push(...createTexteEntry(texte, options.includeMetadata));
      });

      // Page break between sections
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  } else {
    const groups = groupTextesByMarche(textes);
    
    for (const [marcheName, groupTextes] of groups) {
      // Get the date from the first texte in the group
      const marcheDate = groupTextes[0]?.marche_date;
      children.push(...createSectionHeader(marcheName, groupTextes.length, marcheDate));
      
      groupTextes.forEach(texte => {
        children.push(...createTexteEntry(texte, options.includeMetadata));
      });

      // Page break between sections
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // Create document
  const doc = new Document({
    title: options.title,
    creator: 'Gaspard Boréal',
    description: 'Export des textes littéraires',
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            font: 'Garamond',
            size: 24,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const filename = `${options.title.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/g, '')}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, filename);
};

// CSV Export utility
export const exportTextesToCSV = (textes: TexteExport[]): void => {
  const headers = ['Titre', 'Type', 'Marche', 'Ville', 'Région', 'Contenu', 'Date de création'];
  
  const rows = textes.map(texte => [
    texte.titre,
    texte.type_texte,
    texte.marche_nom || '',
    texte.marche_ville || '',
    texte.marche_region || '',
    texte.contenu.replace(/"/g, '""'),
    texte.created_at ? new Date(texte.created_at).toLocaleDateString('fr-FR') : '',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `textes_export_${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, filename);
};
