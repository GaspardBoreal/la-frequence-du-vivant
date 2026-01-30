// ============================================================================
// REGISTRIES - POINT D'ENTRÉE CENTRALISÉ
// ============================================================================

// Types
export * from './types';

// Page Types
export { 
  PAGE_TYPES_REGISTRY, 
  getPageType, 
  getPageTypesByCategory 
} from './pageTypes';

// Traversee Modes
export { 
  TRAVERSEE_MODES_REGISTRY, 
  FUTURE_TRAVERSEE_MODES,
  getTraverseeMode, 
  getTraverseeModesByCategory 
} from './traverseeModes';

// Index Types
export { 
  INDEX_TYPES_REGISTRY, 
  FUTURE_INDEX_TYPES,
  getIndexType, 
  getIndexTypesByCategory 
} from './indexTypes';

// External Links
export { 
  EXTERNAL_LINKS_REGISTRY, 
  getExternalLinkType, 
  getExternalLinksByPlatform,
  getExternalLinksByContext 
} from './externalLinks';
