import type { LucideIcon } from 'lucide-react';
import { BookOpenText, Sprout, Trees } from 'lucide-react';

export const MARCHE_EVENT_TYPES = [
  'agroecologique',
  'eco_poetique',
  'eco_tourisme',
] as const;

export type MarcheEventType = (typeof MARCHE_EVENT_TYPES)[number];

type MarcheEventTypeMeta = {
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  description: string;
  badgeClassName: string;
  cardClassName: string;
  iconWrapClassName: string;
};

export const marcheEventTypeMeta: Record<MarcheEventType, MarcheEventTypeMeta> = {
  agroecologique: {
    icon: Sprout,
    label: 'Marche agroécologique',
    shortLabel: 'Agroécologique',
    description: 'Un protocole d’observation technique, orienté sols, cultures, biodiversité et pratiques de terrain.',
    badgeClassName: 'border-primary/20 bg-primary/10 text-primary',
    cardClassName: 'border-primary/30 bg-primary/5',
    iconWrapClassName: 'bg-primary/10 text-primary',
  },
  eco_poetique: {
    icon: BookOpenText,
    label: 'Marche éco poétique',
    shortLabel: 'Éco poétique',
    description: 'Un parcours sensible et littéraire, centré sur l’écoute, l’écriture, l’imaginaire et la relation au vivant.',
    badgeClassName: 'border-secondary/30 bg-secondary text-secondary-foreground',
    cardClassName: 'border-secondary/40 bg-secondary/40',
    iconWrapClassName: 'bg-secondary text-secondary-foreground',
  },
  eco_tourisme: {
    icon: Trees,
    label: 'Marche éco tourisme',
    shortLabel: 'Éco tourisme',
    description: 'Un format de découverte patrimoniale, paysagère et territoriale, pensé pour la transmission et l’exploration.',
    badgeClassName: 'border-accent/30 bg-accent text-accent-foreground',
    cardClassName: 'border-accent/50 bg-accent/40',
    iconWrapClassName: 'bg-accent text-accent-foreground',
  },
};

export const getMarcheEventTypeMeta = (type?: string | null) => {
  if (!type || !(type in marcheEventTypeMeta)) {
    return null;
  }

  return marcheEventTypeMeta[type as MarcheEventType];
};