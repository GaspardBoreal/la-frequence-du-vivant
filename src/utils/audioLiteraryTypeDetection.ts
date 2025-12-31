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

// Regex patterns for detecting literary types by title structure
// These patterns catch titles that follow typical literary conventions without explicit keywords

// Fable patterns: "La X et le/la Y", "Le X et la Y", etc.
const FABLE_PATTERNS: RegExp[] = [
  // "La libellule, le drone et le modèle" - pattern with comma and "et"
  /^l[ae']?\s*\w+[,\s]+l[ae']?\s*\w+.*\s+et\s+l[ae']?\s*\w+/i,
  // "La Lamproie et l'ascenseur" - simple "La X et le/la Y"
  /^l[ae']?\s*\w+\s+et\s+l[ae']?\s*\w+/i,
  // "Le papillon et le jardinier" - "Le X et le Y"
  /^le\s+\w+\s+et\s+l[ae']?\s*\w+/i,
];

// Poème patterns: titles with poetic structures
const POEME_PATTERNS: RegExp[] = [
  // "Ode à...", "Élégie pour...", "Chant de..."
  /^(ode|élégie|chant|hymne|complainte)\s+(à|de|pour|du|des)/i,
];

/**
 * Detects if a title matches fable patterns (like "La X et le Y")
 */
function matchesFablePattern(title: string): boolean {
  return FABLE_PATTERNS.some(pattern => pattern.test(title.trim()));
}

/**
 * Detects if a title matches poem patterns
 */
function matchesPoemePattern(title: string): boolean {
  return POEME_PATTERNS.some(pattern => pattern.test(title.trim()));
}

/**
 * Detects literary type from an audio title by analyzing keywords and patterns
 */
export function detectLiteraryTypeFromTitle(title: string): DetectedLiteraryType {
  const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const originalTitle = title.toLowerCase();
  
  // First: Check keywords for each literary type
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
  
  // Second: Check structural patterns (for titles without explicit keywords)
  
  // Check fable patterns like "La X et le Y"
  if (matchesFablePattern(title)) {
    const info = TEXT_TYPES_REGISTRY['fable'];
    return {
      type: 'fable',
      info,
      icon: info.icon,
      label: info.label
    };
  }
  
  // Check poem patterns
  if (matchesPoemePattern(title)) {
    const info = TEXT_TYPES_REGISTRY['poeme'];
    return {
      type: 'poeme',
      info,
      icon: info.icon,
      label: info.label
    };
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
 * NEW: Get literary type for an audio, prioritizing DB field over auto-detection
 * @param title - Audio title for auto-detection fallback
 * @param dbLiteraryType - Literary type stored in database (manual classification)
 */
export function getLiteraryTypeForAudio(
  title: string, 
  dbLiteraryType?: string | null
): DetectedLiteraryType & { isManual: boolean } {
  // Priority 1: Use manually set literary_type from DB
  if (dbLiteraryType && TEXT_TYPES_REGISTRY[dbLiteraryType as TextType]) {
    const type = dbLiteraryType as TextType;
    const info = TEXT_TYPES_REGISTRY[type];
    return { 
      type, 
      info, 
      icon: info.icon, 
      label: info.label,
      isManual: true 
    };
  }
  
  // Priority 2: Fall back to auto-detection
  const autoDetected = detectLiteraryTypeFromTitle(title);
  return { ...autoDetected, isManual: false };
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

export function getAvailableTypesFromTracks(
  tracks: { title: string; duration?: number; literary_type?: string | null }[]
): AvailableLiteraryType[] {
  const typeCounts = new Map<TextType, { count: number; totalDuration: number }>();
  
  tracks.forEach(track => {
    // Use new function that prioritizes DB literary_type
    const detected = getLiteraryTypeForAudio(track.title, track.literary_type);
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
