import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin, User, Award, Sparkles, Headphones, Locate } from 'lucide-react';
import type { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MediaItem, MarcheEventGroup, GpsSource } from '@/hooks/useExplorationAllMedia';

const UUID_RE = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;
const isUuidLike = (s?: string | null) => !!s && UUID_RE.test(s.trim());

const GPS_SOURCE_LABEL: Record<GpsSource, string> = {
  exif: 'Position issue de la photo',
  step: 'Position de l’étape de marche',
  event: 'Position de l’événement',
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
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
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

const MediaLightbox: React.FC<Props> = ({ open, onOpenChange, items, startIndex, marcheEvents, badges }) => {
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
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/10 border border-border flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                    {initials(current.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <User className="w-3 h-3" /> Marcheur·euse
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {current.authorName || 'Anonyme'}
                    </p>
                  </div>

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
                      <div className="h-[38dvh] sm:h-72 rounded-xl overflow-hidden border border-border relative">
                        <MapContainer
                          center={(focusPoint ?? allMapPoints[0]) as LatLngExpression}
                          zoom={13}
                          scrollWheelZoom={false}
                          zoomControl={false}
                          style={{ height: '100%', width: '100%' }}
                          attributionControl={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <FitBounds points={allMapPoints} focus={focusPoint ?? undefined} />

                          {/* All marche steps of this event */}
                          {eventSteps.map(step => {
                            const isOrigin = originStep?.id === step.id;
                            return (
                              <CircleMarker
                                key={step.id}
                                center={[step.lat, step.lng]}
                                radius={isOrigin ? 9 : 4}
                                pathOptions={{
                                  color: isOrigin ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                  fillColor: isOrigin ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                  fillOpacity: isOrigin ? 0.9 : 0.3,
                                  weight: isOrigin ? 3 : 1,
                                  className: isOrigin ? 'animate-pulse' : '',
                                }}
                              >
                                <Tooltip
                                  direction="top"
                                  offset={[0, -6]}
                                  opacity={isOrigin ? 1 : 0.85}
                                  permanent={isOrigin}
                                >
                                  <span className={isOrigin ? 'font-semibold' : 'opacity-70 text-[11px]'}>
                                    {step.name}
                                  </span>
                                </Tooltip>
                              </CircleMarker>
                            );
                          })}

                          {/* EXIF point (precise capture location) */}
                          {exifPoint && (
                            <CircleMarker
                              center={exifPoint}
                              radius={7}
                              pathOptions={{
                                color: 'hsl(var(--primary))',
                                fillColor: 'hsl(var(--primary))',
                                fillOpacity: 1,
                                weight: 2,
                                className: 'animate-pulse',
                              }}
                            >
                              <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent>
                                <span className="font-semibold">Ici</span>
                              </Tooltip>
                            </CircleMarker>
                          )}
                        </MapContainer>

                        {/* Compact legend overlay */}
                        {eventSteps.length > 1 && (
                          <div className="absolute bottom-2 left-2 z-[400] px-2 py-1 rounded-md bg-background/85 backdrop-blur border border-border text-[10px] text-muted-foreground flex items-center gap-2">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-primary" /> ici
                            </span>
                            <span className="inline-flex items-center gap-1 opacity-70">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> autres étapes
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
    </AnimatePresence>,
    document.body
  );
};

export default MediaLightbox;
