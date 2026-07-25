import type { ObserveBlock, ObserveBlockId } from './observeConfig';

const labelsOf = (block: ObserveBlock, values: string[]): string[] =>
  values
    .map((v) => block.choices.find((c) => c.value === v)?.label)
    .filter((s): s is string => !!s);

const humanJoin = (items: string[]): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} et ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
};

const TEMPLATES: Partial<Record<ObserveBlockId, (labels: string[]) => string>> = {
  context: (l) =>
    l.length ? `Le site s'inscrit dans un contexte ${humanJoin(l.map((x) => x.toLowerCase()))}.` : '',
  relief: (l) =>
    l.length ? `Le terrain se présente ${humanJoin(l.map((x) => x.toLowerCase()))}.` : '',
  sun: (l) =>
    l.length
      ? `Les ombres portées proviennent de ${humanJoin(l.map((x) => x.toLowerCase()))}.`
      : '',
  wind: (l) =>
    l.length
      ? `Le vent est filtré ou dévié par ${humanJoin(l.map((x) => x.toLowerCase()))}.`
      : '',
  water: (l) =>
    l.length ? `L'eau se manifeste par ${humanJoin(l.map((x) => x.toLowerCase()))}.` : '',
  vegetation: (l) =>
    l.length
      ? `La végétation observée est ${humanJoin(l.map((x) => x.toLowerCase()))}.`
      : '',
  terrain: (l) =>
    l.length
      ? `Le terrain subit ${humanJoin(l.map((x) => x.toLowerCase()))}.`
      : '',
};

export function describeBlock(block: ObserveBlock, values: string[]): string {
  const labels = labelsOf(block, values);
  const tpl = TEMPLATES[block.id];
  if (tpl) {
    const s = tpl(labels);
    if (s) return s;
  }
  if (labels.length === 0) return 'Aucun élément particulier retenu.';
  return `Choix retenus : ${humanJoin(labels.map((x) => x.toLowerCase()))}.`;
}

export const RISK_VALUES = new Set<string>([
  'pollution',
  'tassement',
  'secheresse',
  'sel',
  'inondation',
  'vent_salin',
  'pietinement',
  'erosion',
]);

export const hasRisk = (values: string[]): boolean =>
  values.some((v) => RISK_VALUES.has(v));

export const riskLabels = (block: ObserveBlock, values: string[]): string[] =>
  labelsOf(
    block,
    values.filter((v) => RISK_VALUES.has(v))
  );
