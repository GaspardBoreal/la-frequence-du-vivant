import React from 'react';
import { Activity, CloudRain, Droplets, Gauge, Sun, Thermometer, X } from 'lucide-react';
import { useMesuresInWindow } from '@/hooks/iot/useIotTelemetry';
import { compareGrandeurs, fmtMesure, fmtProfondeur, grandeurMeta, moistureVerdict, withExpectedSlots } from '@/lib/iot/grandeurs';

const ICONS: Record<string, React.ElementType> = {
  soil_moisture: Droplets,
  air_humidity: Droplets,
  soil_temperature: Thermometer,
  air_temperature: Thermometer,
  dew_point: Thermometer,
  pressure: Gauge,
  luminosity: Sun,
  infrared: Sun,
  uv_index: Sun,
  rainfall: CloudRain,
};

const PARIS = 'Europe/Paris';
const fmtHeure = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: PARIS }).format(d);
const fmtJour = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: PARIS }).format(d);

export interface HourMesuresWidgetProps {
  capteurId: string;
  capteurNom?: string;
  /** Profondeurs déclarées par le modèle de sonde (grille de lecture attendue). */
  profondeursAttendues?: (number | string)[] | null;
  from: Date;
  to: Date;
  onClose: () => void;
}

/** Widget « heure ouverte » : les relevés réellement reçus dans le créneau cliqué. */
export const HourMesuresWidget: React.FC<HourMesuresWidgetProps> = ({ capteurId, capteurNom, profondeursAttendues, from, to, onClose }) => {

  const { data: mesures = [], isLoading } = useMesuresInWindow(
    capteurId,
    from.toISOString(),
    to.toISOString(),
  );

  const trames = React.useMemo(() => {
    const map = new Map<string, any[]>();
    mesures.forEach((m: any) => {
      const k = m.mesure_at as string;
      (map.get(k) ?? map.set(k, []).get(k)!).push(m);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [mesures]);

  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => { setIdx(Math.max(0, trames.length - 1)); }, [trames.length]);

  // L'échappement est géré globalement par le poste de contrôle (plusieurs widgets possibles).


  const current = trames[Math.min(idx, Math.max(0, trames.length - 1))];

  return (
    <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{capteurNom ?? 'Sonde'}</div>
          <div className="text-xs text-muted-foreground">
            {fmtJour(from)}, {fmtHeure(from)} → {fmtHeure(to)}
            {' · '}
            {isLoading ? 'lecture…' : `${mesures.length} relevé${mesures.length > 1 ? 's' : ''}`}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer le détail de l’heure"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {trames.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{trames.length} trames ·</span>
          {trames.map(([at], i) => (
            <button
              key={at}
              onClick={() => setIdx(i)}
              className={`rounded-full px-2 py-0.5 tabular-nums transition ${
                i === idx ? 'bg-emerald-600 text-white' : 'bg-muted hover:bg-muted/70'
              }`}
            >
              {fmtHeure(new Date(at))}
            </button>
          ))}
        </div>
      )}

      {!isLoading && trames.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">Silence — aucune trame reçue sur ce créneau.</p>
      )}

      {current && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {withExpectedSlots(current[1] as any[], profondeursAttendues).map((m: any) => {
            const meta = grandeurMeta(m.grandeur);
            const Icon = ICONS[m.grandeur] ?? Activity;
            const prof = fmtProfondeur(m.profondeur_m);
            const key = `${m.grandeur}-${m.profondeur_m ?? 'x'}`;

            if (m.missing) {
              return (
                <div key={key} className="rounded-lg border border-dashed border-border bg-muted/30 px-2.5 py-2 opacity-70">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span className="truncate">{meta.label}</span>
                    {prof && <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5">{prof}</span>}
                  </div>
                  <div className="mt-0.5 text-lg font-semibold tabular-nums text-muted-foreground">—</div>
                  <div className="mt-1 text-[10px] italic text-muted-foreground">non transmise</div>
                </div>
              );
            }

            const verdict = m.grandeur === 'soil_moisture' ? moistureVerdict(m.valeur) : null;
            return (
              <div key={key} className="rounded-lg border border-border bg-card px-2.5 py-2">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Icon className="h-3 w-3" style={{ color: meta.color }} />
                  <span className="truncate">{meta.label}</span>
                  {prof && <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5">{prof}</span>}
                </div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums">
                  {fmtMesure(m.valeur, m.grandeur, m.unite)}
                </div>
                {verdict && (
                  <div
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: `${verdict.color}1f`, color: verdict.color }}
                  >
                    {verdict.label}
                  </div>
                )}
                {m.interpretation && (
                  <div className="mt-1 text-[10px] italic text-muted-foreground">
                    Sonde : {m.interpretation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default HourMesuresWidget;
