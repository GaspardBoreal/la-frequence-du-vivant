// Utilitaires pour traitement cohérent des données d'espèces
// Reproduit la logique de SpeciesVignetteGrid pour garantir des comptages identiques

interface SpeciesData {
  [key: string]: any;
}

interface ProcessedSpecies {
  flore: any[];
  faune: { [key: string]: any[] };
}

/**
 * Traite et catégorise les données d'espèces selon la même logique que SpeciesVignetteGrid
 * @param speciesData - Données brutes des espèces caractéristiques
 * @returns Espèces traitées et catégorisées
 */
export function processSpeciesData(speciesData: SpeciesData | null | undefined): ProcessedSpecies {
  if (!speciesData) return { flore: [], faune: {} };

  const flore: any[] = [];
  const faune: { [key: string]: any[] } = {
    poissons: [],
    oiseaux: [],
    insectes: [],
    reptiles: [],
    mammiferes: [],
    invertebres: [],
    autres: []
  };

  // Fonction helper pour mapper les clés AI aux catégories d'affichage
  const mapKeyToCategory = (key: string): { category: string; fauneType?: string } => {
    const keyLower = key.toLowerCase();
    
    // Mapping direct pour les structures AI DEEPSEARCH
    if (keyLower.includes('poisson')) return { category: 'Poissons', fauneType: 'poissons' };
    if (keyLower.includes('oiseau')) return { category: 'Oiseaux', fauneType: 'oiseaux' };
    if (keyLower.includes('vegetation') || keyLower.includes('plante') || keyLower.includes('flore')) return { category: 'Flore' };
    if (keyLower.includes('invertebr') || keyLower.includes('crustac') || keyLower.includes('mollusque')) return { category: 'Invertébrés', fauneType: 'invertebres' };
    if (keyLower.includes('insecte') || keyLower.includes('arthropode')) return { category: 'Insectes', fauneType: 'insectes' };
    if (keyLower.includes('reptile') || keyLower.includes('serpent')) return { category: 'Reptiles', fauneType: 'reptiles' };
    if (keyLower.includes('mammifère') || keyLower.includes('mammifere')) return { category: 'Mammifères', fauneType: 'mammiferes' };
    
    return { category: 'Autres', fauneType: 'autres' };
  };

  // Fonction helper pour créer un objet espèce standardisé
  const createSpeciesObject = (item: any, key: string, category: string) => ({
    titre: item.nom_commun || item.nom || item.espece || item.titre || key,
    nom_commun: item.nom_commun || item.nom || item.espece || item.titre || key,
    nom_scientifique: item.nom_scientifique || item.nom_latin || item.scientific_name || '',
    statut_conservation: item.statut_conservation || item.statut || item.conservation_status || item.protection || 'Non renseigné',
    description_courte: item.description || item.caracteristiques || '',
    type: item.type || category,
    category,
    source_ids: item.source_ids || [],
    metadata: item
  });

  // Gérer la structure nested avec "donnees"
  const dataToProcess = speciesData.donnees || speciesData;

  // Extract species from various data structures
  Object.entries(dataToProcess).forEach(([key, value]) => {
    const categoryInfo = mapKeyToCategory(key);
    
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const species = createSpeciesObject(item, key, categoryInfo.category);

          // Catégoriser selon la structure
          if (categoryInfo.category === 'Flore') {
            flore.push(species);
          } else if (categoryInfo.fauneType) {
            faune[categoryInfo.fauneType].push(species);
          } else {
            faune.autres.push(species);
          }
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      const species = createSpeciesObject(value, key, categoryInfo.category);
      
      if (categoryInfo.category === 'Flore') {
        flore.push(species);
      } else if (categoryInfo.fauneType) {
        faune[categoryInfo.fauneType].push(species);
      } else {
        faune.autres.push(species);
      }
    }
  });

  return { flore, faune };
}

/**
 * Compte le nombre total d'espèces traitées (même logique que SpeciesVignetteGrid.getTotalCount())
 * @param speciesData - Données brutes des espèces caractéristiques
 * @returns Nombre total d'espèces validées et catégorisées
 */
export function getProcessedSpeciesCount(speciesData: SpeciesData | null | undefined): number {
  const processed = processSpeciesData(speciesData);
  return processed.flore.length + 
         Object.values(processed.faune).reduce((sum, arr) => sum + arr.length, 0);
}