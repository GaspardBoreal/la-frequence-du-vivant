import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ID de l'exploration Dordogne
const DORDOGNE_EXPLORATION_ID = '10ed8c41-5361-42f0-b62d-cda24b1d1401';

interface SpeciesData {
  scientificName?: string;
  commonName?: string;
  nom_scientifique?: string;
  nom_commun?: string;
  kingdom?: string;
  source?: string;
  observationDate?: string;
  count?: number;
}

export interface RandomBird {
  id: string;
  scientificName: string;
  commonName: string;
  observationDate: string | null;
  location: string;
  marcheId: string;
}

export interface RandomSpecies {
  id: string;
  scientificName: string;
  commonName: string;
  kingdom: string;
  location: string;
  observationDate: string | null;
}

export interface RandomText {
  id: string;
  titre: string;
  contenu: string;
  typeTexte: string;
  marcheVille: string;
}

export interface RandomAudio {
  id: string;
  titre: string | null;
  url: string;
  dureeSecondes: number | null;
  literaryType: string | null;
  transcription: string | null;
  marcheVille: string;
}

export const useRandomExplorationData = () => {
  
  /**
   * Récupère un oiseau aléatoire des snapshots biodiversité
   */
  const fetchRandomBird = useCallback(async (excludeIds: string[] = []): Promise<RandomBird | null> => {
    try {
      // Récupérer les marches de l'exploration Dordogne
      const { data: marches } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches!inner(ville)')
        .eq('exploration_id', DORDOGNE_EXPLORATION_ID);
      
      if (!marches || marches.length === 0) return null;
      
      const marcheIds = marches.map(m => m.marche_id);
      
      // Récupérer les snapshots les plus récents avec des oiseaux
      const { data: snapshots } = await supabase
        .from('biodiversity_snapshots')
        .select('id, species_data, snapshot_date, marche_id')
        .in('marche_id', marcheIds)
        .gt('birds_count', 0)
        .not('species_data', 'is', null)
        .order('snapshot_date', { ascending: false })
        .limit(10);
      
      if (!snapshots || snapshots.length === 0) return null;
      
      // Sélection pondérée : 70% de chance pour les 3 plus récents, 30% pour les autres
      const weightedIndex = Math.random() < 0.7 
        ? Math.floor(Math.random() * Math.min(3, snapshots.length))
        : Math.floor(Math.random() * snapshots.length);
      const randomSnapshot = snapshots[weightedIndex];
      const speciesArray = randomSnapshot.species_data as SpeciesData[];
      
      if (!Array.isArray(speciesArray)) return null;
      
      // Filtrer les oiseaux (source eBird ou certaines familles connues)
      const birds = speciesArray.filter(s => 
        s.source === 'ebird' || 
        (s.kingdom?.toLowerCase() === 'animalia' && 
         (s.scientificName?.includes('Turdus') || 
          s.scientificName?.includes('Parus') ||
          s.scientificName?.includes('Pica') ||
          s.scientificName?.includes('Ardea') ||
          s.scientificName?.includes('Alcedo') ||
          s.scientificName?.includes('Corvus')))
      );
      
      if (birds.length === 0) return null;
      
      // Filtrer les oiseaux déjà affichés (par nom scientifique comme ID)
      const availableBirds = birds.filter(b => {
        const birdId = b.scientificName || b.nom_scientifique || '';
        return !excludeIds.includes(birdId);
      });
      
      // Fallback: utiliser tous les oiseaux si tous sont exclus
      const birdsToSelect = availableBirds.length > 0 ? availableBirds : birds;
      const randomBird = birdsToSelect[Math.floor(Math.random() * birdsToSelect.length)];
      const marcheData = marches.find(m => m.marche_id === randomSnapshot.marche_id);
      
      return {
        id: `bird_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scientificName: randomBird.scientificName || randomBird.nom_scientifique || 'Espèce inconnue',
        commonName: randomBird.commonName || randomBird.nom_commun || '',
        observationDate: randomSnapshot.snapshot_date,
        location: (marcheData?.marches as any)?.ville || 'Dordogne',
        marcheId: randomSnapshot.marche_id,
      };
    } catch (error) {
      console.error('Error fetching random bird:', error);
      return null;
    }
  }, []);

  /**
   * Récupère une espèce aléatoire (plante, champignon, etc.)
   */
  const fetchRandomSpecies = useCallback(async (excludeIds: string[] = []): Promise<RandomSpecies | null> => {
    try {
      const { data: marches } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches!inner(ville)')
        .eq('exploration_id', DORDOGNE_EXPLORATION_ID);
      
      if (!marches || marches.length === 0) return null;
      
      const marcheIds = marches.map(m => m.marche_id);
      
      // Récupérer les snapshots les plus récents avec des espèces
      const { data: snapshots } = await supabase
        .from('biodiversity_snapshots')
        .select('id, species_data, snapshot_date, marche_id')
        .in('marche_id', marcheIds)
        .gt('total_species', 0)
        .not('species_data', 'is', null)
        .order('snapshot_date', { ascending: false })
        .limit(10);
      
      if (!snapshots || snapshots.length === 0) return null;
      
      // Sélection pondérée : 70% de chance pour les 3 plus récents, 30% pour les autres
      const weightedIndex = Math.random() < 0.7 
        ? Math.floor(Math.random() * Math.min(3, snapshots.length))
        : Math.floor(Math.random() * snapshots.length);
      const randomSnapshot = snapshots[weightedIndex];
      const speciesArray = randomSnapshot.species_data as SpeciesData[];
      
      if (!Array.isArray(speciesArray) || speciesArray.length === 0) return null;
      
      // Filtrer les espèces déjà affichées (par nom scientifique)
      const availableSpecies = speciesArray.filter(s => {
        const speciesId = s.scientificName || s.nom_scientifique || '';
        return !excludeIds.includes(speciesId);
      });
      
      // Fallback: utiliser toutes les espèces si toutes sont exclues
      const speciesToSelect = availableSpecies.length > 0 ? availableSpecies : speciesArray;
      const randomSpecies = speciesToSelect[Math.floor(Math.random() * speciesToSelect.length)];
      const marcheData = marches.find(m => m.marche_id === randomSnapshot.marche_id);
      
      return {
        id: `species_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scientificName: randomSpecies.scientificName || randomSpecies.nom_scientifique || 'Espèce inconnue',
        commonName: randomSpecies.commonName || randomSpecies.nom_commun || '',
        kingdom: randomSpecies.kingdom || 'Inconnu',
        location: (marcheData?.marches as any)?.ville || 'Dordogne',
        observationDate: randomSnapshot.snapshot_date,
      };
    } catch (error) {
      console.error('Error fetching random species:', error);
      return null;
    }
  }, []);

  /**
   * Récupère un texte poétique aléatoire
   */
  const fetchRandomText = useCallback(async (excludeIds: string[] = []): Promise<RandomText | null> => {
    try {
      const { data: marches } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches!inner(ville)')
        .eq('exploration_id', DORDOGNE_EXPLORATION_ID);
      
      if (!marches || marches.length === 0) return null;
      
      const marcheIds = marches.map(m => m.marche_id);
      
      // Récupérer les textes des marches de l'exploration
      const { data: textes } = await supabase
        .from('marche_textes')
        .select('id, titre, contenu, type_texte, marche_id')
        .in('marche_id', marcheIds);
      
      if (!textes || textes.length === 0) return null;
      
      // Filtrer les textes déjà affichés
      const availableTextes = textes.filter(t => !excludeIds.includes(t.id));
      
      // Fallback: utiliser tous les textes si tous sont exclus
      const textesToSelect = availableTextes.length > 0 ? availableTextes : textes;
      const randomText = textesToSelect[Math.floor(Math.random() * textesToSelect.length)];
      const marcheData = marches.find(m => m.marche_id === randomText.marche_id);
      
      return {
        id: randomText.id,
        titre: randomText.titre,
        contenu: randomText.contenu,
        typeTexte: randomText.type_texte,
        marcheVille: (marcheData?.marches as any)?.ville || 'Dordogne',
      };
    } catch (error) {
      console.error('Error fetching random text:', error);
      return null;
    }
  }, []);

  /**
   * Récupère un audio aléatoire
   */
  const fetchRandomAudio = useCallback(async (excludeIds: string[] = []): Promise<RandomAudio | null> => {
    try {
      const { data: marches } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches!inner(ville)')
        .eq('exploration_id', DORDOGNE_EXPLORATION_ID);
      
      if (!marches || marches.length === 0) return null;
      
      const marcheIds = marches.map(m => m.marche_id);
      
      const { data: audios } = await supabase
        .from('marche_audio')
        .select('id, titre, url_supabase, duree_secondes, literary_type, transcription_text, marche_id')
        .in('marche_id', marcheIds);
      
      if (!audios || audios.length === 0) return null;
      
      // Filtrer les audios déjà affichés
      const availableAudios = audios.filter(a => !excludeIds.includes(a.id));
      
      // Fallback: utiliser tous les audios si tous sont exclus
      const audiosToSelect = availableAudios.length > 0 ? availableAudios : audios;
      const randomAudio = audiosToSelect[Math.floor(Math.random() * audiosToSelect.length)];
      const marcheData = marches.find(m => m.marche_id === randomAudio.marche_id);
      
      return {
        id: randomAudio.id,
        titre: randomAudio.titre,
        url: randomAudio.url_supabase,
        dureeSecondes: randomAudio.duree_secondes,
        literaryType: randomAudio.literary_type,
        transcription: randomAudio.transcription_text,
        marcheVille: (marcheData?.marches as any)?.ville || 'Dordogne',
      };
    } catch (error) {
      console.error('Error fetching random audio:', error);
      return null;
    }
  }, []);

  return {
    fetchRandomBird,
    fetchRandomSpecies,
    fetchRandomText,
    fetchRandomAudio,
  };
};
