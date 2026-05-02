import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin, User, Award, Sparkles, Headphones } from 'lucide-react';
import type { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MediaItem, MarcheEventGroup } from '@/hooks/useExplorationAllMedia';

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
  const eventsGeo = useMemo(
    () => marcheEvents.filter(e => e.latitude != null && e.longitude != null),
    [marcheEvents]
  );
  const originEvent = useMemo(
    () => marcheEvents.find(e => e.id === current?.marcheEventId) || null,
    [marcheEvents, current]
  );

  const points: [number, number][] = useMemo(
    () => eventsGeo.map(e => [e.latitude!, e.longitude!]),
    [eventsGeo]
  );
  const originPoint: [number, number] | undefined =
    originEvent?.latitude != null && originEvent?.longitude != null
      ? [originEvent.latitude, originEvent.longitude]
      : undefined;

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
          className="relative w-full sm:max-w-2xl sm:rounded-2xl bg-card text-card-foreground border-0 sm:border sm:border-border overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[92vh]"
          onClick={e => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Close */}
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-2 z-20 w-9 h-9 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center text-foreground hover:bg-background transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Media area */}
          <div
            className={`relative flex items-center justify-center ${
              current.type === 'audio'
                ? 'bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-amber-500/10'
                : 'bg-black'
            }`}
            style={{ minHeight: '38vh' }}
          >
            {current.type === 'video' ? (
              <video
                key={current.key}
                src={current.url}
                controls
                playsInline
                className="max-h-[60vh] w-full object-contain bg-black"
              />
            ) : current.type === 'audio' ? (
              <div className="w-full px-5 py-8 sm:py-10 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg">
                  <Headphones className="w-7 h-7 text-white" />
                </div>
                <div className="max-w-md">
                  <p className="text-base font-semibold text-foreground leading-snug">
                    {current.titre || 'Enregistrement sonore'}
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
                className="max-h-[60vh] w-full object-contain"
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

          {/* Scrollable meta */}
          <div className="overflow-y-auto flex-1">
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

            {current.titre && (
              <p className="px-4 text-xs text-muted-foreground italic truncate">{current.titre}</p>
            )}

            {/* Map or Convivialité banner */}
            <div className="px-4 mt-3">
              {isConv || !originEvent || originPoint == null ? (
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Photo partagée sur le mur Convivialité (sans rattachement à une marche).</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-40 sm:h-48 rounded-xl overflow-hidden border border-border relative">
                    <MapContainer
                      center={originPoint as LatLngExpression}
                      zoom={12}
                      scrollWheelZoom={false}
                      zoomControl={false}
                      style={{ height: '100%', width: '100%' }}
                      attributionControl={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <FitBounds points={points} focus={originPoint} />
                      {eventsGeo.map(ev => {
                        const isOrigin = ev.id === originEvent.id;
                        return (
                          <CircleMarker
                            key={ev.id}
                            center={[ev.latitude!, ev.longitude!]}
                            radius={isOrigin ? 10 : 5}
                            pathOptions={{
                              color: isOrigin ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                              fillColor: isOrigin ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                              fillOpacity: isOrigin ? 0.85 : 0.35,
                              weight: isOrigin ? 3 : 1,
                            }}
                          >
                            <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent={isOrigin}>
                              <span className={isOrigin ? 'font-semibold' : 'opacity-70'}>
                                {ev.title}
                              </span>
                            </Tooltip>
                          </CircleMarker>
                        );
                      })}
                    </MapContainer>
                  </div>

                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{originEvent.title}</p>
                      <p className="text-muted-foreground truncate">
                        {originEvent.lieu || '—'}{dateLabel ? ` · ${dateLabel}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-4" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default MediaLightbox;
