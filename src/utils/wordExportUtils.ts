import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  AlignmentType,
  BorderStyle,
  Bookmark,
  SimpleField,
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
  ordre?: number;
  created_at?: string;
  partie_id?: string;
  partie_numero_romain?: string;
  partie_titre?: string;
  partie_sous_titre?: string;
  partie_ordre?: number;
  marche_ordre?: number;
}

interface ExportOptions {
  title: string;
  includeTableOfContents: boolean;
  includeCoverPage: boolean;
  organizationMode: 'type' | 'marche';
  includeMetadata: boolean;
  includeKeywordIndex?: boolean;
  selectedKeywordCategories?: string[];
  customKeywords?: string[];
  categorizedCustomKeywords?: { keyword: string; category: string }[];
  contactEmail?: string;
  contactPhone?: string;
}

// ============================================================================
// KEYWORD INDEX CONFIGURATION
// ============================================================================

export interface KeywordCategory {
  id: string;
  label: string;
  keywords: string[];
}

export const KEYWORD_CATEGORIES: KeywordCategory[] = [
  {
    id: 'faune',
    label: 'Faune Fluviale et Migratrice',
    keywords: [
      'lamproie', 'saumon', 'alose', 'truite', 'silure', 'anguille', 'brochet', 'esturgeon',
      'aigrette', 'martin-pêcheur', 'loutre', 'grand-duc', 'héron', 'corneille',
      'libellule', 'papillon', 'cigale', 'grenouille', 'crapaud', 'couleuvre'
    ]
  },
  {
    id: 'hydrologie',
    label: 'Hydrologie et Dynamiques Fluviales',
    keywords: [
      'étiage', 'crue', 'marnage', 'mascaret', 'confluence', 'débit', 'courant',
      'ripisylve', 'frayère', 'berge', 'méandre', 'estuaire', 'embouchure',
      'source', 'résurgence', 'nappe', 'alluvion', 'lit', 'aval', 'amont'
    ]
  },
  {
    id: 'ouvrages',
    label: 'Ouvrages Humains',
    keywords: [
      'barrage', 'ascenseur', 'pont', 'écluse', 'gabarre', 'passe', 'vanne', 'digue',
      'moulin', 'centrale', 'éolienne', 'usine', 'port', 'quai'
    ]
  },
  {
    id: 'flore',
    label: 'Flore et Paysages',
    keywords: [
      'aulne', 'saule', 'séquoia', 'renoncule', 'vigne', 'chêne', 'roseau', 'nénuphar',
      'herbier', 'forêt', 'prairie', 'falaise', 'garrigue', 'marais', 'zone humide'
    ]
  },
  {
    id: 'temporalites',
    label: 'Temporalités et Projections',
    keywords: [
      '2050', '2035', 'holocène', 'mémoire', 'avenir', 'futur', 'prospective',
      'anthropocène', 'demain', 'hier', 'jadis', 'siècle'
    ]
  },
  {
    id: 'poetique',
    label: 'Geste Poétique',
    keywords: [
      'remonter', 'fréquence', 'spectre', 'géopoétique', 'syntoniser', 'écouter',
      'silence', 'souffle', 'marcher', 'arpenter', 'contempler', 'vibration'
    ]
  },
  {
    id: 'technologies',
    label: 'Technologies et Médiations',
    keywords: [
      'IA', 'drone', 'ADN', 'capteur', 'spectrogramme', 'tablette', 'robot',
      'algorithme', 'numérique', 'satellite', 'GPS', 'sonar'
    ]
  }
];

interface KeywordOccurrence {
  keyword: string;
  texteIds: string[];
  category: string;
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
  // IMPORTANT: Insert marker BEFORE opening <div> tags to handle haiku-style structures
  // where each line is wrapped in its own <div> without preceding closing tags
  const PARA_MARKER = '§§PARA§§';
  content = content
    // Insert marker before opening div/p tags (handles <div>line1</div><div>line2</div>)
    .replace(/<div[^>]*>/gi, PARA_MARKER)
    .replace(/<p[^>]*>/gi, PARA_MARKER)
    // Also handle closing tags and br
    .replace(/<\/div>/gi, '')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, PARA_MARKER)
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
/**
 * Convert a string to Title Case, respecting French hyphens and apostrophes
 */
const toTitleCase = (str: string): string => {
  return str.toLowerCase().replace(
    /(?:^|\s|[-'])\S/g,
    (char) => char.toUpperCase()
  );
};

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
        size: 24,
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

const getTypeLabel = (type: string): string => {
  return TEXT_TYPE_LABELS[type.toLowerCase()] || type;
};

/**
 * Generate a valid Word bookmark ID from a text ID
 * Word bookmark IDs: max 40 chars, alphanumeric + underscore, must start with letter
 */
const generateBookmarkId = (texte: TexteExport): string => {
  const base = `texte_${texte.id}`.replace(/[^a-zA-Z0-9_]/g, '_');
  return base.substring(0, 40);
};

/**
 * Create a PAGEREF field that references a bookmark
 */
const createPageRef = (bookmarkId: string): SimpleField => {
  return new SimpleField(`PAGEREF ${bookmarkId} \\h`);
};

const createCoverPage = (title: string, textCount: number, subtitle?: string, contactEmail?: string, contactPhone?: string): Paragraph[] => {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
  });
  // Capitalize first letter of month
  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

  return [
    // Top spacer
    new Paragraph({
      children: [],
      spacing: { before: 4000, after: 600 },
    }),
    // Author name
    new Paragraph({
      children: [
        new TextRun({
          text: 'GASPARD BORÉAL',
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
    }),
    // Title of the work
    new Paragraph({
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 40,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: subtitle ? 200 : 400 },
    }),
    // Subtitle if provided
    ...(subtitle ? [
      new Paragraph({
        children: [
          new TextRun({
            text: subtitle,
            italics: true,
            size: 26,
            color: '555555',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ] : []),
    // Genre indication
    new Paragraph({
      children: [
        new TextRun({
          text: 'Poésie et prose géopoétique',
          italics: true,
          size: 24,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    // Manuscrit inédit mention
    new Paragraph({
      children: [
        new TextRun({
          text: `Manuscrit inédit — ${textCount} textes`,
          size: 22,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 3000 },
    }),
    // Contact info (if provided)
    ...(contactEmail || contactPhone ? [
      ...(contactEmail ? [new Paragraph({
        children: [
          new TextRun({
            text: contactEmail,
            size: 20,
            color: '888888',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: contactPhone ? 60 : 200 },
      })] : []),
      ...(contactPhone ? [new Paragraph({
        children: [
          new TextRun({
            text: contactPhone,
            size: 20,
            color: '888888',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })] : []),
    ] : []),
    // Date at bottom
    new Paragraph({
      children: [
        new TextRun({
          text: formattedDate,
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

const createSectionHeader = (
  title: string, 
  count: number, 
  date?: string,
  showCount: boolean = true
): Paragraph[] => {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: showCount ? `${title} (${count})` : title,
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

// Create a cover page for a "Partie" (movement/section)
const createPartieCoverPage = (
  numeroRomain: string,
  titre: string,
  sousTitre?: string
): Paragraph[] => {
  const paragraphs: Paragraph[] = [
    // Spacer for vertical centering effect (page break is handled by previous section)
    new Paragraph({
      children: [],
      spacing: { before: 5500 },
    }),
    // Roman numeral
    new Paragraph({
      children: [
        new TextRun({
          text: numeroRomain,
          bold: true,
          size: 72,
          color: '333333',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    // Main title
    new Paragraph({
      children: [
        new TextRun({
          text: titre.toUpperCase(),
          bold: true,
          size: 48,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: sousTitre ? 300 : 600 },
    }),
  ];

  // Subtitle if present
  if (sousTitre) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sousTitre,
            italics: true,
            size: 32,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    );
  }

  // Decorative separator
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '───────────────────',
          size: 24,
          color: 'aaaaaa',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    // Page break after
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  return paragraphs;
}

const createTexteEntry = (texte: TexteExport, includeMetadata: boolean): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  const bookmarkId = generateBookmarkId(texte);
  
  const isHaikuOrSenryu = texte.type_texte === 'haiku' || texte.type_texte === 'senryu';

  // Haiku/Senryu: isolate on its own page with vertical centering
  if (isHaikuOrSenryu) {
    // Page break before
    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
    // Spacer for vertical centering effect (simulate center of A4 page)
    paragraphs.push(
      new Paragraph({
        children: [],
        spacing: { before: 4500 },
      })
    );
  }

  // Construire le titre avec préfixe pour les fables uniquement
  const displayTitle = texte.type_texte === 'fable' 
    ? `Fable : ${texte.titre}` 
    : texte.titre;

  // Title with Bookmark for cross-referencing in indexes
  paragraphs.push(
    new Paragraph({
      children: [
        new Bookmark({
          id: bookmarkId,
          children: [
            new TextRun({
              text: displayTitle,
              bold: true,
              size: isHaikuOrSenryu ? 24 : 26,
            }),
          ],
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      alignment: isHaikuOrSenryu ? AlignmentType.CENTER : undefined,
      spacing: { before: isHaikuOrSenryu ? 200 : 300, after: 100 },
    })
  );

  // Metadata (location) - only for non-haiku/senryu, and kept minimal
  // For haikus/senryus: no metadata at all (context is in the march header)
  // For other types: just the city name in Title Case italics, no region
  // Skip if ville is already contained in the marche_nom header
  if (includeMetadata && !isHaikuOrSenryu && texte.marche_ville) {
    const villeAlreadyInHeader = texte.marche_nom && 
      texte.marche_nom.toLowerCase().includes(texte.marche_ville.toLowerCase());
    if (!villeAlreadyInHeader) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: toTitleCase(texte.marche_ville),
              italics: true,
              size: 22,
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
  
  if (isHaikuOrSenryu) {
    // Haiku/Senryu: centered content with specific styling
    const haikuParagraphs = parsedContent.map((para, index) => {
      const isLast = index === parsedContent.length - 1;
      const textRuns = para.runs.map(run => 
        new TextRun({
          text: run.text,
          size: 24,
          italics: true, // Haiku lines in italic
          bold: run.bold,
        })
      );
      return new Paragraph({
        children: textRuns,
        alignment: AlignmentType.CENTER,
        spacing: { after: isLast ? 300 : 80 },
      });
    });
    paragraphs.push(...haikuParagraphs);
    
    // Haiku/Senryu: page break AFTER to isolate on its own page (no separator)
    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  } else {
    paragraphs.push(...createParagraphsFromParsed(parsedContent, 100, 300));

    // Separator (only for non-haiku/senryu texts)
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
  }

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

// Structure interne pour le tri chronologique des marches
interface MarcheGroupWithDate {
  date: string | null;
  textes: TexteExport[];
}

const groupTextesByMarcheWithDate = (textes: TexteExport[]): Map<string, MarcheGroupWithDate> => {
  const groupsWithDate = new Map<string, MarcheGroupWithDate>();
  
  textes.forEach(texte => {
    const key = texte.marche_nom || texte.marche_ville || 'Sans lieu';
    if (!groupsWithDate.has(key)) {
      groupsWithDate.set(key, { date: texte.marche_date || null, textes: [] });
    }
    groupsWithDate.get(key)!.textes.push(texte);
  });

  // Trier les textes par ordre à l'intérieur de chaque groupe
  groupsWithDate.forEach(group => {
    group.textes.sort((a, b) => (a.ordre ?? 999) - (b.ordre ?? 999));
  });

  // Sort groups by date chronologically
  const sortedEntries = Array.from(groupsWithDate.entries())
    .sort((a, b) => {
      const dateA = a[1].date || '9999-12-31';
      const dateB = b[1].date || '9999-12-31';
      return dateA.localeCompare(dateB);
    });

  // Rebuild sorted Map
  const sortedMap = new Map<string, MarcheGroupWithDate>();
  sortedEntries.forEach(([key, value]) => {
    sortedMap.set(key, value);
  });

  return sortedMap;
};

const groupTextesByMarche = (textes: TexteExport[]): Map<string, TexteExport[]> => {
  const groupsWithDate = groupTextesByMarcheWithDate(textes);
  
  // Convert to simple Map for backward compatibility
  const simpleMap = new Map<string, TexteExport[]>();
  groupsWithDate.forEach((value, key) => {
    simpleMap.set(key, value.textes);
  });

  return simpleMap;
};

// Structure for organizing by Partie > Marche
interface PartieInfo {
  id: string;
  numeroRomain: string;
  titre: string;
  sousTitre?: string;
  ordre: number;
}

interface MarcheGroupWithOrdre extends MarcheGroupWithDate {
  marche_ordre: number;
}

interface PartieGroup {
  partie: PartieInfo | null; // null for unassigned marches
  marches: Map<string, MarcheGroupWithOrdre>;
}

/**
 * Group textes by Partie (movement) then by Marche
 * Returns an ordered array of PartieGroup for the document structure
 * IMPORTANT: Marches within each partie are sorted by marche_ordre (from exploration_marches.ordre)
 */
const groupTextesByPartie = (textes: TexteExport[]): PartieGroup[] => {
  const partiesMap = new Map<string, PartieGroup>();
  const unassignedMarches = new Map<string, MarcheGroupWithOrdre>();

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

  // Sort marches within each partie by marche_ordre
  partiesMap.forEach(partieGroup => {
    const sortedMarchesEntries = Array.from(partieGroup.marches.entries())
      .sort((a, b) => a[1].marche_ordre - b[1].marche_ordre);
    partieGroup.marches = new Map(sortedMarchesEntries);
  });

  // Sort unassigned marches by date (fallback behavior)
  const sortedUnassignedEntries = Array.from(unassignedMarches.entries())
    .sort((a, b) => {
      const dateA = a[1].date || '9999-12-31';
      const dateB = b[1].date || '9999-12-31';
      return dateA.localeCompare(dateB);
    });
  const sortedUnassignedMarches = new Map(sortedUnassignedEntries);

  // Sort parties by ordre
  const sortedParties = Array.from(partiesMap.values())
    .sort((a, b) => (a.partie?.ordre ?? 999) - (b.partie?.ordre ?? 999));

  // Add unassigned marches at the end if any
  if (sortedUnassignedMarches.size > 0) {
    sortedParties.push({
      partie: null,
      marches: sortedUnassignedMarches,
    });
  }

  return sortedParties;
};

/**
 * Check if textes have partie assignments
 */
const hasPartieAssignments = (textes: TexteExport[]): boolean => {
  return textes.some(t => t.partie_id && t.partie_numero_romain && t.partie_titre);
}

// ============================================================================
// INDEX GENERATION FUNCTIONS
// ============================================================================

/**
 * Create an index grouping texts by location (marche)
 * If parties are present, shows them as top-level sections
 */
const createIndexByMarche = (textes: TexteExport[]): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  
  // Index title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Index par Lieu',
          bold: true,
          size: 36,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    })
  );

  // Check if we have partie assignments
  if (hasPartieAssignments(textes)) {
    // Group by Partie > Marche
    const partieGroups = groupTextesByPartie(textes);
    
    for (const { partie, marches } of partieGroups) {
      // Add partie header if assigned
      if (partie) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${partie.numeroRomain}. ${partie.titre.toUpperCase()}`,
                bold: true,
                size: 28,
              }),
            ],
            spacing: { before: 400, after: 100 },
          })
        );
        
        // Add sous-titre if present
        if (partie.sousTitre) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: partie.sousTitre,
                  italics: true,
                  size: 22,
                  color: '666666',
                }),
              ],
              spacing: { after: 200 },
            })
          );
        }
      } else {
        // Unassigned section
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Non classé',
                bold: true,
                size: 28,
                color: '888888',
              }),
            ],
            spacing: { before: 400, after: 200 },
          })
        );
      }
      
      // Add marches within this partie
      for (const [marcheName, { textes: groupTextes }] of marches) {
        // Location name (bold, indented)
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: marcheName,
                bold: true,
                size: 24,
              }),
            ],
            indent: { left: 300 },
            spacing: { before: 200, after: 100 },
          })
        );
        
        // List textes
        for (const texte of groupTextes) {
          const bookmarkId = generateBookmarkId(texte);
          const shortTitle = texte.titre.length > 50 
            ? texte.titre.substring(0, 47) + '...' 
            : texte.titre;
          
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${shortTitle} `,
                  size: 22,
                }),
                new TextRun({
                  text: `(${getTypeLabel(texte.type_texte)}) `,
                  italics: true,
                  size: 20,
                  color: '888888',
                }),
                new TextRun({
                  text: '— p. ',
                  size: 20,
                  color: '888888',
                }),
                createPageRef(bookmarkId),
              ],
              indent: { left: 600 },
              spacing: { after: 60 },
            })
          );
        }
      }
    }
  } else {
    // Fallback: no parties, just group by marche
    const marcheGroups = groupTextesByMarcheWithDate(textes);
    for (const [marcheName, { textes: groupTextes }] of marcheGroups) {
      // Location name (bold)
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: marcheName,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 250, after: 100 },
        })
      );
      
      // List textes
      for (const texte of groupTextes) {
        const bookmarkId = generateBookmarkId(texte);
        const shortTitle = texte.titre.length > 50 
          ? texte.titre.substring(0, 47) + '...' 
          : texte.titre;
        
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${shortTitle} `,
                size: 22,
              }),
              new TextRun({
                text: `(${getTypeLabel(texte.type_texte)}) `,
                italics: true,
                size: 20,
                color: '888888',
              }),
              new TextRun({
                text: '— p. ',
                size: 20,
                color: '888888',
              }),
              createPageRef(bookmarkId),
            ],
            indent: { left: 400 },
            spacing: { after: 60 },
          })
        );
      }
    }
  }
  
  return paragraphs;
};

/**
 * Create an index grouping texts by literary genre (type)
 * Shows each genre with its associated locations
 */
const createIndexByType = (textes: TexteExport[]): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  
  // Index title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Index par Genre Littéraire',
          bold: true,
          size: 36,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    })
  );

  // Group by type
  const typeGroups = groupTextesByType(textes);
  
  // Predefined type order
  const typeOrder = ['haiku', 'senryu', 'poeme', 'haibun', 'texte-libre', 'fable', 'prose', 'recit'];
  const sortedTypes = Array.from(typeGroups.keys()).sort((a, b) => {
    const indexA = typeOrder.indexOf(a);
    const indexB = typeOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  for (const type of sortedTypes) {
    const groupTextes = typeGroups.get(type)!;
    
    // Type name (bold)
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: getTypeLabel(type),
            bold: true,
            size: 24,
          }),
        ],
        spacing: { before: 250, after: 100 },
      })
    );
    
    // Sort textes by marche date (chronologically)
    const sortedTextes = [...groupTextes].sort((a, b) => {
      const dateA = a.marche_date || '9999-12-31';
      const dateB = b.marche_date || '9999-12-31';
      return dateA.localeCompare(dateB);
    });
    
    // List each text with its location and page reference
    for (const texte of sortedTextes) {
      const bookmarkId = generateBookmarkId(texte);
      const location = texte.marche_nom || texte.marche_ville || 'Sans lieu';
      const shortTitle = texte.titre.length > 45 
        ? texte.titre.substring(0, 42) + '...' 
        : texte.titre;
      
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${shortTitle} `,
              size: 22,
            }),
            new TextRun({
              text: `— ${location} `,
              italics: true,
              size: 20,
              color: '888888',
            }),
            new TextRun({
              text: '— p. ',
              size: 20,
              color: '888888',
            }),
            createPageRef(bookmarkId),
          ],
          indent: { left: 400 },
          spacing: { after: 60 },
        })
      );
    }
  }
  
  return paragraphs;
};

// ============================================================================
// KEYWORD INDEX GENERATION
// ============================================================================

/**
 * Strip HTML tags for keyword search
 */
const stripHtmlForSearch = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .toLowerCase();
};

/**
 * Capitalize first letter of a string
 */
const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Extract keywords from texts based on selected categories and custom keywords
 */
const extractKeywordsFromTextes = (
  textes: TexteExport[],
  selectedCategories: string[],
  customKeywords: string[],
  categorizedCustomKeywords: { keyword: string; category: string }[] = []
): Map<string, KeywordOccurrence> => {
  const occurrences = new Map<string, KeywordOccurrence>();
  
  // Collect keywords from selected categories
  const categoryKeywordsMap = new Map<string, string>();
  
  for (const category of KEYWORD_CATEGORIES) {
    if (selectedCategories.includes(category.id)) {
      for (const keyword of category.keywords) {
        categoryKeywordsMap.set(keyword.toLowerCase(), category.id);
      }
    }
  }
  
  // Add categorized custom keywords to their respective categories
  for (const { keyword, category } of categorizedCustomKeywords) {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && !categoryKeywordsMap.has(trimmed) && selectedCategories.includes(category)) {
      categoryKeywordsMap.set(trimmed, category);
    }
  }
  
  // Add uncategorized custom keywords to a special category (fallback)
  for (const keyword of customKeywords) {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && !categoryKeywordsMap.has(trimmed)) {
      categoryKeywordsMap.set(trimmed, 'custom');
    }
  }
  
  // Scan each text for keywords
  for (const [keyword, categoryId] of categoryKeywordsMap) {
    // Create a regex that matches the keyword as a whole word (with accents support)
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
    
    const matchingTextes = textes.filter(t => {
      const searchableContent = stripHtmlForSearch(t.contenu) + ' ' + t.titre.toLowerCase();
      return regex.test(searchableContent);
    });
    
    if (matchingTextes.length > 0) {
      occurrences.set(keyword, {
        keyword,
        texteIds: matchingTextes.map(t => t.id),
        category: categoryId
      });
    }
  }
  
  return occurrences;
};

/**
 * Create the keyword index section
 */
const createKeywordIndex = (
  textes: TexteExport[],
  selectedCategories: string[],
  customKeywords: string[],
  categorizedCustomKeywords: { keyword: string; category: string }[] = []
): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  
  const occurrences = extractKeywordsFromTextes(textes, selectedCategories, customKeywords, categorizedCustomKeywords);
  
  if (occurrences.size === 0) {
    return paragraphs;
  }
  
  // Index title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Index des Mots-Clés',
          bold: true,
          size: 36,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    })
  );
  
  // Group occurrences by category
  const categoriesWithKeywords = new Map<string, Map<string, KeywordOccurrence>>();
  
  for (const [keyword, occurrence] of occurrences) {
    if (!categoriesWithKeywords.has(occurrence.category)) {
      categoriesWithKeywords.set(occurrence.category, new Map());
    }
    categoriesWithKeywords.get(occurrence.category)!.set(keyword, occurrence);
  }
  
  // Define category order
  const categoryOrder = ['faune', 'hydrologie', 'ouvrages', 'flore', 'temporalites', 'poetique', 'technologies', 'custom'];
  
  // Sort categories by predefined order
  const sortedCategories = Array.from(categoriesWithKeywords.keys()).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  for (const categoryId of sortedCategories) {
    const categoryKeywords = categoriesWithKeywords.get(categoryId)!;
    
    // Get category label
    let categoryLabel: string;
    if (categoryId === 'custom') {
      categoryLabel = 'Mots-Clés Personnalisés';
    } else {
      const category = KEYWORD_CATEGORIES.find(c => c.id === categoryId);
      categoryLabel = category?.label || categoryId;
    }
    
    // Category header
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: categoryLabel,
            bold: true,
            italics: true,
            size: 26,
          }),
        ],
        spacing: { before: 300, after: 150 },
      })
    );
    
    // Sort keywords alphabetically
    const sortedKeywords = Array.from(categoryKeywords.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'fr'));
    
    // List keywords with page references
    for (const [keyword, occurrence] of sortedKeywords) {
      const children: (TextRun | SimpleField)[] = [
        new TextRun({
          text: capitalizeFirst(keyword),
          size: 22,
        }),
        new TextRun({
          text: ' — p. ',
          size: 20,
          color: '888888',
        }),
      ];
      
      // Add page references with commas
      occurrence.texteIds.forEach((id, index) => {
        const bookmarkId = `texte_${id}`.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 40);
        if (index > 0) {
          children.push(new TextRun({ text: ', ', size: 20, color: '888888' }));
        }
        children.push(createPageRef(bookmarkId));
      });
      
      paragraphs.push(
        new Paragraph({
          children,
          indent: { left: 300 },
          spacing: { after: 80 },
        })
      );
    }
  }
  
  return paragraphs;
};

/**
 * Create the complete indexes section with all indexes
 * Adds page breaks before and between indexes
 */
const createIndexesSection = (
  textes: TexteExport[],
  includeKeywordIndex: boolean = false,
  selectedKeywordCategories: string[] = [],
  customKeywords: string[] = [],
  categorizedCustomKeywords: { keyword: string; category: string }[] = []
): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  
  // Page break before indexes
  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
  
  // Index by Location
  paragraphs.push(...createIndexByMarche(textes));
  
  // Page break between the two indexes
  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
  
  // Index by Literary Genre
  paragraphs.push(...createIndexByType(textes));
  
  // Keyword Index (if enabled)
  if (includeKeywordIndex && selectedKeywordCategories.length > 0) {
    paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
    paragraphs.push(...createKeywordIndex(textes, selectedKeywordCategories, customKeywords, categorizedCustomKeywords));
  }
  
  return paragraphs;
};

export const exportTextesToWord = async (
  textes: TexteExport[],
  options: ExportOptions
): Promise<void> => {
  const children: Paragraph[] = [];

  // Cover page — split title on " — " for proper main title + subtitle
  if (options.includeCoverPage) {
    let mainTitle = options.title;
    let subtitle: string | undefined;
    if (options.title.includes(' — ')) {
      const parts = options.title.split(' — ');
      mainTitle = parts[0];
      subtitle = parts.slice(1).join(' — ');
    }
    children.push(...createCoverPage(mainTitle, textes.length, subtitle, options.contactEmail, options.contactPhone));
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
      children.push(...createSectionHeader(getTypeLabel(type), groupTextes.length, undefined, false));
      
      groupTextes.forEach(texte => {
        children.push(...createTexteEntry(texte, options.includeMetadata));
      });

      // Page break between sections — skip if last text was haiku/senryu
      const lastTexte = groupTextes[groupTextes.length - 1];
      const lastIsHaiku = lastTexte && (lastTexte.type_texte === 'haiku' || lastTexte.type_texte === 'senryu');
      if (!lastIsHaiku) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
    }
  } else {
    // Check if textes have partie assignments
    if (hasPartieAssignments(textes)) {
      // Group by Partie > Marche
      const partieGroups = groupTextesByPartie(textes);
      
      for (const { partie, marches } of partieGroups) {
        // Add partie cover page if assigned to a partie
        if (partie) {
          children.push(...createPartieCoverPage(
            partie.numeroRomain,
            partie.titre,
            partie.sousTitre
          ));
        }
        
        // Add marches within this partie
        for (const [marcheName, { date: marcheDate, textes: groupTextes }] of marches) {
          children.push(...createSectionHeader(marcheName, groupTextes.length, marcheDate || undefined, false));
          
          groupTextes.forEach(texte => {
            children.push(...createTexteEntry(texte, options.includeMetadata));
          });

          // Page break between sections — skip if last text was haiku/senryu (already has its own PageBreak)
          const lastTexte = groupTextes[groupTextes.length - 1];
          const lastIsHaiku = lastTexte && (lastTexte.type_texte === 'haiku' || lastTexte.type_texte === 'senryu');
          if (!lastIsHaiku) {
            children.push(new Paragraph({ children: [new PageBreak()] }));
          }
        }
      }
    } else {
      // Fallback: no parties, just group by marche
      const groups = groupTextesByMarcheWithDate(textes);
      
      for (const [marcheName, { date: marcheDate, textes: groupTextes }] of groups) {
        children.push(...createSectionHeader(marcheName, groupTextes.length, marcheDate || undefined, false));
        
        groupTextes.forEach(texte => {
          children.push(...createTexteEntry(texte, options.includeMetadata));
        });

        // Page break between sections — skip if last text was haiku/senryu
        const lastTexte = groupTextes[groupTextes.length - 1];
        const lastIsHaiku = lastTexte && (lastTexte.type_texte === 'haiku' || lastTexte.type_texte === 'senryu');
        if (!lastIsHaiku) {
          children.push(new Paragraph({ children: [new PageBreak()] }));
        }
      }
    }
  }

  // Add all indexes at the end of the document
  if (options.includeTableOfContents) {
    children.push(...createIndexesSection(
      textes,
      options.includeKeywordIndex ?? false,
      options.selectedKeywordCategories ?? [],
      options.customKeywords ?? [],
      options.categorizedCustomKeywords ?? []
    ));
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
            font: 'Times New Roman',
            size: 24,
          },
          paragraph: {
            spacing: { line: 360 },
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
