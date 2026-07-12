import { TreePine, Wheat, Beef, Sprout, Grape, Flower2, Compass, MoreHorizontal, type LucideIcon } from 'lucide-react';

export const MARCHE_CATEGORIES = [
  'arboriculture',
  'grande_culture',
  'elevage',
  'maraichage',
  'vignoble',
  'jardin',
  'exploration',
  'autre',
] as const;

export type MarcheCategory = typeof MARCHE_CATEGORIES[number];

export interface MarcheCategoryMeta {
  value: MarcheCategory;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind ring/border/bg utilities using semantic tokens */
  cardClassName: string;
  iconWrapClassName: string;
  badgeClassName: string;
  chipClassName: string;
}

const META: Record<MarcheCategory, MarcheCategoryMeta> = {
  arboriculture: {
    value: 'arboriculture',
    label: 'Arboriculture',
    shortLabel: 'Arboriculture',
    description: 'Vergers, arbres fruitiers, sylviculture douce.',
    icon: TreePine,
    cardClassName: 'border-[hsl(var(--category-arboriculture)/0.35)] bg-[hsl(var(--category-arboriculture)/0.08)]',
    iconWrapClassName: 'bg-[hsl(var(--category-arboriculture)/0.18)] text-[hsl(var(--category-arboriculture))]',
    badgeClassName: 'border-[hsl(var(--category-arboriculture)/0.4)] bg-[hsl(var(--category-arboriculture)/0.12)] text-[hsl(var(--category-arboriculture))]',
    chipClassName: 'border-[hsl(var(--category-arboriculture)/0.4)] bg-[hsl(var(--category-arboriculture)/0.12)] text-[hsl(var(--category-arboriculture))]',
  },
  grande_culture: {
    value: 'grande_culture',
    label: 'Grande culture',
    shortLabel: 'Grande culture',
    description: 'Céréales, oléagineux, cultures de plein champ.',
    icon: Wheat,
    cardClassName: 'border-[hsl(var(--category-grande-culture)/0.35)] bg-[hsl(var(--category-grande-culture)/0.08)]',
    iconWrapClassName: 'bg-[hsl(var(--category-grande-culture)/0.18)] text-[hsl(var(--category-grande-culture))]',
    badgeClassName: 'border-[hsl(var(--category-grande-culture)/0.4)] bg-[hsl(var(--category-grande-culture)/0.12)] text-[hsl(var(--category-grande-culture))]',
    chipClassName: 'border-[hsl(var(--category-grande-culture)/0.4)] bg-[hsl(var(--category-grande-culture)/0.12)] text-[hsl(var(--category-grande-culture))]',
  },
  elevage: {
    value: 'elevage',
    label: 'Élevage',
    shortLabel: 'Élevage',
    description: 'Pâturage, animaux de ferme, éleveurs.',
    icon: Beef,
    cardClassName: 'border-[hsl(var(--category-elevage)/0.35)] bg-[hsl(var(--category-elevage)/0.08)]',
    iconWrapClassName: 'bg-[hsl(var(--category-elevage)/0.18)] text-[hsl(var(--category-elevage))]',
    badgeClassName: 'border-[hsl(var(--category-elevage)/0.4)] bg-[hsl(var(--category-elevage)/0.12)] text-[hsl(var(--category-elevage))]',
    chipClassName: 'border-[hsl(var(--category-elevage)/0.4)] bg-[hsl(var(--category-elevage)/0.12)] text-[hsl(var(--category-elevage))]',
  },
  maraichage: {
    value: 'maraichage',
    label: 'Maraîchage',
    shortLabel: 'Maraîchage',
    description: 'Maraîchers sur sol vivant (MSV), légumes de saison.',
    icon: Sprout,
    cardClassName: 'border-[hsl(var(--category-maraichage)/0.35)] bg-[hsl(var(--category-maraichage)/0.08)]',
    iconWrapClassName: 'bg-[hsl(var(--category-maraichage)/0.18)] text-[hsl(var(--category-maraichage))]',
    badgeClassName: 'border-[hsl(var(--category-maraichage)/0.4)] bg-[hsl(var(--category-maraichage)/0.12)] text-[hsl(var(--category-maraichage))]',
    chipClassName: 'border-[hsl(var(--category-maraichage)/0.4)] bg-[hsl(var(--category-maraichage)/0.12)] text-[hsl(var(--category-maraichage))]',
  },
  vignoble: {
    value: 'vignoble',
    label: 'Vignoble',
    shortLabel: 'Vignoble',
    description: 'Vignerons, terroirs, viticulture vivante.',
    icon: Grape,
    cardClassName: 'border-[hsl(var(--category-vignoble)/0.35)] bg-[hsl(var(--category-vignoble)/0.08)]',
    iconWrapClassName: 'bg-[hsl(var(--category-vignoble)/0.18)] text-[hsl(var(--category-vignoble))]',
    badgeClassName: 'border-[hsl(var(--category-vignoble)/0.4)] bg-[hsl(var(--category-vignoble)/0.12)] text-[hsl(var(--category-vignoble))]',
    chipClassName: 'border-[hsl(var(--category-vignoble)/0.4)] bg-[hsl(var(--category-vignoble)/0.12)] text-[hsl(var(--category-vignoble))]',
  },
  jardin: {
    value: 'jardin',
    label: 'Jardin',
    shortLabel: 'Jardin',
    description: 'Jardins vivants, jardiniers amateurs et pédagogiques.',
    icon: Flower2,
    cardClassName: 'border-[hsl(var(--category-jardin)/0.35)] bg-[hsl(var(--category-jardin)/0.08)]',
    iconWrapClassName: 'bg-[hsl(var(--category-jardin)/0.18)] text-[hsl(var(--category-jardin))]',
    badgeClassName: 'border-[hsl(var(--category-jardin)/0.4)] bg-[hsl(var(--category-jardin)/0.12)] text-[hsl(var(--category-jardin))]',
    chipClassName: 'border-[hsl(var(--category-jardin)/0.4)] bg-[hsl(var(--category-jardin)/0.12)] text-[hsl(var(--category-jardin))]',
  },
  exploration: {
    value: 'exploration',
    label: 'Exploration',
    shortLabel: 'Exploration',
    description: 'Territoires, paysages, patrimoine — exploration sensible.',
    icon: Compass,
    cardClassName: 'border-[hsl(var(--category-exploration)/0.35)] bg-[hsl(var(--category-exploration)/0.08)]',
    iconWrapClassName: 'bg-[hsl(var(--category-exploration)/0.18)] text-[hsl(var(--category-exploration))]',
    badgeClassName: 'border-[hsl(var(--category-exploration)/0.4)] bg-[hsl(var(--category-exploration)/0.12)] text-[hsl(var(--category-exploration))]',
    chipClassName: 'border-[hsl(var(--category-exploration)/0.4)] bg-[hsl(var(--category-exploration)/0.12)] text-[hsl(var(--category-exploration))]',
  },
  autre: {
    value: 'autre',
    label: 'Autre',
    shortLabel: 'Autre',
    description: 'Format hybride ou non classé.',
    icon: MoreHorizontal,
    cardClassName: 'border-border bg-muted/30',
    iconWrapClassName: 'bg-muted text-muted-foreground',
    badgeClassName: 'border-border bg-muted text-muted-foreground',
    chipClassName: 'border-border bg-muted text-muted-foreground',
  },
};

export const getMarcheCategoryMeta = (value: string | null | undefined): MarcheCategoryMeta => {
  if (value && (MARCHE_CATEGORIES as readonly string[]).includes(value)) {
    return META[value as MarcheCategory];
  }
  return META.autre;
};

/**
 * Map Partenaires Sol Vivant category labels → our internal MarcheCategory.
 * Priority: most specific agricultural specialty wins; falls back to jardin then autre.
 */
/** Map a single Sol Vivant label to our internal category (or null if none). */
function singleLabelToCategory(label: string): MarcheCategory | null {
  const norm = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (norm.includes('arboricult')) return 'arboriculture';
  if (norm.includes('vign') || norm.includes('viticult')) return 'vignoble';
  if (norm.includes('maraich') || norm.includes('msv')) return 'maraichage';
  if (norm.includes('elevage') || norm.includes('eleveur')) return 'elevage';
  if (norm.includes('cereal') || norm.includes('grande culture')) return 'grande_culture';
  if (norm.includes('jardin')) return 'jardin';
  return null;
}

/**
 * Primary internal category for a Sol Vivant point (marker color / badge).
 * For filtering, prefer `solVivantMatchesCategories` which respects the
 * multi-category logic used by gogocarto.
 */
export function mapSolVivantToCategory(labels: string[] | null | undefined): MarcheCategory {
  if (!labels || labels.length === 0) return 'autre';
  const priority: MarcheCategory[] = ['arboriculture', 'vignoble', 'maraichage', 'elevage', 'grande_culture', 'jardin'];
  const mapped = new Set<MarcheCategory>();
  for (const l of labels) {
    const c = singleLabelToCategory(l);
    if (c) mapped.add(c);
  }
  for (const p of priority) if (mapped.has(p)) return p;
  return 'autre';
}

/**
 * True if ANY of the point's raw Sol Vivant labels maps to one of the selected
 * internal categories. Aligns with gogocarto: a point tagged both "Jardiniers"
 * and "Maraîchers (MSV)" appears in BOTH the Jardin and Maraîchage filters.
 */
export function solVivantMatchesCategories(
  labels: string[] | null | undefined,
  selected: Set<string>,
): boolean {
  if (!labels || labels.length === 0) return selected.has('autre');
  for (const l of labels) {
    const c = singleLabelToCategory(l);
    if (c && selected.has(c)) return true;
  }
  return false;
}
