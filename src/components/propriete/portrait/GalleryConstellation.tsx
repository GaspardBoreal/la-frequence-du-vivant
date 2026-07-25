import React, { useMemo, useState } from 'react';
import { TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SafeMapContainer } from '@/components/maps/SafeMapContainer';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  photos: GalleryPhoto[];
  fallbackCenter?: [number, number] | null;
}

/**
 * Constellation : chaque photo posée à ses coordonnées GPS, reliée par
 * un fil narratif dans l'ordre de sélection. Les photos sans GPS restent
 * accessibles en vignette latérale.
 */
export const GalleryConstellation: React.FC<Props> = ({ photos, fallbackCenter }) => {
  const [active, setActive] = useState<string | null>(null);
  const withGps = useMemo(
    () => photos.filter((p) => p.lat != null && p.lng != null) as (GalleryPhoto & { lat: number; lng: number })[],
    [photos]
  );
  const withoutGps = photos.filter((p) => p.lat == null || p.lng == null);

  const center = useMemo<[number, number]>(() => {
    if (withGps.length > 0) {
      const lat = withGps.reduce((s, p) => s + p.lat, 0) / withGps.length;
      const lng = withGps.reduce((s, p) => s + p.lng, 0) / withGps.length;
      return [lat, lng];
    }
    return fallbackCenter ?? [46.5, 2.5];
  }, [withGps, fallbackCenter]);

  const bounds = useMemo(() => {
    if (withGps.length < 2) return undefined;
    return L.latLngBounds(withGps.map((p) => [p.lat, p.lng]));
  }, [withGps]);

  const polyline = withGps.map((p) => [p.lat, p.lng]) as [number, number][];

  const makeIcon = (photo: GalleryPhoto, index: number) =>
    L.divIcon({
      className: 'portrait-constellation-marker',
      iconSize: [56, 56],
      iconAnchor: [28, 28],
      html: `
        <div style="position:relative;width:56px;height:56px;">
          <div style="position:absolute;inset:0;border-radius:9999px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.35);border:3px solid ${active === photo.id ? '#f59e0b' : '#fff'};">
            <img src="${photo.url}" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <div style="position:absolute;top:-6px;left:-6px;background:#f59e0b;color:#fff;font-size:10px;font-weight:700;width:20px;height:20px;border-radius:9999px;display:flex;align-items:center;justify-content:center;">${index + 1}</div>
        </div>
      `,
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3">
      <div className="relative rounded-2xl overflow-hidden border border-border h-[520px]">
        <SafeMapContainer
          center={center}
          zoom={withGps.length ? 15 : 5}
          bounds={bounds}
          boundsOptions={{ padding: [40, 40], maxZoom: 17 }}
          scrollWheelZoom
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {polyline.length > 1 && (
            <Polyline
              positions={polyline}
              pathOptions={{ color: '#f59e0b', weight: 2, opacity: 0.7, dashArray: '4 6' }}
            />
          )}
          {withGps.map((p, i) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={makeIcon(p, i)}
              eventHandlers={{ click: () => setActive(p.id) }}
            >
              <Popup>
                <div className="w-48">
                  <img src={p.url} alt="" className="w-full h-32 object-cover rounded" />
                  <div className="text-[11px] text-neutral-600 mt-1">
                    {p.author_name ?? 'Anonyme'}
                    {p.photo_date && ` · ${new Date(p.photo_date).toLocaleDateString('fr-FR')}`}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </SafeMapContainer>
        {withGps.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-center px-6">
            <p className="text-sm text-muted-foreground">
              Aucune photo géolocalisée. Sélectionnez des clichés avec GPS pour tracer la constellation.
            </p>
          </div>
        )}
      </div>

      <aside className="rounded-2xl border border-border p-3 max-h-[520px] overflow-y-auto space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Fil narratif
        </div>
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className={`w-full flex items-center gap-2 rounded-lg p-1.5 text-left transition ${
              active === p.id ? 'bg-amber-100/60 dark:bg-amber-900/30' : 'hover:bg-muted'
            }`}
          >
            <div className="w-10 h-10 rounded overflow-hidden shrink-0 relative">
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-0 left-0 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-br">
                {i + 1}
              </div>
            </div>
            <div className="text-[11px] leading-tight min-w-0 flex-1">
              <div className="truncate text-foreground">{p.author_name ?? 'Anonyme'}</div>
              <div className="truncate text-muted-foreground">
                {p.lat != null && p.lng != null ? '📍 Géolocalisée' : 'Sans GPS'}
              </div>
            </div>
          </button>
        ))}
        {withoutGps.length > 0 && (
          <p className="text-[10px] text-muted-foreground italic pt-2 border-t">
            {withoutGps.length} photo{withoutGps.length > 1 ? 's' : ''} sans coordonnées — visible{withoutGps.length > 1 ? 's' : ''} ici uniquement.
          </p>
        )}
      </aside>
    </div>
  );
};
