import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BiogeographyAggregates, BiogeographyRow } from '@/hooks/useExplorationBiogeography';
import { getCountry } from '@/lib/countriesGeoDictionary';
import type { BiodiversitySpecies } from '@/types/biodiversity';

const CONFIDENCE_LABEL: Record<string, string> = {
  verified: 'Vérifié',
  high: 'Élevé',
  medium: 'Moyen',
  low: 'Faible (inféré)',
};

const SOURCE_LABEL: Record<string, string> = {
  powo: 'POWO (Kew RBG)',
  gbif_type_locality: 'GBIF — Type Locality',
  gbif_strict: 'GBIF — Natif strict',
  inferred: 'Inféré (descripteur)',
};

function decideRule(row: BiogeographyRow | undefined): {
  rule: string;
  sourceLabel: string;
  confidence: string;
  originIso: string;
  originName: string;
  sourcesUrls: string;
} {
  if (!row) {
    return { rule: 'Non enrichi', sourceLabel: '—', confidence: '—', originIso: '—', originName: '—', sourcesUrls: '' };
  }
  const conf = row.type_locality_confidence || '';
  const src = row.type_locality_source || '';
  let rule = '4. Inféré (descripteur)';
  if (src === 'powo') rule = '1. POWO (Kew RBG)';
  else if (src === 'gbif_type_locality') rule = '2. GBIF — Type Locality';
  else if (src === 'gbif_strict') rule = '3. GBIF — Natif strict';
  else if (src === 'inferred') rule = '4. Inféré (descripteur)';

  let originIso = '';
  let inferred = false;
  if (row.type_locality_country && conf && conf !== 'low') {
    originIso = row.type_locality_country;
  } else if (row.native_countries_verified?.length) {
    originIso = row.native_countries_verified[0];
  } else if (row.type_locality_country) {
    originIso = row.type_locality_country;
    inferred = true;
  }
  const country = originIso ? getCountry(originIso) : undefined;
  const sourcesUrls = (row.sources || []).map((s) => `${s.name}: ${s.url}`).join(' | ');
  return {
    rule,
    sourceLabel: SOURCE_LABEL[src] || '—',
    confidence: (CONFIDENCE_LABEL[conf] || '—') + (inferred ? ' · fallback inféré' : ''),
    originIso: originIso || '—',
    originName: country?.name || row.type_locality_label || '—',
    sourcesUrls,
  };
}

interface ExportContext {
  explorationTitle?: string;
  species: BiodiversitySpecies[];
  data: BiogeographyAggregates;
}

function buildRows(ctx: ExportContext) {
  const { species, data } = ctx;
  return species
    .filter((sp) => sp.scientificName)
    .map((sp) => {
      const row = data.byScientificName.get(sp.scientificName!);
      const d = decideRule(row);
      return {
        scientific: sp.scientificName!,
        common: sp.commonName || '',
        rule: d.rule,
        source: d.sourceLabel,
        confidence: d.confidence,
        originIso: d.originIso,
        originName: d.originName,
        describer: row?.describer_name || '',
        year: row?.describer_year?.toString() || '',
        sources: d.sourcesUrls,
      };
    })
    .sort((a, b) => a.scientific.localeCompare(b.scientific));
}

export function exportClassificationCsv(ctx: ExportContext) {
  const rows = buildRows(ctx);
  const headers = [
    'Nom scientifique', 'Nom commun', 'Règle appliquée', 'Source primaire',
    'Confiance', 'Pays origine (ISO)', 'Pays origine', 'Descripteur', 'Année', 'Sources (URLs)',
  ];
  const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(esc).join(','),
    ...rows.map((r) => [r.scientific, r.common, r.rule, r.source, r.confidence, r.originIso, r.originName, r.describer, r.year, r.sources].map(esc).join(',')),
  ];
  const csv = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const date = format(new Date(), 'yyyy-MM-dd', { locale: fr });
  const slug = (ctx.explorationTitle || 'exploration').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  saveAs(blob, `rapport-classification-${slug}-${date}.csv`);
}

export function exportClassificationPdf(ctx: ExportContext) {
  const rows = buildRows(ctx);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const dateStr = format(new Date(), 'dd/MM/yyyy', { locale: fr });

  // Header
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Rapport de classification — Origines du vivant', 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(`${ctx.explorationTitle || 'Exploration'} · ${dateStr}`, 14, 22);
  doc.text(`${rows.length} espèces analysées · ${ctx.data.origins.length} pays d'origine`, 14, 27);

  // Rules summary
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Règles de classification (ordre de priorité)', 14, 36);
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  const rules = [
    ['1. POWO (Kew RBG)', 'Plants of the World Online — TDWG L3 → ISO. Référence botanique mondiale.', 'powo.science.kew.org'],
    ['2. GBIF — Type Locality', 'Localité du spécimen type décrit historiquement.', 'gbif.org'],
    ['3. GBIF — Natif strict', 'establishmentMeans = NATIVE / ENDEMIC uniquement. Exclut INTRODUCED, NATURALISED, INVASIVE.', 'gbif.org'],
    ['4. Inféré (descripteur)', "Pays du descripteur, marqué confiance = faible. Jamais affiché comme natif strict.", '—'],
  ];
  autoTable(doc, {
    startY: 40,
    head: [['Règle', 'Description', 'Source']],
    body: rules,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 100, 80], textColor: 255 },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 160 }, 2: { cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  // Species table
  const startY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Décisions de provenance par espèce', 14, startY);

  autoTable(doc, {
    startY: startY + 4,
    head: [['Nom scientifique', 'Nom commun', 'Règle', 'Source', 'Confiance', 'ISO', 'Pays origine', 'Descripteur', 'Année']],
    body: rows.map((r) => [r.scientific, r.common, r.rule, r.source, r.confidence, r.originIso, r.originName, r.describer, r.year]),
    styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: { fillColor: [16, 100, 80], textColor: 255, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'italic' },
      1: { cellWidth: 35 },
      2: { cellWidth: 32 },
      3: { cellWidth: 30 },
      4: { cellWidth: 22 },
      5: { cellWidth: 12 },
      6: { cellWidth: 30 },
      7: { cellWidth: 30 },
      8: { cellWidth: 12 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `La Fréquence du Vivant — Rapport de classification · Page ${pageNum}/${pageCount}`,
        14,
        doc.internal.pageSize.getHeight() - 8,
      );
    },
  });

  const slug = (ctx.explorationTitle || 'exploration').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const date = format(new Date(), 'yyyy-MM-dd', { locale: fr });
  doc.save(`rapport-classification-${slug}-${date}.pdf`);
}
