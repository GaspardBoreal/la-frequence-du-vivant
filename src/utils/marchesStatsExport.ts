import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

export interface MarcheStats {
  numero: number;
  id: string;
  nom: string;
  region: string;
  departement: string;
  date: string;
  nbPhotos: number;
  nbTextes: number;
  nbAudios: number;
  tonalite: string;
}

interface ExplorationStatsExport {
  explorationName: string;
  marches: MarcheStats[];
  exportDate: Date;
}

// Analyze text content to determine tonality
const analyzeTextTonality = (textes: { type_texte: string; contenu: string }[]): string => {
  if (textes.length === 0) return 'Non définie';

  const types = textes.map(t => t.type_texte.toLowerCase());
  const content = textes.map(t => t.contenu.toLowerCase()).join(' ');

  // Keywords for different tonalities
  const poeticKeywords = ['haiku', 'haïku', 'senryu', 'poème', 'vers'];
  const narrativeKeywords = ['récit', 'fable', 'histoire', 'conte'];
  const contemplativeKeywords = ['silence', 'calme', 'paix', 'méditation', 'contemplation', 'lenteur'];
  const ecologicalKeywords = ['nature', 'rivière', 'arbre', 'oiseau', 'biodiversité', 'écosystème', 'forêt'];
  const humanKeywords = ['rencontre', 'paysan', 'artisan', 'producteur', 'marché', 'communauté', 'terroir'];

  let tonalities: string[] = [];

  // Check types
  if (types.some(t => poeticKeywords.some(k => t.includes(k)))) {
    tonalities.push('Poétique');
  }
  if (types.some(t => narrativeKeywords.some(k => t.includes(k)))) {
    tonalities.push('Narrative');
  }

  // Check content
  const contemplativeScore = contemplativeKeywords.filter(k => content.includes(k)).length;
  const ecologicalScore = ecologicalKeywords.filter(k => content.includes(k)).length;
  const humanScore = humanKeywords.filter(k => content.includes(k)).length;

  if (contemplativeScore >= 2) tonalities.push('Contemplative');
  if (ecologicalScore >= 3) tonalities.push('Écologique');
  if (humanScore >= 3) tonalities.push('Humaine');

  // Default fallback
  if (tonalities.length === 0) {
    if (types.includes('haiku') || types.includes('senryu')) return 'Poétique minimaliste';
    if (types.includes('prose') || types.includes('texte-libre')) return 'Libre & exploratoire';
    return 'Documentaire';
  }

  return tonalities.slice(0, 2).join(' & ');
};

// Fetch all data for an exploration
export const fetchExplorationMarchesStats = async (explorationId: string): Promise<ExplorationStatsExport | null> => {
  // Get exploration details
  const { data: exploration, error: explError } = await supabase
    .from('explorations')
    .select('name')
    .eq('id', explorationId)
    .single();

  if (explError || !exploration) {
    console.error('Error fetching exploration:', explError);
    return null;
  }

  // Get marches linked to this exploration
  const { data: links, error: linksError } = await supabase
    .from('exploration_marches')
    .select('marche_id, ordre')
    .eq('exploration_id', explorationId)
    .order('ordre', { ascending: true });

  if (linksError || !links?.length) {
    console.error('Error fetching marches links:', linksError);
    return null;
  }

  const marcheIds = links.map(l => l.marche_id);
  const ordreMap = new Map(links.map(l => [l.marche_id, l.ordre]));

  // Get marche details
  const { data: marches, error: marchesError } = await supabase
    .from('marches')
    .select('id, nom_marche, ville, region, departement, date')
    .in('id', marcheIds);

  if (marchesError || !marches) {
    console.error('Error fetching marches:', marchesError);
    return null;
  }

  // Get photos count per marche
  const { data: photoCounts } = await supabase
    .from('marche_photos')
    .select('marche_id')
    .in('marche_id', marcheIds);

  const photoCountMap = new Map<string, number>();
  photoCounts?.forEach(p => {
    photoCountMap.set(p.marche_id, (photoCountMap.get(p.marche_id) || 0) + 1);
  });

  // Get audio count per marche
  const { data: audioCounts } = await supabase
    .from('marche_audio')
    .select('marche_id')
    .in('marche_id', marcheIds);

  const audioCountMap = new Map<string, number>();
  audioCounts?.forEach(a => {
    audioCountMap.set(a.marche_id, (audioCountMap.get(a.marche_id) || 0) + 1);
  });

  // Get textes per marche for count and tonality
  const { data: textes } = await supabase
    .from('marche_textes')
    .select('marche_id, type_texte, contenu')
    .in('marche_id', marcheIds);

  const textesByMarche = new Map<string, { type_texte: string; contenu: string }[]>();
  textes?.forEach(t => {
    const existing = textesByMarche.get(t.marche_id) || [];
    existing.push({ type_texte: t.type_texte, contenu: t.contenu });
    textesByMarche.set(t.marche_id, existing);
  });

  // Build marches stats
  const marchesStats: MarcheStats[] = marches
    .sort((a, b) => {
      // Sort by date chronologically
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    })
    .map((m, index) => {
      const marcheTextes = textesByMarche.get(m.id) || [];
      return {
        numero: index + 1,
        id: m.id,
        nom: m.nom_marche || m.ville,
        region: m.region || 'Non spécifiée',
        departement: m.departement || 'Non spécifié',
        date: m.date || '',
        nbPhotos: photoCountMap.get(m.id) || 0,
        nbTextes: marcheTextes.length,
        nbAudios: audioCountMap.get(m.id) || 0,
        tonalite: analyzeTextTonality(marcheTextes),
      };
    });

  return {
    explorationName: exploration.name,
    marches: marchesStats,
    exportDate: new Date(),
  };
};

// Create cover page
const createCoverPage = (data: ExplorationStatsExport): Paragraph[] => {
  return [
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { after: 2400 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'DOCUMENTATION',
          bold: true,
          size: 28,
          color: '666666',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 800 },
      children: [
        new TextRun({
          text: data.explorationName,
          bold: true,
          size: 56,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Liste des marches avec statistiques et tonalités',
          size: 28,
          color: '888888',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1600 },
      children: [
        new TextRun({
          text: `${data.marches.length} marches documentées`,
          size: 32,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400 },
      children: [
        new TextRun({
          text: `Généré le ${data.exportDate.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}`,
          size: 22,
          color: '999999',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [
        new TextRun({
          text: 'Gaspard Boréal',
          size: 24,
          italics: true,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

// Create summary statistics
const createSummarySection = (data: ExplorationStatsExport): Paragraph[] => {
  const totalPhotos = data.marches.reduce((sum, m) => sum + m.nbPhotos, 0);
  const totalTextes = data.marches.reduce((sum, m) => sum + m.nbTextes, 0);
  const totalAudios = data.marches.reduce((sum, m) => sum + m.nbAudios, 0);
  
  const regions = new Set(data.marches.map(m => m.region));
  const departements = new Set(data.marches.map(m => m.departement));

  // Count tonalities
  const tonalityCount = new Map<string, number>();
  data.marches.forEach(m => {
    const key = m.tonalite;
    tonalityCount.set(key, (tonalityCount.get(key) || 0) + 1);
  });

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Synthèse', bold: true })],
    }),
    new Paragraph({
      spacing: { before: 300, after: 300 },
      children: [
        new TextRun({ text: 'Statistiques générales', bold: true, size: 24 }),
      ],
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text: `Nombre total de marches : ${data.marches.length}` })],
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text: `Régions traversées : ${regions.size} (${Array.from(regions).join(', ')})` })],
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text: `Départements : ${departements.size}` })],
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text: `Total photos : ${totalPhotos}` })],
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text: `Total textes littéraires : ${totalTextes}` })],
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text: `Total audios : ${totalAudios}` })],
    }),
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({ text: 'Distribution des tonalités', bold: true, size: 24 }),
      ],
    }),
    ...Array.from(tonalityCount.entries()).map(([tonalite, count]) =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: `${tonalite} : ${count} marche(s)` })],
      })
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

// Create table with marches
const createMarchesTable = (data: ExplorationStatsExport): (Paragraph | Table)[] => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 5, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'N°', bold: true, color: 'ffffff' })] })],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Région', bold: true, color: 'ffffff' })] })],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Dépt', bold: true, color: 'ffffff' })] })],
      }),
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Marche', bold: true, color: 'ffffff' })] })],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Photos', bold: true, color: 'ffffff' })] })],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Textes', bold: true, color: 'ffffff' })] })],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Audios', bold: true, color: 'ffffff' })] })],
      }),
      new TableCell({
        width: { size: 29, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Tonalité', bold: true, color: 'ffffff' })] })],
      }),
    ],
  });

  const dataRows = data.marches.map((marche, index) =>
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: String(marche.numero) })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: marche.region, size: 18 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: marche.departement, size: 18 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: marche.nom, bold: true })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(marche.nbPhotos) })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(marche.nbTextes) })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(marche.nbAudios) })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: marche.tonalite, italics: true, size: 20 })] })],
        }),
      ],
    })
  );

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Liste des marches', bold: true })],
    }),
    new Paragraph({ spacing: { after: 300 }, children: [] }),
    table,
  ];
};

// Main export function
export const exportMarchesStatsToWord = async (explorationId: string): Promise<void> => {
  const data = await fetchExplorationMarchesStats(explorationId);
  
  if (!data) {
    throw new Error('Impossible de récupérer les données de l\'exploration');
  }

  const children: (Paragraph | Table)[] = [
    ...createCoverPage(data),
    ...createSummarySection(data),
    ...createMarchesTable(data),
  ];

  const doc = new Document({
    title: `${data.explorationName} - Statistiques des marches`,
    creator: 'Gaspard Boréal',
    description: 'Documentation des marches avec statistiques et tonalités',
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            font: 'Calibri',
            size: 22,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 800,
              bottom: 1000,
              left: 800,
            },
          },
        },
        children: children as Paragraph[],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${data.explorationName.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/g, '')}_statistiques_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, filename);
};
