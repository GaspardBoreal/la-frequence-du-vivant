import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Send, X, Loader2 } from 'lucide-react';
import { useLexiconParcelAt } from './useLexiconParcels';

interface GpsEditOverlayProps {
  initialLat: number;
  initialLng: number;
  onClose: () => void;
  /** Callback déclenché à la soumission avec la nouvelle géométrie LEXICON. */
  onPreview: (preview: { lat: number; lng: number; geometry: any; data: any } | null) => void;
}

const draggableIcon = L.divIcon({
  className: 'gps-edit-marker',
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#3b82f6;border:3px dashed #fff;
    box-shadow:0 0 0 4px rgba(59,130,246,0.35),0 4px 12px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;
  ">↔</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const GpsEditOverlay: React.FC<GpsEditOverlayProps> = ({ initialLat, initialLng, onClose, onPreview }) => {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [submitted, setSubmitted] = useState<{ lat: number; lng: number } | null>(null);

  const { data, isFetching, isError } = useLexiconParcelAt(
    submitted?.lat ?? null,
    submitted?.lng ?? null,
    !!submitted,
  );

  useEffect(() => {
    if (!data || !submitted) return;
    const geometry = data?.data?._raw?.cadastre?.shape || data?.data?.geometry;
    onPreview({ lat: submitted.lat, lng: submitted.lng, geometry, data: data?.data });
  }, [data, submitted, onPreview]);

  const handleSubmit = () => setSubmitted({ lat, lng });
  const handleCancel = () => {
    setSubmitted(null);
    onPreview(null);
    onClose();
  };

  return (
    <>
      <Marker
        position={[lat, lng]}
        icon={draggableIcon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const m = e.target as L.Marker;
            const p = m.getLatLng();
            setLat(p.lat);
            setLng(p.lng);
          },
          drag: (e) => {
            const m = e.target as L.Marker;
            const p = m.getLatLng();
            setLat(p.lat);
            setLng(p.lng);
          },
        }}
      />

      {createPortal(
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] w-[min(92vw,420px)] pointer-events-auto">
          <div className="bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 shadow-xl shadow-black/40 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Crosshair className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                Repositionnement — aperçu local
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 font-mono text-xs">
              <div className="bg-white/5 rounded-md px-2 py-1.5">
                <div className="text-[10px] text-white/50">Lat</div>
                <div>{lat.toFixed(6)}</div>
              </div>
              <div className="bg-white/5 rounded-md px-2 py-1.5">
                <div className="text-[10px] text-white/50">Lng</div>
                <div>{lng.toFixed(6)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={isFetching}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-400/40 text-emerald-100 text-xs font-medium disabled:opacity-50"
              >
                {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Soumettre
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 text-xs"
              >
                <X className="w-3.5 h-3.5" /> Fermer
              </button>
            </div>
            {isError && (
              <div className="mt-2 text-[11px] text-red-300">Échec de l'appel LEXICON.</div>
            )}
            {!submitted && (
              <div className="mt-2 text-[10px] text-white/50">
                Glissez le marqueur puis cliquez sur Soumettre. Aucune sauvegarde en base.
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default GpsEditOverlay;
