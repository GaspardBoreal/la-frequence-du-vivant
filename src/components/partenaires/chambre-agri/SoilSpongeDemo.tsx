import React from 'react';
import { Button } from '@/components/ui/button';
import { CloudRain } from 'lucide-react';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';
import { DemoFrame, Legende } from './DemoFrame';

const DEPTHS = [15, 30, 60];
const NU = [38, 22, 14];
const COUVERT = [34, 31, 27];

export const SoilSpongeDemo: React.FC = () => {
  const { ref, shown } = useRevealOnScroll<HTMLDivElement>();
  const [p, setP] = React.useState(0);
  const [run, setRun] = React.useState(0);

  React.useEffect(() => {
    if (!shown) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setP(1); return; }
    setP(0);
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const v = Math.min(1, (t - t0) / 4000); setP(v); if (v < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, run]);

  const side = (x: number, vals: number[], infil: number, label: string, couvert: boolean) => (
    <g>
      <text x={x + 150} y="22" textAnchor="middle" className="fill-foreground" fontSize="13" fontFamily="serif">{label}</text>
      {couvert
        ? [...Array(16)].map((_, i) => <path key={i} d={`M ${x + 12 + i * 18} 70 q 3 -18 ${i % 2 ? 6 : -4} -26`} stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />)
        : <line x1={x} y1="70" x2={x + 300} y2="70" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />}
      <rect x={x} y="70" width="300" height="190" fill="hsl(var(--accent))" opacity=".25" />
      <rect x={x} y="70" width="300" height={190 * infil * p} fill="hsl(var(--primary))" opacity=".18" />
      {!couvert && <path d={`M ${x + 20} 66 h ${260 * p}`} stroke="hsl(var(--primary))" strokeWidth="3" opacity={0.7 * p} markerEnd="" />}
      {DEPTHS.map((d, i) => {
        const y = 70 + (d / 60) * 170;
        const w = 110 * (vals[i] / 40) * p;
        return (
          <g key={d}>
            <line x1={x + 20} y1={y} x2={x + 140} y2={y} stroke="hsl(var(--foreground))" strokeWidth="1" opacity=".3" />
            <circle cx={x + 20} cy={y} r="4" fill="hsl(var(--foreground))" />
            <text x={x + 30} y={y - 5} fontSize="10" className="fill-muted-foreground">−{d} cm</text>
            <rect x={x + 150} y={y - 6} width="110" height="12" rx="6" fill="hsl(var(--muted))" />
            <rect x={x + 150} y={y - 6} width={w} height="12" rx="6" fill="hsl(var(--primary))" />
            <text x={x + 294} y={y + 4} fontSize="11" textAnchor="end" className="fill-foreground">{Math.round(vals[i] * p)} %</text>
          </g>
        );
      })}
    </g>
  );

  return (
    <div ref={ref} className={shown ? 'cad-on' : ''}>
      <DemoFrame
        kicker="Agriculture de conservation"
        titre="Le sol éponge"
        texte="Même pluie, deux sols. Les sondes BRAD à 15, 30 et 60 cm montrent l’eau qui descend et reste sous couvert, quand elle ruisselle sur sol nu."
        footer={<div className="flex flex-wrap items-center gap-6">
          <Button size="sm" variant="outline" className="cad-hide-print" onClick={() => setRun((r) => r + 1)}><CloudRain className="w-4 h-4 mr-2" />Faire pleuvoir</Button>
          <span className="text-muted-foreground">Humidité du sol mesurée par profondeur</span><Legende />
        </div>}
      >
        <svg viewBox="0 0 640 270" className="w-full h-auto block" role="img" aria-label="Comparaison de l'infiltration entre sol nu et sol couvert">
          {p < 1 && [...Array(30)].map((_, i) => (
            <line key={`${run}-${i}`} className="cad-anim cad-hide-print" x1={10 + i * 21} y1="0" x2={8 + i * 21} y2="10" stroke="hsl(var(--primary))" opacity=".6"
              style={{ animation: `cad-rain 1.1s ${(i % 7) * 0.15}s infinite` }} />
          ))}
          {side(10, NU, 0.3, 'Sol nu', false)}
          {side(330, COUVERT, 1, 'Sous couvert permanent', true)}
        </svg>
      </DemoFrame>
    </div>
  );
};
