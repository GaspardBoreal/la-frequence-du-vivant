import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TexteExport } from '@/utils/epubExportUtils';

interface LivingIndexProps {
  textes: TexteExport[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

interface LocationData {
  location: string;
  partieId?: string;
  partieNumero?: string;
  partieTitre?: string;
  partieOrdre: number;
  marcheOrdre: number;
  textCount: number;
  genreCount: number;
  intensity: number; // 0 to 1, normalized
}

interface GroupedByPartie {
  partieId: string | null;
  partieNumero: string | null;
  partieTitre: string | null;
  partieOrdre: number;
  locations: LocationData[];
}

const LivingIndex: React.FC<LivingIndexProps> = ({ textes, colorScheme }) => {
  // Process textes into grouped locations
  const groupedData = useMemo(() => {
    // Group by marche within parties
    const marcheMap = new Map<string, LocationData>();

    textes.forEach(texte => {
      const location = texte.marche_nom || texte.marche_ville || 'Sans lieu';
      const key = `${texte.partie_id || 'none'}-${location}`;

      if (!marcheMap.has(key)) {
        marcheMap.set(key, {
          location,
          partieId: texte.partie_id,
          partieNumero: texte.partie_numero_romain,
          partieTitre: texte.partie_titre,
          partieOrdre: texte.partie_ordre ?? 999,
          marcheOrdre: texte.marche_ordre ?? 999,
          textCount: 0,
          genreCount: 0,
          intensity: 0,
        });
      }

      const entry = marcheMap.get(key)!;
      entry.textCount++;
    });

    // Calculate unique genres per location
    const genresPerLocation = new Map<string, Set<string>>();
    textes.forEach(texte => {
      const location = texte.marche_nom || texte.marche_ville || 'Sans lieu';
      const key = `${texte.partie_id || 'none'}-${location}`;
      
      if (!genresPerLocation.has(key)) {
        genresPerLocation.set(key, new Set());
      }
      genresPerLocation.get(key)!.add(texte.type_texte.toLowerCase());
    });

    // Update genre counts
    marcheMap.forEach((entry, key) => {
      entry.genreCount = genresPerLocation.get(key)?.size || 0;
    });

    // Calculate intensity based on text count and genre variety
    const entries = Array.from(marcheMap.values());
    const maxTextCount = Math.max(...entries.map(e => e.textCount), 1);
    const maxGenreCount = Math.max(...entries.map(e => e.genreCount), 1);

    entries.forEach(entry => {
      // Intensity combines text density and genre variety
      const textScore = entry.textCount / maxTextCount;
      const genreScore = entry.genreCount / maxGenreCount;
      entry.intensity = textScore * 0.6 + genreScore * 0.4;
    });

    // Sort by narrative order
    entries.sort((a, b) => {
      if (a.partieOrdre !== b.partieOrdre) return a.partieOrdre - b.partieOrdre;
      return a.marcheOrdre - b.marcheOrdre;
    });

    // Group by partie
    const partieMap = new Map<string, GroupedByPartie>();

    entries.forEach(entry => {
      const partieKey = entry.partieId || 'none';
      
      if (!partieMap.has(partieKey)) {
        partieMap.set(partieKey, {
          partieId: entry.partieId || null,
          partieNumero: entry.partieNumero || null,
          partieTitre: entry.partieTitre || null,
          partieOrdre: entry.partieOrdre,
          locations: [],
        });
      }

      partieMap.get(partieKey)!.locations.push(entry);
    });

    return Array.from(partieMap.values()).sort((a, b) => a.partieOrdre - b.partieOrdre);
  }, [textes]);

  // Calculate pulsation duration based on intensity (higher intensity = faster pulse)
  const getPulseDuration = (intensity: number): number => {
    // Range: 5s (low intensity) to 2s (high intensity)
    return 5 - intensity * 3;
  };

  if (textes.length === 0) {
    return (
      <div 
        className="h-full flex items-center justify-center"
        style={{ backgroundColor: colorScheme.background }}
      >
        <p 
          className="text-sm italic"
          style={{ color: colorScheme.secondary }}
        >
          Aucun texte à indexer
        </p>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col p-6 overflow-hidden"
      style={{ backgroundColor: colorScheme.background }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h3 
          className="text-xs uppercase tracking-[0.3em] mb-1"
          style={{ color: colorScheme.secondary }}
        >
          Index Vivant
        </h3>
        <p 
          className="text-[10px] italic"
          style={{ color: colorScheme.secondary + '80' }}
        >
          Les lieux respirent selon leur densité poétique
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {groupedData.map((partie, partieIndex) => (
            <motion.div
              key={partie.partieId || 'none'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: partieIndex * 0.1 }}
            >
              {/* Partie separator */}
              {partie.partieNumero && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div 
                    className="flex-1 h-px"
                    style={{ backgroundColor: colorScheme.accent + '40' }}
                  />
                  <span 
                    className="text-lg font-serif italic tracking-wide"
                    style={{ color: colorScheme.accent }}
                  >
                    {partie.partieNumero}
                  </span>
                  <div 
                    className="flex-1 h-px"
                    style={{ backgroundColor: colorScheme.accent + '40' }}
                  />
                </div>
              )}

              {/* Locations */}
              <div className="space-y-3">
                {partie.locations.map((loc, locIndex) => (
                  <motion.div
                    key={`${partie.partieId}-${loc.location}`}
                    className="text-center group cursor-default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: partieIndex * 0.1 + locIndex * 0.05 
                    }}
                  >
                    {/* Location name with breathing animation */}
                    <motion.div
                      animate={{ 
                        opacity: [0.7, 1, 0.7],
                        scale: [1, 1 + loc.intensity * 0.02, 1],
                      }}
                      transition={{
                        duration: getPulseDuration(loc.intensity),
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <p
                        className="font-serif italic tracking-[0.2em] text-lg transition-all duration-300 group-hover:tracking-[0.3em]"
                        style={{ 
                          color: colorScheme.text,
                          fontSize: `${1 + loc.intensity * 0.3}rem`,
                        }}
                      >
                        {loc.location}
                      </p>
                    </motion.div>

                    {/* Text count on hover */}
                    <motion.p
                      className="text-[10px] mt-1 transition-opacity duration-300"
                      style={{ 
                        color: colorScheme.secondary,
                        opacity: 0.5,
                      }}
                      whileHover={{ opacity: 1 }}
                    >
                      {loc.textCount} texte{loc.textCount > 1 ? 's' : ''}
                      {loc.genreCount > 1 && ` · ${loc.genreCount} genres`}
                    </motion.p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer legend */}
      <div 
        className="mt-4 pt-3 text-center"
        style={{ borderTop: `1px solid ${colorScheme.secondary}20` }}
      >
        <p 
          className="text-[9px]"
          style={{ color: colorScheme.secondary }}
        >
          La pulsation des noms reflète l'intensité poétique de chaque lieu
        </p>
      </div>
    </div>
  );
};

export default LivingIndex;
