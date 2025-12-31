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
  ShadingType,
  PageOrientation,
} from 'docx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

export interface MarcheStats {
  numero: number;
  id: string;
  nom: string;
  ville: string;
  region: string;
  departement: string;
  date: string;
  latitude: number | null;
  longitude: number | null;
  nbPhotos: number;
  nbTextes: number;
  nbAudios: number;
  resumeEditorial: string;
}

interface ExplorationStatsExport {
  explorationName: string;
  marches: MarcheStats[];
  exportDate: Date;
}

// Generate editorial summary using AI
const generateEditorialSummary = async (
  textes: { type_texte: string; titre: string; contenu: string }[],
  marcheName: string
): Promise<string> => {
  if (textes.length === 0) {
    return 'Aucun texte disponible pour cette marche.';
  }

  try {
    const { data, error } = await supabase.functions.invoke('marche-editorial-summary', {
      body: { textes, marcheName },
    });

    if (error) {
      console.error('Error calling editorial summary function:', error);
      return 'Résumé non disponible.';
    }

    return data?.summary || 'Résumé non disponible.';
  } catch (err) {
    console.error('Error generating editorial summary:', err);
    return 'Résumé non disponible.';
  }
};

// Fetch all data for an exploration
export const fetchExplorationMarchesStats = async (
  explorationId: string,
  onProgress?: (current: number, total: number, marcheName: string) => void
): Promise<ExplorationStatsExport | null> => {
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

  // Get marche details including GPS
  const { data: marches, error: marchesError } = await supabase
    .from('marches')
    .select('id, nom_marche, ville, region, departement, date, latitude, longitude')
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

  // Get textes per marche for count and AI summary
  const { data: textes } = await supabase
    .from('marche_textes')
    .select('marche_id, type_texte, titre, contenu')
    .in('marche_id', marcheIds);

  const textesByMarche = new Map<string, { type_texte: string; titre: string; contenu: string }[]>();
  textes?.forEach(t => {
    const existing = textesByMarche.get(t.marche_id) || [];
    existing.push({ type_texte: t.type_texte, titre: t.titre, contenu: t.contenu });
    textesByMarche.set(t.marche_id, existing);
  });

  // Sort marches by date
  const sortedMarches = marches.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateA - dateB;
  });

  // Generate AI summaries for each marche (in batches of 3 for rate limiting)
  const marchesStats: MarcheStats[] = [];
  const batchSize = 3;
  
  for (let i = 0; i < sortedMarches.length; i += batchSize) {
    const batch = sortedMarches.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (m, batchIndex) => {
      const index = i + batchIndex;
      const marcheName = m.nom_marche || m.ville;
      const marcheTextes = textesByMarche.get(m.id) || [];
      
      onProgress?.(index + 1, sortedMarches.length, marcheName);
      
      const resumeEditorial = await generateEditorialSummary(marcheTextes, marcheName);
      
      return {
        numero: index + 1,
        id: m.id,
        nom: marcheName,
        ville: m.ville,
        region: m.region || 'Non spécifiée',
        departement: m.departement || 'Non spécifié',
        date: m.date || '',
        latitude: m.latitude,
        longitude: m.longitude,
        nbPhotos: photoCountMap.get(m.id) || 0,
        nbTextes: marcheTextes.length,
        nbAudios: audioCountMap.get(m.id) || 0,
        resumeEditorial,
      };
    });
    
    const batchResults = await Promise.all(batchPromises);
    marchesStats.push(...batchResults);
  }

  return {
    explorationName: exploration.name,
    marches: marchesStats,
    exportDate: new Date(),
  };
};

// Format GPS coordinates
const formatGPS = (lat: number | null, lng: number | null): string => {
  if (lat === null || lng === null) return '-';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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
          text: 'Liste des marches avec statistiques et résumés éditoriaux',
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
  const villes = data.marches.map(m => m.ville).filter(Boolean);

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
      children: [new TextRun({ text: `Villes : ${villes.length}` })],
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
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

// Create table with marches (landscape format)
const createMarchesTable = (data: ExplorationStatsExport): (Paragraph | Table)[] => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 3, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'N°', bold: true, color: 'ffffff', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 9, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Région', bold: true, color: 'ffffff', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 5, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Dépt', bold: true, color: 'ffffff', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 9, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Ville', bold: true, color: 'ffffff', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Marche', bold: true, color: 'ffffff', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'GPS', bold: true, color: 'ffffff', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 4, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '📷', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 4, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '📝', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 4, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '🎙️', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 42, type: WidthType.PERCENTAGE },
        shading: { fill: '2c3e50', type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: 'Résumé éditorial', bold: true, color: 'ffffff', size: 18 })] })],
      }),
    ],
  });

  const dataRows = data.marches.map((marche, index) =>
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: String(marche.numero), size: 18 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: marche.region, size: 16 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: marche.departement, size: 16 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: marche.ville, size: 18 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: marche.nom, bold: true, size: 18 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: formatGPS(marche.latitude, marche.longitude), size: 16 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(marche.nbPhotos), size: 18 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(marche.nbTextes), size: 18 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(marche.nbAudios), size: 18 })] })],
        }),
        new TableCell({
          shading: { fill: index % 2 === 0 ? 'f8f9fa' : 'ffffff', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: marche.resumeEditorial, italics: true, size: 18 })] })],
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
export const exportMarchesStatsToWord = async (
  explorationId: string,
  onProgress?: (current: number, total: number, marcheName: string) => void
): Promise<void> => {
  const data = await fetchExplorationMarchesStats(explorationId, onProgress);
  
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
    description: 'Documentation des marches avec statistiques et résumés éditoriaux',
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
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
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
