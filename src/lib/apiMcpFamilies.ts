import { Leaf, Mountain, Sparkles, Network } from 'lucide-react';
import biodivHero from '@/assets/api-mcp/family-biodiversity.jpg';
import territoryHero from '@/assets/api-mcp/family-territory.jpg';
import aiHero from '@/assets/api-mcp/family-ai.jpg';
import infraHero from '@/assets/api-mcp/family-infra.jpg';

export type ApiFamily = 'biodiversity' | 'territory' | 'ai' | 'infra';

export const FAMILY_META: Record<ApiFamily, {
  label: string;
  tagline: string;
  icon: typeof Leaf;
  hero: string;
  accent: string;
  glow: string;
}> = {
  biodiversity: {
    label: 'Biodiversité',
    tagline: 'Les voix du vivant',
    icon: Leaf,
    hero: biodivHero,
    accent: 'from-emerald-500/30 to-emerald-700/10',
    glow: 'shadow-[0_0_60px_-15px_rgba(45,212,168,0.4)]',
  },
  territory: {
    label: 'Territoire & climat',
    tagline: 'Le souffle des paysages',
    icon: Mountain,
    hero: territoryHero,
    accent: 'from-teal-500/30 to-emerald-700/10',
    glow: 'shadow-[0_0_60px_-15px_rgba(20,184,166,0.4)]',
  },
  ai: {
    label: 'Intelligence & génération',
    tagline: 'L\'intelligence en dialogue',
    icon: Sparkles,
    hero: aiHero,
    accent: 'from-cyan-500/30 to-emerald-700/10',
    glow: 'shadow-[0_0_60px_-15px_rgba(34,211,238,0.4)]',
  },
  infra: {
    label: 'Infrastructure & automation',
    tagline: 'Le cœur invisible',
    icon: Network,
    hero: infraHero,
    accent: 'from-amber-400/20 to-emerald-700/10',
    glow: 'shadow-[0_0_60px_-15px_rgba(251,191,36,0.3)]',
  },
};

export const FAMILY_ORDER: ApiFamily[] = ['biodiversity', 'territory', 'ai', 'infra'];
