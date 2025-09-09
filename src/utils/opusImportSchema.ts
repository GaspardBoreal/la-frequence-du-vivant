// Schéma JSON strict pour les imports OPUS
// Phase 1 : Standardisation du format JSON d'import

export interface OpusImportSchema {
  dimensions: {
    contexte_hydrologique?: DimensionData;
    especes_caracteristiques?: DimensionData;
    vocabulaire_local?: DimensionData;
    infrastructures_techniques?: DimensionData; // Sera mappé vers empreintes_humaines
    empreintes_humaines?: DimensionData;
    projection_2035_2045?: DimensionData;
    leviers_agroecologiques?: DimensionData;
    nouvelles_activites?: DimensionData;
    agroecologie?: DimensionData; // Sera divisé en leviers + nouvelles_activites
    technodiversite?: DimensionData;
  };
  fables?: FableData[];
  sources: SourceData[];
  metadata?: MetadataData;
}

export interface DimensionData {
  description: string;
  donnees: Record<string, any>;
}

export interface FableData {
  titre: string;
  contenu_principal: string;
  ordre?: number;
  dimension?: string;
  variations?: Record<string, any>;
  tags?: string[];
  inspiration_sources?: any;
}

export interface SourceData {
  titre: string;
  url?: string;
  type: 'web' | 'base_donnees' | 'documentation' | 'scientifique' | 'institutionnel' | 'local' | 'media';
  auteur?: string;
  date_publication?: string;
  date_acces?: string;
  fiabilite: number | string;
  references?: any;
}

export interface MetadataData {
  sourcing_date?: string;
  import_date?: string;
  ai_model?: string;
  validation_level?: string;
  quality_score?: number;
  completeness_score?: number;
  [key: string]: any;
}

// Validation JSON Schema conforme
export const OPUS_JSON_SCHEMA = {
  type: "object",
  required: ["dimensions", "sources"],
  properties: {
    dimensions: {
      type: "object",
      minProperties: 1,
      additionalProperties: {
        type: "object",
        required: ["description", "donnees"],
        properties: {
          description: { type: "string", minLength: 10 },
          donnees: { type: "object", minProperties: 1 }
        }
      }
    },
    fables: {
      type: "array",
      items: {
        type: "object",
        required: ["titre", "contenu_principal"],
        properties: {
          titre: { type: "string", minLength: 5 },
          contenu_principal: { type: "string", minLength: 50 },
          ordre: { type: "number", minimum: 1 },
          dimension: { type: "string" },
          variations: { type: "object" },
          tags: { type: "array", items: { type: "string" } },
          inspiration_sources: { type: "object" }
        }
      }
    },
    sources: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["titre", "type", "fiabilite"],
        properties: {
          titre: { type: "string", minLength: 5 },
          url: { type: "string", format: "uri" },
          type: { 
            type: "string", 
            enum: ["web", "base_donnees", "documentation", "scientifique", "institutionnel", "local", "media"] 
          },
          auteur: { type: "string" },
          date_publication: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          date_acces: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          fiabilite: { 
            oneOf: [
              { type: "number", minimum: 0, maximum: 100 },
              { type: "string", enum: ["très faible", "faible", "moyenne", "haute", "très haute"] }
            ]
          },
          references: { type: "object" }
        }
      }
    },
    metadata: {
      type: "object",
      properties: {
        sourcing_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        import_date: { type: "string", format: "date-time" },
        ai_model: { type: "string" },
        validation_level: { type: "string", enum: ["automatique", "manuelle", "experte"] },
        quality_score: { type: "number", minimum: 0, maximum: 100 },
        completeness_score: { type: "number", minimum: 0, maximum: 100 }
      }
    }
  },
  additionalProperties: false
};

// Mappings des domaines d'étude (les 7 domaines officiels)
export const DOMAINES_ETUDE = [
  'contexte_hydrologique',
  'especes_caracteristiques', 
  'vocabulaire_local',
  'empreintes_humaines', // Inclut infrastructures_techniques
  'projection_2035_2045',
  'leviers_agroecologiques',
  'nouvelles_activites',
  'technodiversite'
] as const;

export const DIMENSION_MAPPINGS = {
  'infrastructures_techniques': 'empreintes_humaines',
  'agroecologie': ['leviers_agroecologiques', 'nouvelles_activites'],
  'contexte': 'contexte_hydrologique',
  'especes': 'especes_caracteristiques',
  'vocabulaire': 'vocabulaire_local',
  'infrastructures': 'empreintes_humaines',
  'projection': 'projection_2035_2045',
  'leviers': 'leviers_agroecologiques',
  'activites': 'nouvelles_activites',
  'techno': 'technodiversite',
  // Mappings technodiversité (toutes les variantes)
  'technodiversité': 'technodiversite',
  'technologies': 'technodiversite',
  'technologie': 'technodiversite',
  'innovations': 'technodiversite',
  'innovation': 'technodiversite',
  'techno_diversite': 'technodiversite',
  'techno-diversite': 'technodiversite',
  'innovations_locales': 'technodiversite',
  'technologies_vertes': 'technodiversite',
  'numerique': 'technodiversite'
} as const;

// Templates pour auto-completion
export const generateDimensionTemplate = (dimension: string): DimensionData => {
  const templates: Record<string, DimensionData> = {
    contexte_hydrologique: {
      description: "Contexte hydrologique et caractéristiques du site d'étude",
      donnees: {
        bassin_versant: "",
        debit_moyen: "",
        regime_hydrologique: "",
        qualite_eau: "",
        sources: []
      }
    },
    especes_caracteristiques: {
      description: "Espèces indicatrices de la biodiversité et qualité écologique",
      donnees: {
        poissons: [],
        invertebres: [],
        vegetation_aquatique: [],
        oiseaux_aquatiques: [],
        sources: []
      }
    },
    vocabulaire_local: {
      description: "Terminologie locale, dialectes et savoirs traditionnels",
      donnees: {
        termes_locaux: {},
        phenomenes: [],
        pratiques: [],
        sources: []
      }
    },
    empreintes_humaines: {
      description: "Infrastructures humaines et aménagements techniques",
      donnees: {
        ouvrages_hydrauliques: [],
        reseaux: [],
        equipements: [],
        sources: []
      }
    },
    projection_2035_2045: {
      description: "Projections et prospective territoriale 2035-2045",
      donnees: {
        drivers_climatiques: [],
        impacts_anticipes: [],
        scenarios: [],
        sources: []
      }
    },
    leviers_agroecologiques: {
      description: "Leviers agroécologiques disponibles",
      donnees: {
        pratiques_agricoles: [],
        cultures: [],
        elevage: [],
        biodiversite_cultivee: [],
        sources: []
      }
    },
    nouvelles_activites: {
      description: "Activités à développer identifiées",
      donnees: {
        activites_a_developper: [],
        partenariats_possibles: [],
        financement_potentiel: [],
        sources: []
      }
    },
    technodiversite: {
      description: "Technologies émergentes et innovations territoriales",
      donnees: {
        technologies_vertes: [],
        innovations_locales: [],
        numerique: [],
        recherche_developpement: [],
        sources: []
      }
    }
  };

  return templates[dimension] || {
    description: `Données pour la dimension ${dimension}`,
    donnees: { sources: [] }
  };
};