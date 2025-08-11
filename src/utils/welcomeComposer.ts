// Generates a data-driven, mobile-first welcome composition for an exploration experience
// The composition is stored in narrative_sessions.context.welcome_composition
// and rendered by ExperienceWelcomeAdaptive.

import type { Exploration, ExplorationMarcheComplete } from '@/hooks/useExplorations';

export type WelcomeVariant = 'media-mosaic' | 'audio-first' | 'map-first' | 'story-cover';

export interface WelcomeComposition {
  variant: WelcomeVariant;
  title: string;
  subtitle?: string;
  theme?: {
    // semantic tokens or hints for theming - consumers translate to actual styles
    accent?: string; // e.g. 'primary', 'emerald', etc. (semantic hint only)
  };
  stats: {
    marches: number;
    photos: number;
    audio: number;
    videos: number;
    tags: string[];
    regions: string[];
  };
  media?: {
    photos?: Array<{ url: string; alt: string }>; // used by media-mosaic/story-cover
    audioSample?: { url: string; title?: string } | null; // used by audio-first
  };
  cta: { label: string; action: 'start' };
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function buildWelcomeComposition(
  exploration: Exploration,
  marches: ExplorationMarcheComplete[],
  opts?: { marcheViewModel?: string }
): WelcomeComposition {
  const photos = marches.flatMap(m => m.marche?.photos || []);
  const audio = marches.flatMap(m => m.marche?.audio || []);
  const videos = marches.flatMap(m => m.marche?.videos || []);
  const tags = unique(
    marches.flatMap(m => (m.marche?.tags || []).map(t => t.tag)).filter(Boolean) as string[]
  ).slice(0, 8);
  const regions = unique(
    marches.map(m => m.marche?.region).filter(Boolean) as string[]
  ).slice(0, 4);

  const photosCount = photos.length;
  const audioCount = audio.length;
  const videosCount = videos.length;
  const marchesCount = marches.length;

  // Heuristic: pick an adaptive variant based on content richness
  let variant: WelcomeVariant = 'story-cover';
  if (audioCount >= 3) variant = 'audio-first';
  else if (photosCount >= 6) variant = 'media-mosaic';
  else if (marchesCount >= 3) variant = 'map-first';

  // Prepare media payload
  const mediaPhotos = photos
    .slice(0, variant === 'media-mosaic' ? 8 : 3)
    .map((p) => ({ url: p.url_supabase, alt: p.titre || p.description || exploration.name }));

  const audioSample = audio.length > 0 ? { url: audio[0].url_supabase, title: audio[0].titre || undefined } : null;

  const composition: WelcomeComposition = {
    variant,
    title: exploration.name,
    subtitle: exploration.description || undefined,
    theme: { accent: 'primary' },
    stats: {
      marches: marchesCount,
      photos: photosCount,
      audio: audioCount,
      videos: videosCount,
      tags,
      regions,
    },
    media: {
      photos: mediaPhotos,
      audioSample,
    },
    cta: { label: 'Commencer', action: 'start' },
  };

  return composition;
}
