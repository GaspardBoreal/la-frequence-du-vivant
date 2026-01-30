import { useMemo } from 'react';
import type { TexteExport, EpubExportOptions } from '@/utils/epubExportUtils';
import type { BookPage } from '@/registries/types';
import { groupTextesByPartie } from '@/utils/epubExportUtils';

interface UseBookPagesOptions {
  textes: TexteExport[];
  options: EpubExportOptions;
}

export const useBookPages = ({ textes, options }: UseBookPagesOptions): BookPage[] => {
  return useMemo(() => {
    const pages: BookPage[] = [];
    let pageNumber = 1;

    // 1. Cover page (always)
    if (options.includeCover) {
      pages.push({
        id: 'cover',
        type: 'cover',
        title: options.title || 'Couverture',
        pageNumber: pageNumber++,
        data: {
          title: options.title,
          subtitle: options.subtitle,
          author: options.author,
          publisher: options.publisher,
          coverImageUrl: options.coverImageUrl,
        },
      });
    }

    // 2. Table of Contents
    if (options.includeTableOfContents) {
      pages.push({
        id: 'toc',
        type: 'toc',
        title: 'Table des Matières',
        pageNumber: pageNumber++,
        data: { textes },
      });
    }

    // 3. Group content by parties and marches
    const groupedContent = groupTextesByPartie(textes);

    groupedContent.forEach((group, groupIndex) => {
      // Partie page
      if (options.includePartiePages && group.partie) {
        pages.push({
          id: `partie-${group.partie.id}`,
          type: 'partie',
          title: `${group.partie.numeroRomain} - ${group.partie.titre}`,
          pageNumber: pageNumber++,
          data: {
            partie: group.partie,
            groupIndex,
          },
        });
      }

      // Texts within this groupe - marches is a Map<string, MarcheGroup>
      Array.from(group.marches.entries()).forEach(([marcheKey, marcheData]) => {
        marcheData.textes.forEach(texte => {
          pages.push({
            id: `texte-${texte.id}`,
            type: 'texte',
            title: texte.titre,
            pageNumber: pageNumber++,
            data: {
              texte,
              marche: {
                nom: marcheKey,
                ville: texte.marche_ville,
              },
              partie: group.partie,
            },
          });
        });
      });
    });

    // 4. Index pages
    if (options.includeIndexes) {
      pages.push({
        id: 'index-lieu',
        type: 'index-lieu',
        title: 'Index par Lieu',
        pageNumber: pageNumber++,
        data: { textes },
      });

      pages.push({
        id: 'index-genre',
        type: 'index-genre',
        title: 'Index par Genre',
        pageNumber: pageNumber++,
        data: { textes },
      });
    }

    return pages;
  }, [textes, options]);
};

export default useBookPages;
