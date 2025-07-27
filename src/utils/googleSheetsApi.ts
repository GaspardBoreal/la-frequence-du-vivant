
export interface GoogleSheetsRow {
  [key: string]: string;
}

export interface RawMarcheGoogleSheets {
  id: string;
  ville: string;
  departement: string;
  region: string;
  thematique: string;
  nom_du_marche: string;
  descriptif_court: string;
  date: string;
  temperature: string;
  latitude: string;
  longitude: string;
  lien_archive: string;
  photo1: string;
  photo2: string;
  photo3: string;
  photo4: string;
  photo5: string;
  video1: string;
  video2: string;
  video3: string;
  audio1: string;
  audio2: string;
  audio3: string;
}

export interface MarcheTechnoSensible {
  id: string;
  ville: string;
  departement: string;
  region: string;
  theme: string;
  nomMarche?: string;
  descriptifCourt?: string;
  descriptifLong?: string;
  date?: string;
  temperature?: number;
  latitude: number;
  longitude: number;
  lien?: string;
  photos?: string[];
  videos?: string[];
  audioFiles?: string[];
  // Legacy properties that might be used by some components
  tags?: string;
  sequencesSonores?: string[];
  poeme?: string;
  tagsThematiques?: string[];
  temoignages?: Array<{
    auteur: string;
    contenu: string;
    date: string;
  }>;
  liensInternes?: Array<{
    titre: string;
    url: string;
  }>;
  liensExternes?: Array<{
    titre: string;
    url: string;
  }>;
  // Nouveaux champs pour Supabase
  supabaseId?: string;
  etudes?: Array<{
    id: string;
    titre: string;
    contenu: string;
    resume?: string;
    chapitres?: any;
    ordre: number;
    type: string;
  }>;
  documents?: Array<{
    id: string;
    nom: string;
    url: string;
    titre?: string;
    description?: string;
    type?: string;
  }>;
  supabaseTags?: string[];
  sousThemes?: string[];
  adresse?: string;
}

// Placeholder function for backward compatibility
export const fetchMarchesTechnoSensibles = async (): Promise<MarcheTechnoSensible[]> => {
  // This function is deprecated, use useSupabaseMarches hook instead
  console.warn('fetchMarchesTechnoSensibles is deprecated. Use useSupabaseMarches hook instead.');
  return [];
};
