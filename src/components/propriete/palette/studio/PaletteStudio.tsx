import React from 'react';
import { createPortal } from 'react-dom';
import { GeoJSON, Polygon, Tooltip } from 'react-leaflet';
import {
  X,
  Layers as LayersIcon,
  Wrench,
  Leaf,
  Sparkles,
  BarChart3,
  Pencil,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import RichMap from '@/components/maps/RichMap';
import { ZONE_COLORS, type ProprieteZone } from '@/hooks/propriete/usePropertyZones';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';
import { useCanCurateParcelles } from '@/hooks/propriete/usePropertyParcelles';
import { useWaypointFrenchNames } from '@/hooks/propriete/useWaypointFrenchNames';
import { buildGeofence, evaluateGeofence } from '@/lib/geofence';
import GpsControlConsole, { type GpsCandidate } from '@/components/propriete/gps/GpsControlConsole';
import InlineGpsCurationLayer from '@/components/propriete/gps/InlineGpsCurationLayer';
import InlineGpsBar from '@/components/propriete/gps/InlineGpsBar';
import { useInlineGpsCuration } from '@/hooks/propriete/useInlineGpsCuration';
import { MapViewReporter, useMapViewState } from '@/components/maps/hooks/useMapViewState';
import { RevealPhotoLightbox } from '@/components/propriete/identify/blocks/RevealPhotoLightbox';

import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { useProprieteCalques } from '@/hooks/propriete/usePropertyCalques';
import { useProprieteObjets } from '@/hooks/propriete/usePropertyObjets';
import { DEFAULT_LAYERS, TOOL_BY_KEY, type PaysageTool } from '@/lib/paysageTools';
import type { InspirationCard } from '@/lib/inspirationsKb';
import DrawLayer from './DrawLayer';
import ObjectsLayer from './ObjectsLayer';
import LayersPanel, { type SystemLayerState } from './LayersPanel';
import ToolPalette from './ToolPalette';
import ObjectInspector from './ObjectInspector';
import PlanBalanceSheet from './PlanBalanceSheet';
import InspirationDrawer from './InspirationDrawer';
import LivingLayer, {
  DEFAULT_VIVANT_FILTER,
  LivingFilterPanel,
  matchVivantFilter,
  typeOfWaypoint,
  indicatorOf,
  type VivantFilterState,
  type VivantType,
} from './LivingLayer';
import { geometryAreaM2, fmtArea } from './geoMetrics';
import ZoneTransformLayer from '../ZoneTransformLayer';
import ZoneTransformBar from '../ZoneTransformBar';
import { useZoneTransform } from '@/hooks/propriete/useZoneTransform';

type PanelTab = 'calques' | 'outils' | 'vivant' | 'bilan';

const TIME_STEPS = [
  { label: 'An 0', tag: 'Le plan nu — ce que l’on pose aujourd’hui.' },
  { label: 'An 3', tag: 'Les strates se referment, le sol se couvre.' },
  { label: 'An 10', tag: 'Le dessin s’efface, le lieu prend le relais.' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  proprieteId: string;
  center: [number, number] | null;
  parcelles: ProprieteParcelle[];
  zones: ProprieteZone[];
  activeZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  onCreateZone: (geometry: any, surfaceM2: number) => void;
  onPatchZone: (z: ProprieteZone, patch: Partial<ProprieteZone>) => void;
  onDeleteZone: (id: string) => void;
  readOnly?: boolean;
}

export const PaletteStudio: React.FC<Props> = ({
  open,
  onClose,
  proprieteId,
  center,
  parcelles,
  zones,
  activeZoneId,
  onSelectZone,
  onCreateZone,
  onPatchZone,
  onDeleteZone,
  readOnly,
}) => {
  const {
    waypoints: rawWaypoints,
    allWaypoints: rawAllWaypoints,
    scopeCounts,
  } = usePropertySpeciesPool(open ? proprieteId : undefined);
  const { data: canCurate } = useCanCurateParcelles(open ? proprieteId : undefined);
  const { displayNameFor } = useWaypointFrenchNames(rawWaypoints);

  /** Statut géofence identique à « J'identifie » (même parcelles, même tampon). */
  const fence = React.useMemo(() => buildGeofence(parcelles ?? []), [parcelles]);
  const waypoints = React.useMemo<GpsCandidate[]>(
    () =>
      rawWaypoints
        .filter((w) => w.overrideStatus !== 'excluded')
        .map((w) => {
          const ev = evaluateGeofence(fence, w.lat, w.lng, 25);
          return { ...w, geofenceStatus: ev.status, geofenceDistanceM: ev.distanceM };
        }),
    [rawWaypoints, fence],
  );

  /**
   * Console GPS : volontairement HORS portée, sinon les points situés hors du
   * plan cadastral deviendraient invisibles et donc impossibles à rapatrier.
   */
  const allCandidates = React.useMemo<GpsCandidate[]>(
    () =>
      rawAllWaypoints
        .filter((w) => w.overrideStatus !== 'excluded')
        .map((w) => {
          const ev = evaluateGeofence(fence, w.lat, w.lng, 25);
          return { ...w, geofenceStatus: ev.status, geofenceDistanceM: ev.distanceM };
        }),
    [rawAllWaypoints, fence],
  );

  /** Curation « sur place » : même geste que dans « J'identifie », sans perdre le plan. */
  const { view, onChange: onViewChange } = useMapViewState();
  const inlineGps = useInlineGpsCuration({
    proprieteId,
    fence,
    displayNameFor: (w) => frenchName(w.scientificName || '') || w.commonName || '—',
  });

  const frenchName = React.useCallback(
    (scientific: string, fallback?: string | null) =>
      displayNameFor({ scientificName: scientific, commonName: fallback ?? null }),
    [displayNameFor],
  );

  const [lightboxId, setLightboxId] = React.useState<string | null>(null);
  const [gpsConsole, setGpsConsole] = React.useState(false);
  const [gpsFocusId, setGpsFocusId] = React.useState<string | null>(null);






  const { calques, upsertCalque, deleteCalque } = useProprieteCalques(open ? proprieteId : undefined);
  const { objets, upsertObjet, deleteObjet } = useProprieteObjets(open ? proprieteId : undefined);

  const [tab, setTab] = React.useState<PanelTab>('outils');
  const [panelOpen, setPanelOpen] = React.useState(true);
  const [activeCalqueId, setActiveCalqueId] = React.useState<string | null>(null);
  const [tool, setTool] = React.useState<PaysageTool | null>(null);
  const [zoneDraw, setZoneDraw] = React.useState(false);
  const zoneTransform = useZoneTransform(onPatchZone);
  const [selectedObjetId, setSelectedObjetId] = React.useState<string | null>(null);
  const [inspirationOpen, setInspirationOpen] = React.useState(false);
  const [pendingInspiration, setPendingInspiration] = React.useState<InspirationCard | null>(null);
  const [timeIndex, setTimeIndex] = React.useState(0);
  const [system, setSystem] = React.useState<SystemLayerState>({
    parcelles: true,
    zones: true,
    vivant: true,
  });
  const [vivantFilter, setVivantFilter] = React.useState<VivantFilterState>(DEFAULT_VIVANT_FILTER);

  /** Observations réellement affichées (filtres Vivant) : contexte lightbox + Contrôle GPS. */
  const visibleWaypoints = React.useMemo(
    () => waypoints.filter((w) => matchVivantFilter(w, vivantFilter)),
    [waypoints, vivantFilter],
  );

  const gpsCenter = React.useMemo<[number, number]>(
    () => center ?? (waypoints[0] ? [waypoints[0].lat, waypoints[0].lng] : [46.6, 2.5]),
    [center, waypoints],
  );



  /* Semer les calques par défaut au premier passage */
  const seededRef = React.useRef(false);
  React.useEffect(() => {
    if (!open || readOnly || seededRef.current) return;
    if (calques.length > 0) {
      seededRef.current = true;
      return;
    }
    seededRef.current = true;
    (async () => {
      for (let i = 0; i < DEFAULT_LAYERS.length; i++) {
        await upsertCalque({ nom: DEFAULT_LAYERS[i], ordre: i });
      }
    })().catch(() => {});
  }, [open, readOnly, calques.length, upsertCalque]);

  React.useEffect(() => {
    if (!activeCalqueId && calques.length > 0) setActiveCalqueId(calques[calques.length - 1].id);
  }, [calques, activeCalqueId]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (inspirationOpen) setInspirationOpen(false);
      else if (tool) setTool(null);
      else if (zoneDraw) setZoneDraw(false);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, tool, zoneDraw, inspirationOpen, onClose]);

  const bounds = React.useMemo<Array<[number, number]>>(() => {
    const pts: Array<[number, number]> = [];
    zones.forEach((z) =>
      (z.geometry?.coordinates?.[0] ?? []).forEach((c: [number, number]) => pts.push([c[1], c[0]])),
    );
    parcelles.forEach((p: any) => {
      const geom = p.geometry;
      const polys =
        geom?.type === 'MultiPolygon' ? geom.coordinates.flat() : geom?.coordinates ?? [];
      polys.forEach((ring: any) =>
        (ring || []).forEach((c: [number, number]) => pts.push([c[1], c[0]])),
      );
    });
    return pts;
  }, [zones, parcelles]);

  const objetCountByCalque = React.useMemo(() => {
    const m: Record<string, number> = {};
    objets.forEach((o) => {
      if (o.calque_id) m[o.calque_id] = (m[o.calque_id] || 0) + 1;
    });
    return m;
  }, [objets]);

  const vivantCounts = React.useMemo(() => {
    const byType = { flore: 0, faune: 0, champignons: 0, autres: 0 } as Record<VivantType, number>;
    let bio = 0;
    let visible = 0;
    waypoints.forEach((w) => {
      byType[typeOfWaypoint(w)] += 1;
      if (indicatorOf(w)) bio += 1;
      if (matchVivantFilter(w, vivantFilter)) visible += 1;
    });
    return { total: waypoints.length, visible, byType, bio };
  }, [waypoints, vivantFilter]);

  const selectedObjet = objets.find((o) => o.id === selectedObjetId) || null;

  /* ── Actions ─────────────────────────────────────────────────────────── */

  const handleDrawFinish = React.useCallback(
    async (geometry: any) => {
      if (zoneDraw) {
        onCreateZone(geometry, Math.round(geometryAreaM2(geometry)));
        setZoneDraw(false);
        return;
      }
      if (!tool) return;
      await upsertObjet({
        outil_key: tool.key,
        geometry,
        calque_id: activeCalqueId,
        zone_id: activeZoneId,
        nom: pendingInspiration ? pendingInspiration.titre : null,
        meta: pendingInspiration
          ? { inspiration: pendingInspiration.key, note: pendingInspiration.resume }
          : {},
        ordre: objets.length,
      });
      setPendingInspiration(null);
      if (tool.geom !== 'point') setTool(null);
    },
    [zoneDraw, tool, activeCalqueId, activeZoneId, pendingInspiration, objets.length, onCreateZone, upsertObjet],
  );

  const patchObjet = React.useCallback(
    (patch: any) => {
      if (!selectedObjet) return;
      upsertObjet({
        id: selectedObjet.id,
        outil_key: selectedObjet.outil_key,
        geometry: selectedObjet.geometry,
        calque_id: patch.calque_id !== undefined ? patch.calque_id : selectedObjet.calque_id,
        zone_id: patch.zone_id !== undefined ? patch.zone_id : selectedObjet.zone_id,
        nom: patch.nom !== undefined ? patch.nom : selectedObjet.nom,
        style: patch.style ?? selectedObjet.style,
        meta: patch.meta ?? selectedObjet.meta,
        ordre: selectedObjet.ordre,
      }).catch(() => {});
    },
    [selectedObjet, upsertObjet],
  );

  if (!open) return null;

  const drawGeom = zoneDraw ? 'polygon' : tool?.geom ?? null;
  const drawColor = zoneDraw
    ? ZONE_COLORS[zones.length % ZONE_COLORS.length]
    : tool?.color ?? '#2f7d4f';

  const tabBtn = (k: PanelTab, Icon: any, label: string) => (
    <button
      key={k}
      onClick={() => setTab(k)}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[9.5px] transition-colors ${
        tab === k
          ? 'bg-[hsl(var(--ds-forest))]/14 text-[hsl(var(--ds-forest-deep))]'
          : 'text-[hsl(var(--ds-forest-deep))]/55 hover:bg-[hsl(var(--ds-forest))]/6'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[3000] flex flex-col bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))]">
      {/* Barre de titre */}
      <header className="flex shrink-0 items-center gap-3 border-b border-[hsl(var(--ds-line))] px-3 py-2 md:px-5">
        <button
          onClick={() => setPanelOpen((v) => !v)}
          className="rounded-md p-1 opacity-60 hover:opacity-100"
          title={panelOpen ? 'Replier le panneau' : 'Déplier le panneau'}
        >
          {panelOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
        <div className="min-w-0">
          <h2 className="font-serif text-[15px] italic leading-tight md:text-[17px]">
            L’Atelier du jardin nourricier
          </h2>
          <p className="hidden text-[10.5px] opacity-55 md:block">
            Une palette par lieu, pas une pour la propriété.
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setInspirationOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-[11px] hover:border-[hsl(var(--ds-forest))]/60"
          >
            <Sparkles className="h-3.5 w-3.5" /> Inspirations
          </button>
          {!readOnly && (
            <button
              onClick={() => {
                setTool(null);
                setZoneDraw((v) => !v);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-all ${
                zoneDraw
                  ? 'border-transparent bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]'
                  : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/60'
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              {zoneDraw ? 'Tracez l’emplacement…' : 'Nouvel emplacement'}
            </button>
          )}
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest-deep))] px-3 py-1.5 text-[11px] text-[hsl(var(--ds-cream))] hover:opacity-90"
          >
            <X className="h-3.5 w-3.5" /> Fermer l’atelier
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Panneau latéral */}
        {panelOpen && (
          <aside className="flex w-[268px] shrink-0 flex-col border-r border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]">
            <div className="flex gap-0.5 border-b border-[hsl(var(--ds-line))]/70 px-1.5 py-1.5">
              {tabBtn('outils', Wrench, 'Outils')}
              {tabBtn('calques', LayersIcon, 'Calques')}
              {tabBtn('vivant', Leaf, 'Vivant')}
              {tabBtn('bilan', BarChart3, 'Bilan')}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {tab === 'outils' && (
                <ToolPalette
                  activeToolKey={tool?.key ?? null}
                  onPick={(t) => {
                    setZoneDraw(false);
                    setTool(t);
                    if (!t) setPendingInspiration(null);
                  }}
                />
              )}
              {tab === 'calques' && (
                <LayersPanel
                  calques={calques}
                  activeCalqueId={activeCalqueId}
                  onActivate={setActiveCalqueId}
                  onPatchCalque={(c, patch) =>
                    upsertCalque({ ...c, ...patch, id: c.id }).catch(() => {})
                  }
                  onDeleteCalque={(id) => {
                    deleteCalque(id).catch(() => {});
                    if (activeCalqueId === id) setActiveCalqueId(null);
                  }}
                  onCreateCalque={() =>
                    upsertCalque({
                      nom: `Calque ${calques.length + 1}`,
                      ordre: calques.length,
                    }).catch(() => {})
                  }
                  onMove={(c, dir) =>
                    upsertCalque({ ...c, id: c.id, ordre: c.ordre + dir }).catch(() => {})
                  }
                  zones={zones}
                  activeZoneId={activeZoneId}
                  onSelectZone={onSelectZone}
                  onPatchZone={onPatchZone}
                  onDeleteZone={onDeleteZone}
                  onTransformZone={(id) => {
                    const z = zones.find((zz) => zz.id === id);
                    if (z) zoneTransform.start(z);
                  }}
                  onRedrawZone={(id) => {
                    onSelectZone(id);
                    setZoneDraw(true);
                  }}
                  system={system}
                  onSystem={(p) => setSystem((s) => ({ ...s, ...p }))}
                  scopeCounts={scopeCounts}
                  objetCountByCalque={objetCountByCalque}
                  readOnly={readOnly}
                />
              )}
              {tab === 'vivant' && (
                <LivingFilterPanel
                  filter={vivantFilter}
                  onChange={setVivantFilter}
                  counts={vivantCounts}
                />
              )}
              {tab === 'bilan' && <PlanBalanceSheet objets={objets} />}
            </div>
          </aside>
        )}

        {/* Carte */}
        <div className="relative min-w-0 flex-1">
          <RichMap
            center={center ?? [45.0, 0.5]}
            zoom={18}
            bounds={bounds.length > 1 ? bounds : undefined}
            fitMaxZoom={19}
            fitPadding={[60, 60]}
            controls={{ zoom: true, style: true, geolocate: true, cadastre: true }}
            maxZoom={22}
            scrollWheelZoom={!drawGeom}
            height="100%"
          >
            <MapViewReporter onChange={onViewChange} />
            {zoneTransform.zone && (
              <ZoneTransformLayer
                ring={zoneTransform.ring}
                color={
                  zoneTransform.zone.couleur ||
                  ZONE_COLORS[
                    Math.max(0, zones.findIndex((z) => z.id === zoneTransform.zone!.id)) %
                      ZONE_COLORS.length
                  ]
                }
                onGestureStart={zoneTransform.pushHistory}
                onPreview={zoneTransform.preview}
              />
            )}
            <InlineGpsCurationLayer curation={inlineGps} />

            {system.parcelles &&
              parcelles.map((p: any) => (
                <GeoJSON
                  key={`parc-${p.id}`}
                  data={p.geometry as any}
                  style={{
                    color: '#2f5d3a',
                    weight: 1.6,
                    opacity: 0.7,
                    fillOpacity: 0.04,
                    dashArray: '4 4',
                  }}
                />
              ))}

            {system.zones &&
              zones.map((z, i) => {
                if (!z.visible || z.id === zoneTransform.zone?.id) return null;
                const color = z.couleur || ZONE_COLORS[i % ZONE_COLORS.length];
                const active = z.id === activeZoneId;
                const ring = (z.geometry?.coordinates?.[0] ?? []).map((c: [number, number]) => [
                  c[1],
                  c[0],
                ]);
                if (ring.length < 3) return null;
                return (
                  <Polygon
                    key={z.id}
                    positions={ring as any}
                    pathOptions={{
                      color,
                      weight: active ? 3.5 : 2,
                      fillColor: color,
                      fillOpacity: (active ? 0.3 : 0.14) * (z.opacite ? z.opacite / 0.18 : 1) * 0.9,
                    }}
                    eventHandlers={{ click: () => onSelectZone(active ? null : z.id) }}
                  >
                    <Tooltip sticky>
                      <span style={{ fontSize: 11 }}>
                        {z.nom}
                        {z.surface_m2 ? ` · ${fmtArea(z.surface_m2)}` : ''}
                      </span>
                    </Tooltip>
                  </Polygon>
                );
              })}

            {system.vivant && (
              <LivingLayer
                waypoints={waypoints.filter((w) => w.id !== inlineGps.target?.id)}
                filter={vivantFilter}
                frenchName={frenchName}
                canCurate={!!canCurate}
                onZoomPhoto={setLightboxId}
                onStartInlineMove={(w) => inlineGps.start(w)}
                onOpenGps={(w) => {
                  setGpsFocusId(w.id);
                  setGpsConsole(true);
                }}
              />

            )}

            <ObjectsLayer
              objets={objets}
              calques={calques}
              selectedId={selectedObjetId}
              onSelect={setSelectedObjetId}
              timeIndex={timeIndex}
            />

            {!readOnly && (
              <DrawLayer
                geom={drawGeom as any}
                color={drawColor}
                freehand={zoneDraw}
                onFinish={handleDrawFinish}
              />
            )}
          </RichMap>

          <InlineGpsBar curation={inlineGps} />

          <ZoneTransformBar
            api={zoneTransform}
            color={
              zoneTransform.zone?.couleur ||
              ZONE_COLORS[
                Math.max(0, zones.findIndex((z) => z.id === zoneTransform.zone?.id)) %
                  ZONE_COLORS.length
              ]
            }
          />

          {/* Bandeau de guidage */}
          {(drawGeom || pendingInspiration) && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex justify-center p-3">
              <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-[hsl(var(--ds-forest-deep))]/95 px-4 py-2 text-[11px] text-[hsl(var(--ds-cream))] shadow-lg backdrop-blur">
                <span className="font-semibold tracking-wide">
                  {zoneDraw
                    ? 'Tracez le contour d’un doigt — relâchez pour fermer.'
                    : tool?.geom === 'point'
                      ? `${tool.glyph} ${tool.label} : cliquez pour poser.`
                      : `${tool?.glyph} ${tool?.label} : cliquez les sommets, double-clic pour terminer.`}
                </span>
                <button
                  onClick={() => {
                    setZoneDraw(false);
                    setTool(null);
                    setPendingInspiration(null);
                  }}
                  className="rounded-full bg-white/15 px-2 py-0.5 hover:bg-white/25"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Curseur temporel */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] flex justify-center p-3">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 px-4 py-2 shadow-lg backdrop-blur">
              <Clock className="h-3.5 w-3.5 opacity-55" />
              {TIME_STEPS.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => setTimeIndex(i)}
                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] transition-all ${
                    timeIndex === i
                      ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                      : 'hover:bg-[hsl(var(--ds-forest))]/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <span className="hidden max-w-[280px] text-[10px] italic opacity-60 md:block">
                {TIME_STEPS[timeIndex].tag}
              </span>
            </div>
          </div>

          {/* Inspecteur */}
          {selectedObjet && (
            <div className="absolute right-3 top-3 z-[600] w-[262px]">
              <ObjectInspector
                objet={selectedObjet}
                calques={calques}
                zones={zones}
                onPatch={patchObjet}
                onClose={() => setSelectedObjetId(null)}
                onDelete={() => {
                  deleteObjet(selectedObjet.id).catch(() => {});
                  setSelectedObjetId(null);
                }}
                onDuplicate={() =>
                  upsertObjet({
                    outil_key: selectedObjet.outil_key,
                    geometry: selectedObjet.geometry,
                    calque_id: selectedObjet.calque_id,
                    zone_id: selectedObjet.zone_id,
                    nom: selectedObjet.nom ? `${selectedObjet.nom} (copie)` : null,
                    style: selectedObjet.style,
                    meta: selectedObjet.meta,
                    ordre: objets.length,
                  }).catch(() => {})
                }
                readOnly={readOnly}
              />
            </div>
          )}
        </div>

        <InspirationDrawer
          open={inspirationOpen}
          onClose={() => setInspirationOpen(false)}
          onUse={(card) => {
            const t = TOOL_BY_KEY[card.toolKey];
            if (!t) return;
            setZoneDraw(false);
            setTool(t);
            setPendingInspiration(card);
            setInspirationOpen(false);
            setTab('outils');
          }}
        />

        {/* Fiche espèce : visionneuse photo plein écran (au-dessus de l'atelier) */}
        {lightboxId && (
          <div className="fixed inset-0 z-[2100]">
            <RevealPhotoLightbox
              items={visibleWaypoints}
              currentId={lightboxId}
              onChange={setLightboxId}
              onClose={() => setLightboxId(null)}
              displayNameFor={displayNameFor}
            />
          </div>
        )}

        {/* Contrôle GPS : mêmes gestes de curation que la Carte des révélations */}
        {canCurate && gpsConsole && (
          <GpsControlConsole
            open={gpsConsole}
            onClose={() => {
              setGpsConsole(false);
              setGpsFocusId(null);
            }}
            proprieteId={proprieteId}
            candidates={allCandidates}
            contextCandidates={visibleWaypoints}
            contextLabel={`Atelier · ${visibleWaypoints.length} observation${visibleWaypoints.length > 1 ? 's' : ''} affichée${visibleWaypoints.length > 1 ? 's' : ''}`}
            parcelRings={fence.rings}
            initialZoom={view?.zoom}
            center={gpsCenter}
            focusId={gpsFocusId}
            displayNameFor={displayNameFor}
          />
        )}

      </div>
    </div>,
    document.body,
  );
};

export default PaletteStudio;
