import React, { useMemo, useState } from 'react';
import { GeoJSON, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Layers,
  FileDown,
  Copy,
  Check,
  Info,
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
  proprieteCenter?: [number, number] | null;
}

export const PortraitCadastre: React.FC<Props> = ({ proprieteId, proprieteCenter }) => {
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
  const preview = useLexiconParcelWithGeometryAt(pickAt?.lat ?? null, pickAt?.lng ?? null, !!pickAt);

  const previewInfo = useMemo(
    () => extractParcelInfo(preview.lexicon),
    [preview.lexicon],
  );
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

  const exportGeoJSON = () => {
    const features = parcelles
      .filter((p) => p.geometry)
      .map((p) => ({
        type: 'Feature' as const,
        properties: {
          parcel_id: p.parcel_id,
          commune: p.commune_nom,
          section: p.section,
          numero: p.numero,
          contenance_m2: p.contenance_m2,
          note: p.note,
        },
        geometry: p.geometry,
      }));
    const fc = { type: 'FeatureCollection' as const, features };
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parcelles-propriete.geojson';
    a.click();
    URL.revokeObjectURL(url);
  };

  const [copied, setCopied] = useState(false);
  const copyList = async () => {
    const lines = parcelles.map(
      (p) => `${p.commune_nom ?? ''} — ${p.section ?? ''} ${p.numero ?? ''} — ${p.contenance_m2 ?? 0} m²`,
    );
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copie impossible');
    }
  };

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement du cadastre…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre outils */}
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
        <button
          onClick={copyList}
          disabled={parcelles.length === 0}
          className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted flex items-center gap-1.5 disabled:opacity-40"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          Copier la liste
        </button>
        <button
          onClick={exportGeoJSON}
          disabled={parcelles.length === 0}
          className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted flex items-center gap-1.5 disabled:opacity-40"
        >
          <FileDown className="w-3.5 h-3.5" /> GeoJSON
        </button>
      </div>

      {!canCurate && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50/40 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-100">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          Seul le propriétaire, un prestataire rattaché ou un administrateur peut modifier les parcelles.
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-4">
        {/* Carte */}
        <div
          className="md:col-span-3 rounded-2xl overflow-hidden border border-border relative"
          style={{ height: 520 }}
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
            <ClickToPreview enabled={canCurate} onPick={(lat, lng) => setPickAt({ lat, lng })} />

            {/* Parcelles enregistrées */}
            {parcelles.map((p) =>
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
          </RichMap>

          {/* Panneau d’aperçu parcelle cliquée */}
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

        {/* Panneau liste */}
        <div className="md:col-span-2 space-y-2">
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
              {canCurate
                ? 'Cliquez une parcelle sur la carte cadastrale pour l’ajouter à votre propriété.'
                : 'Aucune parcelle enregistrée pour cette propriété.'}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
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
      </div>
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
          <input
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (note !== (p.note ?? '')) onSaveNote(note);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setNote(p.note ?? '');
                setEditing(false);
              }
            }}
            placeholder="Note (ex. verger, potager…)"
            className="w-full text-[11px] px-2 py-1 rounded-md border border-border bg-background outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      ) : (
        canCurate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="mt-1 text-[10px] italic text-muted-foreground hover:text-foreground"
          >
            {p.note ? `« ${p.note} »` : '+ ajouter une note'}
          </button>
        )
      )}
    </div>
  );
};

export default PortraitCadastre;
