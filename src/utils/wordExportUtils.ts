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
  created_at?: string;
}

interface ExportOptions {
  title: string;
  includeTableOfContents: boolean;
  includeCoverPage: boolean;
  organizationMode: 'type' | 'marche';
  includeMetadata: boolean;
}

const TEXT_TYPE_LABELS: Record<string, string> = {
  haiku: 'Haïkus',
  poeme: 'Poèmes',
  senryu: 'Senryūs',
  haibun: 'Haïbuns',
  texte_libre: 'Textes libres',
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

const createSectionHeader = (title: string, count: number): Paragraph[] => {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `${title} (${count})`,
          bold: true,
          size: 32,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
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

  // Metadata (location, date)
  if (includeMetadata && (texte.marche_nom || texte.marche_ville)) {
    const locationParts: string[] = [];
    if (texte.marche_nom) locationParts.push(texte.marche_nom);
    if (texte.marche_ville) locationParts.push(texte.marche_ville);
    if (texte.marche_region) locationParts.push(texte.marche_region);

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
        spacing: { after: 200 },
      })
    );
  }

  // Content - split by newlines and create paragraphs
  const contentLines = texte.contenu.split('\n').filter(line => line.trim());
  contentLines.forEach((line, index) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line.trim(),
            size: 22,
          }),
        ],
        spacing: { after: index === contentLines.length - 1 ? 300 : 100 },
      })
    );
  });

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
  const groups = new Map<string, TexteExport[]>();
  
  textes.forEach(texte => {
    const key = texte.marche_nom || texte.marche_ville || 'Sans lieu';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(texte);
  });

  return groups;
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
    const typeOrder = ['haiku', 'senryu', 'poeme', 'haibun', 'texte_libre', 'fable', 'prose', 'recit'];
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
      children.push(...createSectionHeader(marcheName, groupTextes.length));
      
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
  const headers = ['Titre', 'Type', 'Marché', 'Ville', 'Région', 'Contenu', 'Date de création'];
  
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
