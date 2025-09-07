import type { Technodiversite, InnovationTech } from '@/types/opus';

export interface ProcessedTechnologyItem {
  titre: string;
  type: string;
  contenu?: string;
  description?: string;
  metadata: {
    type_innovation: string;
    autonomie_energetique: boolean;
    cout_fabrication?: string;
    documentation_ouverte: boolean;
    source_ids: string[];
  };
}

export interface ProcessedTechnologyData {
  innovations: ProcessedTechnologyItem[];
  sources: string[];
}

/**
 * Traite les données de technodiversité pour les convertir en format standard des vignettes
 */
export function processTechnologyData(data: Technodiversite): ProcessedTechnologyData {
  const processedInnovations: ProcessedTechnologyItem[] = [];
  const allSourceIds: string[] = [...(data.sources || [])];

  // Traiter chaque innovation
  (data.innovations || []).forEach((innovation: InnovationTech) => {
    // Filtrer les innovations vides ou invalides
    if (!innovation.nom || innovation.nom.trim() === '') {
      return;
    }

    processedInnovations.push({
      titre: innovation.nom,
      type: 'innovation',
      contenu: innovation.description || '',
      description: innovation.description || '',
      metadata: {
        type_innovation: innovation.type,
        autonomie_energetique: innovation.autonomie_energetique,
        cout_fabrication: innovation.cout_fabrication,
        documentation_ouverte: innovation.documentation_ouverte,
        source_ids: [...allSourceIds] // Toutes les innovations partagent les mêmes sources
      }
    });
  });

  // Ajouter les projets open source comme innovations séparées si présents
  if (data.open_source_projects?.length) {
    data.open_source_projects.forEach(project => {
      if (project && project.trim() !== '') {
        processedInnovations.push({
          titre: project,
          type: 'open_source',
          contenu: `Projet open source: ${project}`,
          description: `Projet open source: ${project}`,
          metadata: {
            type_innovation: 'open-source',
            autonomie_energetique: false,
            documentation_ouverte: true,
            source_ids: [...allSourceIds]
          }
        });
      }
    });
  }

  // Ajouter les éléments de fabrication locale si présents
  if (data.fabrication_locale?.length) {
    data.fabrication_locale.forEach(item => {
      if (item && item.trim() !== '') {
        processedInnovations.push({
          titre: item,
          type: 'fabrication_locale',
          contenu: `Initiative de fabrication locale: ${item}`,
          description: `Initiative de fabrication locale: ${item}`,
          metadata: {
            type_innovation: 'fabrication-locale',
            autonomie_energetique: false,
            documentation_ouverte: false,
            source_ids: [...allSourceIds]
          }
        });
      }
    });
  }

  return {
    innovations: processedInnovations,
    sources: allSourceIds
  };
}

/**
 * Collecte tous les IDs de sources référencées dans les données technodiversité
 */
export function collectTechnologySourceIds(data: Technodiversite): string[] {
  return [...(data.sources || [])];
}