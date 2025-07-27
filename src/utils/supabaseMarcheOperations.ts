import { supabase } from '../integrations/supabase/client';
import { MarcheTechnoSensible } from './googleSheetsApi';
import { uploadFile } from './supabaseUpload';

export interface MarcheFormData {
  ville: string;
  region: string;
  nomMarche?: string;
  descriptifCourt?: string;
  descriptifLong?: string;
  date?: string;
  temperature?: number | null;
  latitude?: number;
  longitude?: number;
  themesPrincipaux?: string[];
  sousThemes?: string[];
  tags?: string[];
  photos?: File[];
  videos?: File[];
  audioFiles?: File[];
  documents?: File[];
  etudes?: Array<{
    titre: string;
    contenu: string;
    resume?: string;
    type: 'principale' | 'complementaire' | 'annexe';
    ordre: number;
  }>;
  poeme?: string | null;
}

// Fonction pour nettoyer les données du formulaire
const cleanFormData = (formData: MarcheFormData) => {
  return {
    ville: formData.ville || '',
    region: formData.region || '',
    nom_marche: formData.nomMarche || null,
    descriptif_court: formData.descriptifCourt || null,
    descriptif_long: formData.descriptifLong || null,
    date: formData.date || null,
    temperature: formData.temperature !== null && formData.temperature !== undefined ? Number(formData.temperature) : null,
    latitude: formData.latitude || null,
    longitude: formData.longitude || null,
    theme_principal: formData.themesPrincipaux?.[0] || null,
    sous_themes: formData.sousThemes && formData.sousThemes.length > 0 ? formData.sousThemes : null,
    lien_google_drive: null,
    coordonnees: formData.latitude && formData.longitude 
      ? `(${formData.longitude},${formData.latitude})` 
      : null
  };
};

// Fonction pour nettoyer le poème
const cleanPoeme = (poeme: string | null | undefined): string | null => {
  if (!poeme || typeof poeme !== 'string') return null;
  return poeme.trim() || null;
};

// Fonction pour créer une nouvelle marche dans Supabase
export const createMarche = async (formData: MarcheFormData): Promise<string | null> => {
  try {
    const cleanedData = cleanFormData(formData);

    const { data, error } = await supabase
      .from('marches_technosensibles')
      .insert([cleanedData])
      .select()

    if (error) {
      console.error("Erreur lors de la création de la marche:", error);
      throw error;
    }

    const newMarche = data[0];
    const marcheId = newMarche.id;

    console.log(`✨ Nouvelle marche créée avec l'ID: ${marcheId}`);
    return marcheId;

  } catch (error) {
    console.error("Erreur lors de la création de la marche:", error);
    return null;
  }
};

// Fonction pour mettre à jour une marche existante dans Supabase
export const updateMarche = async (marcheId: string, formData: MarcheFormData): Promise<boolean> => {
  try {
    const cleanedData = cleanFormData(formData);

    const { error } = await supabase
      .from('marches_technosensibles')
      .update(cleanedData)
      .eq('id', marcheId);

    if (error) {
      console.error(`Erreur lors de la mise à jour de la marche ${marcheId}:`, error);
      return false;
    }

    console.log(`✅ Marche ${marcheId} mise à jour avec succès.`);
    return true;

  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la marche ${marcheId}:`, error);
    return false;
  }
};

// Fonction pour supprimer une marche de Supabase
export const deleteMarche = async (marcheId: string): Promise<boolean> => {
  try {
    // Supprimer les enregistrements liés dans les tables photos, videos, audio, etudes, documents
    await supabase.from('marches_photos').delete().eq('marche_id', marcheId);
    await supabase.from('marches_videos').delete().eq('marche_id', marcheId);
    await supabase.from('marches_audio').delete().eq('marche_id', marcheId);
    await supabase.from('marches_etudes').delete().eq('marche_id', marcheId);
    await supabase.from('marches_documents').delete().eq('marche_id', marcheId);
    await supabase.from('marches_tags').delete().eq('marche_id', marcheId);

    // Supprimer la marche elle-même
    const { error } = await supabase
      .from('marches_technosensibles')
      .delete()
      .eq('id', marcheId);

    if (error) {
      console.error(`Erreur lors de la suppression de la marche ${marcheId}:`, error);
      throw error;
    }

    console.log(`🔥 Marche ${marcheId} supprimée avec succès.`);
    return true;

  } catch (error) {
    console.error(`Erreur lors de la suppression de la marche ${marcheId}:`, error);
    return false;
  }
};

// Fonction pour uploader plusieurs fichiers et retourner leurs URLs
export const uploadFiles = async (files: File[], folder: string): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    try {
      const url = await uploadFile(file, folder);
      if (url) {
        urls.push(url);
      }
    } catch (error) {
      console.error(`Erreur lors de l'upload du fichier ${file.name}:`, error);
    }
  }
  return urls;
};
