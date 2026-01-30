import React, { useMemo } from 'react';
import { BookOpen, MapPin, Tag, AlertCircle, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TexteExport, EpubExportOptions } from '@/utils/epubExportUtils';

interface EpubIndexPreviewProps {
  textes: TexteExport[];
  options: EpubExportOptions;
}

// Order of literary types for genre index
const GENRE_ORDER = ['haiku', 'senryu', 'poeme', 'fable', 'manifeste'];

const getGenreLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'haiku': 'Haïkus',
    'senryu': 'Senryū',
    'poeme': 'Poèmes',
    'fable': 'Fables',
    'manifeste': 'Manifestes',
  };
  return labels[type.toLowerCase()] || type;
};

const getGenreBadgeStyle = (type: string): string => {
  const styles: Record<string, string> = {
    'haiku': 'bg-emerald-100 text-emerald-700',
    'senryu': 'bg-teal-100 text-teal-700',
    'poeme': 'bg-blue-100 text-blue-700',
    'fable': 'bg-amber-100 text-amber-700',
    'manifeste': 'bg-purple-100 text-purple-700',
  };
  return styles[type.toLowerCase()] || 'bg-gray-100 text-gray-700';
};

const EpubIndexPreview: React.FC<EpubIndexPreviewProps> = ({ textes, options }) => {
  const { colorScheme, includeTableOfContents, includeIndexes } = options;

  // Generate Table of Contents structure
  const tableOfContents = useMemo(() => {
    const toc: Array<{
      level: 'partie' | 'marche';
      numeroRomain?: string;
      titre: string;
      sousTitre?: string;
    }> = [];

    const seenParties = new Set<string>();
    const seenMarches = new Set<string>();

    // Sort textes by partie_ordre then marche_ordre
    const sortedTextes = [...textes].sort((a, b) => {
      const partieOrdreA = a.partie_ordre ?? 999;
      const partieOrdreB = b.partie_ordre ?? 999;
      if (partieOrdreA !== partieOrdreB) return partieOrdreA - partieOrdreB;
      return (a.marche_ordre ?? 999) - (b.marche_ordre ?? 999);
    });

    sortedTextes.forEach(texte => {
      // Add partie entry if not seen
      if (texte.partie_id && texte.partie_titre && !seenParties.has(texte.partie_id)) {
        seenParties.add(texte.partie_id);
        toc.push({
          level: 'partie',
          numeroRomain: texte.partie_numero_romain,
          titre: texte.partie_titre,
          sousTitre: texte.partie_sous_titre,
        });
      }

      // Add marche entry if not seen (within this partie context)
      const marcheName = texte.marche_nom || texte.marche_ville || 'Sans lieu';
      const marcheKey = `${texte.partie_id || 'none'}-${marcheName}`;
      if (!seenMarches.has(marcheKey)) {
        seenMarches.add(marcheKey);
        toc.push({
          level: 'marche',
          titre: marcheName,
        });
      }
    });

    return toc;
  }, [textes]);

  // Generate Location Index (ville -> genres) - ordered by marche_ordre (narrative order)
  const locationIndex = useMemo(() => {
    const indexMap = new Map<string, { genres: Set<string>; minOrdre: number; partieOrdre: number }>();

    textes.forEach(texte => {
      const location = texte.marche_nom || texte.marche_ville || 'Sans lieu';
      const marcheOrdre = texte.marche_ordre ?? 999;
      const partieOrdre = texte.partie_ordre ?? 999;
      
      if (!indexMap.has(location)) {
        indexMap.set(location, { 
          genres: new Set(), 
          minOrdre: marcheOrdre,
          partieOrdre: partieOrdre,
        });
      }
      
      const entry = indexMap.get(location)!;
      entry.genres.add(texte.type_texte.toLowerCase());
      
      // Keep the minimum ordre (first appearance in the narrative)
      if (partieOrdre < entry.partieOrdre || 
          (partieOrdre === entry.partieOrdre && marcheOrdre < entry.minOrdre)) {
        entry.minOrdre = marcheOrdre;
        entry.partieOrdre = partieOrdre;
      }
    });

    // Sort by partie_ordre first, then by marche_ordre (narrative order)
    return Array.from(indexMap.entries())
      .map(([location, data]) => ({
        location,
        genres: Array.from(data.genres)
          .sort((a, b) => GENRE_ORDER.indexOf(a) - GENRE_ORDER.indexOf(b))
          .map(g => getGenreLabel(g)),
        partieOrdre: data.partieOrdre,
        minOrdre: data.minOrdre,
      }))
      .sort((a, b) => {
        if (a.partieOrdre !== b.partieOrdre) return a.partieOrdre - b.partieOrdre;
        return a.minOrdre - b.minOrdre;
      });
  }, [textes]);

  // Generate Genre Index (genre -> villes)
  const genreIndex = useMemo(() => {
    const indexMap = new Map<string, Set<string>>();

    textes.forEach(texte => {
      const genre = texte.type_texte.toLowerCase();
      const location = texte.marche_nom || texte.marche_ville || 'Sans lieu';
      if (!indexMap.has(genre)) {
        indexMap.set(genre, new Set());
      }
      indexMap.get(genre)!.add(location);
    });

    // Convert to sorted array following GENRE_ORDER
    return Array.from(indexMap.entries())
      .map(([genre, locations]) => ({
        genre,
        genreLabel: getGenreLabel(genre),
        locations: Array.from(locations).sort((a, b) => a.localeCompare(b, 'fr')),
        count: textes.filter(t => t.type_texte.toLowerCase() === genre).length,
      }))
      .sort((a, b) => {
        const orderA = GENRE_ORDER.indexOf(a.genre);
        const orderB = GENRE_ORDER.indexOf(b.genre);
        if (orderA === -1 && orderB === -1) return a.genre.localeCompare(b.genre);
        if (orderA === -1) return 1;
        if (orderB === -1) return -1;
        return orderA - orderB;
      });
  }, [textes]);

  // Generate Works Index (alphabetical list of all titles with genre and location)
  const worksIndex = useMemo(() => {
    return textes
      .map(texte => ({
        titre: texte.titre,
        genre: texte.type_texte.toLowerCase(),
        genreLabel: getGenreLabel(texte.type_texte),
        location: texte.marche_nom || texte.marche_ville || 'Sans lieu',
        partieNumero: texte.partie_numero_romain,
      }))
      .sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
  }, [textes]);

  // If no options are enabled
  if (!includeTableOfContents && !includeIndexes) {
    return (
      <div 
        className="h-[400px] flex flex-col items-center justify-center p-8"
        style={{ 
          backgroundColor: colorScheme.background,
          color: colorScheme.text,
        }}
      >
        <AlertCircle 
          className="h-12 w-12 mb-4"
          style={{ color: colorScheme.secondary }}
        />
        <p 
          className="text-sm italic text-center"
          style={{ color: colorScheme.secondary }}
        >
          Aucun index sélectionné
        </p>
        <p 
          className="text-xs text-center mt-2"
          style={{ color: colorScheme.secondary + '80' }}
        >
          Activez la Table des Matières ou les Index dans les options pour les prévisualiser
        </p>
      </div>
    );
  }

  return (
    <div 
      className="h-[400px] flex flex-col"
      style={{ 
        backgroundColor: colorScheme.background,
        color: colorScheme.text,
      }}
    >
      <Tabs defaultValue={includeTableOfContents ? 'toc' : (includeIndexes ? 'works' : 'location')} className="flex-1 flex flex-col">
        <TabsList 
          className="w-full grid rounded-none border-b"
          style={{ 
            gridTemplateColumns: `repeat(${(includeTableOfContents ? 1 : 0) + (includeIndexes ? 3 : 0)}, 1fr)`,
            borderColor: colorScheme.secondary + '30',
          }}
        >
          {includeTableOfContents && (
            <TabsTrigger value="toc" className="text-xs gap-1">
              <BookOpen className="h-3 w-3" />
              Table des Matières
            </TabsTrigger>
          )}
          {includeIndexes && (
            <>
              <TabsTrigger value="works" className="text-xs gap-1">
                <FileText className="h-3 w-3" />
                Par Œuvre
              </TabsTrigger>
              <TabsTrigger value="location" className="text-xs gap-1">
                <MapPin className="h-3 w-3" />
                Par Lieu
              </TabsTrigger>
              <TabsTrigger value="genre" className="text-xs gap-1">
                <Tag className="h-3 w-3" />
                Par Genre
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Table of Contents */}
        {includeTableOfContents && (
          <TabsContent value="toc" className="flex-1 m-0">
            <ScrollArea className="h-[360px] px-4 py-3">
              <h3 
                className="text-sm font-semibold mb-3 uppercase tracking-wide"
                style={{ color: colorScheme.primary }}
              >
                Table des Matières
              </h3>
              <div className="space-y-1">
                {tableOfContents.map((entry, index) => (
                  <div
                    key={index}
                    className={entry.level === 'partie' ? 'mt-3 first:mt-0' : 'ml-4'}
                  >
                    {entry.level === 'partie' ? (
                      <div className="font-medium text-sm">
                        <span style={{ color: colorScheme.primary }}>
                          {entry.numeroRomain}.
                        </span>{' '}
                        {entry.titre}
                        {entry.sousTitre && (
                          <span 
                            className="ml-2 text-xs italic"
                            style={{ color: colorScheme.secondary }}
                          >
                            — {entry.sousTitre}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div 
                        className="text-xs py-0.5"
                        style={{ color: colorScheme.text + 'CC' }}
                      >
                        • {entry.titre}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* Works Index - Alphabetical list of all titles */}
        {includeIndexes && (
          <TabsContent value="works" className="flex-1 m-0">
            <ScrollArea className="h-[360px] px-4 py-3">
              <h3 
                className="text-sm font-semibold mb-3 uppercase tracking-wide"
                style={{ color: colorScheme.primary }}
              >
                Index des Œuvres
              </h3>
              <div className="space-y-1.5">
                {worksIndex.map((entry, index) => (
                  <div key={index} className="text-xs flex items-start gap-2">
                    <span 
                      className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium ${getGenreBadgeStyle(entry.genre)}`}
                    >
                      {entry.genreLabel}
                    </span>
                    <div className="flex-1">
                      <span 
                        className="font-medium"
                        style={{ color: colorScheme.text }}
                      >
                        {entry.titre}
                      </span>
                      <span 
                        className="ml-1 italic text-[10px]"
                        style={{ color: colorScheme.secondary }}
                      >
                        — {entry.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* Location Index */}
        {includeIndexes && (
          <TabsContent value="location" className="flex-1 m-0">
            <ScrollArea className="h-[360px] px-4 py-3">
              <h3 
                className="text-sm font-semibold mb-3 uppercase tracking-wide"
                style={{ color: colorScheme.primary }}
              >
                Index par Lieu
              </h3>
              <div className="space-y-2">
                {locationIndex.map((entry, index) => (
                  <div key={index} className="text-xs">
                    <div className="font-medium" style={{ color: colorScheme.text }}>
                      • {entry.location}
                    </div>
                    <div 
                      className="ml-3 italic"
                      style={{ color: colorScheme.secondary }}
                    >
                      → {entry.genres.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* Genre Index */}
        {includeIndexes && (
          <TabsContent value="genre" className="flex-1 m-0">
            <ScrollArea className="h-[360px] px-4 py-3">
              <h3 
                className="text-sm font-semibold mb-3 uppercase tracking-wide"
                style={{ color: colorScheme.primary }}
              >
                Index par Genre Littéraire
              </h3>
              <div className="space-y-3">
                {genreIndex.map((entry, index) => (
                  <div key={index} className="text-xs">
                    <div className="font-medium flex items-center gap-2">
                      <span style={{ color: colorScheme.text }}>
                        • {entry.genreLabel}
                      </span>
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: colorScheme.accent + '20',
                          color: colorScheme.accent,
                        }}
                      >
                        {entry.count}
                      </span>
                    </div>
                    <div 
                      className="ml-3 mt-0.5"
                      style={{ color: colorScheme.secondary }}
                    >
                      {entry.locations.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default EpubIndexPreview;
