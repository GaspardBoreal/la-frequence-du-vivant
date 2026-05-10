import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Copy, ExternalLink, MapPin, Mountain as MountainIcon, Sparkles, Wind, X } from 'lucide-react';
import { toast } from 'sonner';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DynamicTileLayer, MapStyleToggle, type MapStyle } from '@/components/maps';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number;
  longitude: number;
  source?: 'exif' | 'manual' | 'device_geolocation' | string | null;
  title?: string | null;
}

// Pulsing emerald marker
const pulseIcon = L.divIcon({
  className: 'photo-loc-pulse',
  html: `
    <div style="position:relative;width:28px;height:28px;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:hsl(160 84% 39% / 0.35);animation:photoLocPing 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <span style="position:absolute;inset:8px;border-radius:9999px;background:hsl(160 84% 39%);box-shadow:0 0 0 3px hsl(0 0% 100% / 0.9), 0 4px 12px hsl(160 84% 25% / 0.5);"></span>
    </div>
    <style>@keyframes photoLocPing{75%,100%{transform:scale(2.4);opacity:0;}}</style>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const Recenter: React.FC<{ lat: number; lng: number; zoom: number }> = ({ lat, lng, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
};

// Haversine
const distMeters = (a: [number, number], b: [number, number]) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const bearing = (from: [number, number], to: [number, number]) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(from[0]);
  const φ2 = toRad(to[0]);
  const Δλ = toRad(to[1] - from[1]);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const compassPoint = (deg: number) => {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  return dirs[Math.round(deg / 22.5) % 16];
};

const sourceLabel = (s?: string | null) => {
  switch (s) {
    case 'exif': return 'Précision photo (EXIF)';
    case 'manual': return 'Position saisie manuellement';
    case 'device_geolocation': return 'Position de l\'appareil au moment du dépôt';
    default: return 'Position estimée';
  }
};

const PhotoLocationDialog: React.FC<Props> = ({ open, onOpenChange, latitude, longitude, source, title }) => {
  const [style, setStyle] = useState<MapStyle>('satellite');
  const [zoom, setZoom] = useState(19);
  const [radius, setRadius] = useState(80);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const tile = TILES[style];

  const earthUrl = `https://earth.google.com/web/@${latitude},${longitude},100a,250d,35y,0h,60t,0r`;
  const gmapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=19/${latitude}/${longitude}`;

  const userInfo = useMemo(() => {
    if (!userPos) return null;
    const d = distMeters(userPos, [latitude, longitude]);
    const b = bearing(userPos, [latitude, longitude]);
    return { d, b, point: compassPoint(b) };
  }, [userPos, latitude, longitude]);

  const askGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation indisponible sur cet appareil');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoLoading(false);
      },
      () => {
        toast.error('Impossible d\'obtenir votre position');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const copyCoords = async () => {
    try {
      await navigator.clipboard.writeText(`${latitude}, ${longitude}`);
      toast.success('Coordonnées copiées');
    } catch {
      toast.error('Impossible de copier');
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-[81] grid w-[95vw] max-w-3xl translate-x-[-50%] translate-y-[-50%]',
            'gap-0 overflow-hidden border bg-background p-0 shadow-2xl rounded-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <DialogPrimitive.Title className="sr-only">Le lieu exact de cette photo</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Carte interactive ultra-zoomée centrée sur la position GPS de la photo, avec rayon de biodiversité et boussole.
          </DialogPrimitive.Description>
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground">Le lieu exact de cette photo</h2>
              {title && <p className="text-xs text-muted-foreground mt-0.5 truncate">{title}</p>}
            </div>
            <DialogPrimitive.Close className="rounded-md p-1 hover:bg-muted transition shrink-0">
              <X className="w-4 h-4" />
              <span className="sr-only">Fermer</span>
            </DialogPrimitive.Close>
          </div>


        {/* MAP */}
        <div className="relative h-[45vh] min-h-[300px] bg-muted">
          <MapContainer
            center={[latitude, longitude]}
            zoom={zoom}
            scrollWheelZoom
            className="w-full h-full z-0"
          >
            <TileLayer url={tile.url} attribution={tile.attr} maxZoom={tile.max} maxNativeZoom={19} />
            {style === 'cadastre' && <CadastreOverlay />}
            <Recenter lat={latitude} lng={longitude} zoom={zoom} />
            <Marker position={[latitude, longitude]} icon={pulseIcon} />
            <Circle
              center={[latitude, longitude]}
              radius={radius}
              pathOptions={{ color: 'hsl(160 84% 39%)', fillColor: 'hsl(160 84% 39%)', fillOpacity: 0.08, weight: 1.5, dashArray: '4 4' }}
            />
          </MapContainer>

          {/* Style switcher */}
          <div className="absolute top-3 left-3 z-[500] flex gap-1 p-1 rounded-lg bg-background/90 backdrop-blur border border-border shadow-md">
            {(['plan', 'satellite', 'cadastre'] as MapStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`px-2.5 py-1 text-[11px] rounded-md transition ${
                  style === s ? 'bg-emerald-600 text-white' : 'text-foreground hover:bg-muted'
                }`}
              >
                {s === 'plan' ? 'Plan' : s === 'satellite' ? 'Satellite' : 'Cadastre'}
              </button>
            ))}
          </div>

          {/* Zoom hint */}
          <div className="absolute top-3 right-3 z-[500] px-2 py-1 rounded-md bg-background/90 backdrop-blur border border-border text-[10px] text-muted-foreground flex items-center gap-1">
            <Layers className="w-3 h-3" /> zoom {zoom}
          </div>
        </div>

        {/* INFO + WAHOUHH */}
        <div className="p-4 space-y-4 max-h-[40vh] overflow-y-auto">
          {/* Coordinates row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-mono text-xs text-foreground">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{sourceLabel(source)}</div>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={copyCoords} className="h-7 text-[11px]">
                <Copy className="w-3 h-3 mr-1" /> Copier
              </Button>
              <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <ExternalLink className="w-3 h-3 mr-1" /> Maps
                </Button>
              </a>
              <a href={osmUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <ExternalLink className="w-3 h-3 mr-1" /> OSM
                </Button>
              </a>
            </div>
          </div>

          {/* WAHOUHH #1 — Cercle du vivant */}
          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-foreground">Le cercle du vivant</h3>
            </div>
            <p className="text-xs text-muted-foreground italic mb-3">
              « À {radius} mètres autour de cette photo, c'est tout un monde qui respire. »
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="flex-1 accent-emerald-600"
              />
              <div className="text-xs font-mono text-emerald-700 w-14 text-right">{radius} m</div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Élargissez le cercle pour ressentir l'écosystème qui entoure votre instantané.
            </div>
          </div>

          {/* WAHOUHH #2 — Boussole + Earth 3D */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Compass className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">Reposer mes pas ici</h3>
              </div>
              {!userPos ? (
                <>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Découvrez à quelle distance et dans quelle direction se trouve ce lieu depuis vous.
                  </p>
                  <Button size="sm" onClick={askGeolocation} disabled={geoLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-[11px]">
                    {geoLoading ? 'Localisation…' : 'M\'y guider depuis ma position'}
                  </Button>
                </>
              ) : userInfo && (
                <div className="text-center py-1">
                  <div className="text-2xl font-light text-emerald-700">
                    {userInfo.d < 1000 ? `${Math.round(userInfo.d)} m` : `${(userInfo.d / 1000).toFixed(1)} km`}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    cap <span className="font-semibold text-foreground">{userInfo.point}</span> ({Math.round(userInfo.b)}°)
                  </div>
                  <div className="text-[10px] text-muted-foreground italic mt-1.5">
                    « Ce lieu vous attend. »
                  </div>
                </div>
              )}
            </div>

            <a
              href={earthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-border bg-gradient-to-br from-sky-500/10 via-emerald-500/5 to-transparent p-3.5 hover:border-emerald-500/40 transition group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Mountain className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-semibold">Survoler en 3D</h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Plongez dans le relief, voyez les courbes du paysage qui ont accueilli votre regard.
              </p>
              <div className="text-[11px] text-sky-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Ouvrir Google Earth <ExternalLink className="w-3 h-3" />
              </div>
            </a>
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default PhotoLocationDialog;
