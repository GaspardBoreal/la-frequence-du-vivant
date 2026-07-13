/**
 * Verdicts éditoriaux Vigne / Mouton pour l'Immersion Vignoble.
 *
 * MVP heuristique basé sur `iconic_taxon` (source GBIF) — un enrichissement
 * curatif fin (par espèce) viendra ensuite via species_eco_tags_kb.
 * L'incertitude est assumée : chaque verdict porte un niveau de confiance
 * ("faible" | "moyen" | "élevé") qui pilote une mention discrète.
 */

export type VignobleAxis = 'vigne' | 'mouton';
export type VignobleVerdictTone = 'ally' | 'watch' | 'neutral' | 'threat';
export type VignobleConfidence = 'faible' | 'moyen' | 'élevé';

export interface VignobleVerdict {
  axis: VignobleAxis;
  tone: VignobleVerdictTone;
  label: string;
  detail: string;
  confidence: VignobleConfidence;
}

interface HeuristicRule {
  taxa: string[];
  vigne: Omit<VignobleVerdict, 'axis'>;
  mouton: Omit<VignobleVerdict, 'axis'>;
}

const RULES: HeuristicRule[] = [
  {
    taxa: ['Aves'],
    vigne: {
      tone: 'ally', label: 'Alliée de la vigne',
      detail: 'Régule insectes ravageurs (cicadelles, tordeuses) — présence liée aux haies et lisières.',
      confidence: 'moyen',
    },
    mouton: {
      tone: 'neutral', label: 'Compagne du troupeau',
      detail: 'Cohabite paisiblement, signale la santé des prairies pâturées.',
      confidence: 'moyen',
    },
  },
  {
    taxa: ['Mammalia'],
    vigne: {
      tone: 'ally', label: 'Utile la nuit',
      detail: 'Chauves-souris : forte consommation du papillon du ver de grappe (étude CIVB/LPO).',
      confidence: 'élevé',
    },
    mouton: {
      tone: 'neutral', label: 'Sans interaction directe',
      detail: 'Peu d\'interférence avec le troupeau.',
      confidence: 'moyen',
    },
  },
  {
    taxa: ['Insecta', 'Arachnida'],
    vigne: {
      tone: 'watch', label: 'À observer',
      detail: 'Selon l\'espèce, auxiliaire (pollinisation, prédation) ou pression (tordeuse, cicadelle).',
      confidence: 'faible',
    },
    mouton: {
      tone: 'neutral', label: 'Faune ordinaire',
      detail: 'Rarement problématique — quelques diptères piqueurs à surveiller en été.',
      confidence: 'faible',
    },
  },
  {
    taxa: ['Plantae'],
    vigne: {
      tone: 'ally', label: 'Enherbement vivant',
      detail: 'Structure le sol, nourrit la microfaune, tempère l\'hydrométrie — atout enherbement.',
      confidence: 'moyen',
    },
    mouton: {
      tone: 'ally', label: 'Fourrage naturel',
      detail: 'Ressource alimentaire pour les brebis lors du pâturage d\'octobre à avril.',
      confidence: 'élevé',
    },
  },
  {
    taxa: ['Fungi'],
    vigne: {
      tone: 'watch', label: 'Sol vivant — vigilance',
      detail: 'Décomposeurs essentiels ; à distinguer des pathogènes cryptogamiques.',
      confidence: 'faible',
    },
    mouton: {
      tone: 'neutral', label: 'Rôle indirect',
      detail: 'Améliorent la fertilité des prairies pâturées.',
      confidence: 'moyen',
    },
  },
  {
    taxa: ['Reptilia', 'Amphibia'],
    vigne: {
      tone: 'ally', label: 'Alliée discrète',
      detail: 'Lézards et couleuvres régulent limaces et insectes — indicateurs de zones peu perturbées.',
      confidence: 'moyen',
    },
    mouton: {
      tone: 'neutral', label: 'Cohabitation paisible',
      detail: 'Aucune interaction problématique documentée.',
      confidence: 'moyen',
    },
  },
];

const NEUTRAL: Omit<VignobleVerdict, 'axis'> = {
  tone: 'neutral', label: 'À documenter',
  detail: 'Verdict à préciser — donnée en cours de curation.',
  confidence: 'faible',
};

export function getVerdict(iconic_taxon: string | null, axis: VignobleAxis): VignobleVerdict {
  const rule = RULES.find((r) => iconic_taxon && r.taxa.includes(iconic_taxon));
  const base = rule ? rule[axis] : NEUTRAL;
  return { axis, ...base };
}

export const TONE_STYLES: Record<VignobleVerdictTone, { chip: string; dot: string }> = {
  ally: {
    chip: 'bg-[hsl(var(--vignoble-gold)/0.18)] text-[hsl(var(--vignoble-ink))] border-[hsl(var(--vignoble-gold)/0.55)]',
    dot: 'bg-[hsl(var(--vignoble-gold))]',
  },
  watch: {
    chip: 'bg-[hsl(var(--vignoble-wine)/0.10)] text-[hsl(var(--vignoble-wine))] border-[hsl(var(--vignoble-wine)/0.45)]',
    dot: 'bg-[hsl(var(--vignoble-wine))]',
  },
  neutral: {
    chip: 'bg-[hsl(var(--vignoble-ink)/0.06)] text-[hsl(var(--vignoble-ink)/0.7)] border-[hsl(var(--vignoble-ink)/0.15)]',
    dot: 'bg-[hsl(var(--vignoble-ink)/0.4)]',
  },
  threat: {
    chip: 'bg-[hsl(var(--vignoble-wine)/0.18)] text-[hsl(var(--vignoble-wine))] border-[hsl(var(--vignoble-wine)/0.6)]',
    dot: 'bg-[hsl(var(--vignoble-wine))]',
  },
};
