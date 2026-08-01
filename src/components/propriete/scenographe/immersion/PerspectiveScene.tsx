import React from 'react';

import { projectPlants } from '@/lib/immersion/perspective';
import { buildSilhouette } from '@/lib/immersion/silhouettes';
import type { SeasonKey } from '@/lib/immersion/silhouettes';
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';

interface Props {
  plantings: Planting[];
  center: { lat: number; lng: number };
  yaw: number;
  year: number;
  season: SeasonKey;
  width: number;
  height: number;
  /** 0→1 : les plantes sortent de terre progressivement (avant/après). */
  reveal?: number;
  onHover?: (p: Planting | null) => void;
  showLabels?: boolean;
}

/**
 * Rendu perspective partagé (Dôme 360° et Avant/Après) : mêmes silhouettes,
 * même échelle, même horizon — pour que les deux immersions racontent
 * exactement le même projet.
 */
export const PerspectiveScene: React.FC<Props> = ({
  plantings,
  center,
  yaw,
  year,
  season,
  width,
  height,
  reveal = 1,
  onHover,
  showLabels = true,
}) => {
  const { plants, horizonY } = React.useMemo(
    () => projectPlants({ plantings, center, yaw, year, width, height }),
    [plantings, center, yaw, year, width, height],
  );

  return (
    <svg width={width} height={height} className="absolute inset-0" style={{ overflow: 'visible' }}>
      {plants.map((pl, idx) => {
        const grow = Math.max(0, Math.min(1, (reveal - (idx / Math.max(1, plants.length)) * 0.35) / 0.65));
        if (grow <= 0) return null;
        const hPx = pl.heightPx * grow;
        const wPx = pl.widthPx * (0.55 + 0.45 * grow);
        if (hPx < 3 || wPx < 3) return null;
        const { parts } = buildSilhouette({
          key: pl.planting.scientificName || pl.planting.id,
          strate: pl.planting.strate,
          widthPx: wPx,
          heightPx: hPx,
          season,
          maturity: pl.size.factor,
        });
        const haze = Math.max(0.35, 1 - pl.distance / 45);
        const proposed = pl.planting.origin === 'proposee';
        return (
          <g
            key={pl.planting.id}
            opacity={haze}
            onMouseEnter={() => onHover?.(pl.planting)}
            onMouseLeave={() => onHover?.(null)}
            style={{ cursor: onHover ? 'pointer' : undefined }}
          >
            <ellipse
              cx={pl.x}
              cy={pl.groundY + 1}
              rx={Math.max(3, wPx * 0.55)}
              ry={Math.max(1.5, wPx * 0.16)}
              fill="#000"
              opacity={0.35}
            />
            {proposed && grow < 1 && (
              <ellipse
                cx={pl.x}
                cy={pl.groundY}
                rx={wPx * 0.7}
                ry={wPx * 0.22}
                fill="none"
                stroke="#c8a24a"
                strokeOpacity={0.7 * (1 - grow)}
                strokeWidth={1.5}
              />
            )}
            <g transform={`translate(${pl.x} ${pl.groundY})`}>
              {parts.map((part, i) => (
                <path key={i} d={part.d} fill={part.fill} opacity={part.opacity ?? 1} />
              ))}
            </g>
            {showLabels && hPx > 70 && (
              <text
                x={pl.x}
                y={pl.groundY - hPx - 8}
                textAnchor="middle"
                fontSize={11}
                fill={proposed ? '#c8a24a' : '#f2ece0'}
                opacity={0.85}
              >
                {(pl.planting.commonNameFr || pl.planting.scientificName || '').slice(0, 24)}
              </text>
            )}
          </g>
        );
      })}
      <line
        x1={0}
        y1={horizonY}
        x2={width}
        y2={horizonY}
        stroke="#c8a24a"
        strokeOpacity={0.12}
        strokeWidth={1}
      />
    </svg>
  );
};

export default PerspectiveScene;
