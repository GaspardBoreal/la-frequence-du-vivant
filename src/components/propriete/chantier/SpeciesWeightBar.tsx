import React from 'react';

const TONE = {
  up: '#4f8a5b',
  down: '#b4553f',
  flat: '#8b8578',
} as const;

/**
 * La jauge signée d'une espèce : elle pousse à droite quand l'espèce confirme
 * la lecture du sol, à gauche quand elle la contredit. La longueur est relative
 * à la contribution la plus forte du lot — la hiérarchie se lit sans chiffre.
 */
export const SpeciesWeightBar: React.FC<{
  value: number;
  max: number;
  /** Statut brouillon retirant l'espèce du score : jauge fantôme. */
  ghost?: boolean;
  width?: number;
}> = ({ value, max, ghost, width = 72 }) => {
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const tone = TONE[dir];
  const half = width / 2;
  const len = max > 0 ? Math.min(half, (Math.abs(value) / max) * half) : 0;

  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width, height: 10 }}
      aria-hidden
    >
      {/* axe central */}
      <span
        className="absolute top-0 block"
        style={{ left: half - 0.5, width: 1, height: 10, background: 'currentColor', opacity: 0.28 }}
      />
      {value === 0 ? (
        <span
          className="absolute rounded-full"
          style={{ left: half - 2, top: 3, width: 4, height: 4, background: tone, opacity: 0.6 }}
        />
      ) : (
        <span
          className="absolute rounded-[2px] transition-all duration-300"
          style={{
            top: 2,
            height: 6,
            width: Math.max(3, len),
            left: value > 0 ? half : half - Math.max(3, len),
            background: ghost ? 'transparent' : tone,
            border: ghost ? `1px dashed ${tone}` : undefined,
            opacity: ghost ? 0.55 : 0.9,
          }}
        />
      )}
    </span>
  );
};

export const weightColor = (v: number) => (v > 0 ? TONE.up : v < 0 ? TONE.down : TONE.flat);

export default SpeciesWeightBar;
