import { Bot, Shield, Archive, Sprout, PenTool, Brain, Eye, Users, Zap, TreePine } from 'lucide-react';

export interface IaFonctionnaliteItem {
  titre: string;
  description_courte: string;
  type: string;
  category: string;
  maturity_level: 'conceptuel' | 'prototype' | 'pilote' | 'deploye';
  impact_territorial: 'local' | 'regional' | 'national';
  domaine_application: 'gouvernance' | 'ecologie' | 'patrimoine' | 'agriculture' | 'culture';
  metadata: {
    cas_usage: string[];
    benefices: string[];
    defis_techniques: string[];
    partenaires_potentiels: string[];
    timeline_deploiement: string;
    cout_estimatif: string;
    niveau_innovation: 1 | 2 | 3 | 4 | 5;
    synergies: string[];
    [key: string]: any;
  };
}

export interface ProcessedIaFonctionnalitesData {
  fonctionnalites: IaFonctionnaliteItem[];
  par_domaine: {
    gouvernance: IaFonctionnaliteItem[];
    ecologie: IaFonctionnaliteItem[];
    patrimoine: IaFonctionnaliteItem[];
    agriculture: IaFonctionnaliteItem[];
    culture: IaFonctionnaliteItem[];
  };
  par_maturite: {
    conceptuel: IaFonctionnaliteItem[];
    prototype: IaFonctionnaliteItem[];
    pilote: IaFonctionnaliteItem[];
    deploye: IaFonctionnaliteItem[];
  };
  totalCount: number;
}

/**
 * Enrichit une fonctionnalité IA basique avec des métadonnées créatives et pertinentes
 */
const enrichirFonctionnalite = (fonctionnalite: string, index: number): IaFonctionnaliteItem => {
  const enrichissements: Record<string, Omit<IaFonctionnaliteItem, 'titre'>> = {
    'Gouvernance participative': {
      description_courte: 'Plateforme IA pour faciliter la prise de décision collective et la participation citoyenne aux enjeux territoriaux',
      type: 'plateforme-collaborative',
      category: 'Intelligence collective',
      maturity_level: 'pilote',
      impact_territorial: 'regional',
      domaine_application: 'gouvernance',
      metadata: {
        cas_usage: [
          'Concertation sur projets d\'aménagement',
          'Budget participatif intelligent',
          'Médiation automatisée des conflits d\'usage',
          'Cartographie des besoins territoriaux'
        ],
        benefices: [
          'Inclusion numérique des citoyens',
          'Réduction des biais décisionnels',
          'Transparence des processus',
          'Optimisation des ressources publiques'
        ],
        defis_techniques: [
          'Interface intuitive multi-générationnelle',
          'Traitement du langage naturel en dialectes locaux',
          'Algorithmes de consensus équitable',
          'Protection des données personnelles'
        ],
        partenaires_potentiels: [
          'Collectivités territoriales',
          'Associations citoyennes',
          'Universités (sciences politiques)',
          'Coopératives numériques'
        ],
        timeline_deploiement: '18-24 mois',
        cout_estimatif: '150-300k€',
        niveau_innovation: 4,
        synergies: ['Mémoire & patrimoine vivant', 'Coach éco-agricole personnalisé']
      }
    },
    'Alerte écologique prédictive': {
      description_courte: 'Système d\'IA prédictive pour anticiper et prévenir les risques environnementaux sur le bassin de la Dordogne',
      type: 'systeme-prediction',
      category: 'Écologie prédictive',
      maturity_level: 'prototype',
      impact_territorial: 'regional',
      domaine_application: 'ecologie',
      metadata: {
        cas_usage: [
          'Prédiction des crues et sécheresses',
          'Détection précoce de pollution',
          'Alerte sur la biodiversité menacée',
          'Optimisation des écosystèmes fluviaux'
        ],
        benefices: [
          'Réduction des risques environnementaux',
          'Protection de la biodiversité',
          'Économies en gestion de crise',
          'Adaptation au changement climatique'
        ],
        defis_techniques: [
          'Intégration multi-capteurs IoT',
          'Modèles prédictifs robustes',
          'Gestion temps réel des données',
          'Interface d\'alerte multi-canal'
        ],
        partenaires_potentiels: [
          'Agence de l\'eau Adour-Garonne',
          'INRAE - Recherche écologique',
          'Météo-France',
          'Parcs naturels régionaux'
        ],
        timeline_deploiement: '24-36 mois',
        cout_estimatif: '400-600k€',
        niveau_innovation: 5,
        synergies: ['Coach éco-agricole personnalisé']
      }
    },
    'Mémoire & patrimoine vivant': {
      description_courte: 'IA conversationnelle pour préserver, enrichir et transmettre la mémoire collective du territoire',
      type: 'ia-conversationnelle',
      category: 'Patrimoine numérique',
      maturity_level: 'prototype',
      impact_territorial: 'local',
      domaine_application: 'patrimoine',
      metadata: {
        cas_usage: [
          'Archives orales interactives',
          'Récits de vie géolocalisés',
          'Transmission des savoir-faire',
          'Médiation culturelle augmentée'
        ],
        benefices: [
          'Sauvegarde du patrimoine immatériel',
          'Lien intergénérationnel renforcé',
          'Attractivité touristique',
          'Identité territoriale préservée'
        ],
        defis_techniques: [
          'Traitement des dialectes locaux',
          'Reconnaissance vocale adaptative',
          'Indexation sémantique avancée',
          'Interface multimédia immersive'
        ],
        partenaires_potentiels: [
          'Archives départementales',
          'Musées et écomusées',
          'Associations d\'histoire locale',
          'Médiathèques territoriales'
        ],
        timeline_deploiement: '12-18 mois',
        cout_estimatif: '200-350k€',
        niveau_innovation: 3,
        synergies: ['Création géopoétique intelligente', 'Gouvernance participative']
      }
    },
    'Coach éco-agricole personnalisé': {
      description_courte: 'Assistant IA pour accompagner la transition agroécologique des exploitations agricoles du territoire',
      type: 'assistant-virtuel',
      category: 'Agriculture durable',
      maturity_level: 'pilote',
      impact_territorial: 'regional',
      domaine_application: 'agriculture',
      metadata: {
        cas_usage: [
          'Conseil en pratiques agroécologiques',
          'Optimisation des rotations culturales',
          'Gestion intégrée des ravageurs',
          'Certification bio assistée'
        ],
        benefices: [
          'Réduction des intrants chimiques',
          'Amélioration de la rentabilité',
          'Préservation de la biodiversité',
          'Résilience climatique accrue'
        ],
        defis_techniques: [
          'Modèles agronomiques localisés',
          'Intégration données météo/sol',
          'Interface mobile robuste',
          'Apprentissage continu adaptatif'
        ],
        partenaires_potentiels: [
          'Chambres d\'agriculture',
          'Coopératives agricoles',
          'INRAE - Agroécologie',
          'Réseaux bio régionaux'
        ],
        timeline_deploiement: '18-30 mois',
        cout_estimatif: '300-500k€',
        niveau_innovation: 4,
        synergies: ['Alerte écologique prédictive']
      }
    },
    'Création géopoétique intelligente': {
      description_courte: 'IA créative pour générer des œuvres poétiques et artistiques inspirées des paysages et de l\'histoire du territoire',
      type: 'ia-generative',
      category: 'Art & Culture',
      maturity_level: 'conceptuel',
      impact_territorial: 'local',
      domaine_application: 'culture',
      metadata: {
        cas_usage: [
          'Poésie automatique géolocalisée',
          'Soundscapes génératifs',
          'Parcours artistiques augmentés',
          'Co-création avec artistes locaux'
        ],
        benefices: [
          'Valorisation créative du territoire',
          'Innovation artistique territoriale',
          'Médiation culturelle originale',
          'Rayonnement créatif régional'
        ],
        defis_techniques: [
          'Modèles génératifs multimodaux',
          'Inspiration contextuelle géographique',
          'Interface de co-création',
          'Qualité artistique garantie'
        ],
        partenaires_potentiels: [
          'Centres d\'art contemporain',
          'Collectifs d\'artistes',
          'Festivals culturels',
          'Résidences d\'artistes'
        ],
        timeline_deploiement: '24-42 mois',
        cout_estimatif: '250-400k€',
        niveau_innovation: 5,
        synergies: ['Mémoire & patrimoine vivant']
      }
    }
  };

  const enrichissement = enrichissements[fonctionnalite];
  if (enrichissement) {
    return {
      titre: fonctionnalite,
      ...enrichissement
    };
  }

  // Fallback pour les fonctionnalités non reconnues
  return {
    titre: fonctionnalite,
    description_courte: `Fonctionnalité d'intelligence artificielle: ${fonctionnalite}`,
    type: 'ia-generique',
    category: 'Intelligence artificielle',
    maturity_level: 'conceptuel',
    impact_territorial: 'local',
    domaine_application: 'gouvernance',
    metadata: {
      cas_usage: ['À définir'],
      benefices: ['À évaluer'],
      defis_techniques: ['À identifier'],
      partenaires_potentiels: ['À rechercher'],
      timeline_deploiement: 'À planifier',
      cout_estimatif: 'À estimer',
      niveau_innovation: 3,
      synergies: []
    }
  };
};

/**
 * Traite les données de fonctionnalités IA pour l'affichage spécialisé
 */
export const processIaFonctionnalitesData = (data: any): ProcessedIaFonctionnalitesData => {
  console.log('🤖 DEBUG processIaFonctionnalitesData - Input:', data);
  
  if (!data) {
    return {
      fonctionnalites: [],
      par_domaine: {
        gouvernance: [],
        ecologie: [],
        patrimoine: [],
        agriculture: [],
        culture: []
      },
      par_maturite: {
        conceptuel: [],
        prototype: [],
        pilote: [],
        deploye: []
      },
      totalCount: 0
    };
  }

  // Extraire les données soit depuis 'donnees' soit directement
  const dataToProcess = data.donnees || data;
  console.log('🤖 DEBUG Normalized data:', dataToProcess);

  let fonctionnalitesList: string[] = [];

  // Extraire les fonctionnalités selon différents formats possibles
  if (dataToProcess.fonctionnalites_collectif && Array.isArray(dataToProcess.fonctionnalites_collectif)) {
    fonctionnalitesList = dataToProcess.fonctionnalites_collectif;
  } else if (dataToProcess.fonctionnalites && Array.isArray(dataToProcess.fonctionnalites)) {
    fonctionnalitesList = dataToProcess.fonctionnalites;
  } else if (Array.isArray(dataToProcess)) {
    fonctionnalitesList = dataToProcess;
  } else if (typeof dataToProcess === 'object') {
    // Chercher dans toutes les propriétés qui pourraient contenir des fonctionnalités
    Object.entries(dataToProcess).forEach(([key, value]) => {
      if (Array.isArray(value) && key.toLowerCase().includes('fonctionnalit')) {
        fonctionnalitesList = value;
      }
    });
  }

  console.log('🤖 DEBUG Extracted fonctionnalitesList:', fonctionnalitesList);

  // Enrichir chaque fonctionnalité
  const fonctionnalitesEnrichies = fonctionnalitesList.map((item, index) => {
    const titre = typeof item === 'string' ? item : 
      (typeof item === 'object' && item !== null ? 
        (item as any).nom || (item as any).titre || (item as any).name || `Fonctionnalité ${index + 1}` :
        `Fonctionnalité ${index + 1}`);
    return enrichirFonctionnalite(titre, index);
  });

  // Organiser par domaine
  const par_domaine = {
    gouvernance: fonctionnalitesEnrichies.filter(f => f.domaine_application === 'gouvernance'),
    ecologie: fonctionnalitesEnrichies.filter(f => f.domaine_application === 'ecologie'),
    patrimoine: fonctionnalitesEnrichies.filter(f => f.domaine_application === 'patrimoine'),
    agriculture: fonctionnalitesEnrichies.filter(f => f.domaine_application === 'agriculture'),
    culture: fonctionnalitesEnrichies.filter(f => f.domaine_application === 'culture')
  };

  // Organiser par niveau de maturité
  const par_maturite = {
    conceptuel: fonctionnalitesEnrichies.filter(f => f.maturity_level === 'conceptuel'),
    prototype: fonctionnalitesEnrichies.filter(f => f.maturity_level === 'prototype'),
    pilote: fonctionnalitesEnrichies.filter(f => f.maturity_level === 'pilote'),
    deploye: fonctionnalitesEnrichies.filter(f => f.maturity_level === 'deploye')
  };

  const result = {
    fonctionnalites: fonctionnalitesEnrichies,
    par_domaine,
    par_maturite,
    totalCount: fonctionnalitesEnrichies.length
  };

  console.log('🤖 DEBUG Final processed result:', result);
  return result;
};

/**
 * Obtient l'icône appropriée pour le domaine d'application
 */
export const getDomaineIcon = (domaine: string) => {
  switch (domaine) {
    case 'gouvernance':
      return Users;
    case 'ecologie':
      return TreePine;
    case 'patrimoine':
      return Archive;
    case 'agriculture':
      return Sprout;
    case 'culture':
      return PenTool;
    default:
      return Bot;
  }
};

/**
 * Obtient l'icône appropriée pour le type de fonctionnalité
 */
export const getTypeIcon = (type: string) => {
  switch (type) {
    case 'plateforme-collaborative':
      return Users;
    case 'systeme-prediction':
      return Eye;
    case 'ia-conversationnelle':
      return Bot;
    case 'assistant-virtuel':
      return Brain;
    case 'ia-generative':
      return PenTool;
    default:
      return Zap;
  }
};

/**
 * Obtient la couleur appropriée pour le niveau de maturité
 */
export const getMaturiteColor = (level: string): string => {
  switch (level) {
    case 'conceptuel':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'prototype':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'pilote':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'deploye':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

/**
 * Obtient la couleur appropriée pour le domaine d'application
 */
export const getDomaineColor = (domaine: string): string => {
  switch (domaine) {
    case 'gouvernance':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'ecologie':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'patrimoine':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'agriculture':
      return 'bg-lime-100 text-lime-700 border-lime-200';
    case 'culture':
      return 'bg-pink-100 text-pink-700 border-pink-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

/**
 * Compte le nombre total de fonctionnalités IA
 */
export const getIaFonctionnalitesCount = (data: any): number => {
  if (!data) return 0;
  
  const dataToProcess = data.donnees || data;
  
  if (dataToProcess.fonctionnalites_collectif && Array.isArray(dataToProcess.fonctionnalites_collectif)) {
    return dataToProcess.fonctionnalites_collectif.length;
  }
  
  if (dataToProcess.fonctionnalites && Array.isArray(dataToProcess.fonctionnalites)) {
    return dataToProcess.fonctionnalites.length;
  }
  
  if (Array.isArray(dataToProcess)) {
    return dataToProcess.length;
  }
  
  return 0;
};