// ============================================================================
// TYPES COMMUNS POUR LES REGISTRES
// ============================================================================

import type { LucideIcon } from 'lucide-react';
import type { TexteExport, EpubColorScheme, EpubTypography } from '@/utils/epubExportUtils';

// ============================================================================
// PAGE TYPES
// ============================================================================

export interface PageRendererProps {
  colorScheme: EpubColorScheme;
  typography: EpubTypography;
  data?: unknown;
  onNavigate?: (pageIndex: number) => void;
  onNavigateToPageId?: (pageId: string) => boolean;
  onOpenTraversee?: (mode: string) => void;
  externalLinks?: ExternalLink[];
}

export type PageCategory = 'structure' | 'content' | 'navigation' | 'exploration';

export interface PageType {
  id: string;
  label: string;
  icon: LucideIcon;
  category: PageCategory;
  order: number;
}

// ============================================================================
// BOOK PAGES
// ============================================================================

export interface BookPage {
  id: string;
  type: string;
  title: string;
  pageNumber: number;
  data?: unknown;
  externalLinks?: ExternalLink[];
}

// ============================================================================
// TRAVERSEE MODES
// ============================================================================

export interface TraverseeProps {
  textes: TexteExport[];
  colorScheme: EpubColorScheme;
  onBack?: () => void;
  onNavigateToTexteId?: (texteId: string) => void;
}

export type TraverseeCategory = 'visualisation' | 'index' | 'immersion';

export interface TraverseeMode {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  component: React.FC<TraverseeProps>;
  category: TraverseeCategory;
  requiredData?: ('textes' | 'audio' | 'photos' | 'marches')[];
  badge?: 'new' | 'beta' | 'experimental';
}

// ============================================================================
// INDEX TYPES
// ============================================================================

export type IndexCategory = 'geographic' | 'literary' | 'thematic' | 'temporal';

export interface IndexData {
  entries: IndexEntry[];
  groupedBy?: string;
}

export interface IndexEntry {
  label: string;
  pageRef?: number;
  subEntries?: IndexEntry[];
  count?: number;
  texteIds?: string[];
}

export interface IndexType {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  category: IndexCategory;
  extractor: (textes: TexteExport[]) => IndexData;
  exportable: boolean;
  interactive: boolean;
}

// ============================================================================
// EXTERNAL LINKS
// ============================================================================

export type ExternalLinkPlatform = 'blog' | 'social' | 'agent' | 'audio' | 'video' | 'custom';
export type ExternalLinkContext = 'texte' | 'marche' | 'partie' | 'global';

export interface ExternalLink {
  type: string;
  url: string;
  label?: string;
  context: ExternalLinkContext;
}

export interface ExternalLinkType {
  id: string;
  label: string;
  icon: LucideIcon;
  platform: ExternalLinkPlatform;
  urlPattern?: string;
  contexts: ExternalLinkContext[];
  color?: string;
}
