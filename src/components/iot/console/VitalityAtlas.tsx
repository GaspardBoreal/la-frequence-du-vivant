import React from 'react';
import { Activity, Clock3, Gauge, Radio, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VitalityStrip } from '@/components/iot/VitalityStrip';
import { capteurEtat } from '@/lib/iot/grandeurs';
import { averageRegularity, earliest, fmtAnciennete, fmtDuree, fmtReception, vitalityStats } from '@/lib/iot/vitality';
import { useSensorsOrigin, type CapteurGeo, type TelemetryPing } from '@/hooks/iot/useIotTelemetry';

const PARIS = 'Europe/Paris';
const shortTime = (d: Date) => new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit', minute: '2-digit', timeZone: PARIS,
}).format(d);
const windowLabel = (from: Date, to: Date) => `${fmtReception(from.toISOString())} → ${shortTime(to)}`;

interface VitalityAtlasProps {
  capteurs: CapteurGeo[];
  pings: TelemetryPing[];
  onOpenSensor: (id: string) => void;
}

/**
 * Lecture temporelle des transmissions du parc sur 48 heures.
 * Ne retient que les sondes actives et en service : le silence d'une sonde en
 * maintenance n'a pas à polluer le rythme lu par le partenaire.
 */
const VitalityAtlas: React.FC<VitalityAtlasProps> = ({ capteurs, pings, onOpenSensor }) => {
  const [selected, setSelected] = React.useState<{ index: number; from: Date; to: Date } | null>(null);

  const retenues = React.useMemo(
    () => capteurs.filter((c) => c.actif && capteurEtat(c as any) === 'service'),
    [capteurs],
  );
  const retenuesIds = React.useMemo(() => new Set(retenues.map((c) => c.id)), [retenues]);

  const ordered = React.useMemo(
    () => pings.filter((p) => retenuesIds.has(p.capteur_id)).sort((a, b) => a.mesure_at.localeCompare(b.mesure_at)),
    [pings, retenuesIds],
  );

  const { data: origins } = useSensorsOrigin(retenues.map((c) => c.id));
  const origine = React.useMemo(
    () => earliest(retenues.map((c) => origins?.[c.id])),
    [retenues, origins],
  );

  const stats = React.useMemo(() => vitalityStats(ordered.map((p) => p.mesure_at)), [ordered]);
  const regularite = React.useMemo(
    () => averageRegularity(retenues.map((c) => ordered.filter((p) => p.capteur_id === c.id).map((p) => p.mesure_at))),
    [retenues, ordered],
  );

  const selectedPings = React.useMemo(() => {
    if (!selected) return ordered;
    return ordered.filter((p) => {
      const t = new Date(p.mesure_at).getTime();
      return t >= selected.from.getTime() && t < selected.to.getTime();
    });
  }, [ordered, selected]);

  const sensorCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    selectedPings.forEach((p) => counts.set(p.capteur_id, (counts.get(p.capteur_id) ?? 0) + 1));
    return counts;
  }, [selectedPings]);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Waves className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Atlas vivant</p>
            <h3 className="mt-0.5 text-base font-semibold text-foreground">Le rythme réel du parc</h3>
          </div>
          {selected && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setSelected(null)}>
              Revenir aux 48 h
            </Button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground"><Clock3 className="h-3 w-3" /> Première réception</div>
            <div className="mt-1 text-xs font-medium text-foreground">{fmtReception(origine ?? stats.first)}</div>
            <div className="text-[10px] text-muted-foreground">
              {origine
                ? `${fmtAnciennete(origine)} · ${retenues.length} sonde${retenues.length > 1 ? 's' : ''}`
                : 'depuis la mise en service'}
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground"><Radio className="h-3 w-3" /> Dernière réception</div>
            <div className="mt-1 text-xs font-medium text-foreground">{fmtReception(stats.last)}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground"><Gauge className="h-3 w-3" /> Régularité</div>
            <div className="mt-1 text-xs font-medium text-foreground">
              {regularite.minutes == null ? 'Pas assez de recul' : fmtDuree(regularite.minutes)}
            </div>
            {regularite.minutes != null && (
              <div className="text-[10px] text-muted-foreground">
                moyenne de {regularite.sensors} sonde{regularite.sensors > 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="text-[10px] uppercase text-muted-foreground">Plus long silence</div>
            <div className="mt-1 text-xs font-medium text-foreground">
              {stats.longestSilenceMin == null ? '—' : fmtDuree(stats.longestSilenceMin)}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <VitalityStrip
            timestamps={ordered.map((p) => p.mesure_at)}
            hours={48}
            showScale
            selectedIndex={selected?.index}
            onSelectHour={(index, from, to) => setSelected((current) => current?.index === index ? null : { index, from, to })}
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span>{stats.count} valeurs reçues</span>
            <span className="text-right">Touchez une heure pour la situer</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/30 p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
            {selected ? windowLabel(selected.from, selected.to) : 'Toutes les réceptions des 48 dernières heures'}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {retenues.map((c) => {
            const n = sensorCounts.get(c.id) ?? 0;
            return (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={n > 0 ? 'secondary' : 'outline'}
                className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
                onClick={() => onOpenSensor(c.id)}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${n > 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                {c.nom}
                <span className="tabular-nums text-muted-foreground">{n}</span>
              </Button>
            );
          })}
        </div>

        {selected && selectedPings.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Silence collectif sur ce créneau.</p>
        )}
      </div>
    </section>
  );
};

export default VitalityAtlas;
