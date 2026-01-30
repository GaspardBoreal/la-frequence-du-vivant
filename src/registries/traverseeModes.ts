// ============================================================================
// TRAVERSEE MODES REGISTRY
// ============================================================================

import { Activity, Orbit, Stars, Clock, Music, Link2 } from 'lucide-react';
import type { TraverseeMode } from './types';
import PoeticSeismograph from '@/components/admin/PoeticSeismograph';
import LivingIndex from '@/components/admin/LivingIndex';

export const TRAVERSEE_MODES_REGISTRY: TraverseeMode[] = [
  {
    id: 'seismograph',
    label: 'Sismographe Poétique',
    icon: Activity,
    description: 'Visualisation EKG de l\'intensité poétique par lieu et mouvement',
    component: PoeticSeismograph,
    category: 'visualisation',
    requiredData: ['textes'],
  },
  {
    id: 'living-index',
    label: 'Index Vivant',
    icon: Orbit,
    description: 'Cosmographie orbitale des 7 mondes thématiques',
    component: LivingIndex,
    category: 'index',
    requiredData: ['textes'],
  },
];

// Modes futurs (placeholders pour démonstration de l'extensibilité)
export const FUTURE_TRAVERSEE_MODES: Omit<TraverseeMode, 'component'>[] = [
  {
    id: 'constellation',
    label: 'Constellation Textuelle',
    icon: Stars,
    description: 'Liens sémantiques entre textes',
    category: 'visualisation',
    requiredData: ['textes'],
    badge: 'beta',
  },
  {
    id: 'flux-temporel',
    label: 'Flux Temporel',
    icon: Clock,
    description: 'Timeline poétique animée',
    category: 'immersion',
    requiredData: ['textes', 'marches'],
    badge: 'new',
  },
  {
    id: 'cartographie-sonore',
    label: 'Cartographie Sonore',
    icon: Music,
    description: 'Visualisation audio des marches',
    category: 'visualisation',
    requiredData: ['textes', 'audio'],
    badge: 'experimental',
  },
  {
    id: 'resonances',
    label: 'Résonances',
    icon: Link2,
    description: 'Connexions inter-textes par mots-clés partagés',
    category: 'index',
    requiredData: ['textes'],
    badge: 'beta',
  },
];

export const getTraverseeMode = (id: string): TraverseeMode | undefined => {
  return TRAVERSEE_MODES_REGISTRY.find(m => m.id === id);
};

export const getTraverseeModesByCategory = (category: TraverseeMode['category']): TraverseeMode[] => {
  return TRAVERSEE_MODES_REGISTRY.filter(m => m.category === category);
};
