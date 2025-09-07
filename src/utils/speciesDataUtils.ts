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
    autres: []
  };

  // Extract species from various data structures
  Object.entries(speciesData).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const species = {
            titre: item.nom || item.espece || item.titre || key,
            nom_commun: item.nom_commun || item.nom || item.espece || item.titre || key,
            nom_scientifique: item.nom_scientifique || item.nom_latin || item.scientific_name || '',
            statut_conservation: item.statut_conservation || item.statut || item.conservation_status || item.protection || 'Non renseigné',
            description_courte: item.description || item.caracteristiques || '',
            type: item.type || 'Non classé',
            category: key,
            metadata: item
          };

          // Categorization logic based on type or characteristics
          const type = (item.type || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          
          if (type.includes('plante') || type.includes('flore') || key.toLowerCase().includes('flore')) {
            flore.push({ ...species, category: 'Flore' });
          } else if (type.includes('poisson') || description.includes('poisson')) {
            faune.poissons.push({ ...species, category: 'Poissons' });
          } else if (type.includes('oiseau') || description.includes('oiseau') || description.includes('volatile')) {
            faune.oiseaux.push({ ...species, category: 'Oiseaux' });
          } else if (type.includes('insecte') || description.includes('insecte') || description.includes('arthropode')) {
            faune.insectes.push({ ...species, category: 'Insectes' });
          } else if (type.includes('reptile') || description.includes('reptile') || description.includes('serpent')) {
            faune.reptiles.push({ ...species, category: 'Reptiles' });
          } else if (type.includes('mammifère') || description.includes('mammifère') || type.includes('mammifere')) {
            faune.mammiferes.push({ ...species, category: 'Mammifères' });
          } else {
            faune.autres.push({ ...species, category: 'Autres' });
          }
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      const species = {
        titre: value.nom || value.espece || key,
        nom_commun: value.nom_commun || value.nom || value.espece || key,
        nom_scientifique: value.nom_scientifique || value.nom_latin || value.scientific_name || '',
        statut_conservation: value.statut_conservation || value.statut || value.conservation_status || value.protection || 'Non renseigné',
        description_courte: value.description || value.caracteristiques || '',
        type: value.type || 'Non classé',
        category: key,
        metadata: value
      };
      
      flore.push({ ...species, category: 'Flore' });
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