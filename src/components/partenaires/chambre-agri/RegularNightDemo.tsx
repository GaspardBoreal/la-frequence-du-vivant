import React from 'react';
import { useRevealOnScroll, useCountUp } from '@/hooks/useRevealOnScroll';
import { DemoFrame, Legende } from './DemoFrame';

const PATH = 'M -20 120 C 120 60, 220 150, 340 90 S 560 60, 720 110';

export const RegularNightDemo: React.FC = () => {
  const { ref, shown } = useRevealOnScroll<HTMLDivElement>();
  const [temp, setTemp] = React.useState(16);
  const activite = Math.max(0.1, Math.min(1, (temp - 6) / 12));
  const contacts = useCountUp(Math.round(420 * activite), shown, 1200);
  const regules = useCountUp(Math.round(1800 * activite), shown, 1400);
  const nbBats = Math.max(1, Math.round(4 * activite));
  const speed = 9 - activite * 4;

  return (
    <div ref={ref} className={shown ? 'cad-on' : ''}>
      <DemoFrame
        kicker="Chantier REGULAR"
        titre="La haie qui chasse la nuit"
        texte="Les chauves-souris suivent les haies et régulent les ravageurs. Détecteurs d’ultrasons et station météo WEENAT montrent quand et où elles travaillent."
        footer={
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div><span className="font-serif text-2xl text-primary">{Math.round(contacts)}</span> <span className="text-muted-foreground">contacts / nuit</span></div>
            <div><span className="font-serif text-2xl text-primary">{Math.round(regules)}</span> <span className="text-muted-foreground">ravageurs consommés</span></div>
            <label className="flex items-center gap-3 cad-hide-print">
              <span className="text-muted-foreground">Nuit à {temp} °C</span>
              <input type="range" min={6} max={20} value={temp} onChange={(e) => setTemp(+e.target.value)} className="accent-primary" aria-label="Température nocturne" />
            </label>
            <Legende />
          </div>
        }
      >
        <svg viewBox="0 0 700 240" className="w-full h-auto block bg-primary/10" role="img" aria-label="Chauves-souris chassant le long d'une haie la nuit">
          <circle cx="600" cy="50" r="22" fill="hsl(var(--foreground))" opacity=".9" />
          {[...Array(24)].map((_, i) => <circle key={i} cx={(i * 97) % 700} cy={(i * 53) % 110} r="1" fill="hsl(var(--foreground))" opacity=".5" />)}
          {/* haie */}
          {[...Array(14)].map((_, i) => <circle key={i} cx={20 + i * 50} cy={190 - (i % 3) * 6} r={26 + (i % 2) * 6} fill="hsl(var(--primary))" opacity=".55" />)}
          <rect x="0" y="200" width="700" height="40" fill="hsl(var(--primary))" opacity=".35" />
          <path d={PATH} fill="none" stroke="hsl(var(--foreground))" strokeDasharray="3 6" opacity=".25" />
          {/* ravageurs */}
          {[80, 200, 300, 420, 520, 640].map((x, i) => (
            <circle key={x} className="cad-anim" cx={x} cy={100 + (i % 2) * 22} r="3" fill="hsl(var(--accent))"
              style={{ animation: `cad-prey ${speed}s ${i * 0.8}s infinite` }} />
          ))}
          {/* détecteur */}
          <rect x="344" y="170" width="12" height="20" rx="2" fill="hsl(var(--foreground))" />
          {[0, 1, 2].map((i) => (
            <circle key={i} className="cad-anim" cx="350" cy="168" r="2" fill="none" stroke="hsl(var(--foreground))"
              style={{ animation: `cad-ring 2.4s ${i * 0.8}s infinite` }} />
          ))}
          {[...Array(nbBats)].map((_, i) => (
            <g key={i} className="cad-anim" style={{ offsetPath: `path('${PATH}')`, animation: `cad-bat ${speed}s ${-i * (speed / nbBats)}s linear infinite`, offsetDistance: `${i * 25 + 30}%` } as React.CSSProperties}>
              <path className="cad-anim" d="M -10 0 Q -5 -6 0 0 Q 5 -6 10 0 Q 5 -2 0 2 Q -5 -2 -10 0 Z" fill="hsl(var(--foreground))"
                style={{ transformOrigin: 'center', animation: 'cad-flap .35s infinite' }} />
            </g>
          ))}
        </svg>
      </DemoFrame>
    </div>
  );
};
