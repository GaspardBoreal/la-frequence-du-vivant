import React from 'react';

/**
 * Schéma de la chaîne de la donnée capteurs (P3).
 * SVG autonome, lisible à l'écran comme à l'impression.
 */
export const SensorChainDiagram: React.FC<{ variant?: 'screen' | 'print' }> = ({
  variant = 'screen',
}) => {
  const ink = variant === 'print' ? '#1c2420' : 'currentColor';
  const accent = variant === 'print' ? '#0d6b58' : 'hsl(var(--primary))';
  const gold = variant === 'print' ? '#c9a227' : 'hsl(var(--primary))';
  const soft = variant === 'print' ? '#6d786f' : 'currentColor';
  const box = variant === 'print' ? '#fcfbf7' : 'transparent';

  const sensors = [
    { label: 'Sonde sol 15 cm', y: 18 },
    { label: 'Sonde sol 30 cm', y: 56 },
    { label: 'Sonde sol 60 cm', y: 94 },
    { label: 'Surface 10 cm', y: 132 },
    { label: 'Station météo 3 m', y: 170 },
  ];
  const outputs = [
    { label: 'Courbes multi-profondeurs', y: 18 },
    { label: 'Écart sol / air', y: 56 },
    { label: 'Seuils agronomiques', y: 94 },
    { label: 'Contexte IA de jardin', y: 132 },
    { label: 'Export CSV / MCP', y: 170 },
  ];

  return (
    <svg
      viewBox="0 0 900 220"
      className="w-full"
      role="img"
      aria-label="Chaîne de la donnée capteurs : sondes et station météo vers API, fonction planifiée, table de mesures, puis restitutions"
    >
      {sensors.map((s) => (
        <g key={s.label}>
          <rect
            x="0"
            y={s.y}
            width="150"
            height="28"
            rx="6"
            fill={box}
            stroke={accent}
            strokeWidth="1"
            opacity="0.85"
          />
          <text x="12" y={s.y + 18} fontSize="11" fill={ink}>
            {s.label}
          </text>
          <path
            d={`M150 ${s.y + 14} H196 V104 H214`}
            fill="none"
            stroke={soft}
            strokeWidth="1"
            opacity="0.55"
          />
        </g>
      ))}

      <rect x="214" y="82" width="132" height="44" rx="8" fill={box} stroke={gold} strokeWidth="1.4" />
      <text x="228" y="102" fontSize="11" fill={ink}>
        API constructeur
      </text>
      <text x="228" y="117" fontSize="9" fill={soft}>
        lecture authentifiée
      </text>
      <path d="M346 104 H386" stroke={soft} strokeWidth="1" opacity="0.55" />

      <rect x="386" y="76" width="150" height="56" rx="8" fill={box} stroke={accent} strokeWidth="1.4" />
      <text x="400" y="96" fontSize="11" fill={ink}>
        Fonction planifiée
      </text>
      <text x="400" y="111" fontSize="9" fill={soft}>
        normalisation, dédup.
      </text>
      <text x="400" y="124" fontSize="9" fill={soft}>
        heure locale Paris
      </text>
      <path d="M536 104 H576" stroke={soft} strokeWidth="1" opacity="0.55" />

      <rect x="576" y="82" width="126" height="44" rx="8" fill={box} stroke={accent} strokeWidth="1.4" />
      <text x="590" y="102" fontSize="11" fill={ink}>
        Séries de mesures
      </text>
      <text x="590" y="117" fontSize="9" fill={soft}>
        capteur × horodatage
      </text>

      {outputs.map((o) => (
        <g key={o.label}>
          <path
            d={`M702 104 H726 V${o.y + 14} H748`}
            fill="none"
            stroke={soft}
            strokeWidth="1"
            opacity="0.55"
          />
          <rect
            x="748"
            y={o.y}
            width="152"
            height="28"
            rx="6"
            fill={box}
            stroke={gold}
            strokeWidth="1"
            opacity="0.9"
          />
          <text x="760" y={o.y + 18} fontSize="10.5" fill={ink}>
            {o.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

/** Schéma de la reconfiguration de navigation (P4). */
export const NavigationShiftDiagram: React.FC<{ variant?: 'screen' | 'print' }> = ({
  variant = 'screen',
}) => {
  const ink = variant === 'print' ? '#1c2420' : 'currentColor';
  const accent = variant === 'print' ? '#0d6b58' : 'hsl(var(--primary))';
  const gold = variant === 'print' ? '#c9a227' : 'hsl(var(--primary))';
  const soft = variant === 'print' ? '#8a8377' : 'currentColor';
  const box = variant === 'print' ? '#fcfbf7' : 'transparent';

  const before = ["J'observe", "J'analyse", "J'identifie", 'Je synthétise', 'Palette'];
  const after = ["J'observe", "J'analyse", "J'identifie", 'Mon projet', 'Palette / Atelier'];

  const row = (labels: string[], y: number, highlightIdx: number, color: string) =>
    labels.map((l, i) => (
      <g key={`${y}-${l}`}>
        <rect
          x={10 + i * 172}
          y={y}
          width="156"
          height="32"
          rx="7"
          fill={box}
          stroke={i === highlightIdx ? color : soft}
          strokeWidth={i === highlightIdx ? 1.6 : 1}
          opacity={i === highlightIdx ? 1 : 0.7}
        />
        <text x={88 + i * 172} y={y + 21} fontSize="11.5" textAnchor="middle" fill={ink}>
          {l}
        </text>
        {i < labels.length - 1 && (
          <path
            d={`M${166 + i * 172} ${y + 16} H${180 + i * 172}`}
            stroke={soft}
            strokeWidth="1"
            opacity="0.6"
          />
        )}
      </g>
    ));

  return (
    <svg
      viewBox="0 0 900 200"
      className="w-full"
      role="img"
      aria-label="Navigation avant et après : Je synthétise devient Mon projet, la synthèse remonte dans le Portrait"
    >
      <text x="10" y="14" fontSize="10" fill={soft} letterSpacing="1.5">
        AUJOURD'HUI
      </text>
      {row(before, 22, 3, gold)}

      <text x="10" y="86" fontSize="10" fill={soft} letterSpacing="1.5">
        CIBLE
      </text>
      {row(after, 94, 3, accent)}

      <path d="M540 126 V158 H700" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7" />
      <rect x="700" y="142" width="190" height="34" rx="8" fill={box} stroke={accent} strokeWidth="1.4" />
      <text x="795" y="158" fontSize="11.5" textAnchor="middle" fill={ink}>
        Portrait
      </text>
      <text x="795" y="170" fontSize="9" textAnchor="middle" fill={soft}>
        synthèse permanente, vitrine
      </text>
    </svg>
  );
};
