import React, { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GeoJSON, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Layers,
  Info,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { RichMap } from '@/components/maps';
import {
  useProprieteParcelles,
  useCanCurateParcelles,
  useUpsertParcelle,
  useDeleteParcelle,
  useUpdateParcelleNote,
  centroidOfParcelles,
  type ProprieteParcelle,
} from '@/hooks/propriete/usePropertyParcelles';
import { useLexiconParcelWithGeometryAt } from '@/components/cadastre/useLexiconParcels';
import { extractParcelInfo, geometryCentroid } from '@/components/cadastre/cadastreUtils';
import { geocodeAddress } from '@/utils/geocoding';
import WeatherStationsLayer from '@/components/community/exploration/WeatherStationsLayer';
import CadastreOptionsMenu, {
  type CadastreOptionsState,
} from './CadastreOptionsMenu';
import PropertyAddressCard from './PropertyAddressCard';
import NearestWeatherStationCard from './NearestWeatherStationCard';

const SAVED_STYLE: L.PathOptions = {
  color: '#2f5d3a',
  weight: 3,
  opacity: 0.95,
  fillColor: '#2f5d3a',
  fillOpacity: 0.28,
};

const HOVER_STYLE: L.PathOptions = {
  color: '#e94560',
  weight: 3,
  opacity: 1,
  fillColor: '#fbbf24',
  fillOpacity: 0.35,
  dashArray: '4 4',
};

const DEFAULT_OPTIONS: CadastreOptionsState = {
  showRadii: false,
  radiiKm: 0.15,
  weatherMode: 'off',
  weatherRadiusKm: 60,
};

const OPTIONS_STORAGE_KEY = 'propriete-cadastre-options-v1';

const loadOptions = (): CadastreOptionsState => {
  if (typeof window === 'undefined') return DEFAULT_OPTIONS;
  try {
    const raw = window.localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_OPTIONS;
    return { ...DEFAULT_OPTIONS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_OPTIONS;
  }
};

const ViewController: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
};

const ClickToPreview: React.FC<{
  onPick: (lat: number, lng: number) => void;
  enabled: boolean;
}> = ({ onPick, enabled }) => {
  useMapEvents({
    click: (e) => {
      if (!enabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface Props {
  proprieteId: string;
  proprieteNom?: string;
  proprieteAdresse?: string | null;
  proprieteVille?: string | null;
  proprieteCodePostal?: string | null;
  proprieteCenter?: [number, number] | null;
}

export const PortraitCadastre: React.FC<Props> = ({
  proprieteId,
  proprieteNom = 'Propriété',
  proprieteAdresse,
  proprieteVille,
  proprieteCodePostal,
  proprieteCenter,
}) => {
  const { data: parcelles = [], isLoading } = useProprieteParcelles(proprieteId);
  const { data: canCurate = false } = useCanCurateParcelles(proprieteId);
  const upsert = useUpsertParcelle(proprieteId);
  const del = useDeleteParcelle(proprieteId);
  const updateNote = useUpdateParcelleNote(proprieteId);

  const parcCenter = useMemo(() => centroidOfParcelles(parcelles), [parcelles]);
  const [center, setCenter] = useState<[number, number]>(
    parcCenter ?? proprieteCenter ?? [45.0, 0.5],
  );
  React.useEffect(() => {
    if (parcCenter) setCenter(parcCenter);
    else if (proprieteCenter) setCenter(proprieteCenter);
  }, [parcCenter?.[0], parcCenter?.[1], proprieteCenter?.[0], proprieteCenter?.[1]]);

  const [pickAt, setPickAt] = useState<{ lat: number; lng: number } | null>(null);
  const [addMode, setAddMode] = useState<boolean>(false);
  const preview = useLexiconParcelWithGeometryAt(pickAt?.lat ?? null, pickAt?.lng ?? null, !!pickAt);

  const previewInfo = useMemo(() => extractParcelInfo(preview.lexicon), [preview.lexicon]);
  const previewCentroid = useMemo(
    () => geometryCentroid(preview.geometry) ?? (pickAt ?? null),
    [preview.geometry, pickAt],
  );

  const alreadySaved = useMemo(() => {
    if (!previewInfo.parcelId) return null;
    return parcelles.find((p) => p.parcel_id === previewInfo.parcelId) ?? null;
  }, [previewInfo.parcelId, parcelles]);

  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const r = await geocodeAddress(search.trim());
      setCenter([r.coordinates[0], r.coordinates[1]]);
    } catch {
      toast.error('Adresse introuvable');
    } finally {
      setSearching(false);
    }
  };

  const handleAddPreview = async () => {
    if (!previewInfo.parcelId || !canCurate) return;
    await upsert.mutateAsync({
      parcelId: previewInfo.parcelId,
      communeCode: previewInfo.communeCode ?? null,
      communeNom: previewInfo.commune ?? null,
      section: previewInfo.section ?? null,
      numero: previewInfo.number ?? null,
      prefix: previewInfo.prefix ?? null,
      contenanceM2: previewInfo.surfaceM2 ?? null,
      geometry: preview.geometry ?? null,
      centroidLat: previewCentroid?.lat ?? null,
      centroidLng: previewCentroid?.lng ?? null,
    });
    toast.success('Parcelle ajoutée');
    setPickAt(null);
  };

  const totalSurface = useMemo(
    () => parcelles.reduce((s, p) => s + (p.contenance_m2 ?? 0), 0),
    [parcelles],
  );

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Options carte persistées
  const [options, setOptions] = useState<CadastreOptionsState>(loadOptions);
  const updateOptions = useCallback((patch: Partial<CadastreOptionsState>) => {
    setOptions((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const parcelsForWeather = useMemo(
    () =>
      parcelles
        .filter((p) => p.centroid_lat != null && p.centroid_lng != null)
        .map((p) => ({
          id: p.id,
          latitude: p.centroid_lat as number,
          longitude: p.centroid_lng as number,
          nom_marche: p.commune_nom ?? proprieteNom,
        })),
    [parcelles, proprieteNom],
  );
  const weatherMarches = useMemo(() => {
    if (parcelsForWeather.length > 0) return parcelsForWeather;
    return [{ id: 'center', latitude: center[0], longitude: center[1], nom_marche: proprieteNom }];
  }, [parcelsForWeather, center, proprieteNom]);

  // Plein écran
  const [fullscreen, setFullscreen] = useState(false);
  React.useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  /** Bascule visible du mode ajout — même état que l'interrupteur du menu carte. */
  const toggleAddMode = useCallback(() => {
    setAddMode((v) => {
      if (v) setPickAt(null);
      return !v;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement du cadastre…
      </div>
    );
  }

  const showWeather = options.weatherMode !== 'off';
  const hideParcels = options.weatherMode === 'on_only';


  const AddParcelleButton: React.FC<{ className?: string }> = ({ className = '' }) =>
    !canCurate ? null : (
      <button
        type="button"
        onClick={toggleAddMode}
        aria-pressed={addMode}
        title={
          addMode
            ? 'Mode ajout actif — cliquez une parcelle sur la carte'
            : 'Activer l’ajout de parcelles à la propriété'
        }
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition active:scale-95 ${
          addMode
            ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
            : 'bg-background text-foreground border-border hover:border-amber-400/60'
        } ${className}`}
      >
        {addMode ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        {addMode ? 'Cliquez une parcelle…' : 'Ajouter une parcelle'}
      </button>
    );

  /* ============================================================
   * BLOC CARTE (partagé entre inline et plein écran)
   * ============================================================ */
  const MapBlock: React.FC<{ heightPx?: number | string; fs?: boolean }> = ({ heightPx = 520, fs = false }) => (
    <div
      className={`rounded-2xl overflow-hidden border border-border relative isolate z-0 ${
        canCurate && addMode ? '[&_.leaflet-container]:cursor-crosshair' : ''
      }`}
      style={{ height: heightPx }}
    >
      <RichMap
        center={center}
        zoom={17}
        controls={{ zoom: true, style: true, geolocate: true, cadastre: true }}
        maxZoom={22}
        height="100%"
        initialStyle="cadastre"
      >
        <ViewController center={center} />
        <ClickToPreview enabled={canCurate && addMode} onPick={(lat, lng) => setPickAt({ lat, lng })} />

        {/* Rayons d'observation autour de chaque parcelle */}
        {options.showRadii && !hideParcels &&
          parcelles.map((p) =>
            p.centroid_lat != null && p.centroid_lng != null ? (
              <Circle
                key={`radius-${p.id}`}
                center={[p.centroid_lat, p.centroid_lng]}
                radius={options.radiiKm * 1000}
                pathOptions={{
                  color: '#10b981',
                  weight: 1.5,
                  opacity: 0.7,
                  fillColor: '#10b981',
                  fillOpacity: 0.08,
                  dashArray: '4 4',
                }}
              />
            ) : null,
          )}

        {/* Parcelles enregistrées */}
        {!hideParcels &&
          parcelles.map((p) =>
            p.geometry ? (
              <GeoJSON
                key={p.id}
                data={p.geometry as any}
                style={hoveredId === p.id ? HOVER_STYLE : SAVED_STYLE}
                eventHandlers={{
                  mouseover: () => setHoveredId(p.id),
                  mouseout: () => setHoveredId(null),
                }}
              />
            ) : null,
          )}

        {/* Preview point cliqué */}
        {pickAt && (
          <>
            <Marker
              position={[pickAt.lat, pickAt.lng]}
              icon={L.divIcon({
                className: 'cadastre-pick-marker',
                iconSize: [22, 22],
                iconAnchor: [11, 11],
                html: `<div style="width:20px;height:20px;border-radius:50%;background:#e94560;border:3px solid #FAF8F3;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>`,
              })}
            />
            {preview.geometry && (
              <GeoJSON
                key={`preview-${previewInfo.parcelId ?? 'x'}`}
                data={preview.geometry as any}
                style={{
                  color: '#e94560',
                  weight: 3,
                  dashArray: '6 6',
                  fillColor: '#fbbf24',
                  fillOpacity: 0.15,
                }}
              />
            )}
          </>
        )}

        {/* Stations météo */}
        {showWeather && (
          <WeatherStationsLayer
            marches={weatherMarches}
            radiusKm={options.weatherRadiusKm}
            showLinks
          />
        )}
      </RichMap>

      {/* Options FAB */}
      <CadastreOptionsMenu
        canCurate={canCurate}
        addMode={addMode}
        onToggleAddMode={toggleAddMode}
        state={options}
        onChange={updateOptions}
      />

      {/* Fullscreen toggle */}
      <button
        onClick={() => setFullscreen(!fs)}
        className="absolute top-4 left-4 z-[1000] h-10 w-10 rounded-xl bg-black/60 backdrop-blur-xl border border-white/15 text-white flex items-center justify-center shadow-lg hover:bg-black/75 transition active:scale-95"
        title={fs ? 'Réduire' : 'Plein écran'}
        aria-label={fs ? 'Réduire la carte' : 'Agrandir la carte'}
      >
        {fs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Bascule visible en plein écran (la barre d'outils n'y est pas rendue) */}
      {fs && canCurate && !addMode && (
        <div className="absolute top-4 left-16 z-[1000]">
          <AddParcelleButton />
        </div>
      )}

      {/* Bandeau info si mode ajout actif */}
      {canCurate && addMode && !pickAt && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-full bg-amber-500/95 text-black text-xs font-semibold pl-4 pr-1.5 py-1 shadow-lg backdrop-blur">
          Cliquez sur une parcelle pour l'ajouter
          <button
            type="button"
            onClick={toggleAddMode}
            className="inline-flex items-center gap-1 rounded-full bg-black/15 hover:bg-black/25 px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition"
          >
            <X className="w-3 h-3" /> Quitter
          </button>
        </div>
      )}

      {/* Panneau d'aperçu parcelle cliquée */}
      {pickAt && (
        <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-background/95 backdrop-blur border border-border shadow-lg p-3 z-[500]">
          {preview.isFetching ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse de la parcelle…
            </div>
          ) : !previewInfo.parcelId ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Aucune parcelle cadastrale trouvée à ce point.</span>
              <button onClick={() => setPickAt(null)} className="text-muted-foreground hover:text-foreground">×</button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs space-y-0.5 flex-1 min-w-0">
                <div className="font-semibold text-sm">
                  {previewInfo.commune ?? 'Commune inconnue'}
                  {previewInfo.postalCode ? ` (${previewInfo.postalCode})` : ''}
                </div>
                <div className="text-muted-foreground">
                  Section <strong className="text-foreground">{previewInfo.section ?? '—'}</strong> · Numéro <strong className="text-foreground">{previewInfo.number ?? '—'}</strong>
                  {previewInfo.surfaceM2 ? ` · ${previewInfo.surfaceM2.toLocaleString('fr-FR')} m²` : ''}
                </div>
                <div className="text-[10px] text-muted-foreground/70 truncate">
                  Id : {previewInfo.parcelId}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {alreadySaved ? (
                  <button
                    onClick={async () => {
                      await del.mutateAsync(alreadySaved.id);
                      toast.success('Parcelle retirée');
                      setPickAt(null);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-700 hover:bg-red-500/20 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Trash2 className="w-3 h-3" /> Retirer
                  </button>
                ) : (
                  <button
                    onClick={handleAddPreview}
                    disabled={!canCurate || upsert.isPending}
                    className="text-xs px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
                  >
                    {upsert.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    Ajouter
                  </button>
                )}
                <button onClick={() => setPickAt(null)} className="text-[10px] text-muted-foreground hover:text-foreground">
                  annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ============================================================
   * LISTE PARCELLES
   * ============================================================ */
  const ParcelsList: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
    <div className="space-y-2">
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> Parcelles retenues
          </div>
          <div className="text-xs font-semibold">{parcelles.length}</div>
        </div>
        {totalSurface > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            Surface cumulée&nbsp;: <strong className="text-foreground">{totalSurface.toLocaleString('fr-FR')} m²</strong>
            {' '}({(totalSurface / 10000).toFixed(2).replace('.', ',')} ha)
          </div>
        )}
      </div>

      {parcelles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          <MapPin className="w-5 h-5 mx-auto mb-2 opacity-40" />
          {canCurate ? (
            <>
              <p className="mb-3">Aucune parcelle retenue pour l’instant.</p>
              <AddParcelleButton className="mx-auto" />
              <p className="mt-2 text-[10px] opacity-70">
                puis cliquez la parcelle voulue sur la carte
              </p>
            </>
          ) : (
            'Aucune parcelle enregistrée pour cette propriété.'
          )}
        </div>
      ) : (
        <div className={`space-y-1.5 ${compact ? 'max-h-[calc(100vh-260px)]' : 'max-h-[440px]'} overflow-y-auto pr-1`}>
          {parcelles.map((p) => (
            <ParcelleRow
              key={p.id}
              parcelle={p}
              hovered={hoveredId === p.id}
              canCurate={canCurate}
              onHover={setHoveredId}
              onFocus={() =>
                p.centroid_lat != null && p.centroid_lng != null && setCenter([p.centroid_lat, p.centroid_lng])
              }
              onDelete={async () => {
                if (!confirm('Retirer cette parcelle ?')) return;
                await del.mutateAsync(p.id);
                toast.success('Parcelle retirée');
              }}
              onSaveNote={(note) => updateNote.mutate({ id: p.id, note })}
            />
          ))}
        </div>
      )}
    </div>
  );

  /* ============================================================
   * RENDER
   * ============================================================ */
  return (
    <div className="space-y-4">
      {/* Barre outils (recherche uniquement) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] rounded-full border border-border bg-background px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="Adresse ou commune…"
            className="flex-1 bg-transparent border-none outline-none text-xs"
          />
          <button
            onClick={doSearch}
            disabled={searching}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aller'}
          </button>
        </div>

        <AddParcelleButton />
      </div>

      {!canCurate && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50/40 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-100">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          Seul le propriétaire, un prestataire rattaché ou un administrateur peut modifier les parcelles.
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-3">
          <MapBlock />
        </div>
        <div className="md:col-span-2">
          <ParcelsList />
        </div>
      </div>

      {/* Bandeau adresse */}
      <PropertyAddressCard
        nom={proprieteNom}
        adresse={proprieteAdresse}
        ville={proprieteVille}
        codePostal={proprieteCodePostal}
        center={center}
        parcelles={parcelles}
      />

      {/* Station météo la plus proche */}
      <NearestWeatherStationCard center={center} />

      {/* Plein écran */}
      {fullscreen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="fs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[1000] bg-background"
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{proprieteNom}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Cadastre · {parcelles.length} parcelle{parcelles.length > 1 ? 's' : ''}
                      {totalSurface > 0 ? ` · ${(totalSurface / 10000).toFixed(2).replace('.', ',')} ha` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => setFullscreen(false)}
                    className="h-9 px-3 rounded-xl border border-border hover:bg-muted flex items-center gap-1.5 text-xs font-medium"
                  >
                    <Minimize2 className="w-4 h-4" /> Réduire
                  </button>
                </div>
                <div className="flex-1 grid md:grid-cols-[1fr_360px] overflow-hidden">
                  <div className="min-h-0">
                    <MapBlock heightPx="100%" fs />
                  </div>
                  <div className="hidden md:block border-l border-border p-3 overflow-y-auto">
                    <ParcelsList compact />
                    <div className="mt-4">
                      <PropertyAddressCard
                        nom={proprieteNom}
                        adresse={proprieteAdresse}
                        ville={proprieteVille}
                        codePostal={proprieteCodePostal}
                        center={center}
                        parcelles={parcelles}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};

const ParcelleRow: React.FC<{
  parcelle: ProprieteParcelle;
  hovered: boolean;
  canCurate: boolean;
  onHover: (id: string | null) => void;
  onFocus: () => void;
  onDelete: () => void;
  onSaveNote: (note: string) => void;
}> = ({ parcelle: p, hovered, canCurate, onHover, onFocus, onDelete, onSaveNote }) => {
  const [note, setNote] = useState(p.note ?? '');
  const [editing, setEditing] = useState(false);
  React.useEffect(() => setNote(p.note ?? ''), [p.note]);

  return (
    <div
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
      className={`rounded-xl border p-2.5 transition cursor-pointer ${
        hovered ? 'border-emerald-500 bg-emerald-500/5' : 'border-border bg-background'
      }`}
      onClick={onFocus}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs flex-1 min-w-0">
          <div className="font-semibold truncate">{p.commune_nom ?? 'Commune inconnue'}</div>
          <div className="text-muted-foreground">
            Section <strong className="text-foreground">{p.section ?? '—'}</strong> · N° <strong className="text-foreground">{p.numero ?? '—'}</strong>
          </div>
          <div className="text-[10px] text-muted-foreground/70">
            {p.contenance_m2 ? `${p.contenance_m2.toLocaleString('fr-FR')} m²` : '—'}
          </div>
        </div>
        {canCurate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full text-xs rounded-lg border border-border bg-background p-2 resize-none"
            placeholder="Note libre…"
          />
          <div className="flex justify-end gap-1 mt-1">
            <button
              onClick={() => {
                setEditing(false);
                setNote(p.note ?? '');
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1"
            >
              annuler
            </button>
            <button
              onClick={() => {
                onSaveNote(note);
                setEditing(false);
              }}
              className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-1"
            >
              enregistrer
            </button>
          </div>
        </div>
      ) : p.note ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (canCurate) setEditing(true);
          }}
          className="mt-1.5 text-[11px] italic text-muted-foreground border-l-2 border-emerald-500/40 pl-2 hover:text-foreground"
        >
          « {p.note} »
        </div>
      ) : canCurate ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="mt-1.5 text-[10px] text-muted-foreground/70 hover:text-emerald-700 italic"
        >
          + ajouter une note
        </button>
      ) : null}
    </div>
  );
};

export default PortraitCadastre;
