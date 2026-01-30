// ============================================================================
// PAGE TYPES REGISTRY
// ============================================================================

import { Book, Layout, FileText, List, BookOpen, Compass, Activity, Map } from 'lucide-react';
import type { PageType } from './types';

export const PAGE_TYPES_REGISTRY: PageType[] = [
  {
    id: 'cover',
    label: 'Couverture',
    icon: Book,
    category: 'structure',
    order: 0,
  },
  {
    id: 'toc',
    label: 'Table des Matières',
    icon: List,
    category: 'navigation',
    order: 1,
  },
  {
    id: 'partie',
    label: 'Page de Partie',
    icon: Layout,
    category: 'structure',
    order: 2,
  },
  {
    id: 'texte',
    label: 'Texte',
    icon: FileText,
    category: 'content',
    order: 3,
  },
  {
    id: 'index-lieu',
    label: 'Index par Lieu',
    icon: Map,
    category: 'navigation',
    order: 100,
  },
  {
    id: 'index-genre',
    label: 'Index par Genre',
    icon: BookOpen,
    category: 'navigation',
    order: 101,
  },
  {
    id: 'traversee',
    label: 'Traversée',
    icon: Compass,
    category: 'exploration',
    order: 200,
  },
];

export const getPageType = (id: string): PageType | undefined => {
  return PAGE_TYPES_REGISTRY.find(p => p.id === id);
};

export const getPageTypesByCategory = (category: PageType['category']): PageType[] => {
  return PAGE_TYPES_REGISTRY.filter(p => p.category === category);
};
