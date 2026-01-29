import type { TexteExport } from './epubExportUtils';

// ============================================================================
// TYPES
// ============================================================================

export interface EpubMetadataSuggestion {
  title: string;
  subtitle: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'contextual' | 'ai';
}

export interface TexteAnalysis {
  totalTextes: number;
  uniqueLieux: string[];
  uniqueParties: Array<{
    titre: string;
    numeroRomain?: string;
    sousTitre?: string;
  }>;
  typesDistribution: Record<string, number>;
  dominantType: string;
  dominantTypeCount: number;
  region: string;
  dateRange?: { start: string; end: string };
}

// ============================================================================
// TEXT TYPE LABELS (French)
// ============================================================================

const TEXT_TYPE_LABELS: Record<string, string> = {
  haiku: 'haïkus',
  senryu: 'senryūs',
  haibun: 'haïbuns',
  poeme: 'poèmes',
  'texte-libre': 'textes libres',
  'essai-bref': 'essais brefs',
  'dialogue-polyphonique': 'dialogues polyphoniques',
  fable: 'fables',
  fragment: 'fragments',
  'carte-poetique': 'cartes poétiques',
  prose: 'proses',
  carnet: 'carnets de terrain',
  correspondance: 'correspondances',
  manifeste: 'manifestes',
  glossaire: 'glossaires poétiques',
  protocole: 'protocoles hybrides',
  synthese: 'synthèses',
  'recit-donnees': 'récits-données',
  recit: 'récits',
};

const getTypeLabel = (type: string): string => {
  return TEXT_TYPE_LABELS[type.toLowerCase()] || type;
};

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

export function analyzeTextes(textes: TexteExport[]): TexteAnalysis {
  if (textes.length === 0) {
    return {
      totalTextes: 0,
      uniqueLieux: [],
      uniqueParties: [],
      typesDistribution: {},
      dominantType: '',
      dominantTypeCount: 0,
      region: 'France',
    };
  }

  // Extract unique locations (only count cities, not market names to avoid duplicates)
  const lieuxSet = new Set<string>();
  textes.forEach(t => {
    if (t.marche_ville) lieuxSet.add(t.marche_ville);
  });
  const uniqueLieux = Array.from(lieuxSet);

  // Extract unique parties (movements)
  const partiesMap = new Map<string, { titre: string; numeroRomain?: string; sousTitre?: string }>();
  textes.forEach(t => {
    if (t.partie_titre && !partiesMap.has(t.partie_titre)) {
      partiesMap.set(t.partie_titre, {
        titre: t.partie_titre,
        numeroRomain: t.partie_numero_romain,
        sousTitre: t.partie_sous_titre,
      });
    }
  });
  const uniqueParties = Array.from(partiesMap.values());

  // Type distribution
  const typesDistribution: Record<string, number> = {};
  textes.forEach(t => {
    const type = t.type_texte?.toLowerCase() || 'autre';
    typesDistribution[type] = (typesDistribution[type] || 0) + 1;
  });

  // Find dominant type
  let dominantType = '';
  let dominantTypeCount = 0;
  Object.entries(typesDistribution).forEach(([type, count]) => {
    if (count > dominantTypeCount) {
      dominantType = type;
      dominantTypeCount = count;
    }
  });

  // Detect region (first found)
  const region = textes.find(t => t.marche_region)?.marche_region || 'Nouvelle-Aquitaine';

  // Date range
  const dates = textes
    .filter(t => t.marche_date)
    .map(t => t.marche_date!)
    .sort();
  
  const dateRange = dates.length > 0 
    ? { start: dates[0], end: dates[dates.length - 1] }
    : undefined;

  return {
    totalTextes: textes.length,
    uniqueLieux,
    uniqueParties,
    typesDistribution,
    dominantType,
    dominantTypeCount,
    region,
    dateRange,
  };
}

// ============================================================================
// POETIC PHRASES LIBRARY
// ============================================================================

const GEOGRAPHIC_PHRASES: Record<string, string[]> = {
  'Dordogne': [
    'le long de la Dordogne',
    'des méandres de la Dordogne',
    'de l\'estuaire aux sources',
    'du Bec d\'Ambès au Puy de Sancy',
  ],
  'Nouvelle-Aquitaine': [
    'en Nouvelle-Aquitaine',
    'des terres aquitaines',
    'entre océan et montagne',
  ],
  'default': [
    'en chemin',
    'sur les sentiers',
    'à travers les paysages',
  ],
};

const TYPE_ACCROCHES: Record<string, string[]> = {
  haiku: [
    'instants de rivière',
    'éclats de nature captés',
    'fragments de marche',
  ],
  fable: [
    'dialogues du vivant',
    'récits d\'un monde hybride',
    'voix de la rivière',
  ],
  manifeste: [
    'écritures engagées',
    'textes de conviction',
    'manifestes du réel',
  ],
  poeme: [
    'explorations poétiques',
    'chemins de mots',
    'paysages intérieurs',
  ],
  default: [
    'textes de marche',
    'carnets poétiques',
    'explorations sensibles',
  ],
};

// ============================================================================
// CONTEXTUAL METADATA GENERATOR
// ============================================================================

export function generateContextualMetadata(
  textes: TexteExport[],
  explorationName?: string
): EpubMetadataSuggestion {
  const analysis = analyzeTextes(textes);
  
  if (analysis.totalTextes === 0) {
    return {
      title: explorationName || 'Recueil Poétique',
      subtitle: 'En attente de textes',
      description: 'Sélectionnez des textes pour générer des métadonnées.',
      confidence: 'low',
      source: 'contextual',
    };
  }

  let title: string;
  let subtitle: string;
  let description: string;
  let confidence: 'high' | 'medium' | 'low';

  // === TITLE GENERATION ===
  
  // Case 1: Single partie (movement) → Use partie title
  if (analysis.uniqueParties.length === 1) {
    const partie = analysis.uniqueParties[0];
    title = partie.titre;
    confidence = 'high';
  }
  // Case 2: Single location → Use location name
  else if (analysis.uniqueLieux.length === 1) {
    const lieu = analysis.uniqueLieux[0];
    title = `${lieu} — Carnet poétique`;
    confidence = 'high';
  }
  // Case 3: Single dominant type (>80% of content)
  else if (analysis.dominantTypeCount >= analysis.totalTextes * 0.8) {
    const typeLabel = getTypeLabel(analysis.dominantType);
    // Capitalize first letter
    const capitalizedType = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
    
    // Try to find a geographic context
    const geoPhrase = analysis.region?.toLowerCase().includes('dordogne')
      ? 'de la Dordogne'
      : analysis.region
        ? `de ${analysis.region}`
        : '';
    
    title = geoPhrase ? `${capitalizedType} ${geoPhrase}` : capitalizedType;
    confidence = 'high';
  }
  // Case 4: Use exploration name if available
  else if (explorationName && explorationName.length > 3) {
    title = explorationName;
    confidence = 'medium';
  }
  // Case 5: Generate from parties
  else if (analysis.uniqueParties.length > 1) {
    title = 'Trilogie riveraine';
    confidence = 'medium';
  }
  // Default
  else {
    title = 'Fréquence du Vivant';
    confidence = 'low';
  }

  // === SUBTITLE GENERATION ===
  
  // Get type list for subtitle
  const topTypes = Object.entries(analysis.typesDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => getTypeLabel(type));
  
  const typesList = topTypes.length > 0 
    ? topTypes.join(', ') 
    : 'textes poétiques';

  // Geographic context
  const geoContext = analysis.region?.toLowerCase().includes('dordogne')
    ? 'Du Bec d\'Ambès aux sources'
    : analysis.uniqueLieux.length === 1
      ? `À ${analysis.uniqueLieux[0]}`
      : `${analysis.uniqueLieux.length} lieux traversés`;

  // Build subtitle
  if (analysis.uniqueParties.length === 1 && analysis.uniqueParties[0].sousTitre) {
    subtitle = analysis.uniqueParties[0].sousTitre;
  } else if (analysis.totalTextes > 0) {
    subtitle = `${geoContext} — ${typesList.charAt(0).toUpperCase() + typesList.slice(1)}`;
  } else {
    subtitle = '';
  }

  // === DESCRIPTION GENERATION ===
  
  const typeCount = Object.keys(analysis.typesDistribution).length;
  const lieuxCount = analysis.uniqueLieux.length;
  
  // Build elegant description
  const parts: string[] = [];
  
  // Opening
  if (analysis.totalTextes === 1) {
    parts.push(`Un texte unique`);
  } else {
    parts.push(`Un recueil de ${analysis.totalTextes} textes`);
  }
  
  // Type diversity
  if (typeCount > 1) {
    const typeEnumeration = topTypes.slice(0, 3).join(', ');
    parts.push(`mêlant ${typeEnumeration}`);
  }
  
  // Geographic scope
  if (lieuxCount === 1) {
    parts.push(`composé à ${analysis.uniqueLieux[0]}`);
  } else if (lieuxCount > 1) {
    parts.push(`traversant ${lieuxCount} lieux de ${analysis.region || 'France'}`);
  }
  
  // Poetic closing
  if (analysis.region?.toLowerCase().includes('dordogne')) {
    parts.push(`dans une exploration poétique de la Dordogne`);
  } else {
    parts.push(`en quête du vivant`);
  }
  
  description = parts.join(' ') + '.';

  return {
    title,
    subtitle,
    description,
    confidence,
    source: 'contextual',
  };
}

// ============================================================================
// PAYLOAD BUILDER FOR AI GENERATION
// ============================================================================

export function buildAIPayload(textes: TexteExport[], explorationName?: string) {
  const analysis = analyzeTextes(textes);
  
  // Create a lightweight summary of textes (not full content)
  const textesSummary = textes.slice(0, 20).map(t => ({
    titre: t.titre,
    type_texte: t.type_texte,
    marche_ville: t.marche_ville,
    partie_titre: t.partie_titre,
  }));

  return {
    textes: textesSummary,
    explorationName,
    stats: {
      totalTextes: analysis.totalTextes,
      uniqueLieux: analysis.uniqueLieux,
      uniqueParties: analysis.uniqueParties.map(p => p.titre),
      typesDistribution: analysis.typesDistribution,
      region: analysis.region,
    },
  };
}
