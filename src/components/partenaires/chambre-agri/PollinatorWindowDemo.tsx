import React from 'react';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';
import { DemoFrame, Legende } from './DemoFrame';

type WindowState = 'fermee' | 'faible' | 'ouverte';
type PollinatorKind = 'abeille' | 'bourdon' | 'syrphe' | 'papillon';

const WEATHER = [
  { hour: 5, temperature: 13, wind: 4 },
  { hour: 6, temperature: 12, wind: 5 },
  { hour: 7, temperature: 13, wind: 6 },
  { hour: 8, temperature: 15, wind: 8 },
  { hour: 9, temperature: 18, wind: 10 },
  { hour: 10, temperature: 21, wind: 12 },
  { hour: 11, temperature: 23, wind: 14 },
  { hour: 12, temperature: 25, wind: 15 },
  { hour: 13, temperature: 27, wind: 16 },
  { hour: 14, temperature: 28, wind: 17 },
  { hour: 15, temperature: 29, wind: 22 },
  { hour: 16, temperature: 29, wind: 28 },
  { hour: 17, temperature: 28, wind: 17 },
  { hour: 18, temperature: 26, wind: 14 },
  { hour: 19, temperature: 24, wind: 10 },
  { hour: 20, temperature: 22, wind: 6 },
] as const;

const windowState = (hour: number, temperature: number, wind: number, rain = false): { state: WindowState; cause?: string } => {
  if (hour < 7 || hour > 20 || temperature < 12 || wind > 25 || rain) {
    const cause = hour < 7 || hour > 20 ? 'nuit' : temperature < 12 ? 'froid' : wind > 25 ? 'vent' : 'pluie';
    return { state: 'fermee', cause };
  }
  if (temperature < 15 || (wind >= 18 && wind <= 25) || temperature > 32 || hour === 20) {
    const cause = temperature < 15
      ? 'fraîcheur : seuls les bourdons volent'
      : wind >= 18
        ? 'vent : seuls les bourdons volent'
        : temperature > 32
          ? 'forte chaleur : seuls les bourdons volent'
          : 'lumière déclinante : seuls les bourdons volent';
    return { state: 'faible', cause };
  }
  return { state: 'ouverte' };
};

const INVASIVES = [
  {
    x: 128, y: 146, width: 82, height: 72,
    label: 'Renouée du Japon · fauches répétées',
    tooltip: 'Très visitée par les abeilles en fin d’été, mais elle étouffe la flore locale et appauvrit la diversité des fleurs.',
    kind: 'renouee',
  },
  {
    x: 466, y: 158, width: 72, height: 60,
    label: 'Ambroisie · détruite avant floraison',
    tooltip: 'Pollinisée par le vent, son pollen est très allergisant. Sa destruction avant floraison est obligatoire.',
    kind: 'ambroisie',
  },
  {
    x: 580, y: 132, width: 86, height: 84,
    label: 'Baccharis · arrachage',
    tooltip: 'Arbuste invasif des marais et fossés littoraux, il remplace la végétation d’origine.',
    kind: 'baccharis',
  },
] as const;

const FLOWERS = [
  { x: 42, y: 184 }, { x: 76, y: 164 }, { x: 228, y: 178 }, { x: 274, y: 151 },
  { x: 318, y: 181 }, { x: 366, y: 158 }, { x: 407, y: 184 }, { x: 532, y: 180 },
  { x: 652, y: 174 },
];

const FLIGHT_PATHS = [
  'M 34 152 C 82 116, 146 128, 226 151 S 350 126, 424 158',
  'M 72 178 C 136 142, 204 174, 278 132 S 388 158, 518 166',
  'M 212 160 C 274 116, 334 146, 398 126 S 512 158, 650 146',
  'M 650 168 C 582 130, 536 162, 442 142 S 304 166, 226 144',
];

const Flower: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 20 C-2 10 1 3 0-4" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
    <path d="M0 8 C-8 2-10 10-2 13 M0 4 C7-2 10 6 2 10" fill="hsl(var(--primary))" opacity=".45" />
    {[0, 60, 120, 180, 240, 300].map((angle) => (
      <ellipse key={angle} cx="0" cy="-10" rx="2.8" ry="6" fill="hsl(var(--warning))" opacity=".72" transform={`rotate(${angle}) translate(0 -5)`} />
    ))}
    <circle cy="-10" r="3" fill="hsl(var(--warning-foreground))" opacity=".8" />
  </g>
);

const Pollinator: React.FC<{ kind: PollinatorKind; index: number }> = ({ kind, index }) => {
  const commonStyle = {
    offsetPath: `path('${FLIGHT_PATHS[index % FLIGHT_PATHS.length]}')`,
    animation: `cad-pollinator-flight ${7 + (index % 4) * 0.7}s ${-index * 0.83}s linear infinite`,
  } as React.CSSProperties;

  return (
    <g className="cad-anim" style={commonStyle} aria-hidden="true">
      {kind === 'abeille' && <g>
        <ellipse cx="-3" cy="-3" rx="4" ry="2.5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" opacity=".78" />
        <ellipse cx="3" cy="-3" rx="4" ry="2.5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" opacity=".78" />
        <ellipse rx="6" ry="3.5" fill="hsl(var(--warning))" stroke="hsl(var(--foreground))" />
        <path d="M-2-3v6M2-3v6" stroke="hsl(var(--foreground))" strokeWidth="1.2" />
      </g>}
      {kind === 'bourdon' && <g transform="scale(1.25)">
        <ellipse cx="-3" cy="-3" rx="4.5" ry="3" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" opacity=".72" />
        <ellipse cx="3" cy="-3" rx="4.5" ry="3" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" opacity=".72" />
        <ellipse rx="6.5" ry="4.5" fill="hsl(var(--foreground))" />
        <path d="M-2-4v8M2-4v8" stroke="hsl(var(--warning))" strokeWidth="2" />
      </g>}
      {kind === 'syrphe' && <g>
        <ellipse cx="-3" cy="-3" rx="5" ry="2" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" opacity=".75" />
        <ellipse cx="3" cy="-3" rx="5" ry="2" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" opacity=".75" />
        <path d="M-6 0 Q0-4 7 0 Q0 5-6 0" fill="hsl(var(--warning))" stroke="hsl(var(--foreground))" />
        <path d="M-1-3v6M3-2v4" stroke="hsl(var(--foreground))" strokeWidth="1" />
      </g>}
      {kind === 'papillon' && <g>
        <path d="M0 0 C-4-10-13-9-10 0 C-13 8-4 9 0 2 C4 9 13 8 10 0 C13-9 4-10 0 0Z" fill="hsl(var(--warning))" stroke="hsl(var(--foreground))" />
        <path d="M0-3v8" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
      </g>}
    </g>
  );
};

const InvasivePlant: React.FC<(typeof INVASIVES)[number]> = ({ x, y, width, height, label, tooltip, kind }) => (
  <g>
    <title>{tooltip}</title>
    <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx="16" fill="none" stroke="hsl(var(--warning))" strokeWidth="2" strokeDasharray="5 4" />
    <path d={`M${x} ${y + 25} Q${x - 5} ${y} ${x} ${y - 24}`} fill="none" stroke="hsl(var(--primary))" strokeWidth={kind === 'baccharis' ? 5 : 3} />
    {kind === 'renouee' && <g fill="hsl(var(--primary))" opacity=".7">
      <ellipse cx={x - 13} cy={y + 7} rx="13" ry="6" transform={`rotate(-24 ${x - 13} ${y + 7})`} />
      <ellipse cx={x + 14} cy={y - 7} rx="13" ry="6" transform={`rotate(24 ${x + 14} ${y - 7})`} />
      <circle cx={x} cy={y - 26} r="5" fill="hsl(var(--background))" stroke="hsl(var(--warning))" />
    </g>}
    {kind === 'ambroisie' && <g fill="none" stroke="hsl(var(--primary))" strokeWidth="2" opacity=".8">
      <path d={`M${x} ${y + 18}l-15-13m15 2 14-14m-14 2-10-14m10 6 9-13`} />
    </g>}
    {kind === 'baccharis' && <g fill="hsl(var(--primary))" opacity=".68">
      <circle cx={x - 16} cy={y} r="16" /><circle cx={x + 15} cy={y - 4} r="18" /><circle cx={x} cy={y - 18} r="17" />
      <circle cx={x - 10} cy={y - 25} r="3" fill="hsl(var(--warning))" /><circle cx={x + 13} cy={y - 25} r="3" fill="hsl(var(--warning))" />
    </g>}
    <g transform={`translate(${x - width / 2 + 8} ${y - height / 2 + 8})`}>
      <path d="M0 12 7 0l7 12Z" fill="hsl(var(--warning))" />
      <text x="7" y="10" textAnchor="middle" fontSize="9" className="fill-warning-foreground" fontWeight="700">!</text>
    </g>
    <rect x={x - width / 2 - 8} y={y - height / 2 - 24} width={width + 16} height="18" rx="4" fill="hsl(var(--card))" opacity=".94" />
    <text x={x} y={y - height / 2 - 12} textAnchor="middle" fontSize="8.5" className="fill-foreground">{label}</text>
  </g>
);

export const PollinatorWindowDemo: React.FC = () => {
  const { ref, shown } = useRevealOnScroll<HTMLDivElement>();
  const [h, setH] = React.useState(11);
  const [autoPlay, setAutoPlay] = React.useState(true);

  React.useEffect(() => {
    if (!shown || !autoPlay || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setH((x) => (x >= 20 ? 5 : x + 1)), 900);
    return () => clearInterval(id);
  }, [shown, autoPlay]);

  const selectHour = (hour: number) => {
    setAutoPlay(false);
    setH(hour);
  };

  const weather = WEATHER.find((item) => item.hour === h) ?? WEATHER[6];
  const status = windowState(h, weather.temperature, weather.wind);
  const insectCount = status.state === 'fermee'
    ? 0
    : status.state === 'faible'
      ? weather.temperature <= 15 ? 2 : 3
      : Math.round(10 + Math.min(1, Math.max(0, (weather.temperature - 15) / 13)) * 4);
  const insectKinds: PollinatorKind[] = status.state === 'faible'
    ? Array.from({ length: insectCount }, () => 'bourdon' as const)
    : Array.from({ length: insectCount }, (_, index) => (['abeille', 'bourdon', 'syrphe', 'papillon'] as const)[index % 4]);
  const stateLabel = status.state === 'ouverte' ? 'fenêtre ouverte' : status.state === 'faible' ? 'activité faible' : 'fenêtre fermée';
  const footerStatus = `${stateLabel}${status.cause ? ` (${status.cause})` : ''}`;

  return (
    <div ref={ref} className={shown ? 'cad-on' : ''}>
      <DemoFrame
        kicker="Pollinisateurs et invasives"
        titre="La fenêtre de butinage"
        texte="La météo à la parcelle révèle les heures où les pollinisateurs volent. Les espèces invasives repérées par les observations sont signalées dans la parcelle."
        footer={<div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span><span className="font-serif text-2xl text-primary">{h} h</span> <span className="text-muted-foreground">· {weather.temperature} °C · vent {weather.wind} km/h · {footerStatus}</span></span>
            <Legende />
          </div>
          <p className="text-xs text-muted-foreground">Toute intervention (fauche, broyage) est à programmer hors de la fenêtre de butinage.</p>
        </div>}
      >
        <svg viewBox="0 0 700 270" className="w-full h-auto block" role="img" aria-label={`Parcelle en fin août, ${footerStatus}`}>
          <rect width="700" height="218" fill="hsl(var(--primary))" opacity=".06" />
          <path d="M0 199 Q90 190 175 198 T350 197 T525 199 T700 196 V218 H0Z" fill="hsl(var(--primary))" opacity=".12" />
          <g aria-label="Fleurs indigènes fixes">
            {FLOWERS.map((flower) => <Flower key={`${flower.x}-${flower.y}`} {...flower} />)}
          </g>
          {INVASIVES.map((invasive) => <InvasivePlant key={invasive.label} {...invasive} />)}
          {insectKinds.map((kind, index) => <Pollinator key={`${h}-${kind}-${index}`} kind={kind} index={index} />)}
          {WEATHER.map((item, i) => {
            const itemStatus = windowState(item.hour, item.temperature, item.wind).state;
            const selected = item.hour === h;
            return <g
              key={item.hour}
              onClick={() => selectHour(item.hour)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  selectHour(item.hour);
                }
              }}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${item.hour} h, ${itemStatus === 'ouverte' ? 'fenêtre ouverte' : itemStatus === 'faible' ? 'activité faible' : 'fenêtre fermée'}`}
              aria-pressed={selected}
            >
              <rect x={20 + i * 41} y="218" width="37" height="22" rx="4"
                fill={itemStatus === 'ouverte' ? 'hsl(var(--primary))' : itemStatus === 'faible' ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                opacity={selected ? 1 : itemStatus === 'ouverte' ? 0.72 : itemStatus === 'faible' ? 0.35 : 0.55}
                stroke={selected ? 'hsl(var(--foreground))' : 'transparent'} strokeWidth="2" />
              <text x={38 + i * 41} y="233" textAnchor="middle" fontSize="10" className={itemStatus === 'fermee' ? 'fill-muted-foreground' : 'fill-primary-foreground'}>{item.hour}h</text>
            </g>;
          })}
          <text x="20" y="258" fontSize="9" className="fill-muted-foreground">Fin août · lever 7 h · coucher 20 h 45</text>
        </svg>
      </DemoFrame>
    </div>
  );
};
