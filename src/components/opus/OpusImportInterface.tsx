import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationMarches } from '@/hooks/useExplorations';
import { OpusImportValidationPanel } from './OpusImportValidationPanel';
import { 
  Upload, 
  FileJson, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Eye, 
  Database,
  Bot,
  Link,
  BookOpen,
  BarChart3,
  Info,
  Copy
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ImportData {
  exploration_id: string;
  marche_id: string;
  dimensions: Record<string, any>;
  fables?: Array<any>;
  sources: Array<any>;
  metadata?: {
    // Métadonnées optionnelles - seront générées automatiquement si manquantes
    [key: string]: any;
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

interface PreviewData {
  dimensions_count: number;
  fables_count: number;
  sources_count: number;
  completude_score: number;
  quality_score: number;
}

interface OpusImportInterfaceProps {
  marcheId: string;
  marcheName: string;
  explorationId?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const OpusImportInterface: React.FC<OpusImportInterfaceProps> = ({
  marcheId,
  marcheName,
  explorationId,
  onSuccess,
  onClose
}) => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [jsonContent, setJsonContent] = useState('');
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'importing' | 'success'>('input');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedMarcheId, setSelectedMarcheId] = useState<string>(marcheId);
  const [selectedMarcheName, setSelectedMarcheName] = useState<string>(marcheName);

  // Get exploration marches when no specific marche is selected
  const { data: explorationMarches = [], isLoading: marchesLoading } = useExplorationMarches(explorationId || '');
  
  console.debug('🔍 OpusImportInterface loading states:', {
    marchesLoading,
    explorationMarchesLength: explorationMarches.length,
    marcheId,
    explorationId,
    hasExplorationMarches: explorationMarches.length > 0
  });
  
  // Determine current marche values
  const currentMarcheId = selectedMarcheId || marcheId;
  const currentMarcheName = selectedMarcheName || marcheName;

  // Données d'exemple pour test Dordogne
  const loadDordogneTestData = useCallback(() => {
    const testData = {
      "dimensions": {
        "hydrologie": {
          "description": "Caractéristiques hydrologiques de l'estuaire de la Gironde et de la confluence Dordogne-Garonne",
          "donnees": {
            "regime_hydrologique": {
              "intitule": "Estuaire hypersynchrone avec marées semi-diurnes",
              "source_ids": ["S01"]
            },
            "debit_moyen": "450 m³/s (étiage critique < 200 m³/s)",
            "qualite_eau": {
              "resume": "Intrusion saline accrue lors d'étiages, hypoxies estivales récurrentes",
              "source_ids": ["S01", "S02"]
            },
            "indicateurs_quantitatifs": [
              {
                "nom": "Marnage à Bordeaux",
                "valeur": "2-6 m selon coefficients",
                "source_ids": ["S01"]
              }
            ]
          }
        },
        "biodiversite": {
          "description": "Espèces aquatiques et terrestres caractéristiques de l'estuaire gironder",
          "donnees": {
            "especes_aquatiques": [
              {
                "nom_scientifique": "Alosa alosa",
                "nom_commun": "Grande alose",
                "statut": "Vulnérable",
                "source_ids": ["S03"]
              }
            ]
          }
        },
        "vocabulaire": {
          "description": "Terminologie technique et locale liée aux milieux estuariens",
          "donnees": {
            "termes_techniques": [
              {
                "terme": "Hypersynchronisme",
                "definition": "Amplification du marnage vers l'amont dans un estuaire en entonnoir",
                "contexte": "Caractéristique marquée de l'estuaire de la Gironde",
                "source_ids": ["S01"]
              }
            ]
          }
        },
        "technodiversite": {
          "description": "Technologies et innovations pour la gestion estuarienne",
          "donnees": {
            "technologies_observation": [
              {
                "nom": "Réseau MAGEST",
                "description": "Mesures automatisées qualité eau estuaire", 
                "operateur": "EP Garonne",
                "source_ids": ["S07"]
              }
            ]
          }
        },
        "empreintes_humaines": {
          "description": "Infrastructures et aménagements anthropiques sur l'estuaire",
          "donnees": {
            "industrielles": [
              {
                "nom": "Terminal conteneurs Bassens",
                "type": "Infrastructure portuaire",
                "impact": "Dragage permanent, trafic maritime",
                "source_ids": ["S10"]
              }
            ]
          }
        }
      },
      "fables": [
        {
          "titre": "Le Dialogue des Marées",
          "contenu_principal": "Dans l'estuaire de la Gironde, deux voix se répondent éternellement : celle du Flot qui remonte fièrement vers les terres, porteur de sel et de mystères océaniques, et celle du Jusant qui redescend, chargé de terres et d'histoires continentales.",
          "ordre": 1,
          "dimension": "hydrologie",
          "tags": ["marées", "estuaire", "dialogue"]
        }
      ],
      "sources": [
        {
          "titre": "Marées estuaire Gironde - Traversée Bordeaux",
          "url": "https://traverseedebordeaux.com/spip.php?article9",
          "type": "web",
          "auteur": "Association Traversée de Bordeaux",
          "date_publication": "2023-05-15",
          "date_acces": "2025-09-08",
          "fiabilite": 85,
          "references": ["S01"]
        },
        {
          "titre": "Qualité eau estuaire - Réseau MAGEST",
          "url": "https://www.ep-garonne.fr/mesure-de-la-qualite-de-leau-de-lestuaire.html", 
          "type": "institutionnel",
          "auteur": "EP Garonne",
          "fiabilite": 95,
          "references": ["S02", "S07"]
        }
      ],
      "metadata": {
        "sourcing_date": "2025-09-08",
        "ai_model": "Claude-3.5-Sonnet",
        "notes": "Données d'exemple pour test système d'import - 5 dimensions"
      }
    };
    
    setJsonContent(JSON.stringify(testData, null, 2));
    toast({
      title: "🧪 Données de test chargées",
      description: "Exemple Dordogne avec 5 dimensions + fables + sources",
    });
  }, [toast]);

  // Phase 1 - Template JSON optimisé avec protocole DEEPSEARCH renforcé
  const generateCompleteTemplate = useCallback(() => {
    const currentDate = new Date().toISOString().split('T')[0];
    return `{
  "_instructions": {
    "protocole": "DEEPSEARCH OPTIMISÉ - Recherche approfondie 2022-2025",
    "rayon_recherche": "5 km maximum autour point GPS",
    "sources_prioritaires": "Niveau 1-2 (fiabilité 4-5/5) minimum",
    "quantifications_strictes": "Respecter exactement les nombres demandés par dimension",
    "methodologie": "Triple lecture systématique + validation croisée obligatoire"
  },
  "dimensions": {
    "contexte_hydrologique": {
      "description": "État et dynamique hydrologique du point d'exploration - données quantifiées 2022-2025",
      "donnees": {
        "niveau_eau": [
          {
            "valeur": "X.X mètres NGF (ou hauteur relative)",
            "periode": "Moyenne 2022-2025",
            "tendance": "stable/hausse/baisse avec variations saisonnières",
            "source_mesure": "Station Banque Hydro la plus proche + code station"
          }
        ],
        "debit": [
          {
            "valeur": "X.X m³/s (ou estimation qualitative argumentée)",
            "periode": "Moyenne annuelle 2022-2025", 
            "variabilite_saisonniere": "Coefficient variation ou description",
            "evenements_extremes": "Crues/étiages remarquables 2022-2025"
          }
        ],
        "qualite_eau": [
          {
            "indice_biologique": "IBD, IBGN ou autre indice officiel",
            "parametres_chimiques": "3 paramètres récents (nitrates, phosphore, oxygène...)",
            "annee_reference": "2024 ou année la plus récente",
            "station_mesure": "Point de mesure Agence de l'Eau"
          }
        ],
        "sources": [
          {
            "url": "https://www.hydro.eaufrance.fr/stationhydro/[CODE_STATION]",
            "type": "institutionnel",
            "auteur": "Ministère Transition Écologique - Banque Hydro",
            "titre": "Données hydrométriques station [NOM]",
            "date_publication": "2024-XX-XX",
            "date_consultation": "${currentDate}",
            "fiabilite": 5,
            "domaine_expertise": "Hydrologie quantitative"
          }
        ]
      }
    },
    "especes_caracteristiques": {
      "description": "EXACTEMENT 5 espèces typiques : 2 végétales + 2 animales (dont 1 aquatique) + 1 indicatrice",
      "donnees": {
        "especes_vegetales": [
          {
            "nom_vernaculaire": "Nom français exact",
            "nom_scientifique": "Genus species (obligatoire)",
            "statut_conservation": "LC/NT/VU/EN/CR (Liste Rouge UICN)",
            "abondance_locale": "rare/occasionnel/commun/dominant",
            "role_ecologique": "Fonction spécifique au point d'exploration",
            "habitat_prefere": "Description micro-habitat",
            "source_identification": "Atlas régional/INPN/expertise terrain"
          },
          {
            "nom_vernaculaire": "Deuxième espèce végétale",
            "nom_scientifique": "Genus species",
            "statut_conservation": "Statut conservation",
            "abondance_locale": "Fréquence observée",
            "role_ecologique": "Rôle dans l'écosystème local",
            "habitat_prefere": "Conditions écologiques",
            "source_identification": "Source identification"
          }
        ],
        "especes_animales": [
          {
            "nom_vernaculaire": "Espèce animale terrestre",
            "nom_scientifique": "Genus species",
            "statut_conservation": "Statut Liste Rouge",
            "abondance_locale": "Densité/fréquence",
            "role_ecologique": "Position trophique/fonction",
            "periode_observation": "Saisonnalité/reproduction",
            "source_identification": "Atlas faune/ornithologique"
          }
        ],
        "especes_aquatiques": [
          {
            "nom_vernaculaire": "Espèce aquatique indicatrice",
            "nom_scientifique": "Genus species", 
            "statut_conservation": "Statut conservation",
            "abondance_locale": "Densité population",
            "role_ecologique": "Indicateur qualité eau/biologique",
            "exigences_habitat": "Qualité eau, substrat, courant",
            "source_identification": "Inventaire piscicole/ONEMA"
          }
        ],
        "espece_indicatrice": [
          {
            "nom_vernaculaire": "Espèce bio-indicatrice majeure",
            "nom_scientifique": "Genus species",
            "statut_conservation": "Statut officiel",
            "valeur_indicatrice": "Qualité écologique indiquée",
            "seuils_tolerance": "Conditions limites survie",
            "evolution_2022_2025": "Tendance population récente",
            "source_identification": "Étude scientifique/monitoring"
          }
        ],
        "sources": [
          {
            "url": "https://inpn.mnhn.fr/espece/cd_nom/[CODE_TAXON]",
            "type": "scientifique",
            "auteur": "MNHN - Inventaire National Patrimoine Naturel",
            "titre": "Fiche espèce [NOM_SCIENTIFIQUE]",
            "date_publication": "2024-XX-XX",
            "date_consultation": "${currentDate}",
            "fiabilite": 5,
            "domaine_expertise": "Taxonomie et écologie"
          }
        ]
      }
    },
    "vocabulaire_local": {
      "description": "Minimum 3 catégories : termes hydrologiques + phénomènes naturels + pratiques traditionnelles",
      "donnees": {
        "termes_hydrologiques": [
          {
            "terme": "Mot local exact (ex: gour, rissole, bief)",
            "definition": "Sens précis du terme hydrologique",
            "contexte_usage": "Situation d'emploi traditionnelle",
            "geolocalisation": "Commune/canton d'usage documenté",
            "source_etymologique": "Origine linguistique si connue"
          },
          {
            "terme": "Deuxième terme hydrologique local",
            "definition": "Définition technique locale",
            "contexte_usage": "Usage dans pratiques riveraines",
            "geolocalisation": "Zone géographique d'emploi",
            "source_etymologique": "Références linguistiques"
          }
        ],
        "phenomenes_naturels": [
          {
            "expression": "Expression locale pour phénomène saisonnier",
            "phenomene_designe": "Événement naturel correspondant",
            "periode_occurrence": "Moment dans l'année",
            "contexte_cultural": "Usage dans traditions locales",
            "evolution_semantique": "Changement sens dans le temps"
          },
          {
            "expression": "Deuxième expression phénomène naturel", 
            "phenomene_designe": "Événement météo/hydrologique",
            "periode_occurrence": "Saisonnalité",
            "contexte_cultural": "Intégration culture locale",
            "evolution_semantique": "Évolution usage moderne"
          }
        ],
        "pratiques_traditionnelles": [
          {
            "terme": "Nom pratique ancestrale rivière",
            "description": "Technique/usage traditionnel détaillé",
            "periode_historique": "Époque d'usage principal",
            "savoir_faire": "Compétences/gestes techniques",
            "transmission": "Mode apprentissage/héritage",
            "statut_actuel": "Pratique encore vivante/abandonnée"
          },
          {
            "terme": "Deuxième pratique traditionnelle",
            "description": "Usage ancestral cours d'eau",
            "periode_historique": "Contexte temporel",
            "savoir_faire": "Techniques spécifiques",
            "transmission": "Transmission générationnelle",
            "statut_actuel": "État conservation pratique"
          }
        ],
        "sources": [
          {
            "url": "https://atlas-linguistique-regional.fr ou archive-municipale.fr",
            "type": "institutionnel",
            "auteur": "Atlas linguistique/Archives départementales",
            "titre": "Lexique patrimonial [RÉGION/COMMUNE]",
            "date_publication": "YYYY-MM-DD",
            "date_consultation": "${currentDate}",
            "fiabilite": 4,
            "domaine_expertise": "Linguistique régionale/ethnobotanique"
          }
        ]
      }
    },
    "empreintes_humaines": {
      "description": "EXACTEMENT 3 éléments majeurs : 1 infrastructure hydraulique + 1 aménagement récent + 1 vestige historique",
      "donnees": {
        "infrastructures_hydrauliques": [
          {
            "nom": "Nom officiel ouvrage (barrage/pont/écluse)",
            "type": "Catégorie technique précise",
            "description_technique": "Dimensions, matériaux, fonction hydraulique",
            "date_construction": "Année précise construction",
            "gestionnaire": "Organisme responsable maintenance",
            "impact_ecologique": "Fragmentation/continuité écologique quantifiée",
            "enjeux_gestion": "Problématiques actuelles (sédiments, poissons...)",
            "mesures_compensatoires": "Passes à poissons, aménagements...",
            "source_technique": "Gestionnaire/SANDRE/étude d'impact"
          }
        ],
        "amenagements_recents": [
          {
            "nom": "Aménagement <10 ans modifiant écosystème",
            "date_realisation": "Année réalisation (2015-2025)",
            "objectif": "Finalité aménagement (protection, production...)",
            "emprise": "Surface/linéaire concerné",
            "impact_ecosystemique": "Modification habitats/espèces",
            "suivi_environnemental": "Monitoring effets écologiques",
            "retour_experience": "Bilan efficacité si disponible",
            "source_technique": "Maître ouvrage/bureau études/DREAL"
          }
        ],
        "vestiges_historiques": [
          {
            "nom": "Vestige structurant paysage (moulin, forge...)",
            "periode_historique": "Époque construction/activité",
            "fonction_originale": "Usage historique détaillé",
            "etat_conservation": "État actuel/restaurations",
            "integration_paysage": "Rôle dans organisation territoriale",
            "valeur_patrimoniale": "Classement/protection éventuelle",
            "source_historique": "Archives/service patrimoine/inventaire"
          }
        ],
        "sources": [
          {
            "url": "https://www.sandre.eaufrance.fr/atlas/srv/fre/catalog.search",
            "type": "institutionnel", 
            "auteur": "SANDRE - Service d'Administration Nationale Données Référentielles",
            "titre": "Atlas des ouvrages sur l'eau",
            "date_publication": "2024-XX-XX",
            "date_consultation": "${currentDate}",
            "fiabilite": 5,
            "domaine_expertise": "Ouvrages hydrauliques"
          }
        ]
      }
    },
    "projection_2035_2045": {
      "description": "Prospective territoriale : 3 drivers climatiques + 3 leviers agroécologiques + 3 nouvelles activités",
      "donnees": {
        "drivers_climatiques": [
          {
            "driver": "Hausse températures moyennes",
            "evolution_quantifiee": "+X.X°C selon scénario RCP4.5/RCP8.5",
            "impacts_hydrologiques": "Conséquences débit/évaporation/qualité",
            "vulnerabilites": "Écosystèmes/espèces les plus exposés",
            "source_climatique": "Météo-France/DRIAS/GIEC local",
            "incertitudes": "Marges erreur/variabilité scénarios"
          },
          {
            "driver": "Évolution régime précipitations", 
            "evolution_quantifiee": "±X% précipitations annuelles",
            "impacts_hydrologiques": "Modification crues/étiages/recharge",
            "saisonnalite": "Redistribution temporelle pluies",
            "source_climatique": "Projections régionales climatiques",
            "incertitudes": "Fourchettes projections"
          },
          {
            "driver": "Fréquence événements extrêmes",
            "evolution_quantifiee": "Probabilité crues/sécheresses",
            "impacts_hydrologiques": "Stress écosystèmes aquatiques",
            "adaptation_requise": "Mesures gestion risques",
            "source_climatique": "Études prospectives bassins",
            "incertitudes": "Limites modélisation extrêmes"
          }
        ],
        "leviers_agroecologiques": [
          {
            "levier": "Agroforesterie parcours/cultures",
            "potentiel_deploiement": "X hectares mobilisables, Y exploitations candidates",
            "impact_environnemental": "Réduction érosion/nitrates quantifiée",
            "contraintes_mise_en_oeuvre": "Investissement, formation, foncier",
            "exemples_regionaux": "Références expérimentations réussies",
            "horizon_deployement": "2025-2030/2030-2035",
            "source_technique": "INRAE/Chambre Agriculture/CIVAM"
          },
          {
            "levier": "Couverture végétale permanente",
            "potentiel_deploiement": "Surface cultures concernées",
            "impact_environnemental": "Réduction X% lessivage azote",
            "contraintes_mise_en_oeuvre": "Techniques, coûts, débouchés",
            "exemples_regionaux": "GIEE/groupes agriculteurs pionniers",
            "horizon_deployement": "Calendrier déploiement réaliste",
            "source_technique": "Références techniques agricoles"
          },
          {
            "levier": "Restauration prairies humides",
            "potentiel_deploiement": "Y hectares restaurables, Z km linéaires",
            "impact_environnemental": "Biodiversité +Z espèces, épuration",
            "contraintes_mise_en_oeuvre": "Foncier, hydraulique, gestion",
            "exemples_regionaux": "CEN/LIFE+ projets similaires",
            "horizon_deployement": "Planning restauration écologique",
            "source_technique": "Conservatoires/Agence Eau"
          }
        ],
        "nouvelles_activites": [
          {
            "activite": "POTENTIEL FORT - Écotourisme fluvial",
            "potentiel_marche": "X emplois créés, Y k€ CA potentiel",
            "conditions_emergence": "Infrastructure, formation, promotion",
            "horizon_deployement": "2025-2030 (déployable <5 ans)",
            "exemples_inspiration": "Dordogne amont, Lot, autres rivières",
            "contraintes": "Réglementation, saisonnalité, investissement",
            "source_economique": "Étude marché tourisme/CRT/CCI"
          },
          {
            "activité": "POTENTIEL MOYEN - Aquaculture extensive",
            "potentiel_marche": "Production piscicole circuits courts",
            "conditions_emergence": "Qualité eau, réglementation, débouchés",
            "horizon_deployement": "2030-2035 (expérimentation régionale)",
            "exemples_inspiration": "Piscicultures durables françaises",
            "contraintes": "Autorisations, techniques, marchés",
            "source_economique": "FranceAgriMer/CIPA/études sectorielles"
          },
          {
            "activite": "POTENTIEL DISRUPTIF - Bioremédiation innovante",
            "potentiel_marche": "Services dépollution/biotechnologies",
            "conditions_emergence": "R&D, brevets, partenariats industriels", 
            "horizon_deployement": "2035-2045 (innovation rupture)",
            "exemples_inspiration": "Projets recherche phytoremédiation",
            "contraintes": "Maturité technologique, réglementation",
            "source_economique": "Prospective sectorielle/ADEME/ANR"
          }
        ],
        "sources": [
          {
            "url": "http://www.drias-climat.fr/accompagnement/sections/506",
            "type": "institutionnel",
            "auteur": "Météo-France - DRIAS Climat",
            "titre": "Projections climatiques régionalisées",
            "date_publication": "2024-XX-XX", 
            "date_consultation": "${currentDate}",
            "fiabilite": 5,
            "domaine_expertise": "Climatologie prospective"
          }
        ]
      }
    },
    "ia_fonctionnalites": {
      "description": "EXACTEMENT 5 fonctionnalités IA Rivière Dordogne alignées sur intentions Opus géopoétique",
      "donnees": {
        "fonctionnalites_collectives": [
          {
            "nom": "Plateforme décision participative territoriale",
            "objectif_opus": "Gouvernance collective transformation écologique",
            "utilisateurs_cibles": "Élus, citoyens, agriculteurs, associations",
            "donnees_entree": "Indicateurs écologiques, avis citoyens, projets",
            "output_attendu": "Aide décision consensus/arbitrage participatif",
            "impact_mesurable": "Nb décisions co-construites, satisfaction usagers",
            "faisabilite_technique": "TRL 6-7, adaptation outils existants",
            "source_inspiration": "Decidim, Cap Collectif, démocratie participative"
          }
        ],
        "outils_decision": [
          {
            "nom": "Système alerte qualité écologique prédictive",
            "objectif_opus": "Anticipation urgence écologique transformation",
            "utilisateurs_cibles": "Gestionnaires, agriculteurs, collectivités",
            "donnees_entree": "Capteurs eau, météo, activités anthropiques",
            "output_attendu": "Alertes précoces/scénarios dégradation",
            "impact_mesurable": "Réduction incidents, temps réaction",
            "faisabilite_technique": "TRL 7-8, ML sur données environnementales",
            "source_inspiration": "Vigicrue, systèmes alerte environnementale"
          }
        ],
        "interfaces_poetiques": [
          {
            "nom": "Médiateur géopoétique science-territoire",
            "objectif_opus": "Redonner poésie portée artistique/sociale/politique",
            "utilisateurs_cibles": "Grand public, scolaires, artistes, poètes",
            "donnees_entree": "Données scientifiques, témoignages, créations",
            "output_attendu": "Traductions poétiques données techniques",
            "impact_mesurable": "Appropriation citoyenne, créations artistiques",
            "faisabilité_technique": "TRL 4-5, IA générative + corpus local",
            "source_inspiration": "GPT littéraire, projets art-science"
          }
        ],
        "services_predictifs": [
          {
            "nom": "Optimiseur pratiques agroécologiques contextualisé",
            "objectif_opus": "Moteur transformation agroécologique sociale",
            "utilisateurs_cibles": "Agriculteurs, conseillers, techniciens",
            "donnees_entree": "Sols, climat, parcelles, objectifs exploitation",
            "output_attendu": "Recommandations techniques personnalisées",
            "impact_mesurable": "Adoption pratiques, résultats environnementaux",
            "faisabilite_technique": "TRL 6-7, modèles agronomiques + IA",
            "source_inspiration": "Mes Parcelles, Datagri, OAD existants"
          }
        ],
        "plateformes_partage": [
          {
            "nom": "Réseau technodiversité collaborative territoriale",
            "objectif_opus": "Urgence technodiversité vivre-ensemble",
            "utilisateurs_cibles": "Innovateurs, artisans, entrepreneurs, FabLabs",
            "donnees_entree": "Innovations locales, besoins, ressources",
            "output_attendu": "Mise en relation, diffusion solutions",
            "impact_mesurable": "Innovations déployées, collaborations créées",
            "faisabilite_technique": "TRL 8-9, plateforme collaborative existante",
            "source_inspiration": "Wikifab, Makery, réseaux innovation ouverte"
          }
        ],
        "sources": [
          {
            "url": "https://www.decidim.org ou https://www.cap-collectif.com",
            "type": "technique",
            "auteur": "Plateforme démocratie participative",
            "titre": "Solutions participation citoyenne numérique",
            "date_publication": "2024-XX-XX",
            "date_consultation": "${currentDate}",
            "fiabilite": 4,
            "domaine_expertise": "Technologies participation citoyenne"
          }
        ]
      }
    },
    "technodiversite": {
      "description": "9 solutions structurées par maturité TRL : 3 professionnelles (7-9) + 3 innovantes (4-6) + 3 disruptives (1-3)",
      "donnees": {
        "niveau_professionnel_trl_7_9": [
          {
            "nom": "Capteurs qualité eau low-cost déployables",
            "description_technique": "Sondes multi-paramètres autonomes solaires",
            "maturite_trl": "8 - Système qualifié, déploiements pilotes",
            "adaptabilite_locale": "Installation simple, maintenance locale",
            "cout_implementation": "500-2000€/sonde, ROI 2-3 ans",
            "maintenance_requise": "Étalonnage semestriel, formation 1 jour",
            "impact_attendu": "Monitoring continu, alertes automatiques",
            "exemples_deployement": "Réseaux citoyens, collectivités pilotes",
            "source_technique": "Fabricants spécialisés, retours d'expérience"
          },
          {
            "nom": "Méthodologie gestion participative ressource eau",
            "description_technique": "Protocole animation concertation locale",
            "maturité_trl": "9 - Système opérationnel éprouvé",
            "adaptabilité_locale": "Formation animateurs, adaptation contexte",
            "cout_implementation": "Formation 5-10k€, animation 2k€/an",
            "maintenance_requise": "Animateur formé, suivi annuel",
            "impact_attendu": "Consensus local, appropriation citoyenne",
            "exemples_deployement": "Contrats rivière, SAGE, Parcs Naturels",
            "source_technique": "Agence Eau, CGET, guides méthodologiques"
          },
          {
            "nom": "Plateforme SIG participatif open-source",
            "description_technique": "Cartographie collaborative web observations",
            "maturite_trl": "9 - Solutions matures disponibles",
            "adaptabilite_locale": "Hébergement local, formation utilisateurs",
            "cout_implementation": "Développement 10-20k€, hébergement 1k€/an",
            "maintenance_requise": "Administrateur technique, modération",
            "impact_attendu": "Base données participative, aide décision",
            "exemples_deployement": "OpenStreetMap, Ushahidi, collectivités",
            "source_technique": "Communautés open-source, intégrateurs"
          }
        ],
        "niveau_innovant_trl_4_6": [
          {
            "nom": "Biomonitoring ADN environnemental automatisé",
            "description_technique": "Prélèvement/analyse ADNe biodiversité",
            "maturite_trl": "6 - Technologie démontrée environnement pertinent",
            "adaptabilite_locale": "Formation technique, partenariat labo",
            "cout_implementation": "Équipement 50-100k€, analyses 100€/échantillon",
            "maintenance_requise": "Technicien qualifié, étalonnage régulier",
            "impact_attendu": "Inventaire biodiversité haute résolution",
            "exemples_deployement": "Projets recherche INRAE, OFB, universités",
            "source_technique": "Publications scientifiques, brevets"
          },
          {
            "nom": "Intelligence collective décision territoriale",
            "description_technique": "IA facilitation consensus multi-acteurs",
            "maturite_trl": "5 - Technologie validée laboratoire",
            "adaptabilite_locale": "Formation facilitateurs, données locales",
            "cout_implementation": "Développement 30-50k€, formation 5k€",
            "maintenance_requise": "Data scientist, modération éthique",
            "impact_attendu": "Décisions collectives optimisées, moins conflits",
            "exemples_deployement": "Recherche démocratie participative, pilots",
            "source_technique": "Laboratoires IA, start-ups gov-tech"
          },
          {
            "nom": "Système prédiction couplée hydro-écologique",
            "description_technique": "Modélisation intégrée eau-biodiversité",
            "maturite_trl": "6 - Démonstrateurs bassins pilotes",
            "adaptabilite_locale": "Calibration données locales, expertise",
            "cout_implementation": "Modélisation 20-40k€, calcul cloud 2k€/an",
            "maintenance_requise": "Hydrologue-écologue, mise à jour modèles",
            "impact_attendu": "Scénarios prospectifs, aide gestion adaptive",
            "exemples_deployement": "Projets ANR, thèses, agences eau",
            "source_technique": "Équipes recherche, bureaux études spécialisés"
          }
        ],
        "niveau_disruptif_trl_1_3": [
          {
            "nom": "Biomimétisme auto-épuration systèmes artificiels",
            "description_technique": "Réacteurs biologiques inspirés écosystèmes",
            "maturite_trl": "3 - Preuve concept expérimentale",
            "adaptabilite_locale": "Recherche locale, partenariats universités",
            "cout_implementation": "Recherche 100-500k€, développement incertain",
            "maintenance_requise": "Chercheurs, ingénieurs spécialisés",
            "impact_attendu": "Révolution traitement eau, efficacité naturelle",
            "exemples_deployement": "Laboratoires biomimétisme, projets exploratoires",
            "source_technique": "Publications recherche fondamentale"
          },
          {
            "nom": "IA collective hybride humain-algorithme-nature",
            "description_technique": "Intelligence augmentée intégrant signaux naturels",
            "maturite_trl": "2 - Technologie formulée conceptuellement",
            "adaptabilite_locale": "Écosystème recherche, living lab",
            "cout_implementation": "R&D 500k-1M€, horizon >10 ans",
            "maintenance_requise": "Équipe pluridisciplinaire recherche",
            "impact_attendu": "Nouveau paradigme gouvernance écologique",
            "exemples_deployement": "Projets prospectifs, fiction spéculative",
            "source_technique": "Recherche théorique, prospective technologique"
          },
          {
            "nom": "Réseau sentient territoire auto-régulé",
            "description_technique": "IoT biotechnologique communication écosystème",
            "maturite_trl": "1 - Principes de base observés/formulés",
            "adaptabilite_locale": "Écosystème innovation, recherche fondamentale",
            "cout_implementation": "Recherche fondamentale >1M€, horizon 2035-2045",
            "maintenance_requise": "Chercheurs multidisciplinaires, éthique",
            "impact_attendu": "Territoire auto-conscient, régulation autonome",
            "exemples_deployement": "Recherche prospective, science-fiction",
            "source_technique": "Littérature spéculative, recherche émergente"
          }
        ],
        "sources": [
          {
            "url": "https://www.ademe.fr/expertises/economie-circulaire/innovation",
            "type": "institutionnel",
            "auteur": "ADEME - Agence Transition Écologique",
            "titre": "Innovations technologiques transition écologique",
            "date_publication": "2024-XX-XX",
            "date_consultation": "${currentDate}",
            "fiabilite": 5,
            "domaine_expertise": "Technologies vertes et innovation"
          }
        ]
       }
    }
  },
  "fables": [
    {
      "titre": "L'eau qui murmure les algorithmes du vivant",
      "contenu_principal": "Narration géopoétique intégrant données scientifiques quantifiées, savoirs locaux et visions prospectives. Le récit tisse ensemble les mesures hydrologiques, la mémoire des espèces caractéristiques et les rêves technodiverses du territoire...",
      "ordre": 1,
      "dimensions_associees": ["contexte_hydrologique", "especes_caracteristiques", "ia_fonctionnalites"],
      "statut": "draft"
    },
    {
      "titre": "La symphonie des innovations collectives",
      "contenu_principal": "Récit des métamorphoses territoriales 2035-2045, où les leviers agroécologiques dansent avec les fonctionnalités IA, orchestrés par les savoirs vernaculaires et les gestes technodiverses. Une fable de transformation où chaque acteur trouve sa partition dans l'harmonie du changement...",
      "ordre": 2, 
      "dimensions_associees": ["projection_2035_2045", "technodiversite", "vocabulaire_local"],
      "statut": "draft"
    }
  ],
  "sources": [
    {
      "url": "https://www.hydro.eaufrance.fr",
      "type": "institutionnel",
      "auteur": "Ministère Transition Écologique - Service Central Hydrométéorologique",
      "titre": "Banque Hydro - Données temps réel et historiques",
      "date_publication": "${currentDate}",
      "date_consultation": "${currentDate}",
      "fiabilite": 5,
      "pertinence_geographique": "Nationale",
      "domaine_expertise": "Hydrologie quantitative"
    },
    {
      "url": "https://inpn.mnhn.fr",
      "type": "scientifique", 
      "auteur": "MNHN - Muséum National Histoire Naturelle",
      "titre": "Inventaire National Patrimoine Naturel",
      "date_publication": "${currentDate}",
      "date_consultation": "${currentDate}",
      "fiabilite": 5,
      "pertinence_geographique": "Nationale",
      "domaine_expertise": "Biodiversité et taxonomie"
    },
    {
      "url": "https://www.sandre.eaufrance.fr",
      "type": "institutionnel",
      "auteur": "SANDRE - Service Administration Données Référentielles Eau",
      "titre": "Référentiel national données sur l'eau",
      "date_publication": "${currentDate}",
      "date_consultation": "${currentDate}",
      "fiabilite": 5,
      "pertinence_geographique": "Nationale", 
      "domaine_expertise": "Gestion eau et ouvrages hydrauliques"
    }
   ]
}`;
  }, []);

  // Sanitize JSON by removing invalid escape sequences
  const sanitizeJson = useCallback((jsonString: string): string => {
    if (!jsonString) return jsonString;
    
    // Remove invalid escape sequences that are causing parsing errors
    let sanitized = jsonString
      // Remove backslashes before brackets and parentheses
      .replace(/\\(\[|\]|\(|\)|~)/g, '$1')
      // Remove backslashes before underscores (common in field names)
      .replace(/\\(_)/g, '$1')
      // Fix double backslashes that might have been created
      .replace(/\\\\/g, '\\');
    
    return sanitized;
  }, []);

  // Auto-correct common JSON issues
  const autoCorrectJson = useCallback(() => {
    if (!jsonContent.trim()) {
      toast({
        title: "Rien à corriger",
        description: "Ajoutez d'abord du contenu JSON",
        variant: "destructive"
      });
      return;
    }

    try {
      const sanitized = sanitizeJson(jsonContent);
      setJsonContent(sanitized);
      
      // Try to parse the sanitized JSON to verify it's valid
      JSON.parse(sanitized);
      
      toast({
        title: "JSON corrigé",
        description: "Les erreurs de formatage communes ont été automatiquement corrigées"
      });
    } catch (error) {
      toast({
        title: "Correction partielle",
        description: "Quelques corrections appliquées, mais des erreurs persistent. Vérifiez manuellement.",
        variant: "destructive"
      });
    }
  }, [jsonContent, sanitizeJson, toast]);

  // Copy JSON format to clipboard
  const copyJsonFormat = useCallback(async () => {
    const jsonFormat = generateCompleteTemplate();
    try {
      await navigator.clipboard.writeText(jsonFormat);
      toast({
        title: "Format JSON copié",
        description: "Le format JSON complet a été copié dans le presse-papiers"
      });
    } catch (error) {
      toast({
        title: "Erreur de copie",
        description: "Impossible de copier dans le presse-papiers",
        variant: "destructive"
      });
    }
  }, [generateCompleteTemplate, toast]);

  // NO auto-fill - only manual template generation

  const parseAndValidateJson = useCallback(() => {
    const errors: string[] = [];
    
    try {
      if (!jsonContent.trim()) {
        errors.push("Aucune donnée JSON saisie");
        setValidationErrors(errors);
        return null;
      }

      // Auto-sanitize the JSON before parsing
      const sanitizedJson = sanitizeJson(jsonContent);
      const parsed = JSON.parse(sanitizedJson);
      
      // Validation automatique des IDs
      if (!currentMarcheId) {
        errors.push("⚠️ Marche non sélectionnée - impossible d'importer");
      }
      if (!explorationId) {
        errors.push("⚠️ Exploration non trouvée - impossible d'importer");
      }
      
      // Validation basique du contenu
      if (!parsed.dimensions || Object.keys(parsed.dimensions).length === 0) {
        errors.push("Au moins une dimension est requise dans 'dimensions'");
      }
      if (!parsed.sources || !Array.isArray(parsed.sources)) {
        errors.push("Le champ 'sources' est requis et doit être un tableau");
      }
      // Les métadonnées ne sont plus obligatoires - elles seront générées automatiquement

      // Injection automatique des IDs (ces champs sont automatiquement ajoutés)
      const completeData: ImportData = {
        ...parsed,
        exploration_id: explorationId || parsed.exploration_id,
        marche_id: currentMarcheId || parsed.marche_id
      };
      
      console.log('🔍 IDs injectés automatiquement:', {
        exploration_id: completeData.exploration_id,
        marche_id: completeData.marche_id,
        originalJson: !!parsed.exploration_id || !!parsed.marche_id
      });
      
      setValidationErrors(errors);
      setImportData(completeData);
      return errors.length === 0 ? completeData : null;
    } catch (error) {
      // Provide more specific error messages
      let errorMessage = error.message;
      if (errorMessage.includes('Unexpected token')) {
        if (errorMessage.includes('\\')) {
          errorMessage += ' - Utilisez le bouton "Auto-corriger" pour résoudre les problèmes d\'échappement';
        } else if (errorMessage.includes('[') || errorMessage.includes(']')) {
          errorMessage += ' - Vérifiez la syntaxe des tableaux (crochets)';
        } else if (errorMessage.includes('{') || errorMessage.includes('}')) {
          errorMessage += ' - Vérifiez la syntaxe des objets (accolades)';
        }
      }
      errors.push(`Format JSON invalide: ${errorMessage}`);
      setValidationErrors(errors);
      return null;
    }
  }, [jsonContent, currentMarcheId, explorationId, sanitizeJson]);

  const previewImport = async () => {
    console.log('🚀 Starting preview import...');
    
    const data = parseAndValidateJson();
    if (!data) {
      console.log('❌ No valid data to preview');
      return;
    }

    console.log('📊 Data to preview:', {
      exploration_id: data.exploration_id,
      marche_id: data.marche_id,
      has_dimensions: !!data.dimensions,
      dimensions_keys: data.dimensions ? Object.keys(data.dimensions) : []
    });

    setIsProcessing(true);
    try {
      console.log('🔄 Calling opus-import-ai function...');
      
      const { data: result, error } = await supabase.functions.invoke('opus-import-ai', {
        body: { data, preview: true }
      });

      console.log('📥 Function response:', { result, error });

      if (error) {
        console.error('❌ Function error:', error);
        throw error;
      }

      if (!result) {
        throw new Error('Aucune réponse de la fonction');
      }

      if (!result.validation) {
        console.error('❌ No validation in result:', result);
        throw new Error('Réponse invalide: validation manquante');
      }

      setValidation(result.validation);
      setPreview(result.preview);
      setStep('preview');

      console.log('✅ Preview successful:', {
        dimensions_count: result.preview?.dimensions_count,
        validation_score: result.validation?.score
      });

      toast({
        title: "Prévisualisation générée",
        description: `${result.preview?.dimensions_count || 0} dimensions détectées`
      });

    } catch (error) {
      console.error('💥 Preview error:', error);
      
      // Afficher les erreurs détaillées si disponibles
      if (error.message && error.message.includes('400')) {
        try {
          const errorBody = JSON.parse(error.message.split('\n').pop() || '{}');
          if (errorBody.errors && Array.isArray(errorBody.errors)) {
            setValidationErrors(errorBody.errors);
            toast({
              title: "Erreurs de validation",
              description: `${errorBody.errors.length} erreur(s) détectée(s)`,
              variant: "destructive"
            });
            return;
          }
        } catch {}
      }
      
      toast({
        title: "Erreur de prévisualisation",
        description: error.message || "Erreur inconnue",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeImport = async () => {
    if (!importData) return;

    setIsProcessing(true);
    setStep('importing');

    try {
      const { data: result, error } = await supabase.functions.invoke('opus-import-ai', {
        body: { data: importData, preview: false }
      });

      if (error) throw error;

      if (result.success) {
        setStep('success');
        
        // SUCCESS LOGS pour debugging
        console.log('🎉 Import réussi - Callback onSuccess va être appelé');
        console.log('📊 Données importées:', result);
        
        toast({
          title: "✅ Import réussi",
          description: `Données IA importées pour ${currentMarcheName}. Rechargement automatique...`,
          variant: "default"
        });
        
        // Invalidate all relevant queries AVANT d'appeler onSuccess
        await queryClient.invalidateQueries({
          queryKey: ['marche-contextes'],
        });
        await queryClient.invalidateQueries({
          queryKey: ['opus-contextes'],
        });
        await queryClient.invalidateQueries({
          queryKey: ['imports-data'],
        });
        
        // Appeler le callback après invalidation des caches
        console.log('🔄 Appel du callback onSuccess pour recharger le dashboard');
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Erreur d\'import');
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      });
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setJsonContent('');
    setImportData(null);
    setValidation(null);
    setPreview(null);
    setStep('input');
  };

  // Real-time JSON validation - useEffect MUST come before any conditional returns
  React.useEffect(() => {
    if (jsonContent.trim()) {
      parseAndValidateJson();
    } else {
      setValidationErrors([]);
    }
  }, [jsonContent, parseAndValidateJson]);

  // SUCCESS STEP - Conditional rendering instead of early return
  if (step === 'success') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-600">Import Réussi !</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Les données IA ont été importées avec succès pour <strong>{currentMarcheName}</strong></p>
          
          {preview && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{preview.dimensions_count}</div>
                <div className="text-sm text-muted-foreground">Dimensions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{preview.fables_count}</div>
                <div className="text-sm text-muted-foreground">Fables</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{preview.sources_count}</div>
                <div className="text-sm text-muted-foreground">Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{preview.completude_score}%</div>
                <div className="text-sm text-muted-foreground">Complétude</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center pt-4">
            <Button onClick={reset}>Nouvel Import</Button>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
            <Button 
              variant="secondary" 
              onClick={() => window.open(`/admin/marches/${currentMarcheId}`, '_blank')}
            >
              <Link className="h-4 w-4 mr-2" />
              Voir le contexte
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // MAIN COMPONENT RENDERING
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            Import IA - Données OPUS
          </h2>
          <p className="text-muted-foreground">
            Importez les données sourcées par votre IA pour enrichir automatiquement toutes les dimensions
          </p>
          
          {/* Indicateurs contexte */}
          <div className="flex gap-4 mt-3 text-sm">
            <Badge variant="outline" className="font-mono">
              Marche: {currentMarcheName || 'Non sélectionnée'}
            </Badge>
            <Badge variant="outline" className="font-mono">
              ID: {currentMarcheId || 'N/A'}
            </Badge>
            {explorationId && (
              <Badge variant="outline" className="font-mono">
                Exploration: {explorationId}
              </Badge>
            )}
          </div>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {step === 'input' && (
        <div className="space-y-6">
          {/* Sélecteur de marche si pas de marche spécifique fournie */}
          {!marcheId && explorationId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Sélection de la marche
                </CardTitle>
              </CardHeader>
              <CardContent>
                {marchesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <div className="text-sm text-muted-foreground">Chargement des marches disponibles...</div>
                  </div>
                ) : (
                  <Select 
                    value={selectedMarcheId} 
                    onValueChange={(value) => {
                      setSelectedMarcheId(value);
                      const selectedMarche = explorationMarches.find(em => em.marche?.id === value);
                      setSelectedMarcheName(selectedMarche?.marche?.nom_marche || selectedMarche?.marche?.ville || 'Marche sélectionnée');
                      // Reset et pré-remplit quand on change de marche
                      setImportData(null);
                      setValidation(null);
                      setPreview(null);
                      setValidationErrors([]);
                      // Le useEffect se chargera du pré-remplissage automatique
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisissez une marche pour l'import..." />
                    </SelectTrigger>
                    <SelectContent>
                      {explorationMarches.map((explorationMarche) => (
                        <SelectItem key={explorationMarche.marche?.id} value={explorationMarche.marche?.id || ''}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {explorationMarche.marche?.nom_marche || 'Marche sans nom'}
                            </span>
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {explorationMarche.marche?.ville}
                              {explorationMarche.marche?.region && ` (${explorationMarche.marche?.region})`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Données JSON IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Information IDs auto-injectés */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="w-4 h-4" />
                <AlertDescription>
                  <strong>IDs automatiquement ajoutés :</strong>
                  <br />• Exploration: <code>{explorationId || 'Non trouvée'}</code>
                  <br />• Marche: <code>{currentMarcheName} ({currentMarcheId || 'Non sélectionnée'})</code>
                  <br />Vous n'avez pas besoin d'inclure exploration_id et marche_id dans votre JSON.
                </AlertDescription>
              </Alert>
              
            <Textarea
              placeholder="Collez ici votre JSON d'import IA ou utilisez le bouton 'Copier le format JSON' pour obtenir le modèle complet..."
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              className="min-h-[200px] max-h-[300px] font-mono text-sm resize-y"
            />
            
            {/* Affichage des erreurs de validation */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erreurs détectées:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                  {validationErrors.some(error => error.includes('Unexpected token') && error.includes('\\')) && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800 font-medium">💡 Solution rapide:</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Utilisez le bouton "Auto-corriger" ci-dessous pour résoudre automatiquement les problèmes d'échappement JSON.
                      </p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={copyJsonFormat}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copier le format JSON
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    const template = generateCompleteTemplate();
                    setJsonContent(template);
                    parseAndValidateJson();
                  }}
                  className="flex items-center gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  Charger le modèle
                </Button>

                <Button 
                  variant="outline"
                  onClick={loadDordogneTestData}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 hover:from-blue-100 hover:to-green-100"
                >
                  <Bot className="h-4 w-4 text-blue-600" />
                  Test Dordogne
                </Button>

                <Button 
                  variant="secondary"
                  onClick={autoCorrectJson}
                  disabled={!jsonContent.trim()}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Auto-corriger
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={previewImport}
                  disabled={!jsonContent.trim() || isProcessing || (!marcheId && !currentMarcheId)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {isProcessing ? 'Analyse...' : 'Prévisualiser'}
                </Button>
                
                <Button variant="outline" onClick={reset} disabled={isProcessing}>
                  Effacer
                </Button>
              </div>
            </div>

            {/* Message d'aide dynamique */}
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {!currentMarcheId ? (
                  <span className="text-amber-600 font-medium">⚠️ Sélectionnez une marche pour activer l'import</span>
                ) : !jsonContent.trim() ? (
                  <span className="text-blue-600">💡 Utilisez "Copier le format JSON" pour obtenir le modèle complet couvrant tous les onglets (Contexte, Espèces, Vocabulaire, Infrastructures, Agroécologie, Technodiversité).</span>
                ) : validationErrors.length > 0 ? (
                  <span className="text-red-600 font-medium">❌ Corrigez les erreurs JSON avant de continuer</span>
                ) : (
                  <span className="text-green-600 font-medium">✅ JSON valide - Vous pouvez maintenant prévisualiser ou valider l'import</span>
                )}
              </AlertDescription>
            </Alert>

            {/* Bouton de validation toujours visible avec tooltip */}
            <div className="border-t pt-4">
              <TooltipProvider>
                <div className="flex justify-end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button 
                          onClick={() => {
                            const data = parseAndValidateJson();
                            if (data) {
                              executeImport();
                            }
                          }}
                          disabled={validationErrors.length > 0 || !jsonContent.trim() || isProcessing || (!marcheId && !currentMarcheId)}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Valider l'Import
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!jsonContent.trim() ? (
                        "Ajoutez des données JSON pour activer l'import"
                      ) : (!marcheId && !currentMarcheId) ? (
                        "Sélectionnez une marche avant d'importer"
                      ) : validationErrors.length > 0 ? (
                        "Corrigez les erreurs avant d'importer"
                      ) : (
                        "Importer directement (sans prévisualisation)"
                      )}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {step === 'preview' && validation && preview && (() => {
        // DEBUG LOGS pour diagnostiquer le bouton manquant
        console.log('🔍 DEBUG - État de la preview:', {
          step,
          validation: validation ? {
            isValid: validation.isValid,
            score: validation.score,
            errorsCount: validation.errors?.length || 0,
            warningsCount: validation.warnings?.length || 0
          } : 'null',
          preview: preview ? {
            dimensions_count: preview.dimensions_count,
            fables_count: preview.fables_count,
            sources_count: preview.sources_count,
            completude_score: preview.completude_score
          } : 'null',
          isProcessing,
          currentMarcheId,
          importData: !!importData
        });
        
        return (
          <div className="space-y-4">
            {/* Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {validation.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                Validation ({validation.score}/100)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={validation.score} className="mb-4" />
              
              {validation.errors.length > 0 && (
                <Alert variant="destructive" className="mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Erreurs:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {validation.warnings.length > 0 && (
                <Alert className="mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Avertissements:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validation.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Message informatif sur l'état du bouton */}
              {!validation.isValid && (
                <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>📋 Note importante:</strong> Malgré les erreurs de validation, vous pouvez toujours procéder à l'import. 
                    Les données seront traitées et les erreurs pourront être corrigées manuellement après import.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Aperçu des données */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{preview.dimensions_count}</div>
                <div className="text-sm text-muted-foreground">Dimensions</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{preview.fables_count}</div>
                <div className="text-sm text-muted-foreground">Fables</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Link className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{preview.sources_count}</div>
                <div className="text-sm text-muted-foreground">Sources</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{preview.completude_score}%</div>
                <div className="text-sm text-muted-foreground">Complétude</div>
              </CardContent>
            </Card>
          </div>

          {/* Actions - BOUTON TOUJOURS VISIBLE avec tooltip explicatif */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={reset}>
              Annuler
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button 
                      onClick={executeImport}
                      disabled={isProcessing}
                      className={`flex items-center gap-2 ${!validation.isValid ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}`}
                      variant={!validation.isValid ? "default" : "default"}
                    >
                      <Upload className="h-4 w-4" />
                      {isProcessing ? 'Import...' : !validation.isValid ? 'Forcer l\'Import' : 'Valider l\'Import'}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isProcessing ? (
                    "Import en cours..."
                  ) : !validation.isValid ? (
                    "⚠️ Forcer l'import malgré les erreurs de validation. Les données seront importées et vous pourrez les corriger manuellement."
                  ) : (
                    "✅ Données validées - Procéder à l'import"
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )})()}

      {step === 'importing' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Import en cours...</h3>
            <p className="text-muted-foreground">
              Traitement des données IA pour {currentMarcheName}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};