import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Send, X, Loader2, Save, Check } from 'lucide-react';
import { useLexiconParcelWithGeometryAt } from './useLexiconParcels';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface GpsEditOverlayProps {
  initialLat: number;
  initialLng: number;
  onClose: () => void;
  /** Callback déclenché à la soumission avec la nouvelle géométrie LEXICON. */
  onPreview: (preview: { lat: number; lng: number; geometry: any; data: any } | null) => void;
  /** Identifiant de la marche pour la persistance GPS (optionnel). */
  marcheId?: string;
  /** Si vrai, expose le bouton « MAJ GPS Marche » (Ambassadeur/Sentinelle/Admin). */
  canPersist?: boolean;
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
  const map = useMap();
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [submitted, setSubmitted] = useState<{ lat: number; lng: number } | null>(null);

  const { lexicon, geometry, isFetching, isError } = useLexiconParcelWithGeometryAt(
    submitted?.lat ?? null,
    submitted?.lng ?? null,
    !!submitted,
  );

  // Pousse la preview au parent dès qu'une géométrie est résolue + recadre la carte
  useEffect(() => {
    if (!submitted || !geometry?.coordinates) return;
    onPreview({ lat: submitted.lat, lng: submitted.lng, geometry, data: lexicon });
    // Ferme toute popup résiduelle et recadre sur la nouvelle parcelle
    try {
      map.closePopup();
      const bounds = L.geoJSON(geometry as any).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { maxZoom: 18, padding: [40, 40] });
      }
    } catch {
      /* noop */
    }
  }, [geometry, submitted, lexicon, onPreview, map]);

  // Réinitialise la preview si l'utilisateur déplace le marqueur après soumission
  useEffect(() => {
    if (submitted && (submitted.lat !== lat || submitted.lng !== lng)) {
      setSubmitted(null);
      onPreview(null);
    }
  }, [lat, lng, submitted, onPreview]);

  const handleSubmit = () => {
    map.closePopup();
    setSubmitted({ lat, lng });
  };
  const handleCancel = () => {
    setSubmitted(null);
    onPreview(null);
    onClose();
  };

  const showLoader = isFetching && !geometry;
  const showNoParcel = !!submitted && !isFetching && !geometry;

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
                disabled={showLoader}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-400/40 text-emerald-100 text-xs font-medium disabled:opacity-50"
              >
                {showLoader ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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
              <div className="mt-2 text-[11px] text-red-300">Échec de l'appel cadastre.</div>
            )}
            {showNoParcel && !isError && (
              <div className="mt-2 text-[11px] text-amber-200">
                Aucune parcelle cadastrale trouvée à cet emplacement.
              </div>
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
