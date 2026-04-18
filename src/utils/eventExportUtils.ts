import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  Table as DocxTable,
  WidthType,
  BorderStyle,
  PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Color mappings for event types (hex without #)
const EVENT_TYPE_COLORS: Record<string, string> = {
  agroecologique: '10b981',
  eco_poetique: '8b5cf6',
  eco_tourisme: 'f59e0b',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  agroecologique: 'Agroécologique',
  eco_poetique: 'Éco poétique',
  eco_tourisme: 'Éco tourisme',
};

export interface EventExportData {
  id: string;
  title: string;
  date_marche: string;
  lieu: string | null;
  event_type: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  participants: Array<{
    prenom: string;
    nom: string;
    validated_at: string | null;
    created_at: string;
  }>;
  marches: Array<{
    id: string;
    nom_marche: string | null;
    ville: string;
    latitude: number | null;
    longitude: number | null;
    descriptif_court: string | null;
    descriptif_long: string | null;
  }>;
  biodiversity: {
    totalSpecies: number;
    speciesByKingdom: { birds: number; plants: number; fungi: number; others: number };
    topSpecies: Array<{ name: string; scientificName: string; count: number; kingdom: string }>;
    allSpecies?: Array<{ name: string; scientificName: string; count: number; kingdom: string }>;
    rawSpeciesPerMarche?: Array<{ name: string; scientificName: string; count: number; kingdom: string; marcheName: string; latitude: number | null; longitude: number | null }>;
  } | null;
}

export interface EventExportOptions {
  includeEventInfo: boolean;
  includeParticipants: boolean;
  includeMarches: boolean;
  includeBiodiversity: boolean;
  includeRawBiodiversity: boolean;
}

function formatEventDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMMM yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
}

function getTypeColor(eventType: string): string {
  return EVENT_TYPE_COLORS[eventType] || '6b7280';
}

function getTypeLabel(eventType: string): string {
  return EVENT_TYPE_LABELS[eventType] || eventType;
}

function stripHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ============================================================================
// WORD EXPORT
// ============================================================================

export async function exportEventsToWord(
  events: EventExportData[],
  options: EventExportOptions,
): Promise<void> {
  const sections: any[] = [];

  // Cover page
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000 },
      children: [
        new TextRun({ text: 'Rapport des Événements', size: 56, bold: true, color: '1a1a2e' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: `${events.length} événement${events.length > 1 ? 's' : ''} · Généré le ${format(new Date(), 'dd/MM/yyyy')}`,
          size: 24,
          color: '6b7280',
          italics: true,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // Each event
  events.forEach((event, idx) => {
    const color = getTypeColor(event.event_type);
    const typeLabel = getTypeLabel(event.event_type);

    // Event title
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: idx > 0 ? 600 : 200, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color } },
        children: [
          new TextRun({ text: event.title, bold: true, size: 32, color: '1a1a2e' }),
        ],
      }),
    );

    // Type badge + date + lieu
    if (options.includeEventInfo) {
      sections.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `▌ ${typeLabel}`, bold: true, size: 20, color }),
            new TextRun({ text: `   ·   ${formatEventDate(event.date_marche)}`, size: 20, color: '6b7280' }),
            ...(event.lieu ? [new TextRun({ text: `   ·   ${event.lieu}`, size: 20, color: '6b7280' })] : []),
          ],
        }),
      );

      if (event.latitude && event.longitude) {
        sections.push(
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: `📍 ${event.latitude.toFixed(5)}, ${event.longitude.toFixed(5)}`, size: 18, color: '9ca3af' }),
            ],
          }),
        );
      }

      if (event.description) {
        sections.push(
          new Paragraph({
            spacing: { after: 300 },
            children: [new TextRun({ text: event.description, size: 20, italics: true, color: '4b5563' })],
          }),
        );
      }
    }

    // Participants
    if (options.includeParticipants && event.participants.length > 0) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({ text: `Participants (${event.participants.length})`, size: 24, bold: true, color }),
          ],
        }),
      );

      const headerRow = new DocxTableRow({
        tableHeader: true,
        children: ['Prénom', 'Nom', 'Inscrit le', 'Statut'].map(
          label =>
            new DocxTableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { fill: color, color: 'ffffff' },
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: 'ffffff' })] })],
            }),
        ),
      });

      const dataRows = event.participants.map(
        p =>
          new DocxTableRow({
            children: [
              p.prenom,
              p.nom,
              formatEventDate(p.created_at),
              p.validated_at ? '✓ Présent' : 'Inscrit',
            ].map(
              val =>
                new DocxTableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: val, size: 18 })] })],
                }),
            ),
          }),
      );

      sections.push(
        new DocxTable({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
      );
    }

    // Marches associées
    if (options.includeMarches && event.marches.length > 0) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({ text: `Parcours — ${event.marches.length} étape${event.marches.length > 1 ? 's' : ''}`, size: 24, bold: true, color }),
          ],
        }),
      );

      event.marches.forEach((m, i) => {
        const coords = m.latitude && m.longitude ? ` (${m.latitude.toFixed(4)}, ${m.longitude.toFixed(4)})` : '';
        sections.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true, size: 20, color }),
              new TextRun({ text: m.nom_marche || m.ville, size: 20 }),
              new TextRun({ text: ` — ${m.ville}${coords}`, size: 18, color: '9ca3af' }),
            ],
          }),
        );

        const court = stripHtml(m.descriptif_court);
        const long = stripHtml(m.descriptif_long);
        if (court) {
          sections.push(
            new Paragraph({
              spacing: { after: 60 },
              indent: { left: 360 },
              children: [
                new TextRun({ text: 'Présentation : ', bold: true, size: 18, color: '6b7280' }),
                new TextRun({ text: court, size: 18, italics: true, color: '4b5563' }),
              ],
            }),
          );
        }
        if (long) {
          sections.push(
            new Paragraph({
              spacing: { after: 160 },
              indent: { left: 360 },
              children: [
                new TextRun({ text: 'En détail : ', bold: true, size: 18, color: '6b7280' }),
                new TextRun({ text: long, size: 18, italics: true, color: '4b5563' }),
              ],
            }),
          );
        }
      });
    }

    // Biodiversité
    if (options.includeBiodiversity && event.biodiversity) {
      const bio = event.biodiversity;
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({ text: `Biodiversité — ${bio.totalSpecies} espèces`, size: 24, bold: true, color }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `Faune : ${bio.speciesByKingdom.birds}`, size: 20 }),
            new TextRun({ text: `  ·  Flore : ${bio.speciesByKingdom.plants}`, size: 20 }),
            new TextRun({ text: `  ·  Champignons : ${bio.speciesByKingdom.fungi}`, size: 20 }),
            new TextRun({ text: `  ·  Autres : ${bio.speciesByKingdom.others}`, size: 20 }),
          ],
        }),
      );

      if (bio.topSpecies.length > 0) {
        sections.push(
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: 'Top espèces observées :', bold: true, size: 20 })],
          }),
        );

        bio.topSpecies.slice(0, 10).forEach((sp, i) => {
          sections.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: `${i + 1}. ${sp.name}`, size: 18 }),
                new TextRun({ text: ` (${sp.scientificName})`, size: 16, italics: true, color: '9ca3af' }),
                new TextRun({ text: ` — ${sp.count} obs.`, size: 16, color: '6b7280' }),
              ],
            }),
          );
        });
      }
    }

    // Page break between events
    if (idx < events.length - 1) {
      sections.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Rapport_Evenements_${format(new Date(), 'yyyy-MM-dd')}.docx`;
  saveAs(blob, fileName);
}

// ============================================================================
// CSV EXPORT
// ============================================================================

function escapeCSV(val: string | null | undefined): string {
  if (!val) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportEventsToCSV(
  events: EventExportData[],
  options: EventExportOptions,
): void {
  const lines: string[] = [];

  // Events CSV
  if (options.includeEventInfo) {
    lines.push('=== ÉVÉNEMENTS ===');
    lines.push('Titre,Type,Date,Lieu,Latitude,Longitude,Participants,Espèces');
    events.forEach(e => {
      lines.push(
        [
          escapeCSV(e.title),
          escapeCSV(getTypeLabel(e.event_type)),
          escapeCSV(formatEventDate(e.date_marche)),
          escapeCSV(e.lieu),
          e.latitude?.toString() || '',
          e.longitude?.toString() || '',
          e.participants.length.toString(),
          e.biodiversity?.totalSpecies?.toString() || '0',
        ].join(','),
      );
    });
    lines.push('');
  }

  // Participants CSV
  if (options.includeParticipants) {
    lines.push('=== PARTICIPANTS ===');
    lines.push('Événement,Type,Prénom,Nom,Date inscription,Statut');
    events.forEach(e => {
      e.participants.forEach(p => {
        lines.push(
          [
            escapeCSV(e.title),
            escapeCSV(getTypeLabel(e.event_type)),
            escapeCSV(p.prenom),
            escapeCSV(p.nom),
            escapeCSV(formatEventDate(p.created_at)),
            p.validated_at ? 'Présent' : 'Inscrit',
          ].join(','),
        );
      });
    });
    lines.push('');
  }

  // Marches CSV
  if (options.includeMarches) {
    lines.push('=== MARCHES ===');
    lines.push('Événement,Type,Ordre,Nom marche,Ville,Latitude,Longitude,Présentation,En détail');
    events.forEach(e => {
      e.marches.forEach((m, i) => {
        lines.push(
          [
            escapeCSV(e.title),
            escapeCSV(getTypeLabel(e.event_type)),
            (i + 1).toString(),
            escapeCSV(m.nom_marche),
            escapeCSV(m.ville),
            m.latitude?.toString() || '',
            m.longitude?.toString() || '',
            escapeCSV(stripHtml(m.descriptif_court)),
            escapeCSV(stripHtml(m.descriptif_long)),
          ].join(','),
        );
      });
    });
    lines.push('');
  }

  // Biodiversity CSV
  if (options.includeBiodiversity) {
    lines.push('=== BIODIVERSITÉ ===');
    lines.push('Événement,Type,Espèce,Nom scientifique,Royaume,Observations');
    events.forEach(e => {
      if (e.biodiversity) {
        e.biodiversity.topSpecies.forEach(sp => {
          lines.push(
            [
              escapeCSV(e.title),
              escapeCSV(getTypeLabel(e.event_type)),
              escapeCSV(sp.name),
              escapeCSV(sp.scientificName),
              escapeCSV(sp.kingdom),
              sp.count.toString(),
            ].join(','),
          );
        });
      }
    });
  }

  // Raw biodiversity CSV
  if (options.includeRawBiodiversity) {
    lines.push('=== DONNÉES BRUTES BIODIVERSITÉ ===');
    lines.push('Événement,Type,Marche,Longitude,Latitude,Espèce,Nom scientifique,Royaume,Observations');
    events.forEach(e => {
      if (e.biodiversity?.rawSpeciesPerMarche) {
        e.biodiversity.rawSpeciesPerMarche.forEach(sp => {
          lines.push(
            [
              escapeCSV(e.title),
              escapeCSV(getTypeLabel(e.event_type)),
              escapeCSV(sp.marcheName),
              sp.longitude?.toString() || '',
              sp.latitude?.toString() || '',
              escapeCSV(sp.name),
              escapeCSV(sp.scientificName),
              escapeCSV(sp.kingdom),
              sp.count.toString(),
            ].join(','),
          );
        });
      }
    });
    lines.push('');
  }

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const fileName = `Rapport_Evenements_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  saveAs(blob, fileName);
}
