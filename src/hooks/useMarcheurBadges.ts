import { useMemo } from 'react';
import {
  Eye, Headphones, Feather, Quote, Sparkles, Leaf, ShieldAlert, ShieldCheck,
  MapPin, Compass, Flower2, Flame, type LucideIcon,
} from 'lucide-react';
import type { MarcheurWithStats } from '@/hooks/useExplorationParticipants';
import type { SensibleBuckets } from '@/lib/speciesClassification';

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind text color token for the icon (HSL via DS) */
  color: string;
  unlocked: boolean;
  progress: number; // 0..1
  /** Human-readable next-step hint when locked */
  hint?: string;
  /** Order: rare badges first */
  weight: number;
}

export interface BadgesResult {
  badges: BadgeDef[];
  unlockedCount: number;
  nextBadge: BadgeDef | null; // closest to unlock, locked
}

interface ComputeArgs {
  marcheur: MarcheurWithStats;
  sensible: SensibleBuckets;
  pioneerCount: number;
  taxonomicFamilies: number;
  hasTemoignage: boolean;
}

export function useMarcheurBadges(args: ComputeArgs): BadgesResult {
  const { marcheur, sensible, pioneerCount, taxonomicFamilies, hasTemoignage } = args;

  return useMemo(() => {
    const s = marcheur.stats;
    const def = (
      id: string, label: string, description: string, icon: LucideIcon, color: string,
      current: number, target: number, weight: number, hintTpl?: (remaining: number) => string,
    ): BadgeDef => {
      const progress = Math.min(current / target, 1);
      const unlocked = current >= target;
      const remaining = Math.max(target - current, 0);
      return {
        id, label, description, icon, color, weight,
        unlocked, progress,
        hint: unlocked ? undefined : (hintTpl ? hintTpl(remaining) : `Plus que ${remaining} pour débloquer`),
      };
    };

    const badges: BadgeDef[] = [
      def('oeil', 'Œil du Vivant', '1ère photo', Eye, 'text-sky-500',
        s.photos, 1, 1, () => 'Postez votre 1ère photo'),
      def('voix', 'Voix du Vivant', '1er audio', Headphones, 'text-purple-500',
        s.sons, 1, 2, () => 'Enregistrez votre 1er son'),
      def('plume', 'Plume du Vivant', '1er texte', Feather, 'text-amber-500',
        s.textes, 1, 2, () => 'Écrivez votre 1er texte'),
      def('temoin', 'Témoin du Vivant', '1er témoignage', Quote, 'text-rose-500',
        hasTemoignage ? 1 : 0, 1, 2, () => 'Partagez votre témoignage'),
      def('quintessence', 'Quintessence', 'Toutes les voies du vivant',
        Sparkles, 'text-yellow-500',
        [s.photos > 0, s.sons > 0, s.textes > 0, hasTemoignage, s.speciesCount > 0].filter(Boolean).length,
        5, 5, (r) => `Couvrez ${r} pilier${r > 1 ? 's' : ''} en plus`),
      def('lecteur', 'Lecteur de milieu', '3 bio-indicateurs détectés',
        Leaf, 'text-emerald-500',
        sensible.bioIndicateurs.length, 3, 4,
        (r) => `${r} bio-indicateur${r > 1 ? 's' : ''} de plus`),
      def('allie', 'Allié du vivant', '5 auxiliaires détectés',
        Flower2, 'text-amber-500',
        sensible.auxiliaires.length, 5, 4,
        (r) => `${r} auxiliaire${r > 1 ? 's' : ''} de plus`),
      def('sentinelle', 'Sentinelle vigilante', '1 EEE signalée',
        ShieldAlert, 'text-rose-500',
        sensible.eee.length, 1, 5, () => 'Signalez 1 espèce exotique envahissante'),
      def('garde', 'Garde-frontière', '5 EEE signalées',
        ShieldCheck, 'text-rose-600',
        sensible.eee.length, 5, 6,
        (r) => `${r} EEE de plus`),
      def('pionnier', 'Pionnier', '1 territoire pionnier',
        MapPin, 'text-amber-500',
        pioneerCount, 1, 3, () => 'Marchez sur un territoire vierge'),
      def('cartographe', 'Cartographe', '5 territoires pionniers',
        Compass, 'text-orange-500',
        pioneerCount, 5, 5,
        (r) => `${r} territoire${r > 1 ? 's' : ''} pionnier${r > 1 ? 's' : ''} de plus`),
      def('polyglotte', 'Polyglotte du vivant', '5 familles taxonomiques',
        Flame, 'text-emerald-600',
        taxonomicFamilies, 5, 4,
        (r) => `${r} famille${r > 1 ? 's' : ''} de plus`),
    ];

    const sorted = [...badges].sort((a, b) => {
      // Unlocked first, then by weight desc
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return b.weight - a.weight;
    });

    const lockedSorted = badges.filter(b => !b.unlocked).sort((a, b) => b.progress - a.progress);
    const nextBadge = lockedSorted[0] || null;

    return {
      badges: sorted,
      unlockedCount: badges.filter(b => b.unlocked).length,
      nextBadge,
    };
  }, [marcheur, sensible, pioneerCount, taxonomicFamilies, hasTemoignage]);
}
