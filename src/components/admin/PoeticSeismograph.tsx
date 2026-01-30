import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TexteExport } from '@/utils/epubExportUtils';

interface PoeticSeismographProps {
  textes: TexteExport[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

interface DataPoint {
  x: number;
  y: number;
  location: string;
  partieNumero?: string;
  partieTitre?: string;
  textCount: number;
  intensity: number;
}

// Genre intensity weights (poetic "vibration")
const GENRE_INTENSITY: Record<string, number> = {
  'haiku': 0.6,      // Brief, concentrated
  'senryu': 0.55,    // Similar to haiku
  'poeme': 0.8,      // Rich, expansive
  'fable': 0.9,      // Narrative depth
  'manifeste': 1.0,  // Maximum intensity
};

const PoeticSeismograph: React.FC<PoeticSeismographProps> = ({ textes, colorScheme }) => {
  // Calculate data points for the seismograph
  const { dataPoints, parties } = useMemo(() => {
    // Group by marche and calculate intensity per location
    const marcheMap = new Map<string, {
      location: string;
      partieId?: string;
      partieNumero?: string;
      partieTitre?: string;
      partieOrdre: number;
      marcheOrdre: number;
      textCount: number;
      totalIntensity: number;
      genres: string[];
    }>();

    textes.forEach(texte => {
      const location = texte.marche_nom || texte.marche_ville || 'Sans lieu';
      const key = `${texte.partie_id || 'none'}-${location}`;
      const genre = texte.type_texte.toLowerCase();
      const intensity = GENRE_INTENSITY[genre] || 0.5;

      if (!marcheMap.has(key)) {
        marcheMap.set(key, {
          location,
          partieId: texte.partie_id,
          partieNumero: texte.partie_numero_romain,
          partieTitre: texte.partie_titre,
          partieOrdre: texte.partie_ordre ?? 999,
          marcheOrdre: texte.marche_ordre ?? 999,
          textCount: 0,
          totalIntensity: 0,
          genres: [],
        });
      }

      const entry = marcheMap.get(key)!;
      entry.textCount++;
      entry.totalIntensity += intensity;
      entry.genres.push(genre);
    });

    // Sort by narrative order
    const sortedEntries = Array.from(marcheMap.values())
      .sort((a, b) => {
        if (a.partieOrdre !== b.partieOrdre) return a.partieOrdre - b.partieOrdre;
        return a.marcheOrdre - b.marcheOrdre;
      });

    // Find max intensity for normalization
    const maxIntensity = Math.max(...sortedEntries.map(e => e.totalIntensity), 1);

    // Calculate data points
    const points: DataPoint[] = sortedEntries.map((entry, index) => ({
      x: index,
      y: (entry.totalIntensity / maxIntensity),
      location: entry.location,
      partieNumero: entry.partieNumero,
      partieTitre: entry.partieTitre,
      textCount: entry.textCount,
      intensity: entry.totalIntensity,
    }));

    // Extract unique parties for visual markers
    const uniqueParties = new Map<string, { numero: string; titre: string; startX: number }>();
    sortedEntries.forEach((entry, index) => {
      if (entry.partieId && entry.partieNumero && !uniqueParties.has(entry.partieId)) {
        uniqueParties.set(entry.partieId, {
          numero: entry.partieNumero,
          titre: entry.partieTitre || '',
          startX: index,
        });
      }
    });

    return { 
      dataPoints: points, 
      parties: Array.from(uniqueParties.values()) 
    };
  }, [textes]);

  // SVG dimensions
  const width = 100;
  const height = 40;
  const padding = { left: 5, right: 5, top: 8, bottom: 10 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Generate the seismograph path
  const generatePath = useMemo(() => {
    if (dataPoints.length === 0) return '';
    if (dataPoints.length === 1) {
      const x = padding.left + graphWidth / 2;
      const y = padding.top + graphHeight * (1 - dataPoints[0].y * 0.8);
      return `M ${x} ${y} L ${x} ${y}`;
    }

    const stepX = graphWidth / (dataPoints.length - 1);
    const baseline = padding.top + graphHeight;

    // Create smooth curve through points
    let path = '';
    
    dataPoints.forEach((point, i) => {
      const x = padding.left + i * stepX;
      const peakY = padding.top + graphHeight * (1 - point.y * 0.85);
      
      if (i === 0) {
        // Start from baseline
        path += `M ${x} ${baseline} `;
        // Sharp rise to peak
        path += `L ${x} ${peakY} `;
      } else {
        const prevX = padding.left + (i - 1) * stepX;
        // Seismograph-style: sharp peaks with quick return
        // Go down to baseline, then up to next peak
        const midX = (prevX + x) / 2;
        path += `L ${midX} ${baseline} `;
        path += `L ${x} ${peakY} `;
      }
    });

    // Return to baseline at end
    const lastX = padding.left + (dataPoints.length - 1) * stepX;
    path += `L ${lastX} ${baseline}`;

    return path;
  }, [dataPoints, graphWidth, graphHeight, padding]);

  // Generate the filled area path
  const generateAreaPath = useMemo(() => {
    if (dataPoints.length === 0) return '';
    
    const stepX = graphWidth / Math.max(dataPoints.length - 1, 1);
    const baseline = padding.top + graphHeight;
    
    let path = `M ${padding.left} ${baseline} `;
    
    dataPoints.forEach((point, i) => {
      const x = padding.left + i * stepX;
      const peakY = padding.top + graphHeight * (1 - point.y * 0.85);
      
      if (i === 0) {
        path += `L ${x} ${peakY} `;
      } else {
        const prevX = padding.left + (i - 1) * stepX;
        const midX = (prevX + x) / 2;
        path += `L ${midX} ${baseline} `;
        path += `L ${x} ${peakY} `;
      }
    });
    
    // Close path
    const lastX = padding.left + (dataPoints.length - 1) * stepX;
    path += `L ${lastX} ${baseline} Z`;
    
    return path;
  }, [dataPoints, graphWidth, graphHeight, padding]);

  if (textes.length === 0) {
    return (
      <div 
        className="h-[400px] flex items-center justify-center"
        style={{ backgroundColor: colorScheme.background }}
      >
        <p 
          className="text-sm italic"
          style={{ color: colorScheme.secondary }}
        >
          Aucun texte à visualiser
        </p>
      </div>
    );
  }

  return (
    <div 
      className="h-[400px] flex flex-col p-6"
      style={{ backgroundColor: colorScheme.background }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h3 
          className="text-xs uppercase tracking-[0.3em] mb-1"
          style={{ color: colorScheme.secondary }}
        >
          Sismographe Poétique
        </h3>
        <p 
          className="text-[10px] italic text-center"
          style={{ color: colorScheme.secondary + '80' }}
        >
          Intensité du voyage littéraire
        </p>
      </div>

      {/* Main visualization */}
      <div className="flex-1 flex flex-col justify-center">
        <svg 
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[200px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="seismographGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorScheme.primary} stopOpacity="0.4" />
              <stop offset="100%" stopColor={colorScheme.primary} stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colorScheme.accent} />
              <stop offset="50%" stopColor={colorScheme.primary} />
              <stop offset="100%" stopColor={colorScheme.accent} />
            </linearGradient>
          </defs>

          {/* Baseline */}
          <line
            x1={padding.left}
            y1={padding.top + graphHeight}
            x2={padding.left + graphWidth}
            y2={padding.top + graphHeight}
            stroke={colorScheme.secondary}
            strokeWidth="0.15"
            strokeDasharray="0.5 0.5"
            opacity="0.3"
          />

          {/* Partie markers */}
          {parties.map((partie, index) => {
            const stepX = graphWidth / Math.max(dataPoints.length - 1, 1);
            const x = padding.left + partie.startX * stepX;
            return (
              <g key={index}>
                <line
                  x1={x}
                  y1={padding.top - 2}
                  x2={x}
                  y2={padding.top + graphHeight + 3}
                  stroke={colorScheme.accent}
                  strokeWidth="0.1"
                  strokeDasharray="0.3 0.3"
                  opacity="0.5"
                />
                <text
                  x={x}
                  y={padding.top - 3}
                  fontSize="2"
                  fill={colorScheme.accent}
                  textAnchor="middle"
                  fontStyle="italic"
                >
                  {partie.numero}
                </text>
              </g>
            );
          })}

          {/* Filled area */}
          <motion.path
            d={generateAreaPath}
            fill="url(#seismographGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />

          {/* Main seismograph line */}
          <motion.path
            d={generatePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="0.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* Peak dots */}
          {dataPoints.map((point, index) => {
            const stepX = graphWidth / Math.max(dataPoints.length - 1, 1);
            const x = padding.left + index * stepX;
            const y = padding.top + graphHeight * (1 - point.y * 0.85);
            return (
              <motion.circle
                key={index}
                cx={x}
                cy={y}
                r={0.6 + point.y * 0.4}
                fill={colorScheme.primary}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.8 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              />
            );
          })}
        </svg>
      </div>

      {/* Location labels at bottom */}
      <div className="mt-4 overflow-x-auto">
        <div 
          className="flex justify-between gap-1 min-w-max px-2"
          style={{ width: '100%' }}
        >
          {dataPoints.map((point, index) => (
            <motion.div
              key={index}
              className="text-center flex-1 min-w-[40px] max-w-[80px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
            >
              <p 
                className="text-[8px] leading-tight truncate"
                style={{ color: colorScheme.text }}
                title={point.location}
              >
                {point.location.length > 12 
                  ? point.location.substring(0, 10) + '…' 
                  : point.location}
              </p>
              <p 
                className="text-[7px] mt-0.5"
                style={{ color: colorScheme.secondary }}
              >
                {point.textCount} texte{point.textCount > 1 ? 's' : ''}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div 
        className="mt-4 pt-3 flex justify-center gap-6 text-[9px]"
        style={{ borderTop: `1px solid ${colorScheme.secondary}20` }}
      >
        <div className="flex items-center gap-1.5">
          <div 
            className="w-3 h-[2px] rounded"
            style={{ backgroundColor: colorScheme.primary }}
          />
          <span style={{ color: colorScheme.secondary }}>Intensité poétique</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: colorScheme.accent }}
          />
          <span style={{ color: colorScheme.secondary }}>Étape du voyage</span>
        </div>
      </div>
    </div>
  );
};

export default PoeticSeismograph;
