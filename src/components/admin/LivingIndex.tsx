import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { TexteExport } from '@/utils/epubExportUtils';
import { KEYWORD_CATEGORIES } from '@/utils/wordExportUtils';

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

interface WorldData {
  id: string;
  label: string;
  keywords: string[];
  occurrences: Map<string, { count: number; texteIds: string[] }>;
  totalOccurrences: number;
  texteCount: number;
  angle: number;
  color: string;
  animation: 'erratic' | 'wave' | 'static' | 'growth' | 'pulse' | 'breathe' | 'spin';
}

// Couleurs distinctives par monde
const WORLD_COLORS: Record<string, string> = {
  faune: '#059669',      // Vert émeraude - la migration
  hydrologie: '#1d4ed8', // Bleu profond - le courant
  ouvrages: '#6b7280',   // Gris pierre - la permanence
  flore: '#65a30d',      // Vert mousse - l'enracinement
  temporalites: '#d97706', // Ambre - le temps qui passe
  poetique: '#a855f7',   // Violet - le souffle poétique
  technologies: '#3b82f6', // Bleu électrique - le signal
};

// Animations par monde
const WORLD_ANIMATIONS: Record<string, WorldData['animation']> = {
  faune: 'erratic',
  hydrologie: 'wave',
  ouvrages: 'static',
  flore: 'growth',
  temporalites: 'pulse',
  poetique: 'breathe',
  technologies: 'spin',
};

const LivingIndex: React.FC<LivingIndexProps> = ({ textes, colorScheme }) => {
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [hoveredWorld, setHoveredWorld] = useState<string | null>(null);

  // Extraction et agrégation des mots-clés depuis les textes
  const worldsData = useMemo(() => {
    const worlds: WorldData[] = KEYWORD_CATEGORIES.map((category, index) => {
      const occurrences = new Map<string, { count: number; texteIds: string[] }>();
      const texteIds = new Set<string>();

      // Scanner chaque texte pour les mots-clés de cette catégorie
      textes.forEach(texte => {
        const content = `${texte.titre} ${texte.contenu}`.toLowerCase();
        
        category.keywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
          const matches = content.match(regex);
          
          if (matches && matches.length > 0) {
            const existing = occurrences.get(keyword) || { count: 0, texteIds: [] };
            existing.count += matches.length;
            if (!existing.texteIds.includes(texte.id)) {
              existing.texteIds.push(texte.id);
            }
            occurrences.set(keyword, existing);
            texteIds.add(texte.id);
          }
        });
      });

      const totalOccurrences = Array.from(occurrences.values()).reduce((sum, o) => sum + o.count, 0);
      
      // Répartition angulaire sur le cercle (7 mondes)
      const angle = (index * 360 / 7) - 90; // -90 pour commencer en haut

      return {
        id: category.id,
        label: category.label,
        keywords: category.keywords,
        occurrences,
        totalOccurrences,
        texteCount: texteIds.size,
        angle,
        color: WORLD_COLORS[category.id] || colorScheme.accent,
        animation: WORLD_ANIMATIONS[category.id] || 'pulse',
      };
    });

    return worlds;
  }, [textes, colorScheme.accent]);

  // Taille normalisée des mondes selon leur densité
  const maxOccurrences = Math.max(...worldsData.map(w => w.totalOccurrences), 1);

  // Calcul de position sur le cercle orbital
  const getWorldPosition = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: 50 + radius * Math.cos(rad),
      y: 50 + radius * Math.sin(rad),
    };
  };

  // Animation variants par type de monde
  const getWorldAnimation = (world: WorldData) => {
    const baseScale = 0.8 + (world.totalOccurrences / maxOccurrences) * 0.7;
    
    switch (world.animation) {
      case 'erratic':
        return {
          animate: {
            x: [0, 2, -1, 1, 0],
            y: [0, -1, 2, -1, 0],
            scale: [baseScale, baseScale * 1.02, baseScale],
          },
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'wave':
        return {
          animate: {
            y: [0, -3, 0, 3, 0],
            scale: [baseScale, baseScale * 1.03, baseScale],
          },
          transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'static':
        return {
          animate: {
            scale: [baseScale, baseScale * 1.01, baseScale],
          },
          transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'growth':
        return {
          animate: {
            scale: [baseScale * 0.95, baseScale * 1.05, baseScale * 0.95],
          },
          transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'pulse':
        return {
          animate: {
            opacity: [0.7, 1, 0.7],
            scale: [baseScale, baseScale * 1.1, baseScale],
          },
          transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'breathe':
        return {
          animate: {
            scale: [baseScale * 0.9, baseScale * 1.1, baseScale * 0.9],
            opacity: [0.8, 1, 0.8],
          },
          transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'spin':
        return {
          animate: {
            rotate: [0, 360],
            scale: [baseScale, baseScale * 1.02, baseScale],
          },
          transition: { duration: 20, repeat: Infinity, ease: 'linear' as const },
        };
      default:
        return {
          animate: { scale: baseScale },
          transition: { duration: 3 },
        };
    }
  };

  // Vue détaillée d'un monde
  const selectedWorldData = worldsData.find(w => w.id === selectedWorld);

  if (textes.length === 0) {
    return (
      <div 
        className="h-full flex items-center justify-center"
        style={{ backgroundColor: colorScheme.background }}
      >
        <p className="text-sm italic" style={{ color: colorScheme.secondary }}>
          Aucun texte à explorer
        </p>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col overflow-hidden relative"
      style={{ backgroundColor: colorScheme.background }}
    >
      <AnimatePresence mode="wait">
        {selectedWorld && selectedWorldData ? (
          // Vue détaillée d'un monde
          <motion.div
            key="detail"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="h-full flex flex-col p-4 overflow-hidden"
          >
            {/* Header avec retour */}
            <button
              onClick={() => setSelectedWorld(null)}
              className="flex items-center gap-2 mb-4 text-sm transition-opacity hover:opacity-80"
              style={{ color: colorScheme.secondary }}
            >
              <ArrowLeft size={16} />
              Retour au cosmos
            </button>

            {/* Titre du monde */}
            <div className="text-center mb-6">
              <motion.div
                className="w-16 h-16 mx-auto mb-3 rounded-full"
                style={{ backgroundColor: selectedWorldData.color }}
                animate={{ 
                  boxShadow: [
                    `0 0 20px ${selectedWorldData.color}40`,
                    `0 0 40px ${selectedWorldData.color}60`,
                    `0 0 20px ${selectedWorldData.color}40`,
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <h3 
                className="text-lg font-serif tracking-wide"
                style={{ color: colorScheme.text }}
              >
                {selectedWorldData.label}
              </h3>
              <p 
                className="text-xs mt-1"
                style={{ color: colorScheme.secondary }}
              >
                {selectedWorldData.totalOccurrences} occurrences · {selectedWorldData.texteCount} textes
              </p>
            </div>

            {/* Liste des mots-clés trouvés */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {Array.from(selectedWorldData.occurrences.entries())
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([keyword, data], index) => (
                    <motion.div
                      key={keyword}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: `${selectedWorldData.color}15` }}
                    >
                      {/* Indicateur de densité */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(data.count, 5) }).map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: selectedWorldData.color }}
                          />
                        ))}
                        {data.count > 5 && (
                          <span 
                            className="text-[10px] ml-1"
                            style={{ color: selectedWorldData.color }}
                          >
                            +{data.count - 5}
                          </span>
                        )}
                      </div>
                      
                      <span 
                        className="font-serif italic flex-1"
                        style={{ color: colorScheme.text }}
                      >
                        {keyword}
                      </span>
                      
                      <span 
                        className="text-xs"
                        style={{ color: colorScheme.secondary }}
                      >
                        {data.texteIds.length} texte{data.texteIds.length > 1 ? 's' : ''}
                      </span>
                    </motion.div>
                  ))}
                
                {selectedWorldData.occurrences.size === 0 && (
                  <p 
                    className="text-center text-sm italic py-8"
                    style={{ color: colorScheme.secondary }}
                  >
                    Aucune occurrence trouvée dans les textes
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          // Vue cosmique principale
          <motion.div
            key="cosmos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            {/* Titre */}
            <div className="text-center py-3 px-4">
              <h3 
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: colorScheme.secondary }}
              >
                Index Vivant
              </h3>
              <p 
                className="text-[10px] italic mt-1"
                style={{ color: `${colorScheme.secondary}80` }}
              >
                Les sept mondes de la Dordogne
              </p>
            </div>

            {/* Visualisation orbitale */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
              <svg
                viewBox="-10 -10 120 120"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full max-w-[400px] max-h-[400px] sm:max-w-none sm:max-h-none"
              >
                {/* Orbites (cercles de fond) */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke={`${colorScheme.secondary}20`}
                  strokeWidth="0.2"
                  strokeDasharray="1 1"
                />
                
                {/* Centre pulsant - Le Recueil */}
                <motion.g
                  animate={{ 
                    opacity: [0.6, 1, 0.6],
                    scale: [0.95, 1.05, 0.95],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="8"
                    fill={`${colorScheme.accent}30`}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="5"
                    fill={colorScheme.accent}
                  />
                  <text
                    x="50"
                    y="50"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="2"
                    fill={colorScheme.background}
                    fontWeight="bold"
                  >
                    ✦
                  </text>
                </motion.g>

                {/* Les 7 mondes */}
                {worldsData.map((world) => {
                  const pos = getWorldPosition(world.angle, 35);
                  const worldAnim = getWorldAnimation(world);
                  const isHovered = hoveredWorld === world.id;
                  const isOtherHovered = hoveredWorld && hoveredWorld !== world.id;
                  const worldRadius = 3 + (world.totalOccurrences / maxOccurrences) * 4;

                  return (
                    <motion.g
                      key={world.id}
                      style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                      animate={{
                        ...worldAnim.animate,
                        opacity: isOtherHovered ? 0.3 : 1,
                      }}
                      transition={worldAnim.transition}
                      onHoverStart={() => setHoveredWorld(world.id)}
                      onHoverEnd={() => setHoveredWorld(null)}
                      onClick={() => setSelectedWorld(world.id)}
                      className="cursor-pointer"
                    >
                      {/* Halo au survol */}
                      {isHovered && (
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={worldRadius + 3}
                          fill="none"
                          stroke={world.color}
                          strokeWidth="0.3"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.2, 1],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}

                      {/* Le monde lui-même */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={worldRadius}
                        fill={world.color}
                        style={{
                          filter: isHovered ? `drop-shadow(0 0 3px ${world.color})` : 'none',
                        }}
                      />

                      {/* Satellites (mots-clés au survol) */}
                      {isHovered && (
                        <motion.g
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {Array.from(world.occurrences.entries())
                            .slice(0, 5)
                            .map(([keyword], i) => {
                              const satelliteAngle = world.angle + (i - 2) * 25;
                              const satellitePos = getWorldPosition(satelliteAngle, 35 + 8);
                              return (
                                <motion.text
                                  key={keyword}
                                  x={satellitePos.x}
                                  y={satellitePos.y}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="2"
                                  fontStyle="italic"
                                  fill={colorScheme.text}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 0.8, scale: 1 }}
                                  transition={{ delay: i * 0.1 }}
                                >
                                  {keyword}
                                </motion.text>
                              );
                            })}
                        </motion.g>
                      )}

                      {/* Label du monde */}
                      <text
                        x={pos.x}
                        y={pos.y + worldRadius + 3}
                        textAnchor="middle"
                        fontSize="2.2"
                        fontWeight="500"
                        fill={isHovered ? world.color : colorScheme.text}
                        style={{ 
                          transition: 'fill 0.3s ease',
                          opacity: isOtherHovered ? 0.3 : 1,
                        }}
                      >
                        {world.label.split(' ')[0]}
                      </text>

                      {/* Stats au survol */}
                      {isHovered && (
                        <motion.text
                          x={pos.x}
                          y={pos.y + worldRadius + 5.5}
                          textAnchor="middle"
                          fontSize="1.5"
                          fill={colorScheme.secondary}
                          initial={{ opacity: 0, y: -2 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {world.totalOccurrences} · {world.texteCount} textes
                        </motion.text>
                      )}
                    </motion.g>
                  );
                })}

                {/* Connexions entre mondes (lignes fines) */}
                {worldsData.map((world, i) => {
                  const nextWorld = worldsData[(i + 1) % worldsData.length];
                  const pos1 = getWorldPosition(world.angle, 35);
                  const pos2 = getWorldPosition(nextWorld.angle, 35);
                  return (
                    <motion.line
                      key={`connection-${i}`}
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke={`${colorScheme.secondary}15`}
                      strokeWidth="0.15"
                      animate={{
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{ 
                        duration: 3 + i * 0.5, 
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Légende */}
            <div 
              className="text-center py-2 px-4 shrink-0"
              style={{ borderTop: `1px solid ${colorScheme.secondary}15` }}
            >
              <p 
                className="text-[9px] sm:text-[10px]"
                style={{ color: colorScheme.secondary }}
              >
                <span className="hidden sm:inline">Survolez un monde pour explorer ses satellites · </span>
                <span className="sm:hidden">Touchez un monde pour </span>
                <span className="hidden sm:inline">Cliquez pour plonger</span>
                <span className="sm:hidden">l'explorer</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LivingIndex;
