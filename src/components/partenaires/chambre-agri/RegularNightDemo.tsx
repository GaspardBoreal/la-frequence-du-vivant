import React from 'react';
import { useRevealOnScroll, useCountUp } from '@/hooks/useRevealOnScroll';
import { DemoFrame, Legende } from './DemoFrame';

/** Vol rasant le long de la cime de la haie, avec petites boucles de chasse. */
const PATH =
  'M 40 158 C 90 148, 110 166, 160 155 C 205 145, 215 166, 255 154 C 305 144, 325 165, 372 156 C 420 147, 440 166, 490 154 C 540 145, 562 165, 615 157';

/** Silhouette de chauve-souris : corps, oreilles, membranes alaires à doigts. */
const Bat: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <g transform={`scale(${scale})`} fill="hsl(var(--background))">
    {/* oreilles */}
    <path d="M -2.6 -6.4 L -3.8 -10.5 L -0.9 -7.6 Z" />
    <path d="M 2.6 -6.4 L 3.8 -10.5 L 0.9 -7.6 Z" />
    {/* corps */}
    <ellipse cx="0" cy="-1" rx="2.6" ry="6" />
    {/* uropatagium */}
    <path d="M -3 3.4 L 0 8.4 L 3 3.4 Z" opacity=".85" />
    {/* ailes (doigts visibles) */}
    <g className="cad-anim" style={{ transformOrigin: '0px -2px', animation: 'cad-flap .32s infinite' }}>
      <path d="M -1 -5 C -8 -10 -17 -10 -25 -4 L -19 -2.2 L -24 0.6 L -17.6 0.2 L -21.4 3.6 L -14.4 1.8 L -16.4 6 L -9 2.4 L -1 3 Z" />
      <path d="M 1 -5 C 8 -10 17 -10 25 -4 L 19 -2.2 L 24 0.6 L 17.6 0.2 L 21.4 3.6 L 14.4 1.8 L 16.4 6 L 9 2.4 L 1 3 Z" />
    </g>
  </g>
);

/** Boîtier enregistreur passif sur piquet, micro orienté. */
const Detecteur: React.FC<{ x: number; y: number; micDir: 1 | -1; label: string }> = ({ x, y, micDir, label }) => (
  <g transform={`translate(${x} ${y})`}>
    <title>{label}</title>
    <line x1="0" y1="0" x2="0" y2="26" stroke="hsl(var(--foreground))" strokeWidth="1.6" opacity=".8" />
    <rect x="-5" y="-11" width="10" height="13" rx="2" fill="hsl(var(--foreground))" opacity=".9" />
    <rect x="-2.4" y="-8.6" width="4.8" height="2" rx="1" fill="hsl(var(--background))" opacity=".8" />
    {/* micro orienté */}
    <line x1={micDir * 5} y1="-6" x2={micDir * 12} y2="-9" stroke="hsl(var(--foreground))" strokeWidth="1.6" />
    <circle cx={micDir * 13} cy="-9.5" r="2.2" fill="hsl(var(--foreground))" />
  </g>
);

export const RegularNightDemo: React.FC = () => {
  const { ref, shown } = useRevealOnScroll<HTMLDivElement>();
  const [temp, setTemp] = React.useState(16);

  const contactsHaie = Math.round(600 / (1 + Math.exp(-(temp - 15) / 2.5)));
  const contactsChamp = Math.round(contactsHaie * 0.12);
  const individus = Math.round(contactsHaie / 35);
  const insectes = individus * 150;

  const aHaie = useCountUp(contactsHaie, shown, 1100);
  const aChamp = useCountUp(contactsChamp, shown, 1100);
  const aInd = useCountUp(individus, shown, 1200);
  const aIns = useCountUp(insectes, shown, 1400);

  const nbBats = Math.max(0, Math.min(4, Math.round(individus / 4)));
  const activite = Math.max(0.05, Math.min(1, individus / 17));
  const speed = 13 - activite * 6;
  const preyCycle = 9 - activite * 5;
  const nbPrey = 8 + Math.round(activite * 4);

  return (
    <div ref={ref} className={shown ? 'cad-on' : ''}>
      <DemoFrame
        kicker="Chantier Régulier"
        titre="La haie qui chasse la nuit"
        texte="Les chauves-souris suivent les haies et régulent les ravageurs. Détecteurs d’ultrasons et station météo WEENAT montrent quand et où elles travaillent."
        footer={
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <span className="text-muted-foreground">contacts / nuit — haie : </span>
              <span className="font-serif text-2xl text-primary">{Math.round(aHaie)}</span>
              <span className="text-muted-foreground"> | plein champ : </span>
              <span className="font-serif text-2xl text-primary">{Math.round(aChamp)}</span>
            </div>
            <div>
              <span className="font-serif text-2xl text-primary">≈ {Math.round(aInd)}</span>{' '}
              <span className="text-muted-foreground">individus estimés</span>
            </div>
            <div
              title="Hypothèse : ~150 papillons de nuit par individu et par nuit (eudémis, cochylis, carpocapse, pyrale). Un contact acoustique n’est pas un individu."
              className="cursor-help border-b border-dotted border-muted-foreground"
            >
              <span className="font-serif text-2xl text-primary">≈ {Math.round(aIns)}</span>{' '}
              <span className="text-muted-foreground">ravageurs consommés (estimation)</span>
            </div>
            <label className="flex items-center gap-3 cad-hide-print">
              <span className="text-muted-foreground">Nuit à {temp} °C</span>
              <input
                type="range"
                min={6}
                max={26}
                value={temp}
                onChange={(e) => setTemp(+e.target.value)}
                className="accent-primary"
                aria-label="Température nocturne"
              />
            </label>
            <Legende />
          </div>
        }
      >
        <svg viewBox="0 0 700 240" className="w-full h-auto block bg-primary/10" role="img" aria-label="Chauves-souris chassant le long d'une haie la nuit">
          {/* ciel décoratif */}
          <circle cx="600" cy="42" r="20" fill="hsl(var(--foreground))" opacity=".45" />
          {[...Array(24)].map((_, i) => (
            <circle key={i} cx={(i * 97) % 700} cy={(i * 37) % 80} r="1" fill="hsl(var(--foreground))" opacity=".4" />
          ))}

          {/* sol */}
          <rect x="0" y="200" width="700" height="40" fill="hsl(var(--primary))" opacity=".35" />

          {/* haie */}
          {[...Array(13)].map((_, i) => (
            <circle key={i} cx={20 + i * 48} cy={190 - (i % 3) * 6} r={26 + (i % 2) * 6} fill="hsl(var(--primary))" opacity=".55" />
          ))}

          {/* bande de proies au-dessus et devant la haie */}
          {[...Array(nbPrey)].map((_, i) => {
            const x = 50 + i * (560 / nbPrey) + (i % 3) * 7;
            const y = 146 + (i % 4) * 5;
            return (
              <circle
                key={i}
                className="cad-anim"
                cx={x}
                cy={y}
                r="2.6"
                fill="hsl(var(--accent))"
                style={{
                  ['--cad-dx' as string]: `${((i % 5) - 2) * 14}px`,
                  ['--cad-dy' as string]: `${((i % 3) - 1) * 6}px`,
                  animation: `cad-catch ${preyCycle}s ${(i * 0.7) % preyCycle}s infinite`,
                }}
              />
            );
          })}

          {/* chauves-souris : vol rasant, allers-retours */}
          {[...Array(nbBats)].map((_, i) => (
            <g
              key={i}
              className="cad-anim"
              style={
                {
                  offsetPath: `path('${PATH}')`,
                  offsetRotate: '0deg',
                  animation: `cad-bat ${speed}s ${-i * (speed / Math.max(1, nbBats))}s ease-in-out infinite alternate`,
                } as React.CSSProperties
              }
            >
              {/* écholocation émise vers l'avant */}
              {[0, 1, 2].map((k) => (
                <path
                  key={k}
                  className="cad-anim"
                  d="M 26 -6 Q 33 0 26 6"
                  fill="none"
                  stroke="hsl(var(--background))"
                  strokeWidth="1.2"
                  style={{ transformOrigin: '26px 0px', animation: `cad-echo 1.4s ${k * 0.45}s infinite` }}
                />
              ))}
              <Bat scale={0.9} />
            </g>
          ))}

          {/* détecteur en lisière de haie */}
          <Detecteur x={318} y={178} micDir={-1} label="Détecteur d’ultrasons — enregistreur passif, il écoute les cris des chauves-souris" />
          {/* détecteur témoin en plein champ */}
          <Detecteur x={636} y={196} micDir={-1} label="Détecteur plein champ (témoin)" />

          {/* station météo WEENAT au premier plan */}
          <g transform="translate(120 214)">
            <title>Station météo WEENAT — température, vent, pluie</title>
            <line x1="0" y1="0" x2="0" y2="-52" stroke="hsl(var(--foreground))" strokeWidth="2" opacity=".85" />
            <g className="cad-anim" style={{ transformOrigin: '0px -52px', animation: 'cad-spin 2.4s linear infinite' }}>
              <line x1="-9" y1="-52" x2="9" y2="-52" stroke="hsl(var(--foreground))" strokeWidth="1.4" />
              <circle cx="-9" cy="-52" r="2.4" fill="hsl(var(--foreground))" />
              <circle cx="9" cy="-52" r="2.4" fill="hsl(var(--foreground))" />
            </g>
            {/* pluviomètre */}
            <path d="M 6 -30 L 16 -30 L 13.5 -18 L 8.5 -18 Z" fill="hsl(var(--foreground))" opacity=".9" />
            {/* capteur de température */}
            <rect x="-14" y="-28" width="9" height="12" rx="2" fill="hsl(var(--foreground))" opacity=".9" />
            <rect x="0" y="-2" width="0" height="0" />
          </g>
        </svg>
      </DemoFrame>
    </div>
  );
};
