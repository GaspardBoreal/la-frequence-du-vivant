import React from 'react';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';
import { DemoFrame, Legende } from './DemoFrame';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 5);
const temp = (h: number) => Math.round(8 + 14 * Math.sin(((h - 6) / 15) * Math.PI));
const vent = (h: number) => (h >= 15 && h <= 16 ? 26 : 10 + (h % 4) * 2);
const ouvert = (h: number) => temp(h) > 12 && vent(h) < 20;

const INVASIVES = [
  { x: 120, y: 70, nom: 'Renouée du Japon' },
  { x: 470, y: 150, nom: 'Ambroisie' },
  { x: 560, y: 60, nom: 'Baccharis' },
];

export const PollinatorWindowDemo: React.FC = () => {
  const { ref, shown } = useRevealOnScroll<HTMLDivElement>();
  const [h, setH] = React.useState(11);
  const [traite, setTraite] = React.useState(false);

  React.useEffect(() => {
    if (!shown || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setH((x) => (x >= 20 ? 5 : x + 1)), 900);
    const t = setTimeout(() => setTraite(true), 6000);
    return () => { clearInterval(id); clearTimeout(t); };
  }, [shown]);

  const open = ouvert(h);
  const bees = open ? 7 : 1;
  const paths = ['M 60 180 C 160 40, 260 200, 360 90 S 560 180, 640 60', 'M 640 190 C 520 60, 380 200, 260 70 S 100 150, 40 60'];

  return (
    <div ref={ref} className={shown ? 'cad-on' : ''}>
      <DemoFrame
        kicker="Pollinisateurs et invasives"
        titre="La fenêtre de butinage"
        texte="La météo à la parcelle révèle les heures où les pollinisateurs volent. Les espèces invasives repérées par les observations sont signalées sur la carte."
        footer={<div className="flex flex-wrap items-center gap-6">
          <span><span className="font-serif text-2xl text-primary">{h} h</span> <span className="text-muted-foreground">· {temp(h)} °C · vent {vent(h)} km/h · {open ? 'fenêtre ouverte' : 'fenêtre fermée'}</span></span>
          <Legende />
        </div>}
      >
        <svg viewBox="0 0 700 250" className="w-full h-auto block" role="img" aria-label="Parcelle avec pollinisateurs et espèces invasives">
          <rect width="700" height="210" fill="hsl(var(--primary))" opacity=".06" />
          {[40, 350].map((x) => [...Array(9)].map((_, i) => (
            <g key={`${x}-${i}`}>
              <circle cx={x + i * 34} cy={i % 2 ? 110 : 125} r="14" fill="hsl(var(--primary))" opacity=".35" />
              <circle cx={x + i * 34} cy={i % 2 ? 104 : 119} r="4" fill="hsl(var(--accent))" />
            </g>
          )))}
          {INVASIVES.map((v) => (
            <g key={v.nom}>
              <circle className={traite ? '' : 'cad-anim'} cx={v.x} cy={v.y} r="18" fill={traite ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} opacity=".35"
                style={traite ? undefined : { animation: 'cad-alert 1.4s infinite' }} />
              <text x={v.x} y={v.y + 32} textAnchor="middle" fontSize="10" className="fill-foreground">{v.nom} · {traite ? 'traitée' : 'alerte'}</text>
            </g>
          ))}
          {[...Array(bees)].map((_, i) => (
            <circle key={i} className="cad-anim" r="4" fill="hsl(var(--accent))" stroke="hsl(var(--foreground))" strokeWidth="1"
              style={{ offsetPath: `path('${paths[i % 2]}')`, animation: `cad-bee ${6 + i}s ${-i * 1.3}s linear infinite`, offsetDistance: `${i * 14}%` } as React.CSSProperties} />
          ))}
          {HOURS.map((hh, i) => (
            <g key={hh} onClick={() => setH(hh)} className="cursor-pointer">
              <rect x={20 + i * 41} y="218" width="37" height="22" rx="4"
                fill={ouvert(hh) ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} opacity={hh === h ? 1 : 0.45} />
              <text x={38 + i * 41} y="233" textAnchor="middle" fontSize="10" className={ouvert(hh) ? 'fill-primary-foreground' : 'fill-muted-foreground'}>{hh}h</text>
            </g>
          ))}
        </svg>
      </DemoFrame>
    </div>
  );
};
