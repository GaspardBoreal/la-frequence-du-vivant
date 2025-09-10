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

  // Fonction pour identifier si c'est une source et non une espèce
  const isSource = (item: any, key: string): boolean => {
    const title = (item.nom_commun || item.nom || item.espece || item.titre || key).toLowerCase();
    
    // Patterns pour identifier les sources
    const sourcePatterns = [
      'observatoire', 'association', 'société', 'fondation', 'institut',
      'centre', 'laboratoire', 'université', 'museum', 'parc naturel',
      'réserve naturelle', 'conservatoire', 'fédération', 'syndicat',
      'collectif', 'réseau', 'club', 'ligue', 'comité'
    ];
    
    // Types d'organismes qui ne sont pas des espèces
    const organisationTypes = [
      'organisme', 'structure', 'service', 'bureau', 'agence',
      'site web', 'portail', 'plateforme', 'base de données'
    ];
    
    // Vérifier si le titre contient des mots-clés d'organisation
    const containsSourcePattern = sourcePatterns.some(pattern => 
      title.includes(pattern.toLowerCase())
    );
    
    const containsOrgType = organisationTypes.some(type => 
      title.includes(type.toLowerCase())
    );
    
    // Vérifier les tags/types dans l'item
    const hasSourceTags = item.type && (
      item.type.toLowerCase().includes('observatoire') ||
      item.type.toLowerCase().includes('web') ||
      item.type.toLowerCase().includes('association') ||
      item.type.toLowerCase().includes('organisme')
    );
    
    return containsSourcePattern || containsOrgType || hasSourceTags;
  };

  // Fonction helper pour créer un objet espèce standardisé
  const createSpeciesObject = (item: any, key: string, category: string) => ({
    titre: item.nom_commun || item.nom || item.espece || item.titre || key,
    nom_commun: item.nom_commun || item.nom || item.espece || item.titre || key,
    nom_scientifique: item.nom_scientifique || item.nom_latin || item.scientific_name || '',
    statut_conservation: item.statut_conservation || item.statut || item.conservation_status || item.protection || 'Non renseigné',
    description_courte: item.description_courte || item.description || item.details || item.caracteristiques || item.commentaires || '',
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
          // Vérifier si c'est une source avant de la traiter comme une espèce
          if (isSource(item, key)) {
            console.log(`Filtrage source détectée: ${item.nom_commun || item.nom || item.titre || key}`);
            return; // Skip les sources
          }
          
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
      // Vérifier si c'est une source avant de la traiter comme une espèce
      if (isSource(value, key)) {
        const itemAny = value as any;
        console.log(`Filtrage source détectée: ${itemAny.nom_commun || itemAny.nom || itemAny.titre || key}`);
        return; // Skip les sources
      }
      
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