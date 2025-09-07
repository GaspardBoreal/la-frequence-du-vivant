/**
 * Scientific utility for extracting and validating publication years from sources
 */

export interface SourceWithYear {
  id: string;
  nom: string;
  url: string;
  description?: string;
  year?: number;
  yearDisplay: string;
}

/**
 * Check if a year is plausible (between 1900 and next year)
 */
export const isPlausibleYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear + 1;
};

/**
 * Extract years from text using robust regex
 */
export const extractYearsFromText = (text: string): number[] => {
  if (!text) return [];
  
  // Regex to match 4-digit years (19xx or 20xx) not part of larger numbers
  const yearRegex = /(?<![0-9])(19[0-9]{2}|20[0-9]{2})(?![0-9])/g;
  const matches = text.match(yearRegex);
  
  if (!matches) return [];
  
  return matches
    .map(match => parseInt(match, 10))
    .filter(year => isPlausibleYear(year))
    .sort((a, b) => b - a); // Most recent first
};

/**
 * Extract year from URL with validation
 */
export const extractYearFromUrl = (url: string): number | null => {
  if (!url) return null;
  
  const years = extractYearsFromText(url);
  return years.length > 0 ? years[0] : null;
};

/**
 * Normalize year from source data with hierarchical extraction
 */
export const normalizeYearFromSource = (source: any): SourceWithYear => {
  let year: number | null = null;
  
  // 1. Priority: explicit date fields
  if (source.date || source.annee || source.year) {
    const dateField = source.date || source.annee || source.year;
    if (typeof dateField === 'number' && isPlausibleYear(dateField)) {
      year = dateField;
    } else if (typeof dateField === 'string') {
      const extractedYears = extractYearsFromText(dateField);
      if (extractedYears.length > 0) {
        year = extractedYears[0];
      }
    }
  }
  
  // 2. Secondary: description metadata
  if (!year && source.description) {
    const extractedYears = extractYearsFromText(source.description);
    if (extractedYears.length > 0) {
      year = extractedYears[0];
    }
  }
  
  // 3. Last resort: URL analysis (with strict validation)
  if (!year && source.url) {
    year = extractYearFromUrl(source.url);
  }
  
  return {
    id: source.id || 'unknown',
    nom: source.nom || source.name || `Source ${source.id}`,
    url: source.url || 'URL non disponible',
    description: source.description || 'Détails non disponibles',
    year: year || undefined,
    yearDisplay: year ? year.toString() : 'inconnue'
  };
};

/**
 * Collect available years from sources for filtering
 */
export const collectAvailableYears = (sources: SourceWithYear[]): string[] => {
  const years = new Set<string>();
  
  sources.forEach(source => {
    if (source.year) {
      years.add(source.year.toString());
    }
  });
  
  const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  
  // Add "inconnue" option if there are sources without years
  const hasUnknownYears = sources.some(source => !source.year);
  if (hasUnknownYears) {
    sortedYears.push('inconnue');
  }
  
  return sortedYears;
};

/**
 * Generate short name for source display
 */
export const generateShortName = (source: SourceWithYear): string => {
  if (source.nom && source.nom !== `Source ${source.id}`) {
    return source.nom;
  }
  
  if (source.url && source.url !== 'URL non disponible') {
    try {
      const hostname = new URL(source.url).hostname.replace('www.', '');
      
      // Common mapping for better display names
      const domainMap: Record<string, string> = {
        'wikipedia.org': 'Wikipédia',
        'fr.wikipedia.org': 'Wikipédia',
        'en.wikipedia.org': 'Wikipedia EN',
        'patrimoine-nouvelle-aquitaine.fr': 'Patrimoine NA',
        'data.gouv.fr': 'Data.gouv',
        'ign.fr': 'IGN',
        'insee.fr': 'INSEE',
        'inpn.mnhn.fr': 'INPN',
        'gbif.org': 'GBIF'
      };
      
      return domainMap[hostname] || hostname.split('.')[0];
    } catch {
      return source.id;
    }
  }
  
  return source.id;
};

/**
 * Format sources summary for display
 */
export const formatSourcesSummary = (sources: SourceWithYear[], maxDisplay: number = 2): string => {
  if (sources.length === 0) return 'Aucune source';
  
  const shortNames = sources.map(source => generateShortName(source));
  
  if (sources.length <= maxDisplay) {
    return shortNames.join(', ');
  }
  
  const displayed = shortNames.slice(0, maxDisplay);
  const remaining = sources.length - maxDisplay;
  
  return `${displayed.join(', ')} + ${remaining} autre${remaining > 1 ? 's' : ''}`;
};