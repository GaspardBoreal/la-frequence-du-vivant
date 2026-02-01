import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useRegionalCoverage, RegionalCoverage } from '@/hooks/useRegionalCoverage';

// Simplified France regions SVG paths
// These are approximate paths for each region
const REGIONS_PATHS: Record<string, { path: string; center: { x: number; y: number } }> = {
  'NOUVELLE-AQUITAINE': {
    path: 'M120,280 L180,250 L200,300 L180,380 L120,400 L80,350 L100,300 Z',
    center: { x: 140, y: 320 }
  },
  'OCCITANIE': {
    path: 'M180,380 L280,340 L320,400 L280,450 L180,450 L150,420 Z',
    center: { x: 230, y: 400 }
  },
  'AUVERGNE-RHÔNE-ALPES': {
    path: 'M280,220 L340,200 L380,260 L360,320 L280,340 L240,280 Z',
    center: { x: 310, y: 270 }
  },
  'BRETAGNE': {
    path: 'M40,160 L120,140 L140,180 L100,200 L40,200 Z',
    center: { x: 90, y: 170 }
  },
  'PAYS DE LA LOIRE': {
    path: 'M100,200 L180,180 L200,220 L180,250 L120,280 L80,240 Z',
    center: { x: 140, y: 230 }
  },
  'ÎLE-DE-FRANCE': {
    path: 'M220,140 L260,130 L280,160 L260,180 L220,170 Z',
    center: { x: 245, y: 155 }
  },
  'GRAND EST': {
    path: 'M280,100 L380,80 L400,160 L340,200 L280,160 Z',
    center: { x: 335, y: 140 }
  },
  'HAUTS-DE-FRANCE': {
    path: 'M200,60 L280,40 L300,100 L260,130 L200,120 Z',
    center: { x: 245, y: 85 }
  },
  'NORMANDIE': {
    path: 'M120,100 L200,80 L220,140 L180,160 L120,140 Z',
    center: { x: 165, y: 120 }
  },
  'CENTRE-VAL DE LOIRE': {
    path: 'M180,180 L260,180 L280,220 L240,280 L180,250 L160,220 Z',
    center: { x: 215, y: 225 }
  },
  'BOURGOGNE-FRANCHE-COMTÉ': {
    path: 'M280,160 L340,150 L380,200 L340,260 L280,220 L260,180 Z',
    center: { x: 310, y: 200 }
  },
  "PROVENCE-ALPES-CÔTE D'AZUR": {
    path: 'M320,340 L400,320 L420,380 L360,420 L320,400 Z',
    center: { x: 365, y: 365 }
  },
  'CORSE': {
    path: 'M440,380 L460,370 L470,420 L450,450 L430,420 Z',
    center: { x: 450, y: 410 }
  }
};

interface TerritorialCoverageMapProps {
  className?: string;
}

const TerritorialCoverageMap: React.FC<TerritorialCoverageMapProps> = ({ className = '' }) => {
  const { data: regionalData, isLoading } = useRegionalCoverage();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Create a map for quick lookup
  const regionDataMap = new Map<string, RegionalCoverage>();
  regionalData?.forEach(r => regionDataMap.set(r.region, r));

  // Get covered regions
  const coveredRegions = new Set(regionalData?.map(r => r.region) || []);
  const totalRegions = coveredRegions.size;
  const totalMarches = regionalData?.reduce((sum, r) => sum + r.marches_count, 0) || 0;

  const handleMouseMove = (e: React.MouseEvent, region: string) => {
    if (coveredRegions.has(region)) {
      const rect = e.currentTarget.closest('svg')?.getBoundingClientRect();
      if (rect) {
        setTooltipPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top - 10
        });
      }
    }
  };

  return (
    <section className={`py-16 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/40 border border-blue-500/20 rounded-full mb-4">
            <MapPin className="w-3 h-3 text-blue-400" />
            <span className="font-mono text-xs uppercase tracking-wide text-blue-300">
              Couverture Territoriale
            </span>
          </div>
          <h2 className="font-crimson text-3xl text-foreground mb-3">
            Intervention sur tout le territoire
          </h2>
          <p className="text-muted-foreground">
            {totalRegions} régions couvertes · {totalMarches} marches documentées · Interventions sur-mesure
          </p>
        </motion.div>

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-card/20 border border-border/20 rounded-2xl p-6 overflow-hidden"
        >
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
          ) : (
            <div className="relative">
              <svg
                viewBox="0 0 500 500"
                className="w-full h-auto max-h-[400px]"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))' }}
              >
                {/* Background France outline */}
                <defs>
                  <linearGradient id="coveredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--emerald-500))" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="hsl(var(--emerald-700))" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="uncoveredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* Render regions */}
                {Object.entries(REGIONS_PATHS).map(([regionName, { path }]) => {
                  const isCovered = coveredRegions.has(regionName);
                  const regionInfo = regionDataMap.get(regionName);
                  const isHovered = hoveredRegion === regionName;

                  return (
                    <g key={regionName}>
                      <path
                        d={path}
                        fill={isCovered ? '#10b981' : '#374151'}
                        fillOpacity={isCovered ? (isHovered ? 0.8 : 0.5) : 0.2}
                        stroke={isCovered ? '#34d399' : '#4b5563'}
                        strokeWidth={isHovered ? 2 : 1}
                        className={`transition-all duration-200 ${isCovered ? 'cursor-pointer' : ''}`}
                        onMouseEnter={() => isCovered && setHoveredRegion(regionName)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        onMouseMove={(e) => handleMouseMove(e, regionName)}
                      />
                      {/* Region marker for covered regions */}
                      {isCovered && regionInfo && (
                        <circle
                          cx={REGIONS_PATHS[regionName].center.x}
                          cy={REGIONS_PATHS[regionName].center.y}
                          r={Math.min(8 + regionInfo.marches_count, 16)}
                          fill="#10b981"
                          fillOpacity={0.8}
                          className="pointer-events-none"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {hoveredRegion && regionDataMap.has(hoveredRegion) && (
                <div
                  className="absolute pointer-events-none z-10 px-3 py-2 bg-card border border-border rounded-lg shadow-xl transform -translate-x-1/2 -translate-y-full"
                  style={{
                    left: tooltipPosition.x,
                    top: tooltipPosition.y
                  }}
                >
                  <p className="font-medium text-foreground text-sm">{hoveredRegion}</p>
                  <p className="text-xs text-muted-foreground">
                    {regionDataMap.get(hoveredRegion)?.marches_count} marches · {' '}
                    {regionDataMap.get(hoveredRegion)?.total_species.toLocaleString('fr-FR')} espèces
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/50 border border-emerald-400" />
              <span className="text-muted-foreground">Régions couvertes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/20 border border-muted-foreground/30" />
              <span className="text-muted-foreground">À venir</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TerritorialCoverageMap;
