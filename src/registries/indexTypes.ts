// ============================================================================
// INDEX TYPES REGISTRY
// ============================================================================

import { Map, BookOpen, FileText, Tag, Clock, Heart, Music } from 'lucide-react';
import type { IndexType, IndexData } from './types';
import type { TexteExport } from '@/utils/epubExportUtils';

// ============================================================================
// INDEX EXTRACTORS
// ============================================================================

const extractIndexByLieu = (textes: TexteExport[]): IndexData => {
  const byLieu: Record<string, { count: number; texteIds: string[] }> = {};
  
  textes.forEach(t => {
    const lieu = t.marche_nom || t.marche_ville || 'Sans lieu';
    if (!byLieu[lieu]) {
      byLieu[lieu] = { count: 0, texteIds: [] };
    }
    byLieu[lieu].count++;
    byLieu[lieu].texteIds.push(t.id);
  });

  return {
    entries: Object.entries(byLieu).map(([label, data]) => ({
      label,
      count: data.count,
    })),
    groupedBy: 'lieu',
  };
};

const extractIndexByGenre = (textes: TexteExport[]): IndexData => {
  const byGenre: Record<string, { count: number; texteIds: string[] }> = {};
  
  textes.forEach(t => {
    const genre = t.type_texte || 'Autre';
    if (!byGenre[genre]) {
      byGenre[genre] = { count: 0, texteIds: [] };
    }
    byGenre[genre].count++;
    byGenre[genre].texteIds.push(t.id);
  });

  return {
    entries: Object.entries(byGenre)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([label, data]) => ({
        label,
        count: data.count,
      })),
    groupedBy: 'genre',
  };
};

const extractIndexByOeuvres = (textes: TexteExport[]): IndexData => {
  return {
    entries: textes
      .slice()
      .sort((a, b) => a.titre.localeCompare(b.titre, 'fr'))
      .map(t => ({
        label: t.titre,
        subEntries: [{
          label: t.marche_nom || t.marche_ville || '',
        }],
      })),
    groupedBy: 'alphabetique',
  };
};

// ============================================================================
// REGISTRY
// ============================================================================

export const INDEX_TYPES_REGISTRY: IndexType[] = [
  {
    id: 'lieu',
    label: 'Index par Lieu',
    icon: Map,
    description: 'Textes groupés par lieu de création',
    category: 'geographic',
    extractor: extractIndexByLieu,
    exportable: true,
    interactive: true,
  },
  {
    id: 'genre',
    label: 'Index par Genre',
    icon: BookOpen,
    description: 'Textes groupés par genre littéraire',
    category: 'literary',
    extractor: extractIndexByGenre,
    exportable: true,
    interactive: true,
  },
  {
    id: 'oeuvres',
    label: 'Index des Œuvres',
    icon: FileText,
    description: 'Liste alphabétique de tous les textes',
    category: 'literary',
    extractor: extractIndexByOeuvres,
    exportable: true,
    interactive: false,
  },
];

// Index futurs envisagés
export const FUTURE_INDEX_TYPES: Omit<IndexType, 'extractor'>[] = [
  {
    id: 'mots-cles',
    label: 'Index Thématique',
    icon: Tag,
    description: 'Les 7 mondes de la Comédie Hybride',
    category: 'thematic',
    exportable: true,
    interactive: true,
  },
  {
    id: 'temporel',
    label: 'Index Temporel',
    icon: Clock,
    description: 'Périodes évoquées (2050, Holocène...)',
    category: 'temporal',
    exportable: false,
    interactive: true,
  },
  {
    id: 'emotionnel',
    label: 'Index Émotionnel',
    icon: Heart,
    description: 'Classification par tonalité émotionnelle',
    category: 'thematic',
    exportable: false,
    interactive: true,
  },
  {
    id: 'sonore',
    label: 'Index Sonore',
    icon: Music,
    description: 'Par paysage sonore associé',
    category: 'thematic',
    exportable: false,
    interactive: true,
  },
];

export const getIndexType = (id: string): IndexType | undefined => {
  return INDEX_TYPES_REGISTRY.find(i => i.id === id);
};

export const getIndexTypesByCategory = (category: IndexType['category']): IndexType[] => {
  return INDEX_TYPES_REGISTRY.filter(i => i.category === category);
};
