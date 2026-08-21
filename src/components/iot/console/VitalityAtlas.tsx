import React from 'react';
import L from 'leaflet';
import { CircleMarker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Activity, Clock3, MapPin, Radio, Waves } from 'lucide-react';
import SafeMapContainer from '@/components/maps/SafeMapContainer';
import { Button } from '@/components/ui/button';
import { VitalityStrip } from '@/components/iot/VitalityStrip';
import type { CapteurGeo, TelemetryPing } from '@/hooks/iot/useIotTelemetry';

const PARIS = 'Europe/Paris';
const dayTime = (iso: string) => new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: PARIS,
}).format(new Date(iso));
const shortTime = (iso: string) => new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit', minute: '2-digit', timeZone: PARIS,
}).format(new Date(iso));
const windowLabel = (from: Date, to: Date) => `${dayTime(from.toISOString())} → ${shortTime(to.toISOString())}`;

const FitSensors: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  React.useEffect(() => {
    if (positions.length === 1) map.setView(positions[0], 17);
    if (positions.length > 1) map.fitBounds(L.latLngBounds(positions), { padding: [28, 28], maxZoom: 17 });
  }, [map, positions]);
  return null;
};

interface VitalityAtlasProps {
  capteurs: CapteurGeo[];
  pings: TelemetryPing[];
  onOpenSensor: (id: string) => void;
}

/** Lecture spatio-temporelle des transmissions du parc sur 48 heures. */
const VitalityAtlas: React.FC<VitalityAtlasProps> = ({ capteurs, pings, onOpenSensor }) => {
  const [selected, setSelected] = React.useState<{ index: number; from: Date; to: Date } | null>(null);
  const ordered = React.useMemo(
    () => [...pings].sort((a, b) => a.mesure_at.localeCompare(b.mesure_at)),
    [pings],
  );
  const first = ordered[0]?.mesure_at;
  const last = ordered[ordered.length - 1]?.mesure_at;
  const positions = React.useMemo(
    () => capteurs.filter((c) => c.lat != null && c.lng != null).map((c) => [c.lat as number, c.lng as number] as [number, number]),
    [capteurs],
  );
  const selectedPings = React.useMemo(() => {
    if (!selected) return ordered;
    return ordered.filter((p) => {
      const t = new Date(p.mesure_at).getTime();
      return t >= selected.from.getTime() && t < selected.to.getTime();
    });
  }, [ordered, selected]);
  const activeIds = React.useMemo(() => new Set(selectedPings.map((p) => p.capteur_id)), [selectedPings]);
  const sensorCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    selectedPings.forEach((p) => counts.set(p.capteur_id, (counts.get(p.capteur_id) ?? 0) + 1));
    return counts;
  }, [selectedPings]);
  const longestSilence = React.useMemo(() => {
    if (ordered.length < 2) return null;
    let gap = 0;
    for (let i = 1; i < ordered.length; i += 1) {
      gap = Math.max(gap, new Date(ordered[i].mesure_at).getTime() - new Date(ordered[i - 1].mesure_at).getTime());
    }
    return Math.round(gap / 3_600_000);
  }, [ordered]);
  const leader = React.useMemo(() => {
    const counts = new Map<string, number>();
    ordered.forEach((p) => counts.set(p.capteur_id, (counts.get(p.capteur_id) ?? 0) + 1));
    const id = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return capteurs.find((c) => c.id === id)?.nom;
  }, [capteurs, ordered]);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Waves className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Atlas vivant · 48 h</p>
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
            <div className="mt-1 text-xs font-medium text-foreground">{first ? dayTime(first) : 'Aucune'}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground"><Radio className="h-3 w-3" /> Dernière réception</div>
            <div className="mt-1 text-xs font-medium text-foreground">{last ? dayTime(last) : 'Aucune'}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="text-[10px] uppercase text-muted-foreground">Régularité</div>
            <div className="mt-1 truncate text-xs font-medium text-foreground">{leader ?? 'Pas assez de recul'}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-2.5">
            <div className="text-[10px] uppercase text-muted-foreground">Plus long silence</div>
            <div className="mt-1 text-xs font-medium text-foreground">{longestSilence == null ? '—' : longestSilence < 1 ? 'moins d’une heure' : `${longestSilence} h`}</div>
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
            <span>{ordered.length} valeurs reçues</span>
            <span className="text-right">Touchez une heure pour la situer</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/30 p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
            {selected ? windowLabel(selected.from, selected.to) : 'Toutes les réceptions des 48 dernières heures'}
          </p>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {activeIds.size}/{capteurs.length} sondes
          </span>
        </div>

        {positions.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <SafeMapContainer center={positions[0]} zoom={15} className="h-52 w-full sm:h-64" scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              <FitSensors positions={positions} />
              {capteurs.filter((c) => c.lat != null && c.lng != null).map((c) => {
                const active = activeIds.has(c.id);
                return (
                  <CircleMarker
                    key={c.id}
                    center={[c.lat as number, c.lng as number]}
                    radius={active ? 10 : 6}
                    pathOptions={{
                      color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      fillColor: active ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                      fillOpacity: active ? 0.82 : 0.35,
                      weight: active ? 3 : 1,
                    }}
                  >
                    <Popup>
                      <div className="min-w-[170px]">
                        <strong>{c.nom}</strong>
                        <div>{sensorCounts.get(c.id) ?? 0} valeur(s) sur la période affichée</div>
                        <Button size="sm" className="mt-2 w-full" onClick={() => onOpenSensor(c.id)}>Ouvrir la sonde</Button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </SafeMapContainer>
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
            Aucune sonde géolocalisée — la chronologie reste disponible.
          </div>
        )}

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {capteurs.map((c) => {
            const active = activeIds.has(c.id);
            return (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={active ? 'secondary' : 'outline'}
                className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
                onClick={() => onOpenSensor(c.id)}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                {c.nom}
                {selected && <span className="tabular-nums text-muted-foreground">{sensorCounts.get(c.id) ?? 0}</span>}
              </Button>
            );
          })}
        </div>
        {selected && selectedPings.length === 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Activity className="h-3.5 w-3.5" /> Silence collectif sur ce créneau.</p>
        )}
      </div>
    </section>
  );
};

export default VitalityAtlas;