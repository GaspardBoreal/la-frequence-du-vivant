import {
  Trees,
  Droplets,
  Home,
  Sprout,
  Footprints,
  StickyNote,
  Layers,
  type LucideIcon,
} from 'lucide-react';

export interface CalqueMeta {
  icon: LucideIcon;
  color: string;
  hint: string;
}

const BY_NAME: Record<string, CalqueMeta> = {
  existant: {
    icon: Trees,
    color: '#5b7f5a',
    hint: 'Ce qui est déjà là : arbres, haies, murs, bâti.',
  },
  'sol & eau': {
    icon: Droplets,
    color: '#3b7ea1',
    hint: 'Mare, noue, citerne, arrosage, modelés de terrain.',
  },
  structures: {
    icon: Home,
    color: '#8a6d3b',
    hint: 'Serre, abri, pergola, clôture, cheminements construits.',
  },
  plantations: {
    icon: Sprout,
    color: '#2f7d4f',
    hint: 'Massifs, potager, verger, couvre-sols à planter.',
  },
  circulations: {
    icon: Footprints,
    color: '#b08d57',
    hint: 'Allées, passages, accès et parcours de visite.',
  },
  annotations: {
    icon: StickyNote,
    color: '#7a4b6b',
    hint: 'Repères, notes de terrain et intentions libres.',
  },
};

const FALLBACK: CalqueMeta = {
  icon: Layers,
  color: '#6b7f76',
  hint: 'Calque libre.',
};

export const calqueMeta = (nom: string): CalqueMeta =>
  BY_NAME[(nom || '').trim().toLowerCase()] ?? FALLBACK;
