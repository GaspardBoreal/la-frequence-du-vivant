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
  innovationsDerived?: boolean; // Indique si "innovations" est une synthèse des sous-catégories
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

    // Inclure également les catégories alternatives si elles existent (au même niveau ou sous data.donnees)
    const innovations_locales = processItems((data?.innovations_locales || data?.donnees?.innovations_locales || []), 'Innovations locales');
    const technologies_vertes = processItems((data?.technologies_vertes || data?.donnees?.technologies_vertes || []), 'Technologies vertes');
    const numerique = processItems((data?.numerique || data?.donnees?.numerique || []), 'Numérique sobre');
    const recherche_developpement = processItems((data?.recherche_developpement || data?.donnees?.recherche_developpement || []), 'Recherche & Développement');

    const total =
      innovations.length +
      fabrication_locale.length +
      projets_open_source.length +
      innovations_locales.length +
      technologies_vertes.length +
      numerique.length +
      recherche_developpement.length;

    console.log('Debug - Structured format processed (with extra categories):', {
      counts: {
        innovations: innovations.length,
        fabrication_locale: fabrication_locale.length,
        projets_open_source: projets_open_source.length,
        innovations_locales: innovations_locales.length,
        technologies_vertes: technologies_vertes.length,
        numerique: numerique.length,
        recherche_developpement: recherche_developpement.length,
      },
      total,
    });

    return {
      innovations,
      fabrication_locale,
      projets_open_source,
      innovations_locales,
      technologies_vertes,
      numerique,
      recherche_developpement,
      totalCount: total,
    };
  }

  // Schémas alternatifs: détection des catégories spécifiques (avec ou sans data.donnees)
  const altInnovationsLocales = processItems((data?.innovations_locales || data?.donnees?.innovations_locales || []), 'Innovations locales');
  const altTechnologiesVertes = processItems((data?.technologies_vertes || data?.donnees?.technologies_vertes || []), 'Technologies vertes');
  const altNumerique = processItems((data?.numerique || data?.donnees?.numerique || []), 'Numérique sobre');
  const altRecherche = processItems((data?.recherche_developpement || data?.donnees?.recherche_developpement || []), 'Recherche & Développement');

  if (altInnovationsLocales.length || altTechnologiesVertes.length || altNumerique.length || altRecherche.length) {
    // Créer un Set pour identifier les éléments uniques par titre
    const allItems = [...altInnovationsLocales, ...altTechnologiesVertes, ...altNumerique, ...altRecherche];
    const uniqueTitles = new Set(allItems.map(item => item.titre));
    const totalUnique = uniqueTitles.size;
    const totalAll = altInnovationsLocales.length + altTechnologiesVertes.length + altNumerique.length + altRecherche.length;
    
    console.log('Debug - Alternative categories processed:', { 
      counts: {
        altInnovationsLocales: altInnovationsLocales.length, 
        altTechnologiesVertes: altTechnologiesVertes.length, 
        altNumerique: altNumerique.length, 
        altRecherche: altRecherche.length
      },
      totalAll,
      totalUnique,
      uniqueTitles: Array.from(uniqueTitles)
    });
    
    return {
      innovations: allItems, // Toutes les technologies pour la section "synthèse"
      fabrication_locale: [],
      projets_open_source: [],
      innovations_locales: altInnovationsLocales,
      technologies_vertes: altTechnologiesVertes,
      numerique: altNumerique,
      recherche_developpement: altRecherche,
      totalCount: totalUnique, // Utiliser le nombre d'éléments uniques pour éviter les doublons
      innovationsDerived: true // Indique que la section "innovations" est une synthèse
    };
  }

  // Traitement spécialisé pour les formats TRL (Technology Readiness Level)
  const trlKeys = Object.keys(data).filter(key => key.match(/^niveau_.*trl_/i));
  if (trlKeys.length > 0) {
    console.log('Debug - TRL format detected, keys:', trlKeys);
    
    const processTrlItems = (items: any[], levelName: string) => {
      if (!Array.isArray(items)) return [];
      return items.map((item, index) => {
        // Mapping spécifique pour les données TRL avec les champs corrects
        const titre = item.solution || item.innovation || item.rupture || 
                     item.nom || item.titre || item.name || `${levelName} ${index + 1}`;
        
        const description = item.description_solution || item.description_innovation || item.description_rupture ||
                          item.description || item.explication || item.details || '';
        
        const type = determineTechType(item) || levelName.toLowerCase().replace(/\s+/g, '-');
        
        return {
          titre,
          description_courte: description,
          type,
          category: levelName,
          metadata: {
            autonomie_energetique: item.autonomie_energetique,
            cout_fabrication: item.cout_fabrication || item.cout,
            documentation_ouverte: item.documentation_ouverte || false,
            impact_territorial: item.impact_territorial || item.impact,
            liens: item.liens || [],
            trl_level: levelName,
            original_fields: {
              solution: item.solution,
              innovation: item.innovation, 
              rupture: item.rupture
            },
            ...item
          }
        };
      });
    };

    const innovations_locales = processTrlItems(data.niveau_professionnel_trl_7_9 || [], 'Innovations locales');
    const technologies_vertes = processTrlItems(data.niveau_innovant_trl_4_6 || [], 'Technologies vertes');  
    const numerique = processTrlItems(data.niveau_disruptif_trl_1_3 || [], 'Numérique sobre');

    const total = innovations_locales.length + technologies_vertes.length + numerique.length;
    
    console.log('Debug - TRL format processed:', {
      counts: {
        innovations_locales: innovations_locales.length,
        technologies_vertes: technologies_vertes.length,
        numerique: numerique.length
      },
      total,
      sampleTitles: {
        innovations_locales: innovations_locales.slice(0, 2).map(item => item.titre),
        technologies_vertes: technologies_vertes.slice(0, 2).map(item => item.titre),
        numerique: numerique.slice(0, 2).map(item => item.titre)
      }
    });

    return {
      innovations: [...innovations_locales, ...technologies_vertes, ...numerique],
      fabrication_locale: [],
      projets_open_source: [],
      innovations_locales,
      technologies_vertes,
      numerique,
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
  
  // Fonction pour valider les clés avant de les traiter
  const isValidTechKey = (key: string): boolean => {
    const invalidPatterns = [
      /^niveau_\w+/i,                    // Exclure toutes les clés commençant par "niveau_"
      /^trl_\d+$/i,                      // Exclure les clés TRL (Technology Readiness Level)
      /^disruptif_\d+$/i,                // Exclure les clés de disruption
      /^\w+_\w+_\d+_\d+$/i,              // Exclure les patterns de configuration
      /^metadata$/i,                     // Exclure les métadonnées
      /^config$/i,                       // Exclure les configurations
      /^_/,                              // Exclure les clés privées (commençant par _)
    ];
    
    return !invalidPatterns.some(pattern => pattern.test(key)) && key.length > 2;
  };
  
  Object.entries(data).forEach(([key, value]) => {
    if (!isValidTechKey(key)) {
      console.debug(`[technodiversiteDataUtils] Skipping invalid key: ${key}`);
      return;
    }
    
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
    } else if (typeof value === 'string' && value.length > 3) {
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
  
  // Analyse des mots-clés pour déterminer le type à partir des différents champs
  const solution = (item.solution || '').toLowerCase();
  const innovation = (item.innovation || '').toLowerCase();
  const rupture = (item.rupture || '').toLowerCase();
  const description = (item.description || item.description_solution || item.description_innovation || item.description_rupture || '').toLowerCase();
  const nom = (item.nom || item.titre || '').toLowerCase();
  const text = `${nom} ${description} ${solution} ${innovation} ${rupture}`;
  
  // Types spécifiques selon le contenu
  if (text.includes('biomimétisme') || text.includes('bio-') || text.includes('nature') || text.includes('écosystème')) {
    return 'biomimétisme';
  }
  if (text.includes('open') || text.includes('source') || text.includes('collaborative') || text.includes('commun')) {
    return 'open-hardware';
  }
  if (text.includes('numérique') || text.includes('digital') || text.includes('sobre') || text.includes('ia') || text.includes('intelligence artificielle')) {
    return 'numérique-sobre';
  }
  if (text.includes('low') || text.includes('tech') || text.includes('simple') || text.includes('frugal') || text.includes('artisanal')) {
    return 'low-tech';
  }
  if (text.includes('énergie') || text.includes('solaire') || text.includes('éolien') || text.includes('renouvelable')) {
    return 'énergies-renouvelables';
  }
  if (text.includes('agriculture') || text.includes('permaculture') || text.includes('agroécologie')) {
    return 'agroécologie';
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
  // Utiliser une palette monochrome subtile pour tous les types
  return 'bg-slate/10 text-slate-700 border-slate/20';
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