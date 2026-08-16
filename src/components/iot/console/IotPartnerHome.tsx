import React from 'react';
import { Radio, Building2, Clock, Activity } from 'lucide-react';
import { useAllCapteursGeo, useTelemetryPings } from '@/hooks/iot/useIotTelemetry';
import VitalityStrip from '@/components/iot/VitalityStrip';
import { useIotConsole } from './IotConsoleContext';

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

/**
 * Accueil générique d'un espace partenaire : l'état du parc de sondes du
 * fabricant, sans récit propre à un partenaire donné.
 */
export const IotPartnerHome: React.FC = () => {
  const { label } = useIotConsole();
  const { data: capteurs = [], isLoading } = useAllCapteursGeo();
  const ids = React.useMemo(() => capteurs.map((c) => c.id), [capteurs]);
  const { data: pings = [] } = useTelemetryPings(48, ids);

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

  if (isLoading) {
    return <p className="py-16 text-center text-muted-foreground">Lecture du parc…</p>;
  }

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

      <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Vitalité 48 h</p>
        <VitalityStrip timestamps={pings.map((p) => p.mesure_at)} hours={48} showScale className="mt-3" />
        <p className="mt-2 text-xs text-muted-foreground">
          {pings.length} mesures reçues sur les deux derniers jours. Chaque barre est une heure ; les trous
          signalent un silence.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sondes du parc</p>
        <ul className="mt-3 divide-y divide-border/50">
          {capteurs.map((c) => {
            const m = minutesSince(c.last_seen_at);
            const statut = sensorStatus(m, c.silence_alert_hours);
            const batterie =
              c.battery_pct != null && c.battery_pct > 0
                ? `Batterie ${Math.round(c.battery_pct)} %`
                : 'Batterie non transmise';
            return (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${statut.className}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {statut.label}
                  </span>
                  <span className="font-medium text-foreground">{c.nom}</span>
                  <span className="text-xs text-muted-foreground">{c.serial_number}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.propriete?.nom ?? '—'} ·{' '}
                  {m == null ? 'jamais vue' : m < 60 ? `vue il y a ${m} min` : `vue il y a ${Math.round(m / 60)} h`}
                  {' · '}
                  <span className={c.battery_pct != null && c.battery_pct > 0 ? '' : 'opacity-60'}>{batterie}</span>
                </div>
              </li>
            );
          })}
          {capteurs.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">Aucune sonde déclarée pour ce fabricant.</li>
          )}
        </ul>
        {capteurs.length > 0 && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            <span className="text-foreground/80">En ligne</span> : vue il y a moins de 2 h ·{' '}
            <span className="text-foreground/80">En veille</span> : pas de remontée depuis plus de 2 h ·{' '}
            <span className="text-foreground/80">Silencieuse</span> : au-delà du seuil d'alerte de la sonde. « Batterie
            non transmise » signifie que le fabricant n'envoie pas cette donnée — ce n'est pas une batterie vide.
          </p>
        )}
      </div>
    </div>
  );
};

export default IotPartnerHome;
