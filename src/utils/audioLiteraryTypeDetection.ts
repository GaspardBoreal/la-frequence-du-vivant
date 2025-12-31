// Utility to detect literary type from audio title
import { TEXT_TYPES_REGISTRY, TextType, TextTypeInfo } from '@/types/textTypes';

export interface DetectedLiteraryType {
  type: TextType | null;
  info: TextTypeInfo | null;
  icon: string;
  label: string;
}

// Keywords to detect literary types from audio titles
const LITERARY_TYPE_KEYWORDS: Record<TextType, string[]> = {
  haiku: ['haiku', 'haïku', 'haïkus', 'haikus'],
  senryu: ['senryu', 'senryū'],
  haibun: ['haibun', 'haïbun'],
  poeme: ['poème', 'poeme', 'poésie', 'poesie', 'poétique'],
  'texte-libre': ['texte libre', 'texte-libre'],
  'essai-bref': ['essai', 'réflexion'],
  'dialogue-polyphonique': ['dialogue', 'polyphonique', 'conversation'],
  fable: ['fable', 'fables', 'conte', 'récit'],
  fragment: ['fragment', 'extrait'],
  'carte-poetique': ['carte', 'cartographie'],
  prose: ['prose'],
  carnet: ['carnet', 'notes', 'terrain'],
  correspondance: ['correspondance', 'lettre', 'courrier'],
  manifeste: ['manifeste'],
  glossaire: ['glossaire', 'lexique', 'vocabulaire'],
  protocole: ['protocole'],
  synthese: ['synthèse', 'synthese'],
  'recit-donnees': ['données', 'data', 'récit-données']
};

/**
 * Detects literary type from an audio title by analyzing keywords
 */
export function detectLiteraryTypeFromTitle(title: string): DetectedLiteraryType {
  const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const originalTitle = title.toLowerCase();
  
  // Check each literary type for matching keywords
  for (const [typeKey, keywords] of Object.entries(LITERARY_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      if (normalizedTitle.includes(normalizedKeyword) || originalTitle.includes(keyword)) {
        const type = typeKey as TextType;
        const info = TEXT_TYPES_REGISTRY[type];
        return {
          type,
          info,
          icon: info.icon,
          label: info.label
        };
      }
    }
  }
  
  // Default: unknown type
  return {
    type: null,
    info: null,
    icon: '🎧',
    label: 'Audio'
  };
}

/**
 * Gets a compact badge representation for display
 */
export function getLiteraryTypeBadge(title: string): { icon: string; label: string; color: string } {
  const detected = detectLiteraryTypeFromTitle(title);
  
  // Color based on family
  let color = 'bg-muted text-muted-foreground';
  if (detected.info) {
    switch (detected.info.family) {
      case 'poetique':
        color = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
        break;
      case 'narrative':
        color = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        break;
      case 'terrain':
        color = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        break;
      case 'hybride':
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        break;
    }
  }
  
  return {
    icon: detected.icon,
    label: detected.label,
    color
  };
}

/**
 * Analyzes a list of audio tracks and returns available literary types with counts
 */
export interface AvailableLiteraryType {
  type: TextType;
  info: TextTypeInfo;
  count: number;
  totalDuration: number;
}

export function getAvailableTypesFromTracks(tracks: { title: string; duration?: number }[]): AvailableLiteraryType[] {
  const typeCounts = new Map<TextType, { count: number; totalDuration: number }>();
  
  tracks.forEach(track => {
    const detected = detectLiteraryTypeFromTitle(track.title);
    if (detected.type && detected.info) {
      const existing = typeCounts.get(detected.type) || { count: 0, totalDuration: 0 };
      typeCounts.set(detected.type, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + (track.duration || 0)
      });
    }
  });
  
  // Convert to array and sort by count (descending)
  return Array.from(typeCounts.entries())
    .map(([type, { count, totalDuration }]) => ({
      type,
      info: TEXT_TYPES_REGISTRY[type],
      count,
      totalDuration
    }))
    .sort((a, b) => b.count - a.count);
}
