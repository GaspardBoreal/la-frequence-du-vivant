import { Sprout, Droplets, TreePine, Bug, Zap, Leaf, Wheat, Apple, Fish, Sun } from 'lucide-react';

export interface AgroecologieLevier {
  titre: string;
  description_courte: string;
  type: string;
  category: string;
  faisabilite: 'facile' | 'modere' | 'complexe';
  impact_environnemental: 'faible' | 'moyen' | 'fort';
  domaine_application: 'vegetal' | 'hydrique' | 'biodiversite' | 'sol' | 'energie';
  metadata: {
    techniques: string[];
    benefices: string[];
    defis: string[];
    partenaires_potentiels: string[];
    timeline_deploiement: string;
    cout_estimatif: string;
    niveau_impact: 1 | 2 | 3 | 4 | 5;
    synergies: string[];
    [key: string]: any;
  };
}

export interface ProcessedAgroecologieData {
  leviers: AgroecologieLevier[];
  par_domaine: {
    vegetal: AgroecologieLevier[];
    hydrique: AgroecologieLevier[];
    biodiversite: AgroecologieLevier[];
    sol: AgroecologieLevier[];
    energie: AgroecologieLevier[];
  };
  par_faisabilite: {
    facile: AgroecologieLevier[];
    modere: AgroecologieLevier[];
    complexe: AgroecologieLevier[];
  };
  totalCount: number;
}

/**
 * Enrichit un levier agroécologique basique avec des métadonnées créatives et pertinentes
 */
const enrichirLevier = (levier: string, index: number): AgroecologieLevier => {
  const enrichissements: Record<string, Omit<AgroecologieLevier, 'titre'>> = {
    'Agroforesterie productive': {
      description_courte: 'Intégration d\'arbres et cultures pour diversifier la production et renforcer la résilience des parcelles',
      type: 'systeme-mixte',
      category: 'Diversification végétale',
      faisabilite: 'modere',
      impact_environnemental: 'fort',
      domaine_application: 'vegetal',
      metadata: {
        techniques: [
          'Plantation d\'arbres fruitiers en bordure',
          'Haies multi-strates productives',
          'Sylvopastoralisme intégré',
          'Cultures intercalaires forestières'
        ],
        benefices: [
          'Séquestration carbone accrue',
          'Microclimats favorables aux cultures',
          'Diversification des revenus',
          'Réduction érosion et amélioration fertilité'
        ],
        defis: [
          'Investissement initial conséquent',
          'Temps de retour sur investissement long',
          'Formation technique spécialisée',
          'Adaptation du matériel agricole'
        ],
        partenaires_potentiels: [
          'Chambres d\'agriculture',
          'Association française d\'agroforesterie',
          'Coopératives fruitières',
          'Parcs naturels régionaux'
        ],
        timeline_deploiement: '5-10 ans',
        cout_estimatif: '2000-5000€/ha',
        niveau_impact: 5,
        synergies: ['Corridors écologiques', 'Gestion intégrée de l\'eau']
      }
    },
    'Corridors écologiques cultivés': {
      description_courte: 'Création de passages naturels entre parcelles pour favoriser la biodiversité et les auxiliaires de culture',
      type: 'amenagement-paysager',
      category: 'Infrastructure écologique',
      faisabilite: 'facile',
      impact_environnemental: 'fort',
      domaine_application: 'biodiversite',
      metadata: {
        techniques: [
          'Haies mellifères natives',
          'Bandes enherbées fleuries',
          'Mares et zones humides',
          'Nichoirs et gîtes à auxiliaires'
        ],
        benefices: [
          'Régulation naturelle des ravageurs',
          'Pollinisation optimisée',
          'Connectivité des habitats',
          'Paysages agricoles attractifs'
        ],
        defis: [
          'Planification territoriale concertée',
          'Gestion différenciée des espaces',
          'Suivi scientifique de la biodiversité',
          'Sensibilisation des exploitants'
        ],
        partenaires_potentiels: [
          'Conservatoires d\'espaces naturels',
          'LPO et associations naturalistes',
          'Collectivités territoriales',
          'Fédérations de chasseurs'
        ],
        timeline_deploiement: '2-3 ans',
        cout_estimatif: '500-1500€/ha',
        niveau_impact: 4,
        synergies: ['Agroforesterie productive', 'Agriculture régénérative']
      }
    },
    'Gestion intégrée de l\'eau': {
      description_courte: 'Optimisation de la ressource hydrique par des techniques innovantes de récupération et distribution',
      type: 'infrastructure-hydrique',
      category: 'Économie d\'eau',
      faisabilite: 'modere',
      impact_environnemental: 'fort',
      domaine_application: 'hydrique',
      metadata: {
        techniques: [
          'Récupération eau de pluie automatisée',
          'Micro-irrigation de précision',
          'Bassins de rétention naturels',
          'Mulching et couverts végétaux'
        ],
        benefices: [
          'Réduction consommation eau 30-50%',
          'Résilience aux sécheresses',
          'Amélioration qualité des sols',
          'Économies sur factures énergétiques'
        ],
        defis: [
          'Investissement technologique initial',
          'Formation aux outils numériques',
          'Maintenance des systèmes complexes',
          'Réglementation administrative'
        ],
        partenaires_potentiels: [
          'Agence de l\'eau Adour-Garonne',
          'Irrigants de France',
          'Constructeurs matériel irrigation',
          'Bureaux d\'études hydrauliques'
        ],
        timeline_deploiement: '18-24 mois',
        cout_estimatif: '3000-8000€/ha',
        niveau_impact: 4,
        synergies: ['Agriculture régénérative', 'Énergie renouvelable']
      }
    },
    'Agriculture régénérative': {
      description_courte: 'Pratiques culturales restauratrices pour régénérer la fertilité naturelle et la structure des sols',
      type: 'pratique-culturale',
      category: 'Santé des sols',
      faisabilite: 'facile',
      impact_environnemental: 'fort',
      domaine_application: 'sol',
      metadata: {
        techniques: [
          'Couverts végétaux permanents',
          'Rotations longues diversifiées',
          'Semis direct et non-labour',
          'Compostage et amendements organiques'
        ],
        benefices: [
          'Séquestration carbone dans les sols',
          'Amélioration structure et fertilité',
          'Réduction érosion de 80%',
          'Biodiversité microbienne renforcée'
        ],
        defis: [
          'Transition économique 2-3 ans',
          'Évolution des pratiques ancestrales',
          'Formation technique approfondie',
          'Suivi analytique régulier'
        ],
        partenaires_potentiels: [
          'Réseau BASE (biodiversité, agriculture, sol)',
          'Laboratoires d\'analyses agronomiques',
          'CIVAM et groupes d\'agriculteurs',
          'Instituts de recherche INRAE'
        ],
        timeline_deploiement: '12-18 mois',
        cout_estimatif: '200-800€/ha',
        niveau_impact: 5,
        synergies: ['Corridors écologiques cultivés', 'Gestion intégrée de l\'eau']
      }
    },
    'Énergie renouvelable agricole': {
      description_courte: 'Production d\'énergie verte intégrée aux systèmes agricoles pour l\'autonomie énergétique des exploitations',
      type: 'systeme-energetique',
      category: 'Autonomie énergétique',
      faisabilite: 'complexe',
      impact_environnemental: 'moyen',
      domaine_application: 'energie',
      metadata: {
        techniques: [
          'Agrivoltaïsme dynamique',
          'Méthanisation de résidus agricoles',
          'Éoliennes adaptées aux exploitations',
          'Micro-hydroélectricité de ruisseau'
        ],
        benefices: [
          'Autonomie énergétique 70-100%',
          'Revenus complémentaires significatifs',
          'Réduction empreinte carbone',
          'Innovation technologique territoriale'
        ],
        defis: [
          'Investissements lourds 50-200k€',
          'Réglementation complexe',
          'Raccordement réseau électrique',
          'Maintenance technique spécialisée'
        ],
        partenaires_potentiels: [
          'Syndicats énergies renouvelables',
          'Coopératives énergétiques citoyennes',
          'Constructeurs équipements spécialisés',
          'Collectivités locales'
        ],
        timeline_deploiement: '24-36 mois',
        cout_estimatif: '50000-200000€/exploitation',
        niveau_impact: 3,
        synergies: ['Gestion intégrée de l\'eau']
      }
    }
  };

  const enrichissement = enrichissements[levier];
  if (enrichissement) {
    return {
      titre: levier,
      ...enrichissement
    };
  }

  // Fallback pour les leviers non reconnus
  return {
    titre: levier,
    description_courte: `Technique agroécologique: ${levier}`,
    type: 'pratique-generale',
    category: 'Agroécologie',
    faisabilite: 'modere',
    impact_environnemental: 'moyen',
    domaine_application: 'sol',
    metadata: {
      techniques: ['À définir'],
      benefices: ['À évaluer'],
      defis: ['À identifier'],
      partenaires_potentiels: ['À rechercher'],
      timeline_deploiement: 'À planifier',
      cout_estimatif: 'À estimer',
      niveau_impact: 3,
      synergies: []
    }
  };
};

/**
 * Traite les données de leviers agroécologiques pour l'affichage spécialisé
 */
export const processAgroecologieData = (data: any): ProcessedAgroecologieData => {
  console.log('🌱 DEBUG processAgroecologieData - Input:', data);
  
  if (!data) {
    return {
      leviers: [],
      par_domaine: {
        vegetal: [],
        hydrique: [],
        biodiversite: [],
        sol: [],
        energie: []
      },
      par_faisabilite: {
        facile: [],
        modere: [],
        complexe: []
      },
      totalCount: 0
    };
  }

  // Extraire les données soit depuis 'donnees' soit directement
  const dataToProcess = data.donnees || data;
  console.log('🌱 DEBUG Normalized data:', dataToProcess);

  let leviersListe: string[] = [];

  // Extraire les leviers selon différents formats possibles
  if (dataToProcess.leviers && Array.isArray(dataToProcess.leviers)) {
    leviersListe = dataToProcess.leviers;
  } else if (dataToProcess.techniques && Array.isArray(dataToProcess.techniques)) {
    leviersListe = dataToProcess.techniques;
  } else if (Array.isArray(dataToProcess)) {
    leviersListe = dataToProcess;
  } else if (typeof dataToProcess === 'object') {
    // Chercher dans toutes les propriétés qui pourraient contenir des leviers
    Object.entries(dataToProcess).forEach(([key, value]) => {
      if (Array.isArray(value) && (key.toLowerCase().includes('levier') || key.toLowerCase().includes('technique'))) {
        leviersListe = value;
      }
    });
  }

  console.log('🌱 DEBUG Extracted leviersListe:', leviersListe);

  // Enrichir chaque levier
  const leviersEnrichis = leviersListe.map((item, index) => {
    const titre = typeof item === 'string' ? item : 
      (typeof item === 'object' && item !== null ? 
        (item as any).nom || (item as any).titre || (item as any).name || `Levier ${index + 1}` :
        `Levier ${index + 1}`);
    return enrichirLevier(titre, index);
  });

  // Organiser par domaine
  const par_domaine = {
    vegetal: leviersEnrichis.filter(l => l.domaine_application === 'vegetal'),
    hydrique: leviersEnrichis.filter(l => l.domaine_application === 'hydrique'),
    biodiversite: leviersEnrichis.filter(l => l.domaine_application === 'biodiversite'),
    sol: leviersEnrichis.filter(l => l.domaine_application === 'sol'),
    energie: leviersEnrichis.filter(l => l.domaine_application === 'energie')
  };

  // Organiser par niveau de faisabilité
  const par_faisabilite = {
    facile: leviersEnrichis.filter(l => l.faisabilite === 'facile'),
    modere: leviersEnrichis.filter(l => l.faisabilite === 'modere'),
    complexe: leviersEnrichis.filter(l => l.faisabilite === 'complexe')
  };

  const result = {
    leviers: leviersEnrichis,
    par_domaine,
    par_faisabilite,
    totalCount: leviersEnrichis.length
  };

  console.log('🌱 DEBUG Final processed result:', result);
  return result;
};

/**
 * Obtient l'icône appropriée pour le domaine d'application
 */
export const getDomaineIcon = (domaine: string) => {
  switch (domaine) {
    case 'vegetal':
      return TreePine;
    case 'hydrique':
      return Droplets;
    case 'biodiversite':
      return Bug;
    case 'sol':
      return Leaf;
    case 'energie':
      return Sun;
    default:
      return Sprout;
  }
};

/**
 * Obtient l'icône appropriée pour le type de levier
 */
export const getTypeIcon = (type: string) => {
  switch (type) {
    case 'systeme-mixte':
      return TreePine;
    case 'amenagement-paysager':
      return Bug;
    case 'infrastructure-hydrique':
      return Droplets;
    case 'pratique-culturale':
      return Leaf;
    case 'systeme-energetique':
      return Zap;
    default:
      return Sprout;
  }
};

/**
 * Obtient la couleur appropriée pour le niveau de faisabilité
 */
export const getFaisabiliteColor = (level: string): string => {
  switch (level) {
    case 'facile':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'modere':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'complexe':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

/**
 * Obtient la couleur appropriée pour l'impact environnemental
 */
export const getImpactColor = (impact: string): string => {
  switch (impact) {
    case 'faible':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'moyen':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'fort':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

/**
 * Obtient la couleur appropriée pour le domaine d'application
 */
export const getDomaineColor = (domaine: string): string => {
  switch (domaine) {
    case 'vegetal':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'hydrique':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'biodiversite':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'sol':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'energie':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

/**
 * Compte le nombre total de leviers agroécologiques
 */
export const getAgroecologieCount = (data: any): number => {
  if (!data) return 0;
  
  const dataToProcess = data.donnees || data;
  
  if (dataToProcess.leviers && Array.isArray(dataToProcess.leviers)) {
    return dataToProcess.leviers.length;
  }
  
  if (dataToProcess.techniques && Array.isArray(dataToProcess.techniques)) {
    return dataToProcess.techniques.length;
  }
  
  if (Array.isArray(dataToProcess)) {
    return dataToProcess.length;
  }
  
  return 0;
};