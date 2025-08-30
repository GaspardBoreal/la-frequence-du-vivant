// Types pour l'architecture révolutionnaire OPUS
export interface OpusExploration {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  nom: string;
  description?: string;
  theme_principal: string;
  cover_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords: string[];
  language: string;
  published: boolean;
  ordre: number;
}

export interface MarcheContexteHybrid {
  id: string;
  created_at: string;
  updated_at: string;
  marche_id: string;
  opus_id?: string;
  contexte_hydrologique?: ContexteHydrologique;
  especes_caracteristiques?: EspecesCaracteristiques;
  vocabulaire_local?: VocabulaireLocal;
  empreintes_humaines?: EmpreintesHumaines;
  projection_2035_2045?: Projection2035;
  leviers_agroecologiques?: LeviersAgroecologiques;
  nouvelles_activites?: NouvellesActivites;
  technodiversite?: Technodiversite;
  completude_score?: number;
  last_validation?: string;
  sources?: Source[];
}

export interface FableNarrative {
  id: string;
  created_at: string;
  updated_at: string;
  marche_id: string;
  opus_id?: string;
  titre: string;
  resume?: string;
  contenu_principal: string;
  variations: FableVariations;
  version: string;
  tags: string[];
  statut: 'draft' | 'validated' | 'published';
  dimensions_associees: string[];
  ordre: number;
  inspiration_sources?: any;
  notes_creative?: any;
}

export interface PrefigurationInteractive {
  id: string;
  created_at: string;
  updated_at: string;
  opus_id: string;
  nom_prefiguration: string;
  type_experience: 'confluence' | 'projection' | 'fables_vivantes' | 'technodiversite';
  config_navigation: NavigationConfig;
  config_visuelle: VisuelleConfig;
  config_sonore?: SonoreConfig;
  config_interaction?: InteractionConfig;
  fleuve_metadata?: FleuveMetadata;
  temporal_layers?: TemporalLayers;
  published: boolean;
  ordre: number;
}

// Sous-types pour les contextes
export interface ContexteHydrologique {
  description: string;
  debit_moyen?: string;
  profondeur_moyenne?: string;
  temperature_eau?: string;
  ph?: string;
  qualite_eau?: string;
  phenomenes_particuliers?: string[];
  sources: string[];
}

export interface EspecesCaracteristiques {
  mammiferes?: EspeceDetail[];
  oiseaux?: EspeceDetail[];
  poissons?: EspeceDetail[];
  flore?: EspeceDetail[];
  insectes?: EspeceDetail[];
  reptiles?: EspeceDetail[];
  description_generale?: string;
  enjeux_conservation?: string[];
  sources: string[];
}

export interface EspeceDetail {
  nom_commun: string;
  nom_scientifique?: string;
  statut_conservation?: string;
  description?: string;
  habitat_prefere?: string;
  particularites?: string[];
}

export interface VocabulaireLocal {
  termes: TermeLocal[];
  etymologie?: string;
  expressions_locales?: string[];
  sources: string[];
}

export interface TermeLocal {
  terme: string;
  definition: string;
  origine?: string;
  usage_context?: string;
}

export interface EmpreintesHumaines {
  infrastructures: Infrastructure[];
  activites_economiques?: string[];
  patrimoine_historique?: string[];
  amenagements_recents?: string[];
  impact_environnemental?: string;
  sources: string[];
}

export interface Infrastructure {
  nom: string;
  type: string;
  description?: string;
  impact_ecologique?: string;
  annee_construction?: number;
}

export interface Projection2035 {
  drivers_climatiques: DriverClimatique[];
  impacts_anticipes: Impact[];
  scenarios: Scenario[];
  incertitudes?: string[];
  sources: string[];
}

export interface DriverClimatique {
  nom: string;
  description: string;
  intensite_prevue: 'faible' | 'modérée' | 'forte';
  timeline: string;
}

export interface Impact {
  domaine: string;
  description: string;
  probabilite: number;
  severite: 'faible' | 'modérée' | 'élevée';
}

export interface Scenario {
  nom: string;
  description: string;
  probabilite: number;
  mesures_adaptation?: string[];
}

export interface LeviersAgroecologiques {
  techniques: TechniqueAgroecologique[];
  benefices_attendus?: string[];
  acteurs_impliques?: string[];
  timeline_deployment?: string;
  sources: string[];
}

export interface TechniqueAgroecologique {
  nom: string;
  description: string;
  cout_implementation?: string;
  impact_environnemental: string;
  faisabilite: 'facile' | 'modérée' | 'complexe';
}

export interface NouvellesActivites {
  activites: NouvelleActivite[];
  partenariats_possibles?: string[];
  financement_potentiel?: string[];
  sources: string[];
}

export interface NouvelleActivite {
  nom: string;
  description: string;
  objectifs: string[];
  livrables_12_mois: string;
  kpis: string[];
  budget_estime?: string;
}

export interface Technodiversite {
  innovations: InnovationTech[];
  fabrication_locale?: string[];
  open_source_projects?: string[];
  impact_territorial?: string;
  sources: string[];
}

export interface InnovationTech {
  nom: string;
  description: string;
  type: 'low-tech' | 'open-hardware' | 'biomimetisme' | 'numérique-sobre';
  autonomie_energetique: boolean;
  cout_fabrication?: string;
  documentation_ouverte: boolean;
}

// Types pour les fables
export interface FableVariations {
  solo?: FableVariation;
  duo?: FableVariation;
  ensemble?: FableVariation;
}

export interface FableVariation {
  contenu: string;
  duree_lecture?: number;
  ambiance_sonore?: string;
  rythme: 'lent' | 'modéré' | 'rapide';
  emotion_dominante?: string;
}

// Types pour les préfigurations
export interface NavigationConfig {
  type_navigation: '3d-fleuve' | 'constellation' | 'timeline' | 'carte-interactive';
  zoom_levels: number[];
  transitions_enabled: boolean;
  gestures_supported: string[];
}

export interface VisuelleConfig {
  theme_colors: string[];
  animation_style: 'fluide' | 'quantique' | 'organique';
  particle_effects: boolean;
  lighting_ambient: boolean;
}

export interface SonoreConfig {
  ambient_sounds: string[];
  music_themes: string[];
  sound_reactive: boolean;
  spatial_audio: boolean;
}

export interface InteractionConfig {
  touch_gestures: string[];
  voice_commands: boolean;
  collaborative_mode: boolean;
  real_time_sync: boolean;
}

export interface FleuveMetadata {
  source_coordinates: [number, number];
  embouchure_coordinates: [number, number];
  longueur_totale: number;
  affluents_principaux: string[];
  biodiversite_hotspots: [number, number][];
}

export interface TemporalLayers {
  historical_data: HistoricalLayer[];
  current_state: CurrentStateLayer;
  future_projections: FutureProjectionLayer[];
}

export interface HistoricalLayer {
  periode: string;
  description: string;
  data_sources: string[];
  key_events: string[];
}

export interface CurrentStateLayer {
  description: string;
  data_real_time: boolean;
  derniere_maj: string;
  sources_donnees: string[];
}

export interface FutureProjectionLayer {
  horizon: '2035' | '2045' | '2050';
  scenarios: string[];
  incertitude_level: number;
  donnees_scientifiques: string[];
}

export interface Source {
  titre: string;
  url?: string;
  auteur?: string;
  date?: string;
  type: 'scientifique' | 'institutionnel' | 'local' | 'media';
}