import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Camera, MapPin, Upload, Lock, Users, Globe, ChevronDown, X } from 'lucide-react';
import exifr from 'exifr';
import { supabase } from '@/integrations/supabase/client';

interface MarcheOption {
  id: string;
  nom_marche: string | null;
  ville: string;
}

interface PhotoGpsPoint {
  lat: number;
  lng: number;
  file: File;
  previewUrl: string;
  dateOriginal?: string;
}

type Visibility = 'private' | 'community' | 'world';

const VISIBILITY_OPTIONS: { key: Visibility; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'private', label: 'Privé', icon: <Lock className="w-3 h-3" />, desc: 'Visible par moi seul' },
  { key: 'community', label: 'Communauté', icon: <Users className="w-3 h-3" />, desc: 'Visible par les marcheurs' },
  { key: 'world', label: 'Monde', icon: <Globe className="w-3 h-3" />, desc: 'Accessible publiquement' },
];

// Red photo marker icon
const photoMarkerIcon = L.divIcon({
  className: 'photo-gps-marker',
  html: `
    <div style="position:relative;width:16px;height:16px;">
      <div style="position:absolute;inset:-5px;border-radius:50%;background:rgba(185,28,28,0.15);animation:photo-pulse 2.5s ease-out infinite;"></div>
      <div style="width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#b91c1c);border:2.5px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(220,38,38,0.4);"></div>
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -12],
});

interface PhotoGpsDropToolProps {
  marches: MarcheOption[];
  explorationId?: string;
}

// The button component (placed on map controls area)
export function PhotoGpsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-rose-500/15 hover:border-rose-400/30 transition-all duration-200 active:scale-95 relative"
      aria-label="Localiser une photo GPS"
      title="Déposer une photo pour voir sa position GPS"
    >
      <Camera className="w-4 h-4" />
      <MapPin className="w-2 h-2 absolute bottom-1.5 right-1.5 text-rose-400" />
    </button>
  );
}

// The marker + popup rendered inside the MapContainer
export function PhotoGpsMarker({
  point,
  marches,
  explorationId,
  onClose,
  onUploaded,
}: {
  point: PhotoGpsPoint;
  marches: MarcheOption[];
  explorationId?: string;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [selectedMarcheId, setSelectedMarcheId] = useState<string>(marches[0]?.id || '');
  const [visibility, setVisibility] = useState<Visibility>('community');
  const [uploading, setUploading] = useState(false);
  const [showMarcheSelect, setShowMarcheSelect] = useState(false);

  const handleUpload = async () => {
    if (!selectedMarcheId || !explorationId) return;
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Non connecté'); return; }

      // Upload file
      const ext = point.file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('marcheur-uploads')
        .upload(path, point.file, { contentType: point.file.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('marcheur-uploads').getPublicUrl(path);

      // Insert media
      const isPublic = visibility !== 'private';
      const sharedToWeb = visibility === 'world';

      const { error: insertErr } = await supabase.from('marcheur_medias').insert({
        user_id: user.id,
        marche_id: selectedMarcheId,
        type_media: 'photo',
        url_fichier: urlData.publicUrl,
        titre: point.file.name,
        is_public: isPublic,
        shared_to_web: sharedToWeb,
        metadata: {
          latitude: point.lat,
          longitude: point.lng,
          date_original: point.dateOriginal || null,
          source: 'photo_gps_tool',
        },
      });
      if (insertErr) throw insertErr;

      const marcheName = marches.find(m => m.id === selectedMarcheId)?.nom_marche || 'la marche';
      toast.success(`Photo ajoutée à ${marcheName}`, { description: VISIBILITY_OPTIONS.find(v => v.key === visibility)?.label });
      onUploaded();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error("Erreur lors de l'ajout", { description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const selectedMarche = marches.find(m => m.id === selectedMarcheId);

  return (
    <>
      <Circle
        center={[point.lat, point.lng]}
        radius={60}
        pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.08, weight: 1, opacity: 0.3 }}
      />
      <Marker position={[point.lat, point.lng]} icon={photoMarkerIcon}>
        <Popup className="exploration-carte-popup" maxWidth={280} minWidth={240}>
          <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 -m-3 text-white">
            {/* Close */}
            <button onClick={onClose} className="absolute top-2 right-2 text-white/40 hover:text-white/80 transition-colors z-10">
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Thumbnail + coords */}
            <div className="flex gap-2.5 mb-3">
              <img
                src={point.previewUrl}
                alt="Photo"
                className="w-[80px] h-[80px] rounded-lg object-cover flex-shrink-0 border border-white/10"
              />
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[10px] text-white/50 mb-1">📍 Coordonnées GPS</div>
                <div className="text-xs font-mono text-emerald-300">{point.lat.toFixed(6)}</div>
                <div className="text-xs font-mono text-emerald-300">{point.lng.toFixed(6)}</div>
                {point.dateOriginal && (
                  <div className="text-[10px] text-white/40 mt-1.5">📅 {point.dateOriginal}</div>
                )}
              </div>
            </div>

            {/* Marche selector */}
            <div className="mb-2">
              <div className="text-[10px] text-white/50 mb-1">Rattacher à la marche :</div>
              <button
                onClick={() => setShowMarcheSelect(!showMarcheSelect)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
              >
                <span className="truncate">{selectedMarche?.nom_marche || selectedMarche?.ville || 'Sélectionner...'}</span>
                <ChevronDown className={`w-3 h-3 text-white/50 transition-transform ${showMarcheSelect ? 'rotate-180' : ''}`} />
              </button>
              {showMarcheSelect && (
                <div className="mt-1 max-h-24 overflow-y-auto rounded-lg bg-black/90 border border-white/10">
                  {marches.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedMarcheId(m.id); setShowMarcheSelect(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-white/10 transition-colors ${m.id === selectedMarcheId ? 'text-emerald-300 bg-emerald-500/10' : 'text-white/70'}`}
                    >
                      {m.nom_marche || m.ville}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility selector */}
            <div className="flex gap-1 mb-3">
              {VISIBILITY_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setVisibility(opt.key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all
                    ${visibility === opt.key
                      ? opt.key === 'private'
                        ? 'bg-gray-500/20 border border-gray-400/30 text-gray-300'
                        : opt.key === 'community'
                          ? 'bg-blue-500/20 border border-blue-400/30 text-blue-300'
                          : 'bg-purple-500/20 border border-purple-400/30 text-purple-300'
                      : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
                    }
                  `}
                  title={opt.desc}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedMarcheId}
              className="w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {uploading ? (
                <div className="w-3.5 h-3.5 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? 'Ajout en cours...' : 'Ajouter à cette marche →'}
            </button>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

// Hook to manage photo GPS state
export function usePhotoGpsDrop() {
  const [photoPoint, setPhotoPoint] = useState<PhotoGpsPoint | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input for re-selecting same file
    e.target.value = '';

    try {
      const [gps, exifData] = await Promise.all([
        exifr.gps(file),
        exifr.parse(file, ['DateTimeOriginal']),
      ]);

      if (!gps?.latitude || !gps?.longitude) {
        toast.warning('Aucune donnée GPS dans cette photo', {
          description: 'La photo ne contient pas de coordonnées de localisation.',
        });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      let dateOriginal: string | undefined;
      if (exifData?.DateTimeOriginal) {
        const d = exifData.DateTimeOriginal instanceof Date
          ? exifData.DateTimeOriginal
          : new Date(exifData.DateTimeOriginal);
        dateOriginal = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      setPhotoPoint({ lat: gps.latitude, lng: gps.longitude, file, previewUrl, dateOriginal });
    } catch (err) {
      console.warn('EXIF extraction failed:', err);
      toast.error("Impossible de lire les données GPS de cette photo");
    }
  }, []);

  const clear = useCallback(() => {
    if (photoPoint?.previewUrl) URL.revokeObjectURL(photoPoint.previewUrl);
    setPhotoPoint(null);
  }, [photoPoint]);

  const FileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleFileChange}
    />
  );

  return { photoPoint, triggerFileInput, clear, FileInput };
}
