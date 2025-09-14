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

  console.log('🔍 DEBUG processSpeciesData - Input:', JSON.stringify(speciesData, null, 2));

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
  if (keyLower.includes('vegetation') || keyLower.includes('plante') || keyLower.includes('flore') || keyLower.includes('aulne') || keyLower.includes('saule')) return { category: 'Flore' };
  if (keyLower.includes('invertebr') || keyLower.includes('crustac') || keyLower.includes('mollusque')) return { category: 'Invertébrés', fauneType: 'invertebres' };
  if (keyLower.includes('insecte') || keyLower.includes('arthropode') || keyLower.includes('ephemere') || keyLower.includes('manne')) return { category: 'Insectes', fauneType: 'insectes' };
  if (keyLower.includes('reptile') || keyLower.includes('serpent')) return { category: 'Reptiles', fauneType: 'reptiles' };
  if (keyLower.includes('mammifère') || keyLower.includes('mammifere') || keyLower.includes('loutre')) return { category: 'Mammifères', fauneType: 'mammiferes' };
    
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

  // Fonction pour extraire les espèces depuis les descriptions textuelles
  const extractSpeciesFromDescription = (description: string, context: string): any[] => {
    const species: any[] = [];
    const descriptionLower = description.toLowerCase();
    
    // Patterns pour identifier les espèces dans les descriptions
    const speciesPatterns = [
      { name: 'Aulne glutineux', scientific: 'Alnus glutinosa', category: 'Flore' },
      { name: 'Saule blanc', scientific: 'Salix alba', category: 'Flore' },
      { name: 'Saumon atlantique', scientific: 'Salmo salar', category: 'Poissons' },
      { name: 'Loutre d\'Europe', scientific: 'Lutra lutra', category: 'Mammifères' },
      { name: 'Manne blanche', scientific: 'Ephoron virgo', category: 'Insectes' },
      { name: 'Éphémère', scientific: 'Ephoron virgo', category: 'Insectes' }
    ];
    
    speciesPatterns.forEach(pattern => {
      if (descriptionLower.includes(pattern.name.toLowerCase()) || 
          descriptionLower.includes(pattern.scientific.toLowerCase())) {
        species.push({
          nom_commun: pattern.name,
          nom_scientifique: pattern.scientific,
          statut_conservation: 'À déterminer',
          description_courte: `Espèce extraite depuis: ${context}`,
          type: pattern.category,
          source_context: context
        });
      }
    });
    
    return species;
  };

  // Gérer la structure nested avec "donnees"
  const dataToProcess = speciesData.donnees || speciesData;

  // Extract species from various data structures
  Object.entries(dataToProcess).forEach(([key, value]) => {
    console.log(`🔍 DEBUG Processing key: "${key}", value type: ${typeof value}`, value);
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
    } else if (typeof value === 'string') {
      // Extraire les espèces depuis les descriptions textuelles (valeur string dans donnees)
      console.log(`🔍 DEBUG Extracting from string key="${key}":`, value);
      const extractedSpecies = extractSpeciesFromDescription(value, key);
      console.log(`🔍 DEBUG Extracted ${extractedSpecies.length} species from "${key}":`, extractedSpecies);
      extractedSpecies.forEach(s => {
        const typeMap: Record<string, string> = {
          'poissons': 'poissons', 'oiseaux': 'oiseaux', 'insectes': 'insectes', 'mammifères': 'mammiferes', 'mammiferes': 'mammiferes', 'invertébrés': 'invertebres', 'invertebres': 'invertebres', 'reptiles': 'reptiles'
        };
        const explicitType = (s.type || '').toString().toLowerCase();
        const fauneType = typeMap[explicitType];
        const category = s.type || (fauneType ? 'Faune' : mapKeyToCategory(s.nom_commun || s.titre).category);
        const speciesObj = createSpeciesObject(s, s.nom_commun || s.titre, category);
        if (category === 'Flore') {
          flore.push(speciesObj);
        } else if (fauneType) {
          faune[fauneType].push(speciesObj);
        } else {
          const infer = mapKeyToCategory(s.nom_commun || s.titre);
          if (infer.fauneType) faune[infer.fauneType].push(speciesObj); else faune.autres.push(speciesObj);
        }
      });
    }
  });

  // Extraire aussi depuis la description générale si présente (hors donnees)
  if (typeof (speciesData as any).description === 'string' && (speciesData as any).description.trim()) {
    console.log(`🔍 DEBUG Extracting from main description:`, (speciesData as any).description);
    const extractedFromDesc = extractSpeciesFromDescription((speciesData as any).description, 'description');
    console.log(`🔍 DEBUG Extracted ${extractedFromDesc.length} species from main description:`, extractedFromDesc);
    extractedFromDesc.forEach(s => {
      const typeMap: Record<string, string> = {
        'poissons': 'poissons', 'oiseaux': 'oiseaux', 'insectes': 'insectes', 'mammifères': 'mammiferes', 'mammiferes': 'mammiferes', 'invertébrés': 'invertebres', 'invertebres': 'invertebres', 'reptiles': 'reptiles'
      };
      const explicitType = (s.type || '').toString().toLowerCase();
      const fauneType = typeMap[explicitType];
      const category = s.type || (fauneType ? 'Faune' : mapKeyToCategory(s.nom_commun || s.titre).category);
      const speciesObj = createSpeciesObject(s, s.nom_commun || s.titre, category);
      if (category === 'Flore') {
        flore.push(speciesObj);
      } else if (fauneType) {
        faune[fauneType].push(speciesObj);
      } else {
        const infer = mapKeyToCategory(s.nom_commun || s.titre);
        if (infer.fauneType) faune[infer.fauneType].push(speciesObj); else faune.autres.push(speciesObj);
      }
    });
  }

  console.log('🔍 DEBUG Final result - Flore:', flore.length, flore);
  console.log('🔍 DEBUG Final result - Faune:', Object.entries(faune).map(([k,v]) => `${k}: ${v.length}`));
  console.log('🔍 DEBUG Total species count:', flore.length + Object.values(faune).reduce((sum, arr) => sum + arr.length, 0));

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