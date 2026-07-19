import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleMarker, Circle, Polyline, Popup, Tooltip } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import RichMap from '@/components/maps/RichMap';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getGenus } from '@/utils/taxonomyMerge';
import { Merge, MapPin, Sparkles } from 'lucide-react';

interface Obs {
  id: string;
  marche_id: string | null;
  species_scientific_name: string | null;
  taxon_common_name_fr: string | null;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  observation_date: string | null;
  source: string | null;
  kingdom: string | null;
  marche_name?: string | null;
  marche_lat?: number | null;
  marche_lng?: number | null;
  marche_radius?: number | null;
  distanceToMarche?: number | null;
  outOfPerimeter?: boolean;
}

type KingdomFilter = 'all' | 'faune' | 'plants' | 'fungi' | 'others';
const kingdomBucket = (k: string | null | undefined): KingdomFilter => {
  const v = (k || '').trim();
  if (v === 'Animalia') return 'faune';
  if (v === 'Plantae') return 'plants';
  if (v === 'Fungi') return 'fungi';
  return 'others';
};


interface Cluster {
  id: string;
  genus: string;
  variants: string[]; // scientific names
  observations: Obs[];
  centroid: [number, number];
  radiusMeters: number;
}

const norm = (s: string | null | undefined) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const haversine = (a: [number, number], b: [number, number]) => {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

// Palette pour cycler les couleurs de clusters
const CLUSTER_COLORS = [
  '#f59e0b', // ambre
  '#a78bfa', // violet doux
  '#ec4899', // rose
  '#22d3ee', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

interface Props {
  marcheIds: string[] | null; // null = all
  kingdomFilter?: KingdomFilter;
  search?: string;
  onRequestMerge: (canonical: string, sources: string[]) => void;
}

const DuplicatesMapView: React.FC<Props> = ({ marcheIds, kingdomFilter = 'all', search = '', onRequestMerge }) => {

  const [radius, setRadius] = useState(25);
  const [activeCluster, setActiveCluster] = useState<Cluster | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const { data: obs = [], isLoading } = useQuery({
    queryKey: ['taxo-duplicates-obs', marcheIds?.join(',') || 'all'],
    queryFn: async (): Promise<Obs[]> => {
      let q = supabase
        .from('marcheur_observations')
        .select(
          'id, marche_id, species_scientific_name, taxon_common_name_fr, latitude, longitude, photo_url, observation_date, source, marches:marche_id ( nom_marche, latitude, longitude, radius_m )'
        )
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (marcheIds && marcheIds.length > 0) q = q.in('marche_id', marcheIds);
      const { data, error } = await q.limit(8000);
      if (error) throw error;
      return ((data || []) as any[]).map((r) => {
        const m = r.marches || {};
        const mLat = m.latitude ?? null;
        const mLng = m.longitude ?? null;
        const radius = m.radius_m ?? 500;
        let distanceToMarche: number | null = null;
        let outOfPerimeter = false;
        if (mLat != null && mLng != null) {
          distanceToMarche = haversine([r.latitude, r.longitude], [mLat, mLng]);
          outOfPerimeter = distanceToMarche > radius * 1.2;
        }
        return {
          ...r,
          marche_name: m.nom_marche ?? null,
          marche_lat: mLat,
          marche_lng: mLng,
          marche_radius: radius,
          distanceToMarche,
          outOfPerimeter,
        } as Obs;
      });
    },
  });

  // Clustering : par genre + proximité GPS ≤ radius (Haversine)
  const clusters = useMemo<Cluster[]>(() => {
    if (!obs.length) return [];
    // Groupe par genre normalisé
    const byGenus = new Map<string, Obs[]>();
    for (const o of obs) {
      const g = norm(getGenus(o.species_scientific_name) || '');
      if (!g) continue;
      const arr = byGenus.get(g) || [];
      arr.push(o);
      byGenus.set(g, arr);
    }
    const out: Cluster[] = [];
    let cid = 0;
    for (const [genus, rows] of byGenus.entries()) {
      // Union-find simple par distance
      const parents = rows.map((_, i) => i);
      const find = (i: number): number => (parents[i] === i ? i : (parents[i] = find(parents[i])));
      const union = (a: number, b: number) => {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb) parents[ra] = rb;
      };
      for (let i = 0; i < rows.length; i++) {
        for (let j = i + 1; j < rows.length; j++) {
          if (
            haversine(
              [rows[i].latitude, rows[i].longitude],
              [rows[j].latitude, rows[j].longitude]
            ) <= radius
          )
            union(i, j);
        }
      }
      const groups = new Map<number, Obs[]>();
      rows.forEach((r, i) => {
        const root = find(i);
        const arr = groups.get(root) || [];
        arr.push(r);
        groups.set(root, arr);
      });
      for (const list of groups.values()) {
        const variants = Array.from(
          new Set(list.map((r) => norm(r.species_scientific_name)).filter(Boolean))
        );
        if (variants.length < 2) continue; // pas de doublon taxonomique
        const lat = list.reduce((s, r) => s + r.latitude, 0) / list.length;
        const lng = list.reduce((s, r) => s + r.longitude, 0) / list.length;
        const maxDist = Math.max(
          ...list.map((r) => haversine([lat, lng], [r.latitude, r.longitude])),
          8
        );
        out.push({
          id: `c${cid++}`,
          genus,
          variants: list
            .map((r) => r.species_scientific_name || r.taxon_common_name_fr || '')
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i),
          observations: list,
          centroid: [lat, lng],
          radiusMeters: maxDist + 4,
        });
      }
    }
    return out.sort((a, b) => b.observations.length - a.observations.length);
  }, [obs, radius]);

  const bounds = useMemo<[number, number][]>(
    () =>
      clusters.length > 0
        ? clusters.flatMap((c) => c.observations.map((o) => [o.latitude, o.longitude] as [number, number]))
        : obs.slice(0, 200).map((o) => [o.latitude, o.longitude] as [number, number]),
    [clusters, obs]
  );

  const totalObsInDuplicates = clusters.reduce((s, c) => s + c.observations.length, 0);
  const outCount = clusters.reduce(
    (s, c) => s + c.observations.filter((o) => o.outOfPerimeter).length,
    0,
  );
  const [showOnlyOut, setShowOnlyOut] = useState(false);

  // Refresh bounds when clusters change (via key on RichMap)
  const mapKey = useMemo(() => `${marcheIds?.join(',') || 'all'}-${radius}-${clusters.length}`, [
    marcheIds,
    radius,
    clusters.length,
  ]);

  return (
    <div className="relative">
      <style>{`
        @keyframes constellation-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
        .cluster-halo path {
          stroke-dasharray: 8 6;
          animation: dash 30s linear infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: -400; }
        }
      `}</style>

      {/* Bandeau info */}
      <div className="flex flex-wrap items-center gap-3 mb-3 px-3 py-2 rounded-lg border bg-card/60 backdrop-blur">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <div className="text-sm">
          <span className="font-semibold text-amber-600">{clusters.length}</span> constellation
          {clusters.length > 1 ? 's' : ''} de doublons ·{' '}
          <span className="font-semibold">{totalObsInDuplicates}</span> observation
          {totalObsInDuplicates > 1 ? 's' : ''} concernée{totalObsInDuplicates > 1 ? 's' : ''} ·{' '}
          <span className="text-muted-foreground">rayon {radius} m</span>
        </div>
        {outCount > 0 && (
          <button
            type="button"
            onClick={() => setShowOnlyOut((v) => !v)}
            className={`text-xs px-2 py-1 rounded-full border transition ${
              showOnlyOut
                ? 'bg-red-500/15 border-red-500/60 text-red-600'
                : 'bg-red-500/5 border-red-500/30 text-red-500 hover:bg-red-500/10'
            }`}
            title="Observation dont le GPS est en dehors du périmètre de sa marche associée"
          >
            ⚠ {outCount} hors périmètre marche {showOnlyOut ? '(actif)' : ''}
          </button>
        )}
        <div className="ml-auto flex items-center gap-3 min-w-[260px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">10 m</span>
          <Slider
            value={[radius]}
            min={10}
            max={500}
            step={5}
            onValueChange={(v) => setRadius(v[0])}
            className="w-48"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">500 m</span>
        </div>
      </div>


      <div
        className="relative rounded-xl overflow-hidden border shadow-lg"
        style={{ height: '70vh', minHeight: 520 }}
      >
        {isLoading ? (
          <div className="h-full w-full animate-pulse bg-muted flex items-center justify-center">
            <MapPin className="h-8 w-8 text-muted-foreground/40" />
          </div>
        ) : bounds.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
            <MapPin className="h-10 w-10 mb-2 opacity-40" />
            <p>Aucune observation géolocalisée pour ce filtre.</p>
          </div>
        ) : (
          <RichMap
            key={mapKey}
            bounds={bounds}
            initialStyle="satellite"
            controls={{ zoom: true, style: true, geolocate: true, cadastre: true }}
            height="100%"
          >
            {clusters.map((c, idx) => {
              const color = resolvedIds.has(c.id) ? '#10b981' : CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
              return (
                <React.Fragment key={c.id}>
                  {/* Halo lumineux */}
                  <Circle
                    center={c.centroid}
                    radius={c.radiusMeters}
                    pathOptions={{
                      color,
                      weight: 1.5,
                      opacity: 0.9,
                      fillColor: color,
                      fillOpacity: 0.12,
                      dashArray: '6 6',
                      className: 'cluster-halo',
                    }}
                    eventHandlers={{ click: () => setActiveCluster(c) }}
                  />
                  {/* Filaments centroïde → points */}
                  {c.observations
                    .filter((o) => !showOnlyOut || o.outOfPerimeter)
                    .map((o) => (
                      <Polyline
                        key={`f-${c.id}-${o.id}`}
                        positions={[c.centroid, [o.latitude, o.longitude]]}
                        pathOptions={{
                          color: o.outOfPerimeter ? '#ef4444' : color,
                          weight: 1,
                          opacity: o.outOfPerimeter ? 0.8 : 0.4,
                          dashArray: o.outOfPerimeter ? '3 4' : undefined,
                        }}
                      />
                    ))}
                  {/* Points GPS ultra-précis */}
                  {c.observations
                    .filter((o) => !showOnlyOut || o.outOfPerimeter)
                    .map((o) => (
                      <CircleMarker
                        key={o.id}
                        center={[o.latitude, o.longitude]}
                        radius={o.outOfPerimeter ? 7 : 6}
                        pathOptions={{
                          color: o.outOfPerimeter ? '#ef4444' : '#fff',
                          weight: o.outOfPerimeter ? 2 : 1.5,
                          fillColor: color,
                          fillOpacity: 0.95,
                          dashArray: o.outOfPerimeter ? '2 3' : undefined,
                        }}
                        eventHandlers={{ click: () => setActiveCluster(c) }}
                      >
                        <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                          <div className="text-xs">
                            <div className="italic font-medium">
                              {o.species_scientific_name || o.taxon_common_name_fr}
                            </div>
                            <div className="opacity-70 font-mono">
                              {o.latitude.toFixed(6)}, {o.longitude.toFixed(6)}
                            </div>
                            {o.marche_name && (
                              <div className={o.outOfPerimeter ? 'text-red-500 font-medium' : 'opacity-70'}>
                                Marche : {o.marche_name}
                                {o.outOfPerimeter && o.distanceToMarche != null && (
                                  <> — ⚠ {Math.round(o.distanceToMarche)} m hors périmètre</>
                                )}
                              </div>
                            )}
                            {o.source && <div className="opacity-60">source: {o.source}</div>}
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    ))}
                  {/* Étiquette de constellation au centroïde */}
                  <CircleMarker
                    center={c.centroid}
                    radius={2}
                    pathOptions={{ color, fillColor: color, fillOpacity: 1, weight: 1 }}
                  >
                    <Tooltip
                      permanent
                      direction="top"
                      offset={[0, -4]}
                      className="!bg-black/70 !text-white !border-0 !text-[10px]"
                    >
                      <span className="italic">{c.genus}</span> · {c.variants.length} formes ·{' '}
                      {c.observations.length} obs
                    </Tooltip>
                  </CircleMarker>
                </React.Fragment>
              );
            })}
          </RichMap>
        )}
      </div>

      {/* Sheet cluster détail */}
      <Sheet open={!!activeCluster} onOpenChange={(o) => !o && setActiveCluster(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {activeCluster && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Constellation « <span className="italic">{activeCluster.genus}</span> »
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Variantes détectées</div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCluster.variants.map((v) => (
                      <Badge key={v} variant="secondary" className="italic">
                        {v}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 font-mono">
                    Centroïde : {activeCluster.centroid[0].toFixed(6)},{' '}
                    {activeCluster.centroid[1].toFixed(6)}
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-2">
                  {activeCluster.observations.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-lg overflow-hidden border bg-card"
                    >
                      {o.photo_url ? (
                        <img
                          src={o.photo_url}
                          alt={o.species_scientific_name || ''}
                          className="w-full h-28 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-28 bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          Pas de photo
                        </div>
                      )}
                      <div className="p-2 text-xs space-y-0.5">
                        <div className="italic font-medium truncate">
                          {o.species_scientific_name || '—'}
                        </div>
                        {o.taxon_common_name_fr && (
                          <div className="text-muted-foreground truncate">
                            {o.taxon_common_name_fr}
                          </div>
                        )}
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {o.latitude.toFixed(6)}, {o.longitude.toFixed(6)}
                        </div>
                        {o.observation_date && (
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(o.observation_date).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        {o.marche_name && (
                          <div
                            className={`text-[10px] mt-1 flex items-center gap-1 ${
                              o.outOfPerimeter ? 'text-red-600 font-medium' : 'text-muted-foreground'
                            }`}
                          >
                            {o.outOfPerimeter && <span>⚠</span>}
                            <span className="truncate" title={o.marche_name}>
                              {o.marche_name}
                            </span>
                            {o.outOfPerimeter && o.distanceToMarche != null && (
                              <span className="whitespace-nowrap">· {Math.round(o.distanceToMarche)} m</span>
                            )}
                          </div>
                        )}
                        {o.outOfPerimeter && (
                          <Badge variant="destructive" className="text-[10px] mt-1">
                            Hors périmètre marche
                          </Badge>
                        )}
                        {o.marche_id && (
                          <a
                            href={`/admin/marches/${o.marche_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-[10px] text-primary hover:underline mt-1"
                          >
                            Voir dans l'admin marche →
                          </a>
                        )}
                        {o.source && (
                          <Badge variant="outline" className="text-[10px] mt-1">
                            {o.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Choisis un nom canonique parmi les variantes puis fusionne. Le formulaire ci-dessous
                    sera pré-rempli.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeCluster.variants.map((v) => (
                      <Button
                        key={v}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onRequestMerge(v, activeCluster.variants.filter((x) => x !== v));
                          setResolvedIds((s) => new Set(s).add(activeCluster.id));
                          setActiveCluster(null);
                        }}
                      >
                        <Merge className="h-3.5 w-3.5 mr-1.5" />
                        Fusionner vers « {v} »
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DuplicatesMapView;
