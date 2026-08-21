import React from 'react';
import { Radio, Building2, Clock, Activity } from 'lucide-react';
import { useAllCapteursGeo, useTelemetryPings, type CapteurGeo } from '@/hooks/iot/useIotTelemetry';
import { useLatestMesures } from '@/hooks/iot/useIot';
import { useCapteurCovers } from '@/hooks/iot/useCapteurPhotos';
import VitalityAtlas from '@/components/iot/console/VitalityAtlas';
import SensorObservatory from '@/components/iot/SensorObservatory';
import SensorPeekDialog from '@/components/iot/SensorPeekDialog';
import { useIotConsole } from './IotConsoleContext';
import { capteurEtat } from '@/lib/iot/grandeurs';
import { openIotAi } from '@/components/iot/chatbot/iotChatFocus';
import {
  buildScale, fmtValue, keyReadings, positionOnScale, type AxisScale, type KeyReading,
} from '@/lib/iot/keyReadings';

const minutesSince = (iso?: string | null) =>
  iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000)) : null;

/** État lisible d'une sonde à partir de sa fraîcheur (en minutes). */
export const sensorStatus = (minutes: number | null, silenceAlertHours?: number | null) => {
  if (minutes == null) {
    return { label: 'Jamais vue', className: 'border-border/60 text-muted-foreground' };
  }
  if (minutes > (silenceAlertHours ?? 24) * 60) {
    return { label: 'Silencieuse', className: 'border-destructive/40 text-destructive' };
  }
  if (minutes > 120) {
    return { label: 'En veille', className: 'border-amber-500/40 text-amber-500' };
  }
  return { label: 'En ligne', className: 'border-emerald-500/40 text-emerald-500' };
};

const Kpi: React.FC<{ icon: React.ElementType; value: string; label: string; hint?: string }> = ({
  icon: Icon, value, label, hint,
}) => (
  <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-[11px] uppercase tracking-[0.18em]">{label}</span>
    </div>
    <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

/** Une valeur clé + sa position sur l'échelle commune du parc. */
const ReadingCell: React.FC<{
  reading: KeyReading | null;
  scale: AxisScale | null;
  dimmed?: boolean;
  extreme?: string | null;
  fallbackLabel: string;
  /** Ouvre l'Observatoire sur la semaine écoulée pour enquêter. */
  onInvestigate?: () => void;
}> = ({ reading, scale, dimmed, extreme, fallbackLabel, onInvestigate }) => {
  if (!reading) {
    return (
      <div className="min-w-0">
        <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{fallbackLabel}</div>
        <div className="mt-0.5 text-sm text-muted-foreground/70">non transmise</div>
      </div>
    );
  }
  const doute = !reading.fiable;
  const pos = scale ? positionOnScale(reading.valeur, scale) : 0.5;
  const attenue = dimmed || doute;
  return (
    <div className="min-w-0">
      <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
        {reading.label}
        {reading.profondeurLabel ? ` · ${reading.profondeurLabel}` : ''}
      </div>
      <div className={`mt-0.5 flex items-baseline gap-1 ${attenue ? 'text-muted-foreground' : 'text-foreground'}`}>
        <span className="text-2xl font-semibold tabular-nums leading-none sm:text-xl">
          {fmtValue(reading.valeur, reading.digits)}
        </span>
        <span className="text-[11px] text-muted-foreground">{reading.unite}</span>
      </div>
      <div className="relative mt-1.5 h-1.5 w-full rounded-full bg-muted">
        <span
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background"
          style={{ left: `${pos * 100}%`, background: attenue ? 'hsl(var(--muted-foreground))' : reading.color }}
        />
        {scale && (
          <span
            className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-border"
            style={{ left: `${positionOnScale(scale.median, scale) * 100}%` }}
          />
        )}
      </div>
      {doute ? (
        <span
          role="button"
          tabIndex={0}
          title={reading.motif ?? undefined}
          onClick={(e) => { e.stopPropagation(); onInvestigate?.(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onInvestigate?.(); }
          }}
          className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-500/40 px-2 py-0.5 text-[10px] text-amber-500 hover:bg-amber-500/10"
        >
          <AlertTriangle className="h-3 w-3" /> à vérifier
        </span>
      ) : (
        extreme && <div className="mt-1 text-[10px] text-muted-foreground">{extreme}</div>
      )}
      {doute && reading.motif && (
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{reading.motif}</p>
      )}
    </div>
  );
};

/**
 * Accueil générique d'un espace partenaire : l'état du parc de sondes du
 * fabricant, sans récit propre à un partenaire donné.
 */
export const IotPartnerHome: React.FC = () => {
  const { label, capabilities } = useIotConsole();
  const { data: capteurs = [], isLoading } = useAllCapteursGeo();
  const ids = React.useMemo(() => capteurs.map((c) => c.id), [capteurs]);
  const { data: pings = [] } = useTelemetryPings(48, ids);
  const { data: latest = {} } = useLatestMesures(ids);
  const { data: covers = {} } = useCapteurCovers(ids);

  const [peekId, setPeekId] = React.useState<string | null>(null);
  const [observatory, setObservatory] = React.useState<CapteurGeo | null>(null);
  const peek = capteurs.find((c) => c.id === peekId) ?? null;
  const pingsFor = (id: string) => pings.filter((p) => p.capteur_id === id).map((p) => p.mesure_at);

  const actifs = capteurs.filter((c) => c.actif).length;
  const proprietes = new Set(capteurs.map((c) => c.propriete_id).filter(Boolean)).size;
  const dernier = capteurs
    .map((c) => c.last_seen_at)
    .filter(Boolean)
    .sort()
    .slice(-1)[0] as string | undefined;
  const fraicheur = minutesSince(dernier);
  const silencieuses = capteurs.filter((c) => {
    const m = minutesSince(c.last_seen_at);
    return m == null || m > (c.silence_alert_hours ?? 24) * 60;
  }).length;

  /** Lectures clés par sonde + échelles partagées (sondes en ligne uniquement). */
  const { readings, scaleH, scaleT, extremes } = React.useMemo(() => {
    const readings = new Map<string, ReturnType<typeof keyReadings>>();
    capteurs.forEach((c) => readings.set(c.id, keyReadings(c, (latest as any)[c.id] ?? [])));
    const online = capteurs.filter(
      (c) =>
        capteurEtat(c as any) === 'service' &&
        sensorStatus(minutesSince(c.last_seen_at), c.silence_alert_hours).label === 'En ligne',
    );
    const collect = (axis: 'humidite' | 'temperature') =>
      online
        .map((c) => readings.get(c.id)?.[axis])
        .filter(Boolean)
        .map((r) => ({ valeur: r!.valeur, unite: r!.unite, digits: r!.digits }));
    const scaleH = buildScale(collect('humidite'));
    const scaleT = buildScale(collect('temperature'));

    const extremes = new Map<string, string>();
    const mark = (axis: 'humidite' | 'temperature', scale: AxisScale | null, lo: string, hi: string) => {
      if (!scale || scale.count < 2 || scale.max === scale.min) return;
      online.forEach((c) => {
        const r = readings.get(c.id)?.[axis];
        if (!r) return;
        if (r.valeur === scale.max) extremes.set(`${c.id}|${axis}`, hi);
        if (r.valeur === scale.min) extremes.set(`${c.id}|${axis}`, lo);
      });
    };
    mark('humidite', scaleH, 'le plus sec', 'le plus humide');
    mark('temperature', scaleT, 'le plus frais', 'le plus chaud');
    return { readings, scaleH, scaleT, extremes };
  }, [capteurs, latest]);

  if (isLoading) {
    return <p className="py-16 text-center text-muted-foreground">Lecture du parc…</p>;
  }

  const scaleLine = (scale: AxisScale | null, nom: string) =>
    scale ? `${nom} : ${fmtValue(scale.min, scale.digits)} → ${fmtValue(scale.max, scale.digits)} ${scale.unite}` : null;
  const echelles = [scaleLine(scaleH, 'Humidité'), scaleLine(scaleT, 'Température')].filter(Boolean).join(' · ');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Espace partenaire</p>
        <h2 className="text-xl font-semibold text-foreground">{label}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Radio} label="Sondes" value={`${actifs}/${capteurs.length}`} hint="actives sur déployées" />
        <Kpi icon={Building2} label="Propriétés" value={String(proprietes)} hint="lieux couverts" />
        <Kpi
          icon={Clock}
          label="Dernière remontée"
          value={fraicheur == null ? '—' : fraicheur < 60 ? `${fraicheur} min` : `${Math.round(fraicheur / 60)} h`}
          hint="fraîcheur de la donnée"
        />
        <Kpi
          icon={Activity}
          label="Silencieuses"
          value={String(silencieuses)}
          hint="au-delà du seuil d'alerte"
        />
      </div>

      <VitalityAtlas capteurs={capteurs} pings={pings} onOpenSensor={setPeekId} />

      <div className="rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sondes actives du parc</p>

        <ul className="mt-3 space-y-2 sm:space-y-0 sm:divide-y sm:divide-border/50">
          {capteurs
            .filter((c) => {
              const m = minutesSince(c.last_seen_at);
              const statut = sensorStatus(m, c.silence_alert_hours);
              return statut.label === 'En ligne';
            })
            .map((c) => {
              const m = minutesSince(c.last_seen_at);
              const statut = sensorStatus(m, c.silence_alert_hours);
              const hors = capteurEtat(c as any) !== 'service';
              const r = readings.get(c.id);
              const batterie =
                c.battery_pct != null && c.battery_pct > 0
                  ? `Batterie ${Math.round(c.battery_pct)} %`
                  : 'Batterie non transmise';
              const fresh =
                m == null ? 'jamais vue' : m < 60 ? `vue il y a ${m} min` : `vue il y a ${Math.round(m / 60)} h`;

              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setPeekId(c.id)}
                    aria-label={`Ouvrir la fiche de ${c.nom}`}
                    className="w-full rounded-2xl border border-border/50 bg-background/40 p-3 text-left transition active:scale-[0.995] hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-14 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-1 sm:py-3 sm:hover:bg-accent/30"
                  >
                    <div className="sm:flex sm:items-center sm:gap-4">
                      {/* Identité */}
                      <div className="min-w-0 sm:w-[34%]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${statut.className}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {statut.label}
                          </span>
                          <span className="font-medium text-foreground">{c.nom}</span>
                          {hors && (
                            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                              hors service
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {c.serial_number} · {c.propriete?.nom ?? '—'}
                        </div>
                      </div>

                      {/* Colonnes de comparaison */}
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-0 sm:flex-1">
                        <ReadingCell
                          reading={r?.humidite ?? null}
                          scale={scaleH}
                          dimmed={hors}
                          extreme={hors ? null : extremes.get(`${c.id}|humidite`) ?? null}
                          fallbackLabel="Humidité"
                        />
                        <ReadingCell
                          reading={r?.temperature ?? null}
                          scale={scaleT}
                          dimmed={hors}
                          extreme={hors ? null : extremes.get(`${c.id}|temperature`) ?? null}
                          fallbackLabel="Température"
                        />
                      </div>

                      {/* Pied */}
                      <div className="mt-2 text-[11px] text-muted-foreground sm:mt-0 sm:w-[22%] sm:text-right">
                        {fresh}
                        <span className="sm:block"> · </span>
                        <span className={c.battery_pct != null && c.battery_pct > 0 ? '' : 'opacity-60'}>{batterie}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          {capteurs.filter((c) => {
            const m = minutesSince(c.last_seen_at);
            const statut = sensorStatus(m, c.silence_alert_hours);
            return statut.label === 'En ligne';
          }).length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">Aucune sonde en ligne actuellement.</li>
          )}
        </ul>

        {capteurs.length > 0 && (
          <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
            {echelles && <p>Échelle du parc — {echelles}. Le repère central marque la médiane.</p>}
            <p>
              <span className="text-foreground/80">En ligne</span> : vue il y a moins de 2 h ·{' '}
              <span className="text-foreground/80">En veille</span> : pas de remontée depuis plus de 2 h ·{' '}
              <span className="text-foreground/80">Silencieuse</span> : au-delà du seuil d'alerte de la sonde.
              « Batterie non transmise » signifie que le fabricant n'envoie pas cette donnée — ce n'est pas une
              batterie vide.
            </p>
          </div>
        )}
      </div>

      <SensorPeekDialog
        capteur={peek}
        latest={peek ? (latest as any)[peek.id] ?? [] : []}
        pings={peek ? pingsFor(peek.id) : []}
        coverUrl={peek ? covers[peek.id]?.url : undefined}
        capabilities={capabilities}
        onClose={() => setPeekId(null)}
        onObservatory={(c) => { setPeekId(null); setObservatory(c as CapteurGeo); }}
        onAskAi={(c) => {
          // La fiche Radix et le chatbot partagent le même niveau de portail.
          // Démonter d'abord la fiche (et son focus trap), puis ouvrir l'IA.
          setPeekId(null);
          window.setTimeout(() => {
            openIotAi({
              capteurId: c.id,
              proprieteId: c.propriete_id,
              prefill: `Cette sonde « ${c.nom} » est-elle fiable ? Que dit-elle du sol ${c.emplacement ? `au ${c.emplacement}` : ''} ?`,
            });
          }, 0);
        }}
      />

      {observatory && <SensorObservatory capteur={observatory} onClose={() => setObservatory(null)} />}
    </div>
  );
};

export default IotPartnerHome;
