import { Factory, Building2, Car, Home, TreePine, Anchor, Truck, MapPin, Calendar, AlertTriangle } from 'lucide-react';

export interface EmpreinteHumaineItem {
  titre: string;
  description: string;
  type: string;
  category: string;
  metadata: {
    impact?: 'positif' | 'neutre' | 'négatif';
    periode_historique?: string;
    coordonnees?: { lat: number; lng: number };
    sources?: string[];
    etat_actuel?: string;
    [key: string]: any;
  };
}

export interface ProcessedEmpreintesHumainesData {
  industrielles: EmpreinteHumaineItem[];
  patrimoniales: EmpreinteHumaineItem[];
  transport: EmpreinteHumaineItem[];
  urbaines: EmpreinteHumaineItem[];
  totalCount: number;
}

export const processEmpreintesHumainesData = (data: any): ProcessedEmpreintesHumainesData => {
  console.log('Debug - processEmpreintesHumainesData input:', data);
  console.log('Debug - data type:', typeof data, 'keys:', data ? Object.keys(data) : 'null');
  
  if (!data) {
    return {
      industrielles: [],
      patrimoniales: [],
      transport: [],
      urbaines: [],
      totalCount: 0
    };
  }

  const result: ProcessedEmpreintesHumainesData = {
    industrielles: [],
    patrimoniales: [],
    transport: [],
    urbaines: [],
    totalCount: 0
  };

  // Si les données suivent la nouvelle structure JSON avec "donnees" (infrastructures_techniques)
  if (data.donnees) {
    const donnees = data.donnees;
    
    // Traiter chaque catégorie de la structure infrastructures_techniques
    if (donnees.ouvrages_hydrauliques) {
      donnees.ouvrages_hydrauliques.forEach((item: any) => {
        const processedItem = {
          titre: item.nom,
          description: item.description,
          type: 'ouvrage_hydraulique',
          category: categorizeInfrastructureItem(item.nom, item.description),
          metadata: {
            impact: determineImpact(item),
            source_ids: item.source_ids || []
          }
        } as EmpreinteHumaineItem;
        addToCategory(result, processedItem);
      });
    }
    
    if (donnees.reseaux) {
      donnees.reseaux.forEach((item: any) => {
        const processedItem = {
          titre: item.nom,
          description: item.description,
          type: 'reseau',
          category: 'transport', // Les réseaux sont généralement du transport
          metadata: {
            impact: determineImpact(item),
            source_ids: item.source_ids || []
          }
        } as EmpreinteHumaineItem;
        addToCategory(result, processedItem);
      });
    }
    
    if (donnees.equipements) {
      donnees.equipements.forEach((item: any) => {
        const processedItem = {
          titre: item.nom,
          description: item.description,
          type: 'equipement',
          category: 'industrielles', // Les équipements sont généralement industriels
          metadata: {
            impact: 'négatif', // Les équipements industriels ont généralement un impact négatif
            source_ids: item.source_ids || []
          }
        } as EmpreinteHumaineItem;
        addToCategory(result, processedItem);
      });
    }
    
    if (donnees.complexes_industriels) {
      donnees.complexes_industriels.forEach((item: any) => {
        const processedItem = {
          titre: item.nom,
          description: item.description,
          type: 'complexe_industriel',
          category: 'industrielles',
          metadata: {
            impact: 'négatif', // Les complexes industriels ont généralement un impact négatif
            source_ids: item.source_ids || []
          }
        } as EmpreinteHumaineItem;
        addToCategory(result, processedItem);
      });
    }
    
    // Nouveau format (rapport PDF) : clés différentes et valeurs parfois en objet unique
    const pushEntry = (raw: any, type: string, defaultCategory: string) => {
      if (!raw) return;
      const titre = raw.nom_ouvrage || raw.nom || raw.titre || 'Ouvrage';
      const description = raw.description_technique || raw.description || raw.explication || '';
      const impactHint = raw.impact_ecologique || raw.impact || '';
      const processedItem: EmpreinteHumaineItem = {
        titre,
        description,
        type,
        category: categorizeInfrastructureItem(titre, description) || (defaultCategory as any),
        metadata: {
          impact: determineImpact({ titre, description, impact_ecologique: impactHint }) as any,
          source_pdf: raw.source_pdf,
          date_construction: raw.date_construction || raw.date_construction_renovation,
          etat: raw.etat || raw.etat_conservation,
          gestionnaire: raw.gestionnaire,
          ...raw,
        },
      } as EmpreinteHumaineItem;
      addToCategory(result, processedItem);
    };

    const handleSingleOrArray = (node: any, type: string, defaultCategory: string) => {
      if (!node) return;
      if (Array.isArray(node)) node.forEach((item) => pushEntry(item, type, defaultCategory));
      else pushEntry(node, type, defaultCategory);
    };

    // Clés observées dans les logs
    console.log('Debug - donnees keys:', Object.keys(donnees));
    handleSingleOrArray(donnees.infrastructures_hydrauliques, 'infrastructure_hydraulique', 'industrielles');
    handleSingleOrArray(donnees.amenagements_recents, 'amenagement', 'industrielles');
    handleSingleOrArray(donnees.vestiges_historiques, 'vestige_historique', 'patrimoniales');

    // Passe générique: traiter toutes les autres clés présentes sous "donnees"
    const knownKeys = new Set([
      'infrastructures_hydrauliques',
      'amenagements_recents',
      'vestiges_historiques',
      'ouvrages_hydrauliques',
      'reseaux',
      'equipements',
      'complexes_industriels'
    ]);
    Object.entries(donnees).forEach(([key, value]) => {
      if (!value || knownKeys.has(key)) return;
      // Par défaut, on laisse la catégorisation se faire par mots-clés
      handleSingleOrArray(value, key, 'industrielles');
    });
    
    result.totalCount = result.industrielles.length + result.patrimoniales.length + 
                     result.transport.length + result.urbaines.length;
    
    console.log('Debug - New JSON format processed:', {
      keys: Object.keys(donnees),
      counts: {
        industrielles: result.industrielles.length,
        patrimoniales: result.patrimoniales.length,
        transport: result.transport.length,
        urbaines: result.urbaines.length,
      },
      total: result.totalCount,
    });

    return result;
  }

  // Ancien code pour d'autres formats...
  const processItems = (items: any[], category: string) => {
    if (!Array.isArray(items)) return [];
    
    return items.map((item, index) => {
      if (typeof item === 'string') {
        const text = item;
        return {
          titre: text,
          description: '',
          type: determineInfrastructureType({ titre: text, description: text }),
          category,
          metadata: {
            impact: determineImpact({ titre: text, description: text }),
          }
        } as EmpreinteHumaineItem;
      }
      return {
        titre: item.nom || item.titre || item.name || `${category} ${index + 1}`,
        description: item.description || item.explication || item.details || '',
        type: item.type || determineInfrastructureType(item),
        category,
        metadata: {
          impact: item.impact || determineImpact(item),
          periode_historique: item.periode || item.date || item.epoque,
          coordonnees: item.coordonnees || item.localisation,
          sources: item.sources || [],
          etat_actuel: item.etat || item.statut,
          ...item
        }
      } as EmpreinteHumaineItem;
    });
  };

  // Structure avec catégories explicites
  if (data.infrastructures_industrielles || data.patrimoine_architecture || 
      data.infrastructures_transport || data.developpements_urbains) {
    
    const industrielles = processItems(data.infrastructures_industrielles || [], 'Industrielle');
    const patrimoniales = processItems(data.patrimoine_architecture || [], 'Patrimoniale');
    const transport = processItems(data.infrastructures_transport || [], 'Transport');
    const urbaines = processItems(data.developpements_urbains || [], 'Urbaine');

    const total = industrielles.length + patrimoniales.length + transport.length + urbaines.length;

    console.log('Debug - Structured format processed:', {
      counts: {
        industrielles: industrielles.length,
        patrimoniales: patrimoniales.length,
        transport: transport.length,
        urbaines: urbaines.length,
      },
      total,
    });

    return {
      industrielles,
      patrimoniales,
      transport,
      urbaines,
      totalCount: total,
    };
  }

  // Fallback pour traitement automatique par détection de mots-clés
  const allItems: EmpreinteHumaineItem[] = [];
  
  // Si c'est un tableau direct
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const processedItem = {
        titre: item.nom || item.titre || item.name || `Infrastructure ${index + 1}`,
        description: item.description || item.explication || '',
        type: item.type || determineInfrastructureType(item),
        category: categorizeByKeywords(item),
        metadata: {
          impact: item.impact || determineImpact(item),
          periode_historique: item.periode || item.date,
          coordonnees: item.coordonnees,
          sources: item.sources || [],
          etat_actuel: item.etat,
          ...item
        }
      };
      allItems.push(processedItem);
    });
  }
  
  // Si c'est un objet avec des propriétés
  else if (typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const processedItem = {
            titre: item.nom || item.titre || key,
            description: item.description || item.explication || '',
            type: item.type || determineInfrastructureType(item),
            category: categorizeByKeywords(item) || key,
            metadata: {
              impact: item.impact || determineImpact(item),
              periode_historique: item.periode || item.date,
              coordonnees: item.coordonnees,
              sources: item.sources || [],
              etat_actuel: item.etat,
              ...item
            }
          } as EmpreinteHumaineItem;
          allItems.push(processedItem);
        });
      } else if (typeof value === 'object' && value !== null) {
        // Si on trouve un noeud imbriqué avec "donnees", traiter récursivement
        if ((value as any).donnees) {
          const nested = processEmpreintesHumainesData({ donnees: (value as any).donnees });
          allItems.push(
            ...nested.industrielles,
            ...nested.patrimoniales,
            ...nested.transport,
            ...nested.urbaines
          );
          return; // passer à la clé suivante
        }
        const processedItem = {
          titre: key,
          description: (value as any).description || (value as any).explication || '',
          type: (value as any).type || 'infrastructure',
          category: categorizeByKeywords(value as any) || 'Autre',
          metadata: {
            impact: (value as any).impact || 'neutre' as const,
            ...value
          }
        } as EmpreinteHumaineItem;
        allItems.push(processedItem);
      }
    });
  }

  // Catégorisation automatique
  const industrielles = allItems.filter(item => item.category === 'Industrielle');
  const patrimoniales = allItems.filter(item => item.category === 'Patrimoniale');
  const transport = allItems.filter(item => item.category === 'Transport');
  const urbaines = allItems.filter(item => item.category === 'Urbaine');

  console.log('Debug - Automatic categorization:', {
    counts: {
      industrielles: industrielles.length,
      patrimoniales: patrimoniales.length,
      transport: transport.length,
      urbaines: urbaines.length,
    },
    total: allItems.length,
  });

  return {
    industrielles,
    patrimoniales,
    transport,
    urbaines,
    totalCount: allItems.length
  };
};

// Fonction helper pour ajouter un item à la bonne catégorie
const addToCategory = (result: ProcessedEmpreintesHumainesData, item: EmpreinteHumaineItem) => {
  const category = item.category;
  if (category === 'industrielles') {
    result.industrielles.push(item);
  } else if (category === 'patrimoniales') {
    result.patrimoniales.push(item);
  } else if (category === 'transport') {
    result.transport.push(item);
  } else {
    result.urbaines.push(item);
  }
};

// Fonction pour catégoriser selon le type d'infrastructure
const categorizeInfrastructureItem = (nom: string, description: string): string => {
  const text = (nom + ' ' + description).toLowerCase();
  
  if (text.includes('carrelet') || text.includes('escalier') || text.includes('patrimoine') || 
      text.includes('monument') || text.includes('historique')) {
    return 'patrimoniales';
  }
  
  if (text.includes('route') || text.includes('sentier') || text.includes('transport') || 
      text.includes('navigation') || text.includes('quai')) {
    return 'transport';
  }
  
  if (text.includes('industriel') || text.includes('cuves') || text.includes('pétrole') || 
      text.includes('drague') || text.includes('appontement')) {
    return 'industrielles';
  }
  
  if (text.includes('eau') || text.includes('captage') || text.includes('prise') || 
      text.includes('digues') || text.includes('urbain')) {
    return 'urbaines';
  }
  
  // Par défaut, considérer comme patrimonial si c'est un ouvrage hydraulique traditionnel
  return 'patrimoniales';
};

/**
 * Détermine le type d'infrastructure basé sur les propriétés de l'item
 */
const determineInfrastructureType = (item: any): string => {
  if (item.type) return item.type;
  
  const description = (item.description || '').toLowerCase();
  const nom = (item.nom || item.titre || '').toLowerCase();
  const text = `${nom} ${description}`;
  
  if (text.includes('usine') || text.includes('raffinerie') || text.includes('terminal')) {
    return 'installation-industrielle';
  }
  if (text.includes('pont') || text.includes('route') || text.includes('voie') || text.includes('quai')) {
    return 'infrastructure-transport';
  }
  if (text.includes('église') || text.includes('château') || text.includes('monument') || text.includes('carrelet')) {
    return 'patrimoine';
  }
  if (text.includes('zone') || text.includes('quartier') || text.includes('lotissement')) {
    return 'développement-urbain';
  }
  
  return 'infrastructure';
};

/**
 * Catégorise automatiquement par mots-clés
 */
const categorizeByKeywords = (item: any): string => {
  const description = (item.description || '').toLowerCase();
  const nom = (item.nom || item.titre || '').toLowerCase();
  const text = `${nom} ${description}`;
  
  if (text.includes('pétrochimique') || text.includes('usine') || text.includes('raffinerie') || 
      text.includes('terminal') || text.includes('industriel')) {
    return 'Industrielle';
  }
  if (text.includes('carrelet') || text.includes('corniche') || text.includes('escalier') || 
      text.includes('église') || text.includes('château') || text.includes('monument') || 
      text.includes('patrimoine')) {
    return 'Patrimoniale';
  }
  if (text.includes('route') || text.includes('voie') || text.includes('pont') || 
      text.includes('quai') || text.includes('port') || text.includes('transport')) {
    return 'Transport';
  }
  if (text.includes('zone') || text.includes('quartier') || text.includes('résidentiel') || 
      text.includes('commercial') || text.includes('urbain')) {
    return 'Urbaine';
  }
  
  return 'Autre';
};

/**
 * Détermine l'impact environnemental/social
 */
const determineImpact = (item: any): 'positif' | 'neutre' | 'négatif' => {
  if (item.impact) return item.impact;
  
  const description = (item.description || '').toLowerCase();
  const nom = (item.nom || item.titre || '').toLowerCase();
  const text = `${nom} ${description}`;
  
  if (text.includes('pollution') || text.includes('pétrochimique') || text.includes('industriel')) {
    return 'négatif';
  }
  if (text.includes('patrimoine') || text.includes('carrelet') || text.includes('corniche')) {
    return 'positif';
  }
  
  return 'neutre';
};

/**
 * Obtient l'icône appropriée pour le type d'infrastructure
 */
export const getInfrastructureTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'installation-industrielle':
      return Factory;
    case 'infrastructure-transport':
      return Car;
    case 'patrimoine':
      return Building2;
    case 'développement-urbain':
      return Home;
    default:
      return MapPin;
  }
};

/**
 * Obtient l'icône pour la catégorie d'infrastructure
 */
export const getInfrastructureCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'industrielle':
      return Factory;
    case 'patrimoniale':
      return Building2;
    case 'transport':
      return Truck;
    case 'urbaine':
      return Home;
    default:
      return MapPin;
  }
};

/**
 * Obtient la couleur du badge pour l'impact
 */
export const getImpactBadgeColor = (impact?: string): string => {
  switch (impact) {
    case 'positif':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'négatif':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'neutre':
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

/**
 * Obtient l'icône pour l'impact
 */
export const getImpactIcon = (impact?: string) => {
  switch (impact) {
    case 'positif':
      return TreePine;
    case 'négatif':
      return AlertTriangle;
    case 'neutre':
    default:
      return MapPin;
  }
};

/**
 * Obtient les métadonnées spécialisées pour l'affichage des vignettes d'infrastructures
 */
export const getInfrastructureMetadata = (item: EmpreinteHumaineItem) => {
  const metadata = [];
  
  if (item.metadata.impact) {
    const ImpactIcon = getImpactIcon(item.metadata.impact);
    metadata.push({
      icon: ImpactIcon,
      label: 'Impact',
      value: item.metadata.impact,
      color: item.metadata.impact === 'positif' ? 'text-green-600' : 
             item.metadata.impact === 'négatif' ? 'text-red-600' : 'text-slate-600'
    });
  }
  
  if (item.metadata.periode_historique) {
    metadata.push({
      icon: Calendar,
      label: 'Période',
      value: item.metadata.periode_historique,
      color: 'text-blue-600'
    });
  }
  
  if (item.metadata.etat_actuel) {
    metadata.push({
      icon: MapPin,
      label: 'État',
      value: item.metadata.etat_actuel,
      color: 'text-purple-600'
    });
  }
  
  return metadata;
};