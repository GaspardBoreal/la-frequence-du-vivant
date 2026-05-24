import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Move, ExternalLink, MapPin, Loader2, Crosshair } from 'lucide-react';
import { RichMap } from '@/components/maps';
import { useMarcheurUnidentifiedPhotos, type UnidentifiedPhotoCandidate } from '@/hooks/useMarcheurUnidentifiedPhotos';
import { useRepositionMediaGps } from '@/hooks/useRepositionMediaGps';
import { useIsGpsCurator } from '@/hooks/useIsGpsCurator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface MarcheLite {
  id: string;
  title: string;
  date_marche: string | null;
  latitude: number | null;
  longitude: number | null;
}

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

type GpsCat = 'exif' | 'marche' | 'none';

interface ResolvedPhoto {
  candidate: UnidentifiedPhotoCandidate;
  marche?: MarcheLite;
  lat: number | null;
  lon: number | null;
  cat: GpsCat;
  isManual: boolean;
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

const InatUploadFullscreen: React.FC<Props> = ({
  open, onOpenChange,
  marcheurPrenom, marcheurNom,
  crewId, resolvedUserId, explorationId,
  explorationMarcheIds, explorationEventIds, identifiedPhotoUrls,
}) => {
  const { data: candidates = [], isLoading } = useMarcheurUnidentifiedPhotos({
    crewId, resolvedUserId, explorationMarcheIds, explorationEventIds,
    identifiedPhotoUrls, explorationId, enabled: open,
  });

  const { data: isCurator = false } = useIsGpsCurator();
  const reposition = useRepositionMediaGps({ explorationId });

  const { data: marches = [] } = useQuery({
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

  const marcheById = useMemo(() => {
    const m = new Map<string, MarcheLite>();
    marches.forEach((x) => m.set(x.id, x));
    return m;
  }, [marches]);

  const resolved: ResolvedPhoto[] = useMemo(() => {
    return candidates.map((c) => {
      const marche = marcheById.get(c.marcheEventId);
      let lat: number | null = c.gps?.latitude ?? null;
      let lon: number | null = c.gps?.longitude ?? null;
      let cat: GpsCat = 'none';
      const isManual = c.gps?.source === 'manual';
      if (lat !== null && lon !== null) {
        cat = 'exif';
      } else if (marche?.latitude && marche?.longitude) {
        lat = marche.latitude;
        lon = marche.longitude;
        cat = 'marche';
      }
      return { candidate: c, marche, lat, lon, cat, isManual };
    });
  }, [candidates, marcheById]);

  const stats = useMemo(() => {
    let exif = 0, marche = 0, none = 0;
    resolved.forEach((r) => {
      if (r.cat === 'exif') exif++;
      else if (r.cat === 'marche') marche++;
      else none++;
    });
    return { exif, marche, none };
  }, [resolved]);

  const [filter, setFilter] = useState<GpsCat | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === 'all' ? resolved : resolved.filter((r) => r.cat === filter)),
    [resolved, filter],
  );

  const allWithGps = useMemo(
    () => resolved.filter((r) => r.lat !== null && r.lon !== null),
    [resolved],
  );

  const bounds = useMemo<Array<[number, number]>>(
    () => allWithGps.map((r) => [r.lat!, r.lon!] as [number, number]),
    [allWithGps],
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-[100vw] w-[100vw] h-[100vh] sm:max-w-[100vw] p-0 gap-0 rounded-none border-0 bg-background"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Bandeau haut */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/60 backdrop-blur">
            <h2 className="text-sm font-semibold text-foreground">
              Photos non identifiées — {marcheurPrenom} {marcheurNom}
            </h2>

            <div className="flex items-center gap-2 ml-2">
              {([
                { k: 'exif' as const, label: 'GPS EXIF', n: stats.exif, c: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
                { k: 'marche' as const, label: 'GPS marche', n: stats.marche, c: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
                { k: 'none' as const, label: 'Sans GPS', n: stats.none, c: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' },
              ]).map((p) => (
                <button
                  key={p.k}
                  onClick={() => setFilter(filter === p.k ? 'all' : p.k)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-medium transition',
                    p.c,
                    filter === p.k && 'ring-2 ring-offset-1 ring-offset-background ring-current',
                  )}
                >
                  <span className="font-bold">{p.n}</span> {p.label}
                </button>
              ))}
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} className="text-xs text-muted-foreground underline">
                  Tout
                </button>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
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
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <RichMap
                  bounds={bounds.length > 0 ? bounds : undefined}
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

                  {filtered.map((r) => {
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
                </RichMap>
              )}

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
                {filtered.length} photo{filtered.length > 1 ? 's' : ''}
                {filter !== 'all' && ` · filtre actif`}
              </div>
              <ul className="divide-y divide-border">
                {filtered.map((r) => {
                  const color = colorFor(r.cat, r.isManual);
                  const sel = selectedId === r.candidate.id;
                  const placing = placingId === r.candidate.id;
                  return (
                    <li
                      key={r.candidate.id}
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
                    </li>
                  );
                })}
                {filtered.length === 0 && (
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
