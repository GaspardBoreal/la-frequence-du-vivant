import { Cpu, Wrench, GitBranch, Leaf, Zap, MapPin, DollarSign, BookOpen, ExternalLink } from 'lucide-react';

export interface TechnodiversiteItem {
  titre: string;
  description_courte: string;
  type: string;
  category: string;
  metadata: {
    autonomie_energetique?: string;
    cout_fabrication?: string;
    documentation_ouverte?: boolean;
    impact_territorial?: string;
    liens?: string[];
    [key: string]: any;
  };
}

export interface ProcessedTechnodiversiteData {
  innovations: TechnodiversiteItem[];
  fabrication_locale: TechnodiversiteItem[];
  projets_open_source: TechnodiversiteItem[];
  // Catégories supplémentaires (optionnelles)
  innovations_locales?: TechnodiversiteItem[];
  technologies_vertes?: TechnodiversiteItem[];
  numerique?: TechnodiversiteItem[];
  recherche_developpement?: TechnodiversiteItem[];
  totalCount: number;
}

/**
 * Traite les données de technodiversité pour l'affichage en vignettes
 */
export const processTechnodiversiteData = (data: any): ProcessedTechnodiversiteData => {
  console.log('Debug - processTechnodiversiteData input:', data);
  
  if (!data) {
    return {
      innovations: [],
      fabrication_locale: [],
      projets_open_source: [],
      totalCount: 0
    };
  }

  const processItems = (items: any[], category: string) => {
    if (!Array.isArray(items)) return [];
    
    return items.map((item, index) => ({
      titre: item.nom || item.titre || item.name || `${category} ${index + 1}`,
      description_courte: item.description || item.explication || '',
      type: item.type || determineTechType(item),
      category,
      metadata: {
        autonomie_energetique: item.autonomie_energetique,
        cout_fabrication: item.cout_fabrication || item.cout,
        documentation_ouverte: item.documentation_ouverte || false,
        impact_territorial: item.impact_territorial || item.impact,
        liens: item.liens || [],
        ...item
      }
    }));
  };

  // Traitement de la nouvelle structure structurée
  if (data.innovations || data.fabrication_locale || data.open_source_projects) {
    const innovations = processItems(data.innovations || [], 'Innovation');
    const fabrication_locale = processItems(data.fabrication_locale || [], 'Fabrication locale');
    const projets_open_source = processItems(data.open_source_projects || [], 'Open Source');

    console.log('Debug - Structured format processed:', { innovations, fabrication_locale, projets_open_source });

    return {
      innovations,
      fabrication_locale,
      projets_open_source,
      totalCount: innovations.length + fabrication_locale.length + projets_open_source.length
    };
  }

  // Schémas alternatifs: détection des catégories spécifiques (avec ou sans data.donnees)
  const altInnovationsLocales = processItems((data?.innovations_locales || data?.donnees?.innovations_locales || []), 'Innovations locales');
  const altTechnologiesVertes = processItems((data?.technologies_vertes || data?.donnees?.technologies_vertes || []), 'Technologies vertes');
  const altNumerique = processItems((data?.numerique || data?.donnees?.numerique || []), 'Numérique sobre');
  const altRecherche = processItems((data?.recherche_developpement || data?.donnees?.recherche_developpement || []), 'Recherche & Développement');

  if (altInnovationsLocales.length || altTechnologiesVertes.length || altNumerique.length || altRecherche.length) {
    const total = altInnovationsLocales.length + altTechnologiesVertes.length + altNumerique.length + altRecherche.length;
    console.log('Debug - Alternative categories processed:', { altInnovationsLocales, altTechnologiesVertes, altNumerique, altRecherche });
    return {
      innovations: [...altInnovationsLocales, ...altTechnologiesVertes, ...altNumerique, ...altRecherche],
      fabrication_locale: [],
      projets_open_source: [],
      innovations_locales: altInnovationsLocales,
      technologies_vertes: altTechnologiesVertes,
      numerique: altNumerique,
      recherche_developpement: altRecherche,
      totalCount: total
    };
  }

  // Fallback pour l'ancien format (données directes ou autres structures)
  console.log('Debug - Using fallback processing for:', data);
  
  // Si c'est un tableau direct, on le traite comme innovations
  if (Array.isArray(data)) {
    const innovations = processItems(data, 'Innovation');
    console.log('Debug - Array format processed as innovations:', innovations);
    
    return {
      innovations,
      fabrication_locale: [],
      projets_open_source: [],
      totalCount: innovations.length
    };
  }

  // Si c'est un objet avec des propriétés, on traite chaque propriété
  const innovations: TechnodiversiteItem[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      innovations.push(...processItems(value, key));
    } else if (typeof value === 'object' && value !== null) {
      innovations.push({
        titre: key,
        description_courte: (value as any).description || (value as any).explication || '',
        type: (value as any).type || 'technologie',
        category: 'Innovation',
        metadata: value
      });
    } else if (typeof value === 'string') {
      innovations.push({
        titre: key,
        description_courte: value,
        type: 'Information',
        category: 'Innovation', 
        metadata: { [key]: value }
      });
    }
  });

  console.log('Debug - Object format processed as innovations:', innovations);

  return {
    innovations,
    fabrication_locale: [],
    projets_open_source: [],
    totalCount: innovations.length
  };
};

/**
 * Détermine le type de technologie basé sur les propriétés de l'item
 */
const determineTechType = (item: any): string => {
  if (item.type) return item.type;
  
  // Analyse des mots-clés pour déterminer le type
  const description = (item.description || '').toLowerCase();
  const nom = (item.nom || item.titre || '').toLowerCase();
  const text = `${nom} ${description}`;
  
  if (text.includes('biomimétisme') || text.includes('bio') || text.includes('nature')) {
    return 'biomimétisme';
  }
  if (text.includes('open') || text.includes('source') || text.includes('collaborative')) {
    return 'open-hardware';
  }
  if (text.includes('numérique') || text.includes('digital') || text.includes('sobre')) {
    return 'numérique-sobre';
  }
  if (text.includes('low') || text.includes('tech') || text.includes('simple') || text.includes('frugal')) {
    return 'low-tech';
  }
  
  return 'technologie';
};

/**
 * Obtient l'icône appropriée pour le type de technologie
 */
export const getTechTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'low-tech':
      return Wrench;
    case 'open-hardware':
    case 'open-source':
      return Cpu;
    case 'biomimétisme':
      return Leaf;
    case 'numérique-sobre':
      return Zap;
    default:
      return Cpu;
  }
};

/**
 * Obtient la couleur du badge pour le type de technologie
 */
export const getTechTypeBadgeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'low-tech':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'open-hardware':
    case 'open-source':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'biomimétisme':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'numérique-sobre':
      return 'bg-violet-100 text-violet-800 border-violet-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

/**
 * Obtient les métadonnées spécialisées pour l'affichage des vignettes technologiques
 */
export const getTechMetadata = (item: TechnodiversiteItem) => {
  const metadata = [];
  
  if (item.metadata.autonomie_energetique) {
    metadata.push({
      icon: Zap,
      label: 'Autonomie',
      value: item.metadata.autonomie_energetique,
      color: 'text-green-600'
    });
  }
  
  if (item.metadata.cout_fabrication) {
    metadata.push({
      icon: DollarSign,
      label: 'Coût',
      value: item.metadata.cout_fabrication,
      color: 'text-blue-600'
    });
  }
  
  if (item.metadata.documentation_ouverte) {
    metadata.push({
      icon: BookOpen,
      label: 'Documentation',
      value: 'Disponible',
      color: 'text-violet-600'
    });
  }
  
  if (item.metadata.impact_territorial) {
    metadata.push({
      icon: MapPin,
      label: 'Impact',
      value: item.metadata.impact_territorial,
      color: 'text-orange-600'
    });
  }
  
  return metadata;
};