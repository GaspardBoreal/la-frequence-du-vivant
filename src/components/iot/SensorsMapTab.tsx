import React from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { BarChart3, Battery, ExternalLink, MapPin, Radio, Search, Signal, Sparkles } from 'lucide-react';
import SafeMapContainer from '@/components/maps/SafeMapContainer';
import IotLayer from '@/components/propriete/iot/map/IotLayer';
import SensorObservatory from '@/components/iot/SensorObservatory';
import { VitalityStrip } from '@/components/iot/VitalityStrip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAllCapteursGeo, useTelemetryLive, useTelemetryPings, type CapteurGeo } from '@/hooks/iot/useIotTelemetry';
import { useLatestMesures } from '@/hooks/iot/useIot';
import { useCapteurCovers } from '@/hooks/iot/useCapteurPhotos';
import { HEALTH_COLOR, fmtHorodatage, fmtMesure, fmtProfondeur, sensorHealth } from '@/lib/iot/grandeurs';
import { iotChatFocus, openIotAi } from '@/components/iot/chatbot/iotChatFocus';
import { useIotConsole } from '@/components/iot/console/IotConsoleContext';


const FONDS = [
  { key: 'plan', label: 'Plan', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap' },
  {
    key: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
] as const;

const FitAll: React.FC<{ positions: [number, number][]; focus?: [number, number] | null }> = ({ positions, focus }) => {
  const map = useMap();
  React.useEffect(() => {
    if (focus) {
      map.setView(focus, Math.max(map.getZoom(), 18), { animate: true });
      return;
    }
    if (positions.length === 0) return;
    if (positions.length === 1) map.setView(positions[0], 17);
    else map.fitBounds(L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1]))), { padding: [60, 60], maxZoom: 18 });
  }, [positions, focus, map]);
  return null;
};

/** Carte de terrain de toutes les sondes déclarées + fiche + observatoire. */
export const SensorsMapTab: React.FC = () => {
  const { capabilities } = useIotConsole();
  const { data: capteurs = [], isLoading } = useAllCapteursGeo();
  const ids = React.useMemo(() => capteurs.map((c) => c.id), [capteurs]);
  const { data: latest = {} } = useLatestMesures(ids);
  const { data: covers = {} } = useCapteurCovers(ids);
  const { data: pings = [] } = useTelemetryPings(48, ids);

  const { live, lastLiveAt } = useTelemetryLive();

  const [fond, setFond] = React.useState<'plan' | 'satellite'>('satellite');
  const [q, setQ] = React.useState('');
  const [propriete, setPropriete] = React.useState('all');
  const [etat, setEtat] = React.useState<'all' | 'green' | 'amber' | 'red'>('all');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [focus, setFocus] = React.useState<[number, number] | null>(null);
  const [observatory, setObservatory] = React.useState<CapteurGeo | null>(null);

  const proprietes = React.useMemo(() => {
    const m = new Map<string, string>();
    capteurs.forEach((c) => c.propriete && m.set(c.propriete.id, c.propriete.nom));
    return [...m.entries()];
  }, [capteurs]);

  const filtered = React.useMemo(
    () =>
      capteurs.filter((c) => {
        if (propriete !== 'all' && c.propriete_id !== propriete) return false;
        if (etat !== 'all' && sensorHealth(c as any).status !== etat) return false;
        if (q.trim()) {
          const hay = `${c.nom} ${c.serial_number} ${c.type?.modele ?? ''} ${c.propriete?.nom ?? ''}`.toLowerCase();
          if (!hay.includes(q.trim().toLowerCase())) return false;
        }
        return true;
      }),
    [capteurs, propriete, etat, q],
  );

  const placed = filtered.filter((c) => c.lat != null && c.lng != null);
  const orphans = filtered.filter((c) => c.lat == null || c.lng == null);
  const positions = placed.map((c) => [c.lat as number, c.lng as number] as [number, number]);

  const selected = capteurs.find((c) => c.id === selectedId) ?? null;
  const pingsFor = (id: string) => pings.filter((p) => p.capteur_id === id).map((p) => p.mesure_at);

  const openSensor = (c: CapteurGeo) => {
    setSelectedId(c.id);
    if (c.lat != null && c.lng != null) setFocus([c.lat, c.lng]);
  };

  // L'IA regarde ce que l'administrateur regarde : sonde > propriété > parc.
  React.useEffect(() => {
    iotChatFocus.setCapteur(selectedId, selected?.propriete_id ?? (propriete === 'all' ? null : propriete));
  }, [selectedId, selected?.propriete_id, propriete]);

  React.useEffect(() => {
    if (!selectedId) iotChatFocus.setPropriete(propriete === 'all' ? null : propriete);
  }, [propriete, selectedId]);

  React.useEffect(() => () => iotChatFocus.reset(), []);

  const fondMeta = FONDS.find((f) => f.key === fond)!;

  return (
    <div className="space-y-3">
      {/* Bandeau direct */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-950 px-4 py-3 text-emerald-50">
        <span className="relative flex h-3 w-3">
          {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${live ? 'bg-emerald-300' : 'bg-emerald-700'}`} />
        </span>
        <div className="min-w-0 text-sm">
          <span className="font-semibold">Le territoire des sondes</span>
          <span className="ml-2 text-xs text-emerald-200/80">
            {placed.length} posée{placed.length > 1 ? 's' : ''} sur {filtered.length} · {proprietes.length} propriété{proprietes.length > 1 ? 's' : ''}
            {lastLiveAt && ' · signal reçu pendant cette session'}
          </span>
        </div>
        <Radio className="ml-auto h-4 w-4 text-emerald-300" />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, série, modèle…" className="h-8 w-[200px] pl-7" />
        </div>
        <select
          value={propriete}
          onChange={(e) => setPropriete(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
        >
          <option value="all">Toutes les propriétés</option>
          {proprietes.map(([id, nom]) => (
            <option key={id} value={id}>{nom}</option>
          ))}
        </select>
        {(['all', 'green', 'amber', 'red'] as const).map((e) => (
          <button
            key={e}
            onClick={() => setEtat(e)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              etat === e ? 'border-emerald-600 bg-emerald-600 text-emerald-50' : 'border-border bg-card text-muted-foreground'
            }`}
          >
            {e === 'all' ? 'Tous états' : e === 'green' ? 'En veille active' : e === 'amber' ? 'À surveiller' : 'En défaut'}
          </button>
        ))}
        <div className="ml-auto flex overflow-hidden rounded-full border border-border">
          {FONDS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFond(f.key)}
              className={`px-3 py-1 text-xs ${fond === f.key ? 'bg-emerald-600 text-emerald-50' : 'bg-card text-muted-foreground'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        {/* Liste */}
        <aside className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
          {isLoading && <div className="h-24 animate-pulse rounded-xl bg-muted" />}
          {filtered.map((c) => {
            const h = sensorHealth(c as any);
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => openSensor(c)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  active ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40' : 'border-border bg-card hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {covers[c.id]?.url ? (
                    <img
                      src={covers[c.id]!.url}
                      alt={`${c.nom} en situation`}
                      loading="lazy"
                      decoding="async"
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                      style={{ border: `2px solid ${HEALTH_COLOR[h.status]}` }}
                    />
                  ) : (
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: HEALTH_COLOR[h.status] }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.nom}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {c.propriete?.nom ?? '—'} · {c.type?.modele ?? '—'}
                    </div>
                  </div>
                  {(c.lat == null || c.lng == null) && <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
                </div>
                <div className="mt-2">
                  <VitalityStrip timestamps={pingsFor(c.id)} hours={48} color={HEALTH_COLOR[h.status]} />
                </div>
              </button>
            );
          })}
          {!isLoading && filtered.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Aucune sonde ne correspond à ces filtres.
            </p>
          )}
          {orphans.length > 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
              <div className="mb-1 font-medium text-amber-700">{orphans.length} sonde(s) sans coordonnées</div>
              <ul className="space-y-1">
                {orphans.map((c) => (
                  <li key={c.id} className="flex items-center gap-1">
                    <span className="truncate">{c.nom}</span>
                    {capabilities.proprieteLinks && (
                      <Link to={`/jardin/${c.propriete_id}?tab=carte`} className="ml-auto inline-flex items-center gap-1 text-emerald-700">
                        poser <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </li>

                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Carte */}
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <SafeMapContainer
            center={[46.6, 2.5]}
            zoom={6}
            maxZoom={22}
            className="h-[70vh] min-h-[420px] w-full"
            scrollWheelZoom
          >
            <TileLayer url={fondMeta.url} attribution={fondMeta.attribution} maxNativeZoom={19} maxZoom={22} />
            <FitAll positions={positions} focus={focus} />
            <IotLayer
              capteurs={placed as any}
              latest={latest}
              covers={covers}
              onOpen={(c: any) => openSensor(c as CapteurGeo)}
            />
          </SafeMapContainer>

          {/* Fiche sonde */}
          {selected && (
            <div className="absolute right-3 top-3 z-[1000] max-h-[calc(70vh-24px)] w-[320px] overflow-y-auto rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{selected.nom}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {selected.serial_number} · {selected.type?.modele ?? '—'}
                  </div>
                </div>
                <button onClick={() => { setSelectedId(null); setFocus(null); }} className="text-xs text-muted-foreground">✕</button>
              </div>

              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <span
                  className="rounded-full px-2 py-0.5 text-white"
                  style={{ background: HEALTH_COLOR[sensorHealth(selected as any).status] }}
                >
                  {sensorHealth(selected as any).label}
                </span>
                <span className="text-muted-foreground">{fmtHorodatage(selected.last_seen_at)}</span>
              </div>

              <div className="mt-3 rounded-xl border border-border/60 bg-background/60 p-2">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Wrench className="h-3 w-3" /> État de service
                </div>
                <div className="flex flex-wrap gap-1">
                  {CAPTEUR_ETATS.map((e) => {
                    const active = capteurEtat(selected as any) === e.key;
                    return (
                      <button
                        key={e.key}
                        type="button"
                        title={e.hint}
                        disabled={setEtat.isPending}
                        onClick={() =>
                          setEtat.mutate({
                            id: selected.id,
                            etat: e.key,
                            motif:
                              e.key === 'service'
                                ? null
                                : window.prompt(`Motif — ${e.label} (facultatif)`, (selected as any).etat_motif ?? '') ??
                                  null,
                          })
                        }
                        className="rounded-full border px-2 py-0.5 text-[10px] transition disabled:opacity-50"
                        style={
                          active
                            ? { background: e.color, borderColor: e.color, color: '#fff' }
                            : { borderColor: 'hsl(var(--border))' }
                        }
                      >
                        {e.label}
                      </button>
                    );
                  })}
                </div>
                {capteurEtat(selected as any) !== 'service' && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {(selected as any).etat_motif || 'Sans motif renseigné'} — sonde écartée des alertes et des
                    analyses.
                  </p>
                )}
              </div>

              {covers[selected.id]?.url && (
                <img
                  src={covers[selected.id]!.url}
                  alt={`${selected.nom} en situation`}
                  decoding="async"
                  fetchPriority="high"
                  className="mt-3 h-28 w-full rounded-xl object-cover"
                />
              )}

              <dl className="mt-3 space-y-1 text-[11px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Propriété</dt>
                  <dd className="truncate">
                    {capabilities.proprieteLinks ? (
                      <Link to={`/jardin/${selected.propriete_id}`} className="text-emerald-700 underline">
                        {selected.propriete?.nom ?? '—'}
                      </Link>
                    ) : (
                      <span>{selected.propriete?.nom ?? '—'}</span>
                    )}
                  </dd>

                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Emplacement</dt>
                  <dd className="truncate">{selected.emplacement ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Coordonnées</dt>
                  <dd className="tabular-nums">
                    {selected.lat != null ? `${selected.lat.toFixed(6)}, ${selected.lng?.toFixed(6)}` : 'non posée'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground"><Battery className="mr-1 inline h-3 w-3" />Batterie</dt>
                  <dd>{selected.battery_pct ? `${Math.round(selected.battery_pct)} %` : 'non transmise'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground"><Signal className="mr-1 inline h-3 w-3" />Réception</dt>
                  <dd>{selected.rssi != null ? `${selected.rssi} dBm` : '—'}{selected.snr != null ? ` · SNR ${selected.snr}` : ''}</dd>
                </div>
              </dl>

              <div className="mt-3">
                <div className="mb-1 text-[11px] font-medium text-muted-foreground">Dernières mesures</div>
                <div className="flex flex-wrap gap-1">
                  {(latest[selected.id] ?? []).map((m: any) => (
                    <span key={m.id} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                      {fmtProfondeur(m.profondeur_m) ? `${fmtProfondeur(m.profondeur_m)} · ` : ''}
                      {fmtMesure(m.valeur, m.grandeur, m.unite)}
                    </span>
                  ))}
                  {(latest[selected.id] ?? []).length === 0 && (
                    <span className="text-[11px] italic text-muted-foreground">Aucune mesure</span>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1 text-[11px] font-medium text-muted-foreground">Vitalité · 48 h</div>
                <VitalityStrip timestamps={pingsFor(selected.id)} hours={48} showScale />
              </div>

              <Button size="sm" className="mt-3 w-full" onClick={() => setObservatory(selected)}>
                <BarChart3 className="mr-1 h-3.5 w-3.5" /> Voir tous les graphes
              </Button>

              {capabilities.ai && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() =>
                    openIotAi({
                      capteurId: selected.id,
                      proprieteId: selected.propriete_id,
                      prefill: `Cette sonde « ${selected.nom} » est-elle fiable ? Que dit-elle du sol ${selected.emplacement ? `au ${selected.emplacement}` : ''} ?`,
                    })
                  }
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> Interroger l'IA de Jardin
                </Button>
              )}

            </div>
          )}
        </div>
      </div>

      {observatory && <SensorObservatory capteur={observatory} onClose={() => setObservatory(null)} />}
    </div>
  );
};

export default SensorsMapTab;
