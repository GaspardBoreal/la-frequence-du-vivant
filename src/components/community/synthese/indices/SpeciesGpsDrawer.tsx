import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Marker, Popup } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Calendar, MapPin, User, ExternalLink, Sparkles, Camera, Users, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { SpeciesName } from '@/components/species/SpeciesName';
import { countIndividuals, getLatLng, type AttributionLike } from '@/utils/speciesIndividualCount';
import { RichMap, type MarcheRouteStep } from '@/components/maps';
import { supabase } from '@/integrations/supabase/client';
import { useSpeciesMarcheurPhotos, type MarcheurSpeciesPhoto } from '@/hooks/useSpeciesMarcheurPhotos';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scientificName: string;
  commonName: string;
  attributions: AttributionLike[];
  photos?: string[];
  /** When provided, draws the marche route in the background of the map */
  explorationId?: string;
}

const buildPulseIcon = (count: number) => {
  const size = Math.min(48, 18 + count * 4);
  return L.divIcon({
    className: 'species-gps-marker',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(16,185,129,0.35);animation:pingHalo 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <span style="position:absolute;inset:25%;border-radius:9999px;background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 0 0 2px rgba(255,255,255,0.9),0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;font-family:system-ui;">${count > 1 ? count : ''}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const formatDate = (d?: string | null) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
};

export const SpeciesGpsDrawer: React.FC<Props> = ({
  open,
  onOpenChange,
  scientificName,
  commonName,
  attributions,
  photos = [],
  explorationId,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [marcheStepsVisible, setMarcheStepsVisible] = React.useState(false);

  // Fetch lightweight marche positions for the background route trace
  const { data: marcheRouteSteps = [] } = useQuery({
    queryKey: ['drawer-marche-positions', explorationId],
    enabled: !!explorationId && open,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<MarcheRouteStep[]> => {
      const { data, error } = await supabase
        .from('exploration_marches')
        .select('ordre, marche:marches(id, latitude, longitude, nom_marche, ville)')
        .eq('exploration_id', explorationId!)
        .order('ordre', { ascending: true });
      if (error || !data) return [];
      return data
        .map((em: any) => em.marche)
        .filter((m: any) => m && m.latitude != null && m.longitude != null)
        .map((m: any, i: number) => ({
          id: m.id,
          latitude: Number(m.latitude),
          longitude: Number(m.longitude),
          label: m.nom_marche || m.ville || `Étape ${i + 1}`,
          ordre: i,
        }));
    },
  });

  const gpsAttrs = useMemo(
    () => (attributions || []).filter((a) => getLatLng(a) !== null),
    [attributions],
  );

  const clusters = useMemo(
    () => countIndividuals(gpsAttrs, { clusterRadiusMeters: 8 }).clusters,
    [gpsAttrs],
  );

  const points = useMemo<Array<[number, number]>>(
    () => clusters.filter((c) => c.centroid).map((c) => [c.centroid!.lat, c.centroid!.lng]),
    [clusters],
  );

  // Bounds = union of species observation points + marche route (so user sees both contexts)
  const bounds = useMemo<Array<[number, number]>>(() => {
    const all: Array<[number, number]> = [...points];
    marcheRouteSteps.forEach((s) => all.push([s.latitude, s.longitude]));
    return all;
  }, [points, marcheRouteSteps]);

  const sortedAttrs = useMemo(
    () =>
      [...(attributions || [])].sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return da - db;
      }),
    [attributions],
  );

  const observers = useMemo(() => {
    const set = new Set<string>();
    (attributions || []).forEach((a) => {
      if (a.observerName) set.add(a.observerName);
    });
    return set.size;
  }, [attributions]);

  const period = useMemo(() => {
    const dates = sortedAttrs.map((a) => a.date).filter(Boolean) as string[];
    if (!dates.length) return '—';
    const first = formatDate(dates[0]);
    const last = formatDate(dates[dates.length - 1]);
    return first === last ? first : `${first} → ${last}`;
  }, [sortedAttrs]);

  const cover = photos[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl p-0 overflow-y-auto bg-gradient-to-b from-background via-background to-emerald-950/10 [&>button.rounded-sm]:hidden"
      >
        <style>{`
          @keyframes pingHalo {
            0% { transform: scale(0.7); opacity: 0.9; }
            80%,100% { transform: scale(1.6); opacity: 0; }
          }
          .leaflet-popup-content-wrapper {
            border-radius: 12px;
            background: hsl(var(--card));
            color: hsl(var(--foreground));
          }
          .leaflet-popup-tip { background: hsl(var(--card)); }
        `}</style>

        {/* Bouton de fermeture — encadré discret, toujours au-dessus de la carte */}
        <SheetClose
          aria-label="Fermer"
          className="absolute right-4 top-4 z-[60] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-background/70 backdrop-blur-md text-foreground/80 shadow-sm ring-offset-background transition hover:border-emerald-400/40 hover:bg-background/90 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </SheetClose>

        {/* Header avec photo cover floutée */}
        <div className="relative h-40 sm:h-48 overflow-hidden">
          {cover ? (
            <>
              <img
                src={cover}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-background/60 to-background" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
          )}
          <SheetHeader className="relative z-10 p-5 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] uppercase tracking-widest text-emerald-300/90 font-semibold">
                Empreinte GPS iNaturalist
              </span>
            </div>
            <SheetTitle className="text-left">
              <SpeciesName scientificName={scientificName} commonName={commonName} size="lg" />
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 -mt-2">
          {[
            { icon: Camera, label: 'Observations', value: String(attributions?.length || 0) },
            { icon: MapPin, label: 'Individus GPS', value: String(clusters.length) },
            { icon: Users, label: 'Observateurs', value: String(observers) },
            { icon: Calendar, label: 'Période', value: period, small: true },
          ].map((k) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl border border-border bg-card/80 backdrop-blur px-3 py-2"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <k.icon className="w-3 h-3" /> {k.label}
              </div>
              <p className={`font-semibold tabular-nums ${k.small ? 'text-xs' : 'text-base'}`}>
                {k.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Carte (RichMap partagé avec l'onglet Carte) */}
        <div className="px-5 mt-5">
          <div className="relative rounded-2xl overflow-hidden border border-border h-72 sm:h-96 bg-muted">
            {points.length > 0 ? (
              <RichMap
                center={points[0]}
                zoom={15}
                bounds={bounds}
                initialStyle="geopoetic"
                controls={{
                  zoom: true,
                  style: true,
                  geolocate: true,
                  cadastre: true,
                  weather: true,
                  marcheRouteVisibility: true,
                }}
                onMarcheVisibilityChange={setMarcheStepsVisible}
                marcheRoute={
                  marcheRouteSteps.length > 0
                    ? {
                        steps: marcheRouteSteps,
                        renderMarkers: false, // étapes masquées par défaut — révélables via le toggle
                        opacity: 0.55,
                      }
                    : undefined
                }
                height="100%"
              >
                {clusters.map((c, idx) => {
                  if (!c.centroid) return null;
                  // Photos disponibles dans ce cluster (issues des marcheur_observations)
                  const clusterPhotos = c.attributions
                    .map((a) => ({
                      url: (a as any).photoUrl as string | undefined,
                      href: (a as any).originalUrl as string | undefined,
                      date: a.date,
                      observer: a.observerName,
                    }))
                    .filter((p) => !!p.url) as Array<{ url: string; href?: string; date?: string | null; observer?: string | null }>;
                  // Fallback : si aucune photo attribuée, on tape dans le pool global de l'espèce
                  const fallbackPhoto = clusterPhotos.length === 0 ? photos[0] : undefined;
                  // Métadonnées agrégées (date la plus récente, observateurs uniques)
                  const sortedDates = c.attributions
                    .map((a) => a.date)
                    .filter(Boolean)
                    .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
                  const latestDate = sortedDates[0];
                  const observersSet = new Set(
                    c.attributions.map((a) => a.observerName).filter(Boolean) as string[],
                  );
                  const observersLabel =
                    observersSet.size === 1
                      ? Array.from(observersSet)[0]
                      : `${observersSet.size} observateurs`;
                  const firstInatLink = c.attributions.find((a) => (a as any).originalUrl) as any;
                  return (
                    <Marker
                      key={idx}
                      position={[c.centroid.lat, c.centroid.lng]}
                      icon={buildPulseIcon(c.count)}
                    >
                      <Popup maxWidth={320} minWidth={240}>
                        <div className="space-y-2 min-w-[220px] max-w-[300px]">
                          {/* Bandeau photos */}
                          {clusterPhotos.length > 0 ? (
                            clusterPhotos.length === 1 ? (
                              <a
                                href={clusterPhotos[0].href || clusterPhotos[0].url}
                                target="_blank"
                                rel="noreferrer"
                                className="block relative rounded-lg overflow-hidden border border-emerald-500/20 group"
                              >
                                <img
                                  src={clusterPhotos[0].url}
                                  alt=""
                                  className="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-105"
                                  loading="lazy"
                                />
                                <div className="absolute inset-x-0 bottom-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent">
                                  <span className="text-[10px] text-white/90 flex items-center gap-1">
                                    <Camera className="w-2.5 h-2.5" /> Photo du marcheur
                                  </span>
                                </div>
                              </a>
                            ) : (
                              <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 snap-x">
                                {clusterPhotos.map((p, i) => (
                                  <a
                                    key={i}
                                    href={p.href || p.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="relative shrink-0 w-20 h-20 rounded-md overflow-hidden border border-emerald-500/20 snap-start group"
                                  >
                                    <img
                                      src={p.url}
                                      alt=""
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                      loading="lazy"
                                    />
                                  </a>
                                ))}
                              </div>
                            )
                          ) : fallbackPhoto ? (
                            <div className="relative rounded-lg overflow-hidden border border-border/50">
                              <img
                                src={fallbackPhoto}
                                alt=""
                                className="w-full h-32 object-cover opacity-80"
                                loading="lazy"
                              />
                              <div className="absolute inset-x-0 bottom-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent">
                                <span className="text-[10px] text-white/80">Photo générique de l'espèce</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-16 rounded-md border border-dashed border-border/60 flex items-center justify-center text-[10px] text-muted-foreground gap-1">
                              <Camera className="w-3 h-3" /> Pas de photo disponible
                            </div>
                          )}

                          {/* Métadonnées */}
                          <div className="space-y-1 text-xs">
                            <p className="font-semibold flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-500" />
                              {c.count} observation{c.count > 1 ? 's' : ''}
                            </p>
                            {latestDate && (
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" /> {formatDate(latestDate)}
                              </p>
                            )}
                            {observersSet.size > 0 && (
                              <p className="flex items-center gap-1 text-muted-foreground truncate">
                                <User className="w-3 h-3 shrink-0" />
                                <span className="truncate">{observersLabel}</span>
                              </p>
                            )}
                            {firstInatLink?.originalUrl && (
                              <a
                                href={firstInatLink.originalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-500 hover:underline pt-0.5"
                              >
                                Voir sur iNaturalist <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </RichMap>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-muted-foreground p-6">
                Aucune coordonnée GPS disponible pour cette espèce.
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            Marqueurs émeraude pulsants — observations groupées (≤ 8 m).
            {marcheRouteSteps.length > 0 &&
              (marcheStepsVisible
                ? ' Tracé et étapes de la marche affichés.'
                : ' Tracé de la marche en arrière-plan.')}
          </p>
        </div>

        {/* Carrousel photos */}
        {photos.length > 0 && (
          <div className="px-5 mt-5">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Galerie photos
            </h3>
            <div
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin"
            >
              {photos.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative shrink-0 w-44 h-44 rounded-xl overflow-hidden border border-border snap-start group"
                >
                  <img
                    src={p}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-110"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <span className="text-[10px] text-white/90">Photo {i + 1}/{photos.length}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {sortedAttrs.length > 0 && (
          <div className="px-5 mt-5 mb-8">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Chronologie
            </h3>
            <div className="relative">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
              <div className="flex gap-4 overflow-x-auto pb-3 pt-2">
                {sortedAttrs.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="relative shrink-0 group"
                  >
                    <div className="flex flex-col items-center gap-1.5 w-24">
                      <div className="text-[10px] text-muted-foreground text-center leading-tight">
                        {formatDate(a.date)}
                      </div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 group-hover:scale-125 transition" />
                      <div className="text-[10px] text-center text-foreground/80 leading-tight truncate w-full">
                        {a.observerName || '—'}
                      </div>
                      {(a as any).originalUrl && (
                        <a
                          href={(a as any).originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-500 hover:underline"
                        >
                          iNat ↗
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SpeciesGpsDrawer;
