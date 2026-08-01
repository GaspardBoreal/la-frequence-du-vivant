import React from 'react';
import { createPortal } from 'react-dom';
import { useMap, useMapEvents, CircleMarker } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { X, Clock, Layers, Trash2, Sprout, Loader2, Maximize2, Save } from 'lucide-react';
import { toast } from 'sonner';

import RichMap from '@/components/maps/RichMap';
import ZoomScaleBadge from '@/components/maps/controls/ZoomScaleBadge';
import { fullscreenSurfaces } from '@/lib/uiOverlayLevel';

import { useProprieteObjets, type ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { useWaypointFrenchNames } from '@/hooks/propriete/useWaypointFrenchNames';
import { useOuvrageScenarios, type Planting } from '@/hooks/propriete/useOuvrageScenarios';
import { useProprieteScenarios } from '@/hooks/propriete/useProprieteScenarios';
import { useInatThumbs } from '@/hooks/propriete/useInatThumbs';
import { classifyObservations, EDGE_TOLERANCE_M } from '@/lib/ouvrageScope';
import { geometryAreaM2, geometryCenter, fmtArea } from '@/components/propriete/palette/studio/geoMetrics';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import { STRATES, STRATE_ORDER, parseStrate, spreadFor, type Strate } from '@/lib/plantSpread';

import HerbierPanel, { type HerbierEntry } from './HerbierPanel';
import HerbierScopePicker, { type ScopeMode } from './HerbierScopePicker';
import HerbierRigourPicker, { type Rigour } from './HerbierRigourPicker';

import PanelResizer from './PanelResizer';
import PlantingLayer from './PlantingLayer';
import OuvrageGeometryLayer from './OuvrageGeometryLayer';
import OuvrageSwitcher from './OuvrageSwitcher';
import BalanceBar from './BalanceBar';
import ScenarioTabs from './ScenarioTabs';
import type { ScenographeProposal } from './scenographeStore';

const GROWTH_STEPS = [
  { label: 'An 0', factor: 0.35, tag: 'La plantation — les mottes, les vides, la patience.' },
  { label: 'An 3', factor: 0.7, tag: 'Les strates basses se referment, le sol se couvre.' },
  { label: 'An 10', factor: 1, tag: 'L’ouvrage a pris son ampleur : c’est le plan vrai.' },
];

const uid = () => `pl_${Math.random().toString(36).slice(2, 10)}`;

/** Capture l'instance Leaflet pour le glisser-déposer depuis l'herbier. */
const MapGrab: React.FC<{ onMap: (m: LeafletMap) => void }> = ({ onMap }) => {
  const map = useMap();
  React.useEffect(() => {
    onMap(map);
  }, [map, onMap]);
  return null;
};

const ClickToPlace: React.FC<{ enabled: boolean; onPlace: (lat: number, lng: number) => void }> = ({
  enabled,
  onPlace,
}) => {
  useMapEvents({
    click: (e) => {
      if (enabled) onPlace(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface Props {
  proprieteId: string;
  objetId: string;
  proposals: ScenographeProposal[];
  /** Scénario à rouvrir précisément (bibliothèque / registre). */
  initialScenarioId?: string | null;
  onClose: () => void;
}

/**
 * Le Scénographe d'ouvrage : composer un aménagement en posant de vraies
 * espèces, à la vraie échelle, sur l'emprise réelle du lieu. Ce que l'on
 * dessine ici n'est pas un croquis mais une hypothèse mesurable.
 */
export const ScenographeFullscreen: React.FC<Props> = ({
  proprieteId,
  objetId: initialObjetId,
  proposals,
  initialScenarioId,
  onClose,
}) => {
  /** L'ouvrage travaillé : modifiable sans quitter le plan. */
  const [objetId, setObjetId] = React.useState(initialObjetId);
  React.useEffect(() => setObjetId(initialObjetId), [initialObjetId]);

  const { objets, upsertObjet } = useProprieteObjets(proprieteId);
  const { scenarios: allScenarios } = useProprieteScenarios(proprieteId);
  const scenarioCounts = React.useMemo(() => {
    const m: Record<string, number> = {};
    allScenarios.forEach((s) => {
      m[s.objet_id] = (m[s.objet_id] || 0) + 1;
    });
    return m;
  }, [allScenarios]);
  const objet: ProprieteObjet | undefined = React.useMemo(
    () => (objets || []).find((o: ProprieteObjet) => o.id === objetId),
    [objets, objetId],
  );

  const { waypoints } = usePropertySpeciesPool(proprieteId);
  const { displayNameFor } = useWaypointFrenchNames(waypoints as any);
  const scen = useOuvrageScenarios(proprieteId, objetId);

  /* Carnet photo des ouvrages — même source et même visionneuse que l'Atelier. */
  const objetPhotos = useObjetPhotos(proprieteId);
  const [galleryObjetId, setGalleryObjetId] = React.useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = React.useState(0);
  const galleryPhotos = React.useMemo(
    () => (galleryObjetId ? objetPhotos.byObjet.get(galleryObjetId) ?? [] : []),
    [galleryObjetId, objetPhotos.byObjet],
  );
  const galleryTitle = React.useMemo(() => {
    const o = (objets || []).find((x: ProprieteObjet) => x.id === galleryObjetId);
    return o ? o.nom || TOOL_BY_KEY[o.outil_key]?.label || 'Ouvrage' : '';
  }, [galleryObjetId, objets]);
  const photoThumbs = React.useMemo(() => {
    const m: Record<string, string | undefined> = {};
    objetPhotos.byObjet.forEach((list, id) => {
      m[id] = list[0]?.url;
    });
    return m;
  }, [objetPhotos.byObjet]);
  const openGallery = React.useCallback((id: string) => {
    setGalleryIndex(0);
    setGalleryObjetId(id);
  }, []);


  /** Rouvrir exactement la variante cliquée dans la bibliothèque. */
  const appliedInitial = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!initialScenarioId || appliedInitial.current === initialScenarioId) return;
    if (!scen.scenarios.some((s) => s.id === initialScenarioId)) return;
    appliedInitial.current = initialScenarioId;
    scen.setActiveId(initialScenarioId);
  }, [initialScenarioId, scen]);

  const [ouvrageCardOpen, setOuvrageCardOpen] = React.useState(false);
  const [growthIdx, setGrowthIdx] = React.useState(1);
  const [armed, setArmed] = React.useState<HerbierEntry | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(true);
  const [panelWidth, setPanelWidth] = React.useState<number>(() => {
    const v = Number(localStorage.getItem('scenographe:panelWidth'));
    return Number.isFinite(v) && v >= 240 ? v : 290;
  });
  React.useEffect(() => {
    localStorage.setItem('scenographe:panelWidth', String(panelWidth));
  }, [panelWidth]);
  const [scopeMode, setScopeMode] = React.useState<ScopeMode>('courant');
  const [scopeIds, setScopeIds] = React.useState<string[]>([]);

  /**
   * Rigueur du périmètre : par défaut on s'en tient à l'emprise dessinée.
   * Le réglage suit l'ouvrage (un massif fin et un verger ne se lisent pas
   * avec la même tolérance).
   */
  const [rigour, setRigour] = React.useState<Rigour>('strict');
  const [neighbourM, setNeighbourM] = React.useState(5);
  React.useEffect(() => {
    const raw = localStorage.getItem(`scenographe:rigour:${objetId}`);
    if (raw === 'strict' || raw === 'lisiere' || raw === 'voisinage') setRigour(raw);
    else setRigour('strict');
    const m = Number(localStorage.getItem(`scenographe:neighbourM:${objetId}`));
    setNeighbourM(Number.isFinite(m) && m >= 1 && m <= 15 ? m : 5);
  }, [objetId]);
  React.useEffect(() => {
    localStorage.setItem(`scenographe:rigour:${objetId}`, rigour);
    localStorage.setItem(`scenographe:neighbourM:${objetId}`, String(neighbourM));
  }, [objetId, rigour, neighbourM]);

  /** Espèce survolée dans l'herbier : ses points pulsent sur le plan. */
  const [hovered, setHovered] = React.useState<HerbierEntry | null>(null);

  const mapRef = React.useRef<LeafletMap | null>(null);
  const handleMapReady = React.useCallback((m: LeafletMap) => {
    mapRef.current = m;
  }, []);



  React.useEffect(() => {
    fullscreenSurfaces.push();
    return () => fullscreenSurfaces.pop();
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (armed) setArmed(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [armed, onClose]);

  /** Changer d'ouvrage : le plan, l'herbier et les scénarios suivent. */
  const switchOuvrage = React.useCallback(
    (id: string) => {
      if (id === objetId) return;
      setObjetId(id);
      setSelected(null);
      setArmed(null);
      setOuvrageCardOpen(false);
      appliedInitial.current = null;
    },
    [objetId],
  );

  const geometry = objet?.geometry;
  const areaM2 = React.useMemo(() => (geometry ? geometryAreaM2(geometry) : 0), [geometry]);
  const center = React.useMemo(() => (geometry ? geometryCenter(geometry) : null), [geometry]);
  const bounds = React.useMemo<Array<[number, number]> | undefined>(() => {
    if (!geometry) return undefined;
    const cs: Array<[number, number]> =
      geometry.type === 'Polygon'
        ? geometry.coordinates?.[0] ?? []
        : geometry.type === 'LineString'
          ? geometry.coordinates ?? []
          : geometry.coordinates
            ? [geometry.coordinates]
            : [];
    return cs.length ? cs.map((c) => [c[1], c[0]] as [number, number]) : undefined;
  }, [geometry]);

  /** Ouvrages écoutés selon la portée choisie. */
  const scopedObjets = React.useMemo<ProprieteObjet[]>(() => {
    const all = (objets || []) as ProprieteObjet[];
    if (scopeMode === 'tous') return all.filter((o) => o.geometry);
    const keep = new Set<string>([objetId, ...(scopeMode === 'choisis' ? scopeIds : [])]);
    return all.filter((o) => keep.has(o.id) && o.geometry);
  }, [objets, objetId, scopeMode, scopeIds]);

  /**
   * Espèces déjà présentes, classées par rapport à la géométrie réelle.
   * On calcule les trois zones une fois, le curseur de rigueur ne fait
   * ensuite que choisir jusqu'où l'on écoute.
   */
  const inPlaceZoned = React.useMemo(() => {
    const empty = { dedans: [] as HerbierEntry[], lisiere: [] as HerbierEntry[], voisinage: [] as HerbierEntry[] };
    if (!scopedObjets.length) return empty;
    const multi = scopedObjets.length > 1;
    const by = new Map<string, HerbierEntry>();
    scopedObjets.forEach((o) => {
      const label = o.nom?.trim() || TOOL_BY_KEY[o.outil_key]?.label || 'Ouvrage';
      const scope = classifyObservations(o.geometry, waypoints as any, neighbourM, EDGE_TOLERANCE_M);
      [...scope.dedans, ...scope.lisiere, ...scope.voisinage].forEach(({ item, zone, distanceM }: any) => {
        if (!item.scientificName) return;
        const prev = by.get(item.scientificName);
        if (prev) {
          prev.observations = (prev.observations || 0) + 1;
          if (!prev.photoUrl && item.photoUrl) prev.photoUrl = item.photoUrl;
          // Une espèce vue à la fois dedans et en lisière est « dedans ».
          if (distanceM < (prev.distanceM ?? Infinity)) {
            prev.distanceM = distanceM;
            prev.zone = zone;
          }
          if (Number.isFinite(item.lat) && Number.isFinite(item.lng))
            prev.points = [...(prev.points || []), { lat: item.lat, lng: item.lng }];
          return;
        }
        by.set(item.scientificName, {
          key: `place:${item.scientificName}`,
          scientificName: item.scientificName,
          commonNameFr: displayNameFor({
            scientificName: item.scientificName,
            commonName: item.commonName ?? null,
          }),
          strate: 'herbacee',
          spreadM: STRATES.herbacee.spreadM,
          origin: 'place',
          photoUrl: item.photoUrl || null,
          observations: 1,
          ouvrageNom: multi ? label : null,
          zone,
          distanceM,
          points:
            Number.isFinite(item.lat) && Number.isFinite(item.lng)
              ? [{ lat: item.lat, lng: item.lng }]
              : [],
        });
      });
    });
    const out = { ...empty };
    Array.from(by.values())
      .sort((a, b) => (b.observations || 0) - (a.observations || 0))
      .forEach((e) => out[(e.zone || 'dedans') as keyof typeof out].push(e));
    return out;
  }, [scopedObjets, waypoints, displayNameFor, neighbourM]);

  const rigourCounts = React.useMemo(
    () => ({
      dedans: inPlaceZoned.dedans.length,
      lisiere: inPlaceZoned.lisiere.length,
      voisinage: inPlaceZoned.voisinage.length,
    }),
    [inPlaceZoned],
  );

  const inPlaceEntries = React.useMemo<HerbierEntry[]>(() => {
    const out = [...inPlaceZoned.dedans];
    if (rigour !== 'strict') out.push(...inPlaceZoned.lisiere);
    if (rigour === 'voisinage') out.push(...inPlaceZoned.voisinage);
    return out;
  }, [inPlaceZoned, rigour]);



  const proposalNames = React.useMemo(
    () => proposals.map((p) => p.scientificName).filter(Boolean),
    [proposals],
  );
  const { map: thumbs } = useInatThumbs(proposalNames);

  const proposedEntries = React.useMemo<HerbierEntry[]>(
    () =>
      proposals.map((p) => {
        const strate: Strate = p.strate || parseStrate(null);
        const thumb = thumbs.get(p.scientificName);
        return {
          key: `prop:${p.scientificName}`,
          scientificName: p.scientificName,
          commonNameFr: p.commonNameFr || thumb?.commonName || null,
          strate,
          spreadM: spreadFor(strate, p.heightM ?? null),
          origin: 'proposee' as const,
          photoUrl: thumb?.photoUrl || null,
          functions: p.functions,
          note: p.note,
        };
      }),
    [proposals, thumbs],
  );

  const plantings = scen.active?.plantings ?? [];

  const placedCount = React.useMemo(() => {
    const m: Record<string, number> = {};
    plantings.forEach((p) => {
      const k = `${p.origin === 'place' ? 'place' : p.origin === 'proposee' ? 'prop' : 'libre'}:${p.scientificName}`;
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [plantings]);

  const savePlantings = React.useCallback(
    async (next: Planting[]) => {
      if (scen.active) {
        await scen.patch(scen.active.id, { plantings: next });
      } else {
        await scen.create(next);
      }
    },
    [scen],
  );

  const place = React.useCallback(
    (entry: HerbierEntry, lat: number, lng: number) => {
      const p: Planting = {
        id: uid(),
        scientificName: entry.scientificName,
        commonNameFr: entry.commonNameFr ?? null,
        lat,
        lng,
        spreadM: entry.spreadM,
        strate: entry.strate,
        origin: entry.origin,
        photoUrl: entry.photoUrl ?? null,
        functions: entry.functions,
        note: entry.note ?? null,
      };
      void savePlantings([...plantings, p]);
      setSelected(p.id);
    },
    [plantings, savePlantings],
  );

  /** Pose en une fois toutes les espèces filtrées, à leur position observée. */
  const placeMany = React.useCallback(
    (entries: HerbierEntry[]) => {
      const fallback = center;
      const next: Planting[] = [];
      entries.forEach((entry) => {
        const pts = entry.points?.length
          ? entry.points
          : fallback
            ? [{ lat: fallback[0], lng: fallback[1] }]
            : [];
        pts.forEach((pt) => {
          next.push({
            id: uid(),
            scientificName: entry.scientificName,
            commonNameFr: entry.commonNameFr ?? null,
            lat: pt.lat,
            lng: pt.lng,
            spreadM: entry.spreadM,
            strate: entry.strate,
            origin: entry.origin,
            photoUrl: entry.photoUrl ?? null,
            functions: entry.functions,
            note: entry.note ?? null,
          });
        });
      });
      if (!next.length) return;
      void savePlantings([...plantings, ...next]);
      toast.success(`${next.length} sujet${next.length > 1 ? 's' : ''} posé${next.length > 1 ? 's' : ''}`, {
        description: `${entries.length} espèce${entries.length > 1 ? 's' : ''} à leur position observée.`,
      });
    },
    [plantings, savePlantings, center],
  );

  const removeMany = React.useCallback(
    (entries: HerbierEntry[]) => {
      const names = new Set(entries.map((e) => e.scientificName));
      const next = plantings.filter((p) => !names.has(p.scientificName));
      const removed = plantings.length - next.length;
      if (!removed) return;
      void savePlantings(next);
      setSelected(null);
      toast.success(`${removed} sujet${removed > 1 ? 's' : ''} retiré${removed > 1 ? 's' : ''} du plan`);
    },
    [plantings, savePlantings],
  );

  const patchPlanting = (id: string, patch: Partial<Planting>) =>
    void savePlantings(plantings.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removePlanting = (id: string) => {
    void savePlantings(plantings.filter((p) => p.id !== id));
    setSelected(null);
  };

  const growth = GROWTH_STEPS[growthIdx].factor;
  const tool = objet ? TOOL_BY_KEY[objet.outil_key] : null;
  const sel = plantings.find((p) => p.id === selected) || null;

  const body = (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-[hsl(var(--ds-forest-deep))]">
      {/* Bandeau : l'identité de l'ouvrage et les variantes du projet */}
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-[hsl(var(--ds-forest-deep))] px-4 py-2.5 text-white">
        <span className="flex items-center gap-2">
          <span className="text-[18px]">{tool?.glyph ?? '🌿'}</span>
          <span className="leading-tight">
            <span className="block text-[9.5px] uppercase tracking-[0.16em] opacity-55">
              Scénographe d’ouvrage
            </span>
            <span className="block text-[13px] font-semibold">
              {objet?.nom?.trim() || tool?.label || 'Ouvrage'}
              {areaM2 > 0 && <span className="ml-2 text-[10.5px] font-normal opacity-60">{fmtArea(areaM2)}</span>}
            </span>
          </span>
        </span>

        <OuvrageSwitcher
          objets={(objets || []) as any}
          activeId={objetId}
          counts={scenarioCounts}
          onSelect={switchOuvrage}
        />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ScenarioTabs
            scenarios={scen.scenarios}
            activeId={scen.activeId}
            onSelect={scen.setActiveId}
            onCreate={() => void scen.create([])}
            onDuplicate={scen.duplicate}
            onDelete={scen.remove}
            onRetenu={scen.setRetenu}
            onRename={(id, nom) => void scen.patch(id, { nom })}
          />
          <button
            onClick={onClose}
            aria-label="Fermer le Scénographe"
            className="rounded-full p-1.5 opacity-70 transition-opacity hover:bg-white/10 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Herbier */}
        {panelOpen && (
          <>
            <aside
              style={{ width: panelWidth }}
              className="hidden shrink-0 flex-col border-r border-[hsl(var(--ds-line))]/60 bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] md:flex"
            >
              <HerbierPanel
                inPlace={inPlaceEntries}
                proposed={proposedEntries}
                armedKey={armed?.key ?? null}
                onArm={setArmed}
                placedCount={placedCount}
                onAddFree={(e) => setArmed(e)}
                wide={panelWidth >= 430}
                onPlaceMany={placeMany}
                onRemoveMany={removeMany}
                scopeControl={
                  <HerbierScopePicker
                    objets={(objets || []) as any}
                    currentId={objetId}
                    mode={scopeMode}
                    selectedIds={scopeIds}
                    onMode={setScopeMode}
                    onSelected={setScopeIds}
                  />
                }
                rigourControl={
                  <HerbierRigourPicker
                    value={rigour}
                    onChange={setRigour}
                    neighbourM={neighbourM}
                    onNeighbourM={setNeighbourM}
                    counts={rigourCounts}
                  />
                }
                onHoverEntry={setHovered}
              />

            </aside>
            <PanelResizer
              width={panelWidth}
              onChange={setPanelWidth}
              onReset={() => setPanelWidth(290)}
            />
          </>
        )}


        {/* Plan */}
        <main
          className="relative min-w-0 flex-1"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const raw = e.dataTransfer.getData('application/x-scenographe');
            const map = mapRef.current;
            if (!raw || !map) return;
            try {
              const entry = JSON.parse(raw) as HerbierEntry;
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const ll = map.containerPointToLatLng([e.clientX - rect.left, e.clientY - rect.top] as any);
              place(entry, ll.lat, ll.lng);
            } catch {
              /* payload illisible : on ignore */
            }
          }}
        >
          <div className={`h-full w-full ${armed ? 'cursor-crosshair' : ''}`}>
            <RichMap
              center={center ?? [46.6, 2.5]}
              bounds={bounds}
              fitPadding={[70, 70]}
              fitMaxZoom={23}
              zoom={20}
              maxZoom={24}
              initialStyle="satellite"
              controls={{ zoom: true, style: true, geolocate: false, cadastre: true }}
              height="100%"
            >
              <MapGrab onMap={handleMapReady} />
              <ZoomScaleBadge nativeMaxZoom={21} />
              <ClickToPlace
                enabled={!!armed}
                onPlace={(lat, lng) => armed && place(armed, lat, lng)}
              />
              <OuvrageGeometryLayer
                objets={(objets || []) as any}
                activeId={objetId}
                activePlantings={plantings.length}
                placing={!!armed}
                onSelectOuvrage={switchOuvrage}
                onSelectSelf={() => setOuvrageCardOpen(true)}
              />
              <PlantingLayer
                plantings={plantings}
                growth={growth}
                selectedId={selected}
                onSelect={setSelected}
                onMove={(id, lat, lng) => patchPlanting(id, { lat, lng })}
              />
              {/* Survol de l'herbier : on montre où l'espèce a réellement été vue. */}
              {(hovered?.points || []).map((pt, i) => (
                <CircleMarker
                  key={`hov-${i}`}
                  center={[pt.lat, pt.lng]}
                  radius={9}
                  pathOptions={{
                    color: '#c8a24a',
                    weight: 2,
                    fillColor: '#c8a24a',
                    fillOpacity: 0.25,
                    interactive: false,
                  }}
                />
              ))}

            </RichMap>
          </div>

          {/* Horloge du vivant */}
          <div className="pointer-events-auto absolute bottom-4 left-1/2 z-[1000] w-[min(420px,92%)] -translate-x-1/2 rounded-2xl border border-white/15 bg-[hsl(var(--ds-forest-deep))]/92 px-4 py-2.5 text-white shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 opacity-70" />
              {GROWTH_STEPS.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => setGrowthIdx(i)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${
                    growthIdx === i ? 'bg-[#c8a24a] text-white' : 'opacity-55 hover:opacity-90'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <span className="ml-auto text-[9.5px] tabular-nums opacity-50">
                {plantings.length} sujet{plantings.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="mt-1 text-[10px] italic leading-snug opacity-60">{GROWTH_STEPS[growthIdx].tag}</p>
          </div>

          {/* Fiche du sujet sélectionné */}
          {sel && (
            <div className="absolute right-3 top-3 z-[1000] w-[236px] rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/96 p-3 text-[hsl(var(--ds-forest-deep))] shadow-2xl backdrop-blur">
              <div className="flex items-start gap-2">
                {sel.photoUrl ? (
                  <img src={sel.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--ds-forest))]/12 text-[16px]">
                    {STRATES[sel.strate].glyph}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-semibold">
                    {sel.commonNameFr || sel.scientificName}
                  </span>
                  <span className="block truncate text-[10px] italic opacity-55">{sel.scientificName}</span>
                </span>
                <button onClick={() => setSelected(null)} className="opacity-50 hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <label className="mt-2.5 block text-[9.5px] font-semibold uppercase tracking-wide opacity-55">
                Strate
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {STRATE_ORDER.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      patchPlanting(sel.id, { strate: s, spreadM: STRATES[s].spreadM })
                    }
                    className="rounded-full px-1.5 py-0.5 text-[9.5px] font-medium"
                    style={{
                      backgroundColor: sel.strate === s ? STRATES[s].color : `${STRATES[s].color}20`,
                      color: sel.strate === s ? '#fff' : STRATES[s].color,
                    }}
                  >
                    {STRATES[s].glyph}
                  </button>
                ))}
              </div>

              <label className="mt-2.5 flex items-center justify-between text-[9.5px] font-semibold uppercase tracking-wide opacity-55">
                Envergure adulte
                <span className="tabular-nums opacity-80">Ø {sel.spreadM.toFixed(1)} m</span>
              </label>
              <input
                type="range"
                min={0.2}
                max={12}
                step={0.1}
                value={sel.spreadM}
                onChange={(e) => patchPlanting(sel.id, { spreadM: Number(e.target.value) })}
                className="mt-1 w-full accent-[#c8a24a]"
              />

              <button
                onClick={() => removePlanting(sel.id)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#c1663f]/40 py-1.5 text-[10.5px] font-medium text-[#c1663f] transition-colors hover:bg-[#c1663f]/10"
              >
                <Trash2 className="h-3 w-3" />
                Retirer du plan
              </button>
            </div>
          )}

          {/* Fiche de l'ouvrage désigné sur le plan */}
          {ouvrageCardOpen && objet && (
            <div className="absolute right-3 top-3 z-[1001] w-[236px] rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/96 p-3 text-[hsl(var(--ds-forest-deep))] shadow-2xl backdrop-blur">
              <div className="flex items-start gap-2">
                <span className="text-[16px]">{tool?.glyph ?? '🌿'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[9px] uppercase tracking-[0.16em] opacity-50">
                    Ouvrage
                  </span>
                  <input
                    value={objet.nom || ''}
                    onChange={(e) => void upsertObjet({ ...(objet as any), nom: e.target.value })}
                    placeholder={tool?.label || 'Ouvrage'}
                    className="w-full rounded border border-transparent bg-transparent text-[11.5px] font-semibold outline-none focus:border-[hsl(var(--ds-line))] focus:bg-white"
                  />
                </span>
                <button onClick={() => setOuvrageCardOpen(false)} className="opacity-50 hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 text-[10.5px] tabular-nums opacity-70">
                {areaM2 > 0 ? fmtArea(areaM2) : '—'} · {plantings.length} sujet
                {plantings.length > 1 ? 's' : ''} posé{plantings.length > 1 ? 's' : ''} ·{' '}
                {scen.scenarios.length} scénographie{scen.scenarios.length > 1 ? 's' : ''}
              </p>
              <p className="mt-1.5 text-[9.5px] italic leading-snug opacity-55">
                Cliquez une emprise voisine pour composer un autre ouvrage.
              </p>
            </div>
          )}

          {/* Herbier mobile */}
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full border border-white/15 bg-[hsl(var(--ds-forest-deep))]/90 px-3 py-1.5 text-[10.5px] font-medium text-white shadow-lg backdrop-blur md:hidden"
          >
            <Layers className="h-3.5 w-3.5" />
            Herbier
          </button>
        </main>
      </div>

      {/* Herbier en tiroir sur mobile */}
      {panelOpen && (
        <div className="max-h-[42vh] shrink-0 overflow-hidden border-t border-[hsl(var(--ds-line))]/60 bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] md:hidden">
          <HerbierPanel
            inPlace={inPlaceEntries}
            proposed={proposedEntries}
            armedKey={armed?.key ?? null}
            onArm={setArmed}
            placedCount={placedCount}
            onAddFree={(e) => setArmed(e)}
            onPlaceMany={placeMany}
            onRemoveMany={removeMany}
            scopeControl={
              <HerbierScopePicker
                objets={(objets || []) as any}
                currentId={objetId}
                mode={scopeMode}
                selectedIds={scopeIds}
                onMode={setScopeMode}
                onSelected={setScopeIds}
              />
            }
          />

        </div>
      )}

      <BalanceBar plantings={plantings} areaM2={areaM2} growth={growth} />

      {!objet && (
        <div className="absolute inset-0 z-[3100] flex items-center justify-center bg-[hsl(var(--ds-forest-deep))]/85 text-white">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement de l’ouvrage…
        </div>
      )}
    </div>
  );

  return createPortal(body, document.body);
};

export default ScenographeFullscreen;
