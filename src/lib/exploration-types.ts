export type ExplorationType = 'agroecologique' | 'eco_poetique' | 'eco_tourisme';

type ExplorationTypeMeta = {
  label: string;
  shortLabel: string;
  description: string;
  protocolHint: string;
  badgeClassName: string;
  surfaceClassName: string;
};

export const EXPLORATION_TYPE_OPTIONS: Array<{ value: ExplorationType; label: string }> = [
  { value: 'agroecologique', label: 'Marches agroécologiques' },
  { value: 'eco_poetique', label: 'Marches éco poétiques' },
  { value: 'eco_tourisme', label: 'Marches éco tourisme' },
];

export const EXPLORATION_TYPE_META: Record<ExplorationType, ExplorationTypeMeta> = {
  agroecologique: {
    label: 'Marche agroécologique',
    shortLabel: 'Agroécologique',
    description: 'Pour les parcours très techniques, orientés terrain, données, biodiversité et protocoles d’observation.',
    protocolHint: 'Protocole technique · sols, espèces, bioacoustique, lecture agroécologique du territoire.',
    badgeClassName: 'border-primary/20 bg-primary/10 text-primary',
    surfaceClassName: 'border-primary/20 bg-primary/10',
  },
  eco_poetique: {
    label: 'Marche éco poétique',
    shortLabel: 'Éco poétique',
    description: 'Pour les explorations littéraires, sensibles et géopoétiques centrées sur les textes, voix et imaginaires.',
    protocolHint: 'Protocole littéraire · textes, voix, géopoétique et expérience sensible.',
    badgeClassName: 'border-accent/20 bg-accent/15 text-accent-foreground',
    surfaceClassName: 'border-accent/20 bg-accent/10',
  },
  eco_tourisme: {
    label: 'Marche éco tourisme',
    shortLabel: 'Éco tourisme',
    description: 'Pour les parcours patrimoine, découverte, médiation culturelle et mise en récit des lieux.',
    protocolHint: 'Protocole patrimoine · médiation, paysages, histoire locale et découverte.',
    badgeClassName: 'border-secondary/30 bg-secondary text-secondary-foreground',
    surfaceClassName: 'border-secondary/30 bg-secondary/70',
  },
};

export const getExplorationTypeMeta = (type?: ExplorationType | null) => {
  if (!type) {
    return {
      label: 'Type non défini',
      shortLabel: 'Non défini',
      description: 'Le protocole de cette exploration n’a pas encore été renseigné.',
      protocolHint: 'Définissez un type sur la fiche exploration pour clarifier le protocole associé.',
      badgeClassName: 'border-border bg-muted text-muted-foreground',
      surfaceClassName: 'border-border bg-muted/50',
    } satisfies ExplorationTypeMeta;
  }

  return EXPLORATION_TYPE_META[type];
};