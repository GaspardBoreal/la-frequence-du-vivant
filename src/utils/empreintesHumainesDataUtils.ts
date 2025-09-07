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

/**
 * Traite les données d'empreintes humaines pour l'affichage en vignettes
 */
export const processEmpreintesHumainesData = (data: any): ProcessedEmpreintesHumainesData => {
  console.log('Debug - processEmpreintesHumainesData input:', data);
  
  if (!data) {
    return {
      industrielles: [],
      patrimoniales: [],
      transport: [],
      urbaines: [],
      totalCount: 0
    };
  }

  const processItems = (items: any[], category: string) => {
    if (!Array.isArray(items)) return [];
    
    return items.map((item, index) => ({
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
    }));
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
          };
          allItems.push(processedItem);
        });
      } else if (typeof value === 'object' && value !== null) {
        const processedItem = {
          titre: key,
          description: (value as any).description || (value as any).explication || '',
          type: (value as any).type || 'infrastructure',
          category: categorizeByKeywords(value as any) || 'Autre',
          metadata: {
            impact: (value as any).impact || 'neutre' as const,
            ...value
          }
        };
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