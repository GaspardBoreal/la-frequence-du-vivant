import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin, User, Award, Sparkles, Headphones, Locate, Plus, Minus, Pencil } from 'lucide-react';
import type { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MediaItem, MarcheEventGroup, GpsSource } from '@/hooks/useExplorationAllMedia';
import type { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import MediaAttributionSheet from './MediaAttributionSheet';

const UUID_RE = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;
const isUuidLike = (s?: string | null) => !!s && UUID_RE.test(s.trim());

const GPS_SOURCE_LABEL: Record<GpsSource, string> = {
  exif: 'Position issue de la photo',
  step: 'Position de l’étape de marche',
  event: 'Position de l’événement',
};

// Numbered marker — same visual language as ExplorationCarteTab.
function createNumberedIcon(num: number, isOrigin: boolean): L.DivIcon {
  const size = isOrigin ? 38 : 22;
  const fontSize = isOrigin ? 14 : 11;
  const opacity = isOrigin ? 1 : 0.78;
  const border = isOrigin ? '2.5px solid #fbbf24' : '1.5px solid rgba(255,255,255,0.7)';
  const shadow = isOrigin
    ? '0 2px 10px rgba(16,185,129,0.55), 0 0 0 5px rgba(251,191,36,0.25)'
    : '0 1px 4px rgba(0,0,0,0.35)';
  const pulse = isOrigin ? 'animation: media-origin-pulse 2.2s ease-in-out infinite;' : '';
  return L.divIcon({
    className: 'media-lightbox-numbered-marker',
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:linear-gradient(135deg,#10b981,#059669);
        border:${border};
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:700;font-size:${fontSize}px;
        box-shadow:${shadow};
        opacity:${opacity};
        ${pulse}
      ">${num}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

// Arrow decorators along the polyline — identical pattern to ExplorationCarteTab.
const ArrowDecorators: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length < 2) return;
    const arrows: L.Marker[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const [lat1, lng1] = positions[i];
      const [lat2, lng2] = positions[i + 1];
      const midLat = (lat1 + lat2) / 2;
      const midLng = (lng1 + lng2) / 2;
      const angle = (Math.atan2(lat2 - lat1, lng2 - lng1) * 180) / Math.PI;
      const icon = L.divIcon({
        className: 'media-lightbox-arrow',
        html: `<div style="transform:rotate(${90 - angle}deg);color:#10b981;font-size:13px;opacity:0.55;text-shadow:0 1px 2px rgba(0,0,0,0.5);">▲</div>`,
        iconSize: [13, 13],
        iconAnchor: [6.5, 6.5],
      });
      const marker = L.marker([midLat, midLng], { icon, interactive: false });
      marker.addTo(map);
      arrows.push(marker);
    }
    return () => { arrows.forEach(a => map.removeLayer(a)); };
  }, [positions, map]);
  return null;
};

// Compact zoom controls overlay (mobile-friendly).
const ZoomControls: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute top-2 right-2 z-[500] flex flex-col gap-1">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); map.zoomIn(); }}
        aria-label="Zoomer"
        className="w-8 h-8 rounded-lg bg-background/85 backdrop-blur border border-border text-foreground flex items-center justify-center hover:bg-background transition active:scale-95"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); map.zoomOut(); }}
        aria-label="Dézoomer"
        className="w-8 h-8 rounded-lg bg-background/85 backdrop-blur border border-border text-foreground flex items-center justify-center hover:bg-background transition active:scale-95"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
};

interface BadgeData {
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MediaItem[];
  startIndex: number;
  marcheEvents: MarcheEventGroup[];
  /** Optional badge data per media key (future: points/awards). */
  badges?: Record<string, BadgeData | undefined>;
  /** Whether the current user can reattribute photo credits (admin/ambassadeur/sentinelle). */
  canReattribute?: boolean;
  /** All marcheurs of the exploration (used by the attribution bottom-sheet). */
  marcheurs?: ExplorationMarcheur[];
  /** Exploration id (for cache invalidation after reattribution). */
  explorationId?: string;
}

const FitBounds: React.FC<{ points: [number, number][]; focus?: [number, number] }> = ({ points, focus }) => {
  const map = useMap();
  useEffect(() => {
    if (focus && points.length === 1) {
      map.setView(focus, 13, { animate: true });
      return;
    }
    if (points.length >= 2) {
      const bounds = points as LatLngBoundsExpression;
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    } else if (points.length === 1) {
      map.setView(points[0] as LatLngExpression, 13, { animate: true });
    }
  }, [map, points, focus]);
  return null;
};

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

const MediaLightbox: React.FC<Props> = ({ open, onOpenChange, items, startIndex, marcheEvents, badges, canReattribute, marcheurs = [], explorationId }) => {
  const [attributionOpen, setAttributionOpen] = useState(false);
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
      if (e.key === 'ArrowRight') setIndex(i => Math.min(items.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, items.length, onOpenChange]);

  const current = items[index];
  const originEvent = useMemo(
    () => marcheEvents.find(e => e.id === current?.marcheEventId) || null,
    [marcheEvents, current]
  );

  // Per-event steps (already filtered to those used by this event's medias).
  const eventSteps = originEvent?.steps ?? [];

  // Origin step = step matching the current media's marcheId (if any).
  const originStep = useMemo(
    () => (current?.marcheId ? eventSteps.find(s => s.id === current.marcheId) ?? null : null),
    [eventSteps, current]
  );

  // Photo's own GPS (EXIF) — distinct point on the map when available.
  const exifPoint: [number, number] | null =
    current?.gps?.source === 'exif' ? [current.gps.lat, current.gps.lng] : null;

  // All map points used to fit bounds: every step + EXIF + event center.
  const allMapPoints: [number, number][] = useMemo(() => {
    const pts: [number, number][] = eventSteps.map(s => [s.lat, s.lng]);
    if (exifPoint) pts.push(exifPoint);
    if (
      originEvent?.latitude != null &&
      originEvent?.longitude != null &&
      pts.length === 0
    ) {
      pts.push([originEvent.latitude, originEvent.longitude]);
    }
    return pts;
  }, [eventSteps, exifPoint, originEvent]);

  // Effective center for the map (used when there's only one point).
  const focusPoint: [number, number] | null =
    exifPoint
      ?? (originStep ? [originStep.lat, originStep.lng] : null)
      ?? (originEvent?.latitude != null && originEvent?.longitude != null
        ? [originEvent.latitude, originEvent.longitude]
        : null);

  const hasMap = allMapPoints.length > 0 || focusPoint != null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) setIndex(i => Math.min(items.length - 1, i + 1));
      else setIndex(i => Math.max(0, i - 1));
    }
    touchStartX.current = null;
  };

  if (!open || !current) return null;

  const badge = badges?.[current.key];
  const isConv = current.source === 'conv';
  const dateLabel = originEvent
    ? new Date(originEvent.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="lightbox-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-sm flex items-stretch sm:items-center justify-center"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          key="lightbox-panel"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full sm:max-w-5xl sm:rounded-2xl bg-card text-card-foreground border-0 sm:border sm:border-border overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[92vh]"
          onClick={e => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Close */}
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-2 z-30 w-9 h-9 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center text-foreground hover:bg-background transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Single scroll container — mobile stacks (media → map → meta), desktop = 2 columns */}
          <div className="overflow-y-auto flex-1">
            <div className="sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] sm:gap-0">
              {/* ─── MEDIA column ─── */}
              <div
                className={`relative flex items-center justify-center ${
                  current.type === 'audio'
                    ? 'bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-amber-500/10'
                    : 'bg-black'
                } sm:sticky sm:top-0 sm:self-start sm:h-[92vh] sm:max-h-[92vh]`}
              >
                {current.type === 'video' ? (
                  <video
                    key={current.key}
                    src={current.url}
                    controls
                    playsInline
                    className="w-full max-h-[50dvh] sm:max-h-[92vh] object-contain bg-black"
                  />
                ) : current.type === 'audio' ? (
                  <div className="w-full px-5 py-8 sm:py-10 flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg">
                      <Headphones className="w-7 h-7 text-white" />
                    </div>
                    <div className="max-w-md">
                      <p className="text-base font-semibold text-foreground leading-snug">
                        {current.titre && !isUuidLike(current.titre) ? current.titre : 'Enregistrement sonore'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Capture sonore de marche</p>
                    </div>
                    <audio
                      key={current.key}
                      src={current.url}
                      controls
                      preload="metadata"
                      className="w-full max-w-md"
                    />
                  </div>
                ) : (
                  <img
                    key={current.key}
                    src={current.url}
                    alt={current.titre || 'Média'}
                    className="w-full max-h-[50dvh] sm:max-h-[92vh] object-contain"
                  />
                )}

                {/* Navigation arrows (multi) */}
                {items.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Précédent"
                      disabled={index === 0}
                      onClick={() => setIndex(i => Math.max(0, i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur border border-border flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-background transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Suivant"
                      disabled={index === items.length - 1}
                      onClick={() => setIndex(i => Math.min(items.length - 1, i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur border border-border flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-background transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-background/70 backdrop-blur border border-border text-[10px] text-muted-foreground">
                      {index + 1} / {items.length}
                    </div>
                  </>
                )}
              </div>

              {/* ─── META column ─── */}
              <div className="flex flex-col">
                {/* Author + Badge slot */}
                <div className="px-4 pt-3 pb-2 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!canReattribute}
                    onClick={() => canReattribute && setAttributionOpen(true)}
                    className={`flex-1 min-w-0 flex items-center gap-3 -mx-1 px-1 py-1 rounded-xl transition ${
                      canReattribute
                        ? 'hover:bg-emerald-500/5 ring-0 hover:ring-1 hover:ring-emerald-500/30 cursor-pointer text-left'
                        : 'cursor-default text-left'
                    }`}
                    aria-label={canReattribute ? 'Réattribuer la photo' : undefined}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/10 border border-border flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                      {initials(current.authorName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        <User className="w-3 h-3" />
                        {current.attributedMarcheurId ? 'Crédité·e à' : 'Marcheur·euse'}
                        {current.attributedMarcheurId && current.uploaderName && current.uploaderName !== current.authorName && (
                          <span className="normal-case tracking-normal text-muted-foreground/60">
                            · upload {current.uploaderName}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                        {current.authorName || 'Anonyme'}
                        {canReattribute && (
                          <Pencil className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                        )}
                      </p>
                    </div>
                  </button>

                  {/* Badge slot */}
                  <div
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium ${
                      badge
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'border border-dashed border-muted-foreground/40 text-muted-foreground/70'
                    }`}
                    title={badge ? badge.label : 'Badge à venir'}
                  >
                    {badge ? (
                      <>
                        {badge.icon ?? <Award className="w-3.5 h-3.5" />}
                        <span>{badge.label}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Badge</span>
                      </>
                    )}
                  </div>
                </div>

                {current.titre && !isUuidLike(current.titre) && (
                  <p className="px-4 text-xs text-muted-foreground italic truncate">{current.titre}</p>
                )}

                {/* Map / location block */}
                <div className="px-4 mt-3 pb-4">
                  {isConv ? (
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Photo partagée sur le mur Convivialité (sans rattachement à une marche).</span>
                    </div>
                  ) : !hasMap ? (
                    <div className="space-y-2">
                      <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>Localisation GPS non disponible pour ce média.</span>
                      </div>
                      {originEvent && (
                        <div className="flex items-start gap-2 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {current.marcheStepName || originEvent.title}
                            </p>
                            <p className="text-muted-foreground truncate">
                              {originEvent.lieu || '—'}{dateLabel ? ` · ${dateLabel}` : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-[42dvh] sm:h-80 rounded-xl overflow-hidden border border-border relative media-lightbox-map">
                        <style>{`
                          .media-lightbox-map .leaflet-container { background: #0f1419; }
                          .media-lightbox-map .carte-tiles-dark { filter: brightness(0.62) saturate(0.35); }
                          .media-lightbox-numbered-marker { background: none !important; border: none !important; }
                          .media-lightbox-arrow { background: none !important; border: none !important; }
                          @keyframes media-origin-pulse {
                            0%, 100% { box-shadow: 0 2px 10px rgba(16,185,129,0.55), 0 0 0 5px rgba(251,191,36,0.25); }
                            50% { box-shadow: 0 2px 14px rgba(16,185,129,0.7), 0 0 0 10px rgba(251,191,36,0.12); }
                          }
                          .media-lightbox-map .leaflet-tooltip.media-origin-tip {
                            background: rgba(15,20,25,0.92);
                            color: #fff;
                            border: 1px solid rgba(251,191,36,0.45);
                            border-radius: 999px;
                            padding: 2px 8px;
                            font-size: 11px;
                            font-weight: 600;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                          }
                          .media-lightbox-map .leaflet-tooltip.media-origin-tip::before { display: none; }
                          .media-lightbox-map .leaflet-tooltip.media-exif-tip {
                            background: rgba(16,185,129,0.95);
                            color: #fff;
                            border: none;
                            border-radius: 999px;
                            padding: 2px 8px;
                            font-size: 11px;
                            font-weight: 600;
                          }
                          .media-lightbox-map .leaflet-tooltip.media-exif-tip::before { display: none; }
                        `}</style>
                        <MapContainer
                          center={(focusPoint ?? allMapPoints[0]) as LatLngExpression}
                          zoom={13}
                          scrollWheelZoom={false}
                          zoomControl={false}
                          style={{ height: '100%', width: '100%' }}
                          attributionControl={false}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
                            className="carte-tiles-dark"
                          />
                          <FitBounds points={allMapPoints} focus={focusPoint ?? undefined} />
                          <ZoomControls />

                          {/* Polyline reliant les étapes dans l'ordre du parcours */}
                          {eventSteps.length >= 2 && (
                            <>
                              <Polyline
                                positions={eventSteps.map(s => [s.lat, s.lng] as [number, number])}
                                pathOptions={{ color: '#10b981', weight: 2.5, opacity: 0.55 }}
                              />
                              <ArrowDecorators positions={eventSteps.map(s => [s.lat, s.lng] as [number, number])} />
                            </>
                          )}

                          {/* Marqueurs numérotés pour toutes les étapes */}
                          {eventSteps.map(step => {
                            const isOrigin = originStep?.id === step.id;
                            return (
                              <Marker
                                key={step.id}
                                position={[step.lat, step.lng]}
                                icon={createNumberedIcon(step.order, isOrigin)}
                                zIndexOffset={isOrigin ? 1000 : 0}
                              >
                                {isOrigin && (
                                  <Tooltip
                                    direction="top"
                                    offset={[0, -22]}
                                    permanent
                                    className="media-origin-tip"
                                  >
                                    {step.name}
                                  </Tooltip>
                                )}
                                {!isOrigin && (
                                  <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
                                    <span className="text-[11px]">#{step.order} · {step.name}</span>
                                  </Tooltip>
                                )}
                              </Marker>
                            );
                          })}

                          {/* Point EXIF — capture précise hors étape */}
                          {exifPoint && (
                            <CircleMarker
                              center={exifPoint}
                              radius={7}
                              pathOptions={{
                                color: '#fbbf24',
                                fillColor: '#fbbf24',
                                fillOpacity: 1,
                                weight: 2,
                                className: 'animate-pulse',
                              }}
                            >
                              <Tooltip direction="top" offset={[0, -8]} permanent className="media-exif-tip">
                                Ici
                              </Tooltip>
                            </CircleMarker>
                          )}
                        </MapContainer>

                        {/* Légende compacte */}
                        {eventSteps.length > 1 && (
                          <div className="absolute bottom-2 left-2 z-[400] px-2.5 py-1 rounded-full bg-background/85 backdrop-blur border border-border text-[10px] text-muted-foreground flex items-center gap-2.5">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-amber-400/50" />
                              {originStep ? `étape ${originStep.order}` : 'ici'}
                            </span>
                            <span className="inline-flex items-center gap-1 opacity-70">
                              <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                              parcours ({eventSteps.length})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          {current.marcheStepName ? (
                            <>
                              <p className="font-semibold text-foreground truncate">
                                {current.marcheStepName}
                              </p>
                              <p className="text-muted-foreground truncate">
                                {originEvent?.title}
                                {dateLabel ? ` · ${dateLabel}` : ''}
                              </p>
                            </>
                          ) : originEvent ? (
                            <>
                              <p className="font-semibold text-foreground truncate">{originEvent.title}</p>
                              <p className="text-muted-foreground truncate">
                                {originEvent.lieu || '—'}{dateLabel ? ` · ${dateLabel}` : ''}
                              </p>
                            </>
                          ) : null}
                          {current.gps && (
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                              <Locate className="w-2.5 h-2.5" />
                              {GPS_SOURCE_LABEL[current.gps.source]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {canReattribute && current && current.source !== 'audio' && current.rawId && (
        <MediaAttributionSheet
          open={attributionOpen}
          onOpenChange={setAttributionOpen}
          source={current.source}
          mediaId={current.rawId}
          explorationId={explorationId}
          marcheurs={marcheurs}
          currentAttributedId={current.attributedMarcheurId ?? null}
          uploaderName={current.uploaderName ?? null}
        />
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MediaLightbox;
