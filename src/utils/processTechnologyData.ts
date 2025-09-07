import type { VignetteData } from '@/components/opus/InteractiveVignette';

export const processTechnologyData = (contextData: any, importSources: any[] = []): VignetteData[] => {
  const result: VignetteData[] = [];
  
  if (!contextData) {
    return result;
  }

  // Accept both full contexte_data and direct technodiversite object
  const techData = (contextData.technodiversite ?? contextData) as any;
  if (!techData || typeof techData !== 'object') {
    return result;
  }

  // Collect all innovations from different categories
  const allInnovations: VignetteData[] = [];
  const allSourceIds: string[] = [];

  // Helper to collect source ids from an item
  const collectIds = (item: any) => {
    const raw = item?.source_ids || item?.sources || [];
    const arr = Array.isArray(raw) ? raw : [];
    for (const v of arr) {
      const id = typeof v === 'string' ? v : (v?.id || v?.key || v?.source_id);
      if (id) allSourceIds.push(String(id));
    }
  };

  // Process innovations
  if (techData.innovations && Array.isArray(techData.innovations)) {
    techData.innovations.forEach((innovation: any) => {
      allInnovations.push({
        titre: innovation.nom || innovation.title || 'Innovation sans nom',
        description_courte: innovation.description_courte || innovation.description || '',
        definition: innovation.description || innovation.definition || '',
        type: innovation.type || 'innovation',
        category: 'technodiversite',
        metadata: innovation
      });
      collectIds(innovation);
    });
  }

  // Process fabrication_locale
  if (techData.fabrication_locale && Array.isArray(techData.fabrication_locale)) {
    techData.fabrication_locale.forEach((fab: any) => {
      allInnovations.push({
        titre: fab.nom || fab.title || 'Fabrication locale',
        description_courte: fab.description_courte || fab.description || '',
        definition: fab.description || fab.definition || '',
        type: fab.type || 'fabrication',
        category: 'technodiversite',
        metadata: fab
      });
      collectIds(fab);
    });
  }

  // Process impact_territorial
  if (techData.impact_territorial && Array.isArray(techData.impact_territorial)) {
    techData.impact_territorial.forEach((impact: any) => {
      allInnovations.push({
        titre: impact.nom || impact.title || 'Impact territorial',
        description_courte: impact.description_courte || impact.description || '',
        definition: impact.description || impact.definition || '',
        type: impact.type || 'impact',
        category: 'technodiversite',
        metadata: impact
      });
      collectIds(impact);
    });
  }

  // Process open_source_projects
  if (techData.open_source_projects && Array.isArray(techData.open_source_projects)) {
    techData.open_source_projects.forEach((project: any) => {
      allInnovations.push({
        titre: project.nom || project.name || project.title || 'Projet open source',
        description_courte: project.description_courte || project.description || '',
        definition: project.description || project.definition || '',
        type: project.type || 'open_source',
        category: 'technodiversite',
        metadata: project,
        url: project.url || project.repository
      });
      collectIds(project);
    });
  }

  // Collect source_ids
  if (techData.source_ids && Array.isArray(techData.source_ids)) {
    allSourceIds.push(...techData.source_ids);
  }

  // Sort innovations alphabetically by title
  allInnovations.sort((a, b) => a.titre.localeCompare(b.titre));

  // Create section header for innovations
  if (allInnovations.length > 0) {
    result.push({
      titre: `Technodiversité locale`,
      description_courte: `${allInnovations.length} innovations documentées`,
      type: 'section_header',
      category: 'technodiversite',
      metadata: { 
        sectionType: 'innovations',
        count: allInnovations.length
      }
    });

    // Add all innovations
    result.push(...allInnovations);
  }

  // Create horizontal banner for sources if we have source_ids
  if (allSourceIds.length > 0) {
    result.push({
      titre: 'Sources bibliographiques',
      description_courte: `Documentation et références de la technodiversité locale`,
      type: 'sources_banner',
      category: 'technodiversite',
      metadata: {
        sectionType: 'sources',
        sourceIds: [...new Set(allSourceIds)], // Remove duplicates
        count: [...new Set(allSourceIds)].length,
        importSources
      }
    });
  }

  return result;
};

export const collectTechnologySourceIds = (data: any): string[] => {
  if (!data) return [];
  const tech: any = (data.technodiversite ?? data);
  if (!tech || typeof tech !== 'object') return [];
  const ids: string[] = [];
  const collect = (item: any) => {
    const raw = item?.source_ids || item?.sources || [];
    const arr = Array.isArray(raw) ? raw : [];
    for (const v of arr) {
      const id = typeof v === 'string' ? v : (v?.id || v?.key || v?.source_id);
      if (id) ids.push(String(id));
    }
  };
  if (Array.isArray(tech.innovations)) tech.innovations.forEach(collect);
  if (Array.isArray(tech.fabrication_locale)) tech.fabrication_locale.forEach(collect);
  if (Array.isArray(tech.impact_territorial)) tech.impact_territorial.forEach(collect);
  if (Array.isArray(tech.open_source_projects)) tech.open_source_projects.forEach(collect);
  if (Array.isArray(tech.source_ids)) ids.push(...tech.source_ids.map(String));
  return Array.from(new Set(ids));
};