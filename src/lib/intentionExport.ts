import jsPDF from 'jspdf';
import { DEFAULT_SEQUENCE } from '@/config/onboarding/defaultSequence';
import { buildSequence, type AnswerValue, type OnboardingQuestion } from '@/config/onboarding/schema';
import { PERSONA_LABELS } from '@/config/onboarding/personas';
import type { PropertyIntention } from '@/hooks/propriete/usePropertyIntention';
import type { PropertyBiodiversityKpis } from '@/hooks/propriete/usePropertyBiodiversityKpis';
import { ECO_FUNCTIONS } from '@/lib/ecologicalFunctions';

/** Une ligne d'export : une question du parcours d'accueil et sa réponse. */
export interface IntentionRow {
  volet: 'Le jardin' | 'Le projet';
  chapitre: string;
  question: string;
  reponse: string;
  brut: string;
}

const readable = (
  q: OnboardingQuestion,
  value: AnswerValue | undefined,
  answers: Record<string, AnswerValue>,
): string => {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return '';
  if (q.kind === 'slider' && q.slider) return `${value} ${q.slider.unit}`;
  const labelOf = (v: string) => q.options?.find((o) => o.value === v)?.label ?? v;
  const precisionOf = (v: string) => {
    const key = q.options?.find((o) => o.value === v)?.followUp?.answerId;
    const raw = key ? answers[key] : undefined;
    return typeof raw === 'string' && raw.trim() ? ` — « ${raw.trim()} »` : '';
  };
  if (Array.isArray(value)) return value.map((v) => labelOf(v) + precisionOf(v)).join(' · ');
  if (typeof value === 'number') return String(value);
  return labelOf(value) + precisionOf(value);
};

const PROJET_IDS = new Set(['priorite', 'objectif_6_mois']);

/** Aplatit l'intention en lignes lisibles, dans l'ordre du parcours. */
export const buildIntentionRows = (intention: PropertyIntention): IntentionRow[] => {
  const answers = intention.answers ?? {};
  const questions = buildSequence(DEFAULT_SEQUENCE.questions, answers, intention.persona);
  return questions.map((q) => {
    const brutValue = q.kind === 'surface' && q.surface
      ? { total: answers[q.surface.totalId] ?? null, libre: answers[q.surface.freeId] ?? null }
      : answers[q.id] ?? null;
    const reponse = q.kind === 'surface' && q.surface
      ? [
          answers[q.surface.totalId] != null ? `${answers[q.surface.totalId]} m² au total` : null,
          answers[q.surface.freeId] != null ? `${answers[q.surface.freeId]} m² disponibles` : null,
        ].filter(Boolean).join(' · ')
      : readable(q, answers[q.id], answers);
    return {
      volet: PROJET_IDS.has(q.id) ? 'Le projet' : 'Le jardin',
      chapitre: q.chapter,
      question: q.title,
      reponse,
      brut: brutValue == null ? '' : JSON.stringify(brutValue),
    };
  });
};

const slugify = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'jardin';

const stamp = () => new Date().toISOString().slice(0, 10);

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const csvCell = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;

/** Indicateurs de biodiversité relevés lors des marches rattachées au jardin. */
export type IntentionBiodiversity = PropertyBiodiversityKpis;

const KINGDOM_FR: Record<string, string> = {
  plantae: 'Plantes',
  animalia: 'Animaux',
  fungi: 'Champignons',
  others: 'Autres',
};

/** Lignes « Biodiversité » : une mesure par ligne, jamais de chiffre inventé. */
export const buildBiodiversityRows = (
  bio: IntentionBiodiversity,
): Array<{ mesure: string; valeur: string }> => {
  if (!bio.hasEvents) {
    return [{ mesure: 'Marches rattachées', valeur: 'Aucune marche rattachée à ce jardin' }];
  }
  const rows: Array<{ mesure: string; valeur: string }> = [
    { mesure: 'Marches rattachées', valeur: String(bio.eventCount) },
    { mesure: 'Espèces distinctes recensées', valeur: String(bio.totalSpecies) },
  ];
  (Object.keys(KINGDOM_FR) as Array<keyof typeof KINGDOM_FR>).forEach((k) => {
    rows.push({
      mesure: `Espèces — ${KINGDOM_FR[k]}`,
      valeur: String((bio.byKingdom as Record<string, number>)[k] ?? 0),
    });
  });
  rows.push(
    { mesure: 'Alliés du jardin (espèces à fonction écologique)', valeur: String(bio.alliesCount) },
    { mesure: 'Part des alliés', valeur: `${bio.alliesShare} %` },
    { mesure: 'Indice de fertilité', valeur: String(bio.fertilityScore) },
  );
  ECO_FUNCTIONS.forEach((f) => {
    const c = bio.functionCounts[f.value] ?? 0;
    if (c > 0) rows.push({ mesure: `Fonction — ${f.shortLabel}`, valeur: String(c) });
  });
  rows.push({
    mesure: 'Origine des étiquettes',
    valeur: `curation ${bio.sources.curated} · base partagée ${bio.sources.kb} · automatique ${bio.sources.auto}`,
  });
  return rows;
};

export const exportIntentionCsv = (
  intention: PropertyIntention,
  nom: string,
  bio?: IntentionBiodiversity | null,
) => {
  const rows = buildIntentionRows(intention);
  const header = ['Volet', 'Chapitre', 'Question', 'Réponse', 'Valeur brute'];
  const lines = [
    header.map(csvCell).join(';'),
    ...rows.map((r) => [r.volet, r.chapitre, r.question, r.reponse, r.brut].map(csvCell).join(';')),
    ...(bio
      ? ['', ['Biodiversité', 'Mesure', 'Valeur'].map(csvCell).join(';'),
         ...buildBiodiversityRows(bio).map((r) =>
           ['Biodiversité', r.mesure, r.valeur].map(csvCell).join(';'))]
      : []),
  ];
  // BOM : Excel ouvre correctement les accents.
  download(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' }),
    `intention-${slugify(nom)}-${stamp()}.csv`);
};

export const exportIntentionJson = (
  intention: PropertyIntention,
  nom: string,
  bio?: IntentionBiodiversity | null,
) => {
  const payload = {
    jardin: nom,
    exporte_le: new Date().toISOString(),
    persona: intention.persona,
    persona_stockee: intention.storedPersona,
    persona_libelle: intention.personaLabel ?? PERSONA_LABELS[intention.persona],
    version: intention.version,
    flow_version: intention.flowVersion,
    flow_source: intention.flowSource,
    completed_at: intention.completedAt,
    updated_at: intention.updatedAt,
    portrait: intention.portrait,
    jardin_exemple: intention.gardenExample,
    gestes: intention.gestures,
    gestes_meta: intention.gesturesMeta,
    reponses: intention.answers,
    lignes: buildIntentionRows(intention),
    brut: intention.raw,
  };
  download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `intention-${slugify(nom)}-${stamp()}.json`);
};

/** Document A4 sobre : en-tête, les deux volets, gestes et jardin-exemple. */
export const exportIntentionPdf = (
  intention: PropertyIntention,
  nom: string,
  sousTitre?: string | null,
) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 18;
  let y = 22;

  const page = () => {
    if (y < 272) return;
    doc.addPage();
    y = 22;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Intention du jardin', M, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(nom, M, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    [sousTitre, `Édité le ${new Date().toLocaleDateString('fr-FR')}`].filter(Boolean).join(' · '),
    M, y,
  );
  doc.setTextColor(0);
  y += 6;
  doc.setDrawColor(200);
  doc.line(M, y, W - M, y);
  y += 8;

  if (intention.portrait) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(intention.portrait, W - 2 * M), M, y);
    y += doc.splitTextToSize(intention.portrait, W - 2 * M).length * 5.4 + 4;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Profil : ${PERSONA_LABELS[intention.persona]}`, M, y);
  doc.setTextColor(0);
  y += 8;

  const ex = intention.gardenExample;
  if (ex && !ex.refused && (ex.titre || ex.intention)) {
    page();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Le jardin qui vous ressemble', M, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const t = [ex.titre, ex.sousTitre].filter(Boolean).join(' — ');
    if (t) { doc.text(doc.splitTextToSize(t, W - 2 * M), M, y); y += 5.4; }
    if (ex.intention) {
      const lines = doc.splitTextToSize(ex.intention, W - 2 * M);
      doc.text(lines, M, y);
      y += lines.length * 5 + 1;
    }
    if (ex.keywords.length) {
      doc.setTextColor(120);
      doc.setFontSize(9);
      doc.text(ex.keywords.join(' · '), M, y);
      doc.setTextColor(0);
      y += 6;
    }
    y += 3;
  }

  const rows = buildIntentionRows(intention);
  (['Le jardin', 'Le projet'] as const).forEach((volet) => {
    const items = rows.filter((r) => r.volet === volet);
    if (items.length === 0) return;
    page();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(volet, M, y);
    y += 6;
    items.forEach((r) => {
      page();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(130);
      doc.text(doc.splitTextToSize(r.question, W - 2 * M), M, y);
      y += doc.splitTextToSize(r.question, W - 2 * M).length * 4.4;
      doc.setTextColor(0);
      doc.setFontSize(11);
      const val = r.reponse || 'À compléter';
      const lines = doc.splitTextToSize(val, W - 2 * M);
      doc.text(lines, M, y);
      y += lines.length * 5.2 + 3;
    });
    y += 4;
  });

  if (intention.gestures.length) {
    page();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Premiers gestes', M, y);
    y += 6;
    intention.gestures.forEach((g) => {
      page();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(g.title, W - 2 * M), M, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(g.detail, W - 2 * M);
      doc.text(lines, M, y);
      y += lines.length * 5 + 3;
    });
  }

  doc.save(`intention-${slugify(nom)}-${stamp()}.pdf`);
};
