import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Move, ExternalLink, MapPin, Crosshair } from 'lucide-react';
import { RichMap } from '@/components/maps';
import { useMarcheurUnidentifiedPhotos } from '@/hooks/useMarcheurUnidentifiedPhotos';
import { useRepositionMediaGps } from '@/hooks/useRepositionMediaGps';
import { useIsGpsCurator } from '@/hooks/useIsGpsCurator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { cn } from '@/lib/utils';
import {
  useFullscreenPreparation,
  type MarcheLite,
  type GpsCat,
} from '@/hooks/useFullscreenPreparation';
import InatFullscreenLoadingOverlay from './InatFullscreenLoadingOverlay';
import InatFullscreenMarchesToggle, { useMarchesDisplayMode } from './InatFullscreenMarchesToggle';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  marcheurPrenom: string;
  marcheurNom: string;
  marcheurSlug: string;
  crewId: string | null;
  resolvedUserId: string | null;
  explorationId?: string;
  explorationMarcheIds: string[];
  explorationEventIds: string[];
  identifiedPhotoUrls: Set<string>;
}

const SNAP_METERS = 25;

const distMeters = (a: [number, number], b: [number, number]) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const colorFor = (cat: GpsCat, manual: boolean) => {
  if (manual) return '#3b82f6';
  if (cat === 'exif') return '#10b981';
  if (cat === 'marche') return '#f59e0b';
  return '#ef4444';
};

const makePhotoIcon = (url: string, color: string, selected: boolean) =>
  L.divIcon({
    className: 'inat-photo-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `
      <div style="
        width:40px;height:40px;border-radius:50%;
        border:3px solid ${color};
        box-shadow:0 2px 6px rgba(0,0,0,.5)${selected ? `,0 0 0 3px ${color}55` : ''};
        background:#fff url('${url}') center/cover no-repeat;
        ${selected ? 'transform:scale(1.15);' : ''}
        transition:transform .15s;
      "></div>`,
  });

const MapClickCatcher: React.FC<{ onClick: (latlng: L.LatLng) => void; active: boolean }> = ({ onClick, active }) => {
  useMapEvents({
    click: (e) => { if (active) onClick(e.latlng); },
  });
  return null;
};

const AnimatedStat: React.FC<{ value: number; label: string; color: string; active: boolean; onClick: () => void; trigger: boolean }> =
  ({ value, label, color, active, onClick, trigger }) => {
    const animated = useAnimatedCounter(trigger ? value : 0, 900, 100);
    return (
      <button
        onClick={onClick}
        className={cn(
          'px-3 py-1.5 rounded-lg border text-xs font-medium transition',
          color,
          active && 'ring-2 ring-offset-1 ring-offset-background ring-current',
        )}
      >
        <span className="font-bold tabular-nums">{animated}</span> {label}
      </button>
    );
  };

const InatUploadFullscreen: React.FC<Props> = ({
  open, onOpenChange,
  marcheurPrenom, marcheurNom,
  crewId, resolvedUserId, explorationId,
  explorationMarcheIds, explorationEventIds, identifiedPhotoUrls,
}) => {
  // Active pre-calc as soon as drawer mounts (open=true) — runs in background
  const { data: candidates = [], isLoading: candidatesLoading } = useMarcheurUnidentifiedPhotos({
    crewId, resolvedUserId, explorationMarcheIds, explorationEventIds,
    identifiedPhotoUrls, explorationId, enabled: open,
  });

  const { data: isCurator = false } = useIsGpsCurator();
  const reposition = useRepositionMediaGps({ explorationId });

  const { data: marches = [], isLoading: marchesLoading } = useQuery({
    queryKey: ['inat-fs-marches', explorationEventIds.slice().sort().join(',')],
    queryFn: async (): Promise<MarcheLite[]> => {
      if (!explorationEventIds.length) return [];
      const { data } = await supabase
        .from('marche_events')
        .select('id, title, date_marche, latitude, longitude')
        .in('id', explorationEventIds);
      return (data || []) as MarcheLite[];
    },
    enabled: open && explorationEventIds.length > 0,
    staleTime: 5 * 60_000,
  });

  const prep = useFullscreenPreparation({
    candidates,
    marches,
    candidatesLoading,
    marchesLoading,
    enabled: open,
  });

  const [marchesMode, setMarchesMode] = useMarchesDisplayMode();
  const [filter, setFilter] = useState<GpsCat | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  const enriched = prep.enriched;
  const stats = prep.stats;
  const revealed = enriched.slice(0, prep.revealedCount);

  const filtered = useMemo(
    () => (filter === 'all' ? revealed : revealed.filter((r) => r.cat === filter)),
    [revealed, filter],
  );

  // List shows all enriched once ready (no filter on revealedCount for the list)
  const listItems = useMemo(
    () => (filter === 'all' ? enriched : enriched.filter((r) => r.cat === filter)),
    [enriched, filter],
  );

  const waypoints = useMemo<Array<[number, number]>>(() => {
    return marches
      .filter((m) => m.latitude != null && m.longitude != null)
      .map((m) => [m.latitude!, m.longitude!] as [number, number]);
  }, [marches]);

  const snapToWaypoint = (latlng: L.LatLng): [number, number] => {
    let best: [number, number] | null = null;
    let bestD = SNAP_METERS;
    waypoints.forEach((w) => {
      const d = distMeters([latlng.lat, latlng.lng], w);
      if (d < bestD) { bestD = d; best = w; }
    });
    return best ?? [latlng.lat, latlng.lng];
  };

  const handleReposition = async (candidateId: string, latlng: L.LatLng) => {
    const [lat, lon] = snapToWaypoint(latlng);
    await reposition.mutateAsync({ candidateId, lat, lon });
    setPlacingId(null);
  };

  useEffect(() => { if (!open) { setPlacingId(null); setSelectedId(null); } }, [open]);

  const overlayVisible = open && (!prep.ready || prep.progress < 0.999);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-[100vw] w-[100vw] h-[100vh] sm:max-w-[100vw] p-0 gap-0 rounded-none border-0 bg-background"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Bandeau haut */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/60 backdrop-blur flex-wrap">
            <h2 className="text-sm font-semibold text-foreground">
              Photos non identifiées — {marcheurPrenom} {marcheurNom}
            </h2>

            <div className="flex items-center gap-2 ml-2">
              <AnimatedStat
                value={stats.exif}
                label="GPS EXIF"
                color="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                active={filter === 'exif'}
                onClick={() => setFilter(filter === 'exif' ? 'all' : 'exif')}
                trigger={prep.ready}
              />
              <AnimatedStat
                value={stats.marche}
                label="GPS marche"
                color="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                active={filter === 'marche'}
                onClick={() => setFilter(filter === 'marche' ? 'all' : 'marche')}
                trigger={prep.ready}
              />
              <AnimatedStat
                value={stats.none}
                label="Sans GPS"
                color="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                active={filter === 'none'}
                onClick={() => setFilter(filter === 'none' ? 'all' : 'none')}
                trigger={prep.ready}
              />
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} className="text-xs text-muted-foreground underline">
                  Tout
                </button>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <InatFullscreenMarchesToggle value={marchesMode} onChange={setMarchesMode} />
              {placingId && (
                <span className="text-xs text-primary font-medium flex items-center gap-1 px-2 py-1 bg-primary/10 rounded">
                  <Crosshair className="w-3 h-3" /> Cliquez sur la carte pour placer
                  <button onClick={() => setPlacingId(null)} className="ml-1 underline">annuler</button>
                </span>
              )}
              {!isCurator && (
                <span className="text-[10px] text-muted-foreground italic">Lecture seule (curators uniquement)</span>
              )}
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Corps : carte gauche + liste droite */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_360px] overflow-hidden" style={{ height: 'calc(100vh - 53px)' }}>
            {/* Carte */}
            <div className="relative h-full bg-muted">
              <RichMap
                bounds={prep.bounds.length > 0 ? prep.bounds : undefined}
                center={[45.0, 0.5]}
                zoom={11}
                controls={{ zoom: true, style: true, geolocate: true, cadastre: false }}
                className="h-full"
                height="100%"
              >
                <MapClickCatcher
                  active={!!placingId}
                  onClick={(latlng) => placingId && handleReposition(placingId, latlng)}
                />

                {/* Marches overlay — toggle 3 niveaux */}
                {marchesMode !== 'off' && marches.map((m) => {
                  if (m.latitude == null || m.longitude == null) return null;
                  return (
                    <CircleMarker
                      key={`marche-${m.id}`}
                      center={[m.latitude, m.longitude]}
                      radius={marchesMode === 'full' ? 8 : 6}
                      pathOptions={{
                        color: 'hsl(var(--primary))',
                        weight: marchesMode === 'full' ? 2 : 1.5,
                        opacity: marchesMode === 'full' ? 0.9 : 0.5,
                        fillColor: 'hsl(var(--primary))',
                        fillOpacity: marchesMode === 'full' ? 0.4 : 0.2,
                      }}
                    >
                      {marchesMode === 'full' && (
                        <Tooltip permanent direction="top" offset={[0, -10]} className="!bg-card !text-foreground !border-border !text-[10px]">
                          {m.title}
                        </Tooltip>
                      )}
                    </CircleMarker>
                  );
                })}

                {/* Photo markers — cascade reveal */}
                <AnimatePresence>
                  {filtered.map((r, idx) => {
                    if (r.lat === null || r.lon === null) return null;
                    const sel = selectedId === r.candidate.id || placingId === r.candidate.id;
                    const color = colorFor(r.cat, r.isManual);
                    return (
                      <Marker
                        key={r.candidate.id}
                        position={[r.lat, r.lon]}
                        icon={makePhotoIcon(r.candidate.url, color, sel)}
                        draggable={isCurator}
                        eventHandlers={{
                          click: () => setSelectedId(r.candidate.id),
                          dragend: (e) => {
                            const m = e.target as L.Marker;
                            const ll = m.getLatLng();
                            handleReposition(r.candidate.id, ll);
                          },
                          add: (e) => {
                            // Subtle scale-in on marker mount
                            const el = (e.target as L.Marker).getElement();
                            if (el) {
                              el.style.opacity = '0';
                              el.style.transform = (el.style.transform || '') + ' scale(0.3)';
                              el.style.transition = 'opacity .25s ease, transform .35s cubic-bezier(.34,1.56,.64,1)';
                              requestAnimationFrame(() => {
                                el.style.opacity = '1';
                                el.style.transform = (el.style.transform || '').replace(' scale(0.3)', '');
                              });
                            }
                          },
                        }}
                      >
                        <Popup>
                          <div className="min-w-[200px] space-y-2">
                            <img
                              src={r.candidate.url}
                              alt=""
                              className="w-full h-32 object-cover rounded cursor-zoom-in"
                              onClick={() => setZoomPhoto(r.candidate.url)}
                            />
                            <div className="text-xs">
                              <p className="font-semibold">{r.marche?.title || 'Marche inconnue'}</p>
                              <p className="text-muted-foreground">
                                {r.marche?.date_marche || ''}
                              </p>
                              <p className="text-[10px] mt-1" style={{ color }}>
                                {r.isManual ? '🔵 Repositionné manuellement'
                                  : r.cat === 'exif' ? '🟢 EXIF'
                                  : r.cat === 'marche' ? '🟡 GPS de la marche'
                                  : '🔴 Sans GPS'}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setZoomPhoto(r.candidate.url)}
                                className="flex-1 text-[11px] bg-muted hover:bg-muted/80 rounded px-2 py-1 flex items-center justify-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" /> Agrandir
                              </button>
                              {isCurator && (
                                <button
                                  onClick={() => setPlacingId(r.candidate.id)}
                                  className="flex-1 text-[11px] bg-primary/10 text-primary hover:bg-primary/20 rounded px-2 py-1 flex items-center justify-center gap-1"
                                >
                                  <Move className="w-3 h-3" /> Déplacer
                                </button>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </AnimatePresence>
              </RichMap>

              {/* Loading overlay (step-by-step) */}
              <InatFullscreenLoadingOverlay
                visible={overlayVisible}
                progress={prep.progress}
                steps={prep.steps}
              />

              {/* Légende */}
              <div className="absolute bottom-4 left-4 z-[400] bg-card/90 backdrop-blur border border-border rounded-lg p-2 text-[10px] space-y-1 shadow">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" />EXIF</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" />GPS marche</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500" />Sans GPS</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" />Manuel</div>
                {isCurator && (
                  <div className="pt-1 mt-1 border-t border-border text-muted-foreground italic">
                    Glissez un point ou cliquez "Déplacer". Aimanté aux marches (&lt;{SNAP_METERS}m).
                  </div>
                )}
              </div>
            </div>

            {/* Liste droite */}
            <div className="border-l border-border bg-card/40 overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur px-3 py-2 border-b border-border text-xs text-muted-foreground">
                {listItems.length} photo{listItems.length > 1 ? 's' : ''}
                {filter !== 'all' && ` · filtre actif`}
              </div>
              <ul className="divide-y divide-border">
                {listItems.map((r, idx) => {
                  const color = colorFor(r.cat, r.isManual);
                  const sel = selectedId === r.candidate.id;
                  const placing = placingId === r.candidate.id;
                  return (
                    <motion.li
                      key={r.candidate.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(idx * 0.015, 0.4), duration: 0.25 }}
                      className={cn(
                        'flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/40 transition',
                        sel && 'bg-muted/60',
                        placing && 'ring-1 ring-primary',
                      )}
                      onClick={() => setSelectedId(r.candidate.id)}
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img
                          src={r.candidate.url}
                          alt=""
                          loading="lazy"
                          className="w-12 h-12 rounded object-cover"
                        />
                        <span
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card"
                          style={{ background: color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">
                          {r.candidate.originalName || r.marche?.title || '—'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {r.marche?.title || ''}
                          {r.marche?.date_marche && ` · ${r.marche.date_marche}`}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setZoomPhoto(r.candidate.url); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                          title="Agrandir"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        {isCurator && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setPlacingId(r.candidate.id); setSelectedId(r.candidate.id); }}
                            className={cn(
                              'p-1 rounded',
                              placing ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground',
                            )}
                            title="Déplacer sur la carte"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
                {listItems.length === 0 && prep.ready && (
                  <li className="p-6 text-center text-xs text-muted-foreground">
                    Aucune photo dans ce filtre.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox simple */}
      {zoomPhoto && (
        <Dialog open onOpenChange={() => setZoomPhoto(null)}>
          <DialogContent className="max-w-5xl p-0 bg-black/90 border-0">
            <img src={zoomPhoto} alt="" className="max-h-[90vh] w-full object-contain" />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default InatUploadFullscreen;
