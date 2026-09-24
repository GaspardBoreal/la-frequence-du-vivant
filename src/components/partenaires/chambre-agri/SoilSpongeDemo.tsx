import React from 'react';
import { Button } from '@/components/ui/button';
import { CloudRain, Clock3 } from 'lucide-react';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';
import { DemoFrame, Legende } from './DemoFrame';

const DEPTHS = [15, 30, 60];
const INITIAL = [12, 14, 16];
const RAIN_NU = [20, 15, 16];
const RAIN_COUVERT = [22, 22, 21];
const LATER_NU = [13, 15, 16];
const LATER_COUVERT = [20, 21, 21];

type Phase = 'rain' | 'later';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
};
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

export const SoilSpongeDemo: React.FC = () => {
  const { ref, shown } = useRevealOnScroll<HTMLDivElement>();
  const [p, setP] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>('rain');
  const [run, setRun] = React.useState(0);

  React.useEffect(() => {
    if (!shown) return;
    setPhase('rain');
    setP(0);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setP(1);
      const laterTimer = window.setTimeout(() => setPhase('later'), 2000);
      return () => window.clearTimeout(laterTimer);
    }
    let raf = 0; const t0 = performance.now();
    let laterTimer = 0;
    const tick = (t: number) => {
      const v = Math.min(1, (t - t0) / 4000);
      setP(v);
      if (v < 1) raf = requestAnimationFrame(tick);
      else laterTimer = window.setTimeout(() => setPhase('later'), 2000);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(laterTimer);
    };
  }, [shown, run]);

  const replay = () => {
    setPhase('rain');
    setP(0);
    setRun((value) => value + 1);
  };

  const delayedProgress = (index: number, couvert: boolean) => {
    const starts = couvert ? [0.08, 0.38, 0.7] : [0.08, 0.68, 1];
    return ease((p - starts[index]) / Math.max(0.01, 1 - starts[index]));
  };

  const valuesFor = (couvert: boolean) => {
    if (phase === 'later') return couvert ? LATER_COUVERT : LATER_NU;
    const target = couvert ? RAIN_COUVERT : RAIN_NU;
    return target.map((value, index) => mix(INITIAL[index], value, delayedProgress(index, couvert)));
  };

  const side = (x: number, label: string, couvert: boolean) => {
    const values = valuesFor(couvert);
    const rainProgress = phase === 'later' ? 1 : ease(p);
    const runoff = (couvert ? 2 : 30) * rainProgress;
    const frontDepth = couvert ? 60 * rainProgress : 20 * rainProgress;
    const frontHeight = (frontDepth / 60) * 190;

    return (
    <g>
      <text x={x + 160} y="44" textAnchor="middle" className="fill-foreground" fontSize="14" fontFamily="serif">{label}</text>
      <rect x={x} y="92" width="320" height="190" fill="hsl(var(--accent))" opacity=".25" />
      <rect x={x} y="92" width="320" height={frontHeight} fill="hsl(var(--primary))" opacity=".18" />

      {!couvert && (
        <g role="img" aria-label="Croûte de battance">
          <title>Croûte de battance : la pluie referme la surface, l'eau ne rentre plus</title>
          <rect x={x} y="92" width="320" height="6" fill="hsl(var(--foreground))" opacity=".34" />
        </g>
      )}
      {couvert && (
        <g role="img" aria-label="Racines et galeries de vers de terre">
          <title>Racines et galeries de vers de terre : autant de chemins pour l'eau</title>
          <path d={`M${x} 91 q22 -10 44 0t44 0t44 0t44 0t44 0t44 0t56 0 v9 h-320z`} fill="hsl(var(--primary))" opacity=".58" />
          {[24, 72, 122, 178, 234, 286].map((offset, index) => (
            <path key={offset} d={`M ${x + offset} 96 C ${x + offset + (index % 2 ? 22 : -14)} 145, ${x + offset + (index % 2 ? -12 : 22)} 220, ${x + offset + (index % 3 - 1) * 18} 278`} stroke="hsl(var(--primary))" strokeWidth={index % 2 ? 2 : 1.5} fill="none" opacity=".72" />
          ))}
          {[52, 145, 258].map((offset, index) => (
            <path key={offset} d={`M ${x + offset} 120 q ${index % 2 ? -18 : 20} 34 2 70 t ${index % 2 ? 18 : -16} 70`} stroke="hsl(var(--foreground))" strokeWidth="1" strokeDasharray="3 4" fill="none" opacity=".32" />
          ))}
        </g>
      )}

      {phase === 'rain' && p > 0 && (
        <g opacity={clamp01(p * 2)}>
          <path
            d={couvert
              ? `M ${x + 198} 89 Q ${x + 254} 84 ${x + 310} 90 L ${x + 310} 96 Q ${x + 252} 91 ${x + 198} 96 Z`
              : `M ${x + 6} 88 Q ${x + 70} 81 ${x + 138} 89 L ${x + 138} 97 Q ${x + 66} 91 ${x + 6} 97 Z`}
            fill="hsl(var(--primary))"
            opacity={couvert ? '.38' : '.68'}
          />
          <path
            d={couvert ? `M ${x + 236} 83 h 68` : `M ${x + 90} 82 H ${x + 15}`}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            markerEnd="url(#soil-arrow)"
          />
          <text x={couvert ? x + 216 : x + 92} y="77" textAnchor="middle" fontSize="9" className="fill-primary">Ruissellement</text>
          <text x={couvert ? x + 292 : x + 28} y="108" textAnchor="middle" fontSize="10" className="fill-foreground">{Math.round(runoff)} mm</text>
        </g>
      )}

      {DEPTHS.map((d, i) => {
        const y = 92 + (d / 60) * 174;
        const w = 112 * (values[i] / 25);
        return (
          <g key={d}>
            <line x1={x + 18} y1={y} x2={x + 146} y2={y} stroke="hsl(var(--foreground))" strokeWidth="1" opacity=".3" />
            <circle cx={x + 20} cy={y} r="4" fill="hsl(var(--foreground))" />
            <text x={x + 30} y={y - 5} fontSize="10" className="fill-muted-foreground">−{d} cm</text>
            <rect x={x + 154} y={y - 6} width="112" height="12" rx="6" fill="hsl(var(--muted))" />
            <rect x={x + 154} y={y - 6} width={w} height="12" rx="6" fill="hsl(var(--primary))" />
            <text x={x + 308} y={y + 4} fontSize="11" textAnchor="end" className="fill-foreground">{Math.round(values[i])} %</text>
          </g>
        );
      })}

      {(p >= 1 || phase === 'later') && (
        <text x={x + 160} y="306" textAnchor="middle" fontSize="11" className="fill-foreground">
          {couvert ? 'Infiltrée 48 mm · Ruisselée 2 mm' : 'Infiltrée 20 mm · Ruisselée 30 mm'}
        </text>
      )}
    </g>
    );
  };

  return (
    <div ref={ref} className={shown ? 'cad-on' : ''}>
      <DemoFrame
        kicker="Agriculture de conservation"
        titre="Le sol éponge"
        texte="Même pluie, deux sols. Les sondes BRAD à 15, 30 et 60 cm montrent l’eau qui descend et reste sous couvert, alors qu’elle ruisselle sur sol nu."
        footer={<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button size="sm" variant="outline" className="cad-hide-print" onClick={replay}><CloudRain className="w-4 h-4 mr-2" />Faire pleuvoir</Button>
          {phase === 'rain' && p >= 1 && (
            <Button size="sm" variant="ghost" className="cad-hide-print" onClick={() => setPhase('later')}><Clock3 className="w-4 h-4 mr-2" />3 jours plus tard</Button>
          )}
          <span className="text-muted-foreground">Humidité du sol (% du volume) mesurée par les sondes BRAD à 15, 30 et 60 cm</span><Legende />
        </div>}
      >
        <svg viewBox="0 0 720 340" className="w-full h-auto block" role="img" aria-label="Comparaison de l'infiltration entre sol nu et sol couvert">
          <defs>
            <marker id="soil-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5Z" fill="hsl(var(--primary))" /></marker>
          </defs>
          <text x="360" y="18" textAnchor="middle" fontSize="12" className="fill-foreground">{phase === 'later' ? '3 jours plus tard' : 'Orage d’été — 50 mm en 1 h'}</text>
          {phase === 'rain' && p < 1 && [...Array(36)].map((_, i) => {
            const localIndex = i % 18;
            const panelOffset = i < 18 ? 20 : 380;
            return (
              <line key={`${run}-${i}`} className="cad-anim cad-hide-print" x1={panelOffset + localIndex * 18} y1="25" x2={panelOffset - 2 + localIndex * 18} y2="37" stroke="hsl(var(--primary))" opacity=".62"
                style={{ animation: `cad-rain 1.1s ${(localIndex % 7) * 0.15}s infinite` }} />
            );
          })}
          {side(20, 'Sol nu', false)}
          {side(380, 'Sous couvert permanent', true)}
          {phase === 'later' && (
            <text x="360" y="329" textAnchor="middle" fontSize="12" className="fill-primary">L’eau infiltrée reste disponible pour la culture.</text>
          )}
        </svg>
      </DemoFrame>
    </div>
  );
};
