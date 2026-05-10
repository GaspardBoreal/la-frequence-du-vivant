import React, { useState } from 'react';
import { MapPin, Clock, Ruler, HardDrive, Globe, Lock, Calendar, Copy, Map as MapIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import type { LightboxItem } from './MediaLightbox';
import PhotoLocationDialog from './PhotoLocationDialog';

interface Props {
  item: LightboxItem;
}

const formatBytes = (b?: number | null) => {
  if (!b || b <= 0) return null;
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`;
  return `${(b / (1024 * 1024)).toFixed(2)} Mo`;
};

const Row: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className="flex items-start gap-2.5">
    <div className="text-white/50 mt-0.5 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-white/45 text-[10px] uppercase tracking-wider">{label}</div>
      <div className="text-white/90 text-xs mt-0.5 break-words">{children}</div>
    </div>
  </div>
);

const MediaMetadataPanel: React.FC<Props> = ({ item }) => {
  const meta = item.metadata || {};
  const gps = meta.gps;
  const dateTaken = meta.date_taken;
  const w = meta.width;
  const h = meta.height;
  const size = formatBytes(item.sizeBytes);

  const copyCoords = async () => {
    if (!gps) return;
    try {
      await navigator.clipboard.writeText(`${gps.latitude}, ${gps.longitude}`);
      toast.success('Coordonnées copiées');
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const osmUrl = gps
    ? `https://www.openstreetmap.org/?mlat=${gps.latitude}&mlon=${gps.longitude}#map=18/${gps.latitude}/${gps.longitude}`
    : null;

  return (
    <div className="space-y-3.5 text-left">
      {gps ? (
        <Row icon={<MapPin className="w-3.5 h-3.5" />} label="Coordonnées GPS">
          <div className="font-mono text-[11px] text-white/95">
            {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
          </div>
          <div className="flex gap-1.5 mt-1.5">
            <button
              onClick={copyCoords}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/8 hover:bg-white/15 text-white/80 text-[10px] transition"
            >
              <Copy className="w-3 h-3" /> Copier
            </button>
            {osmUrl && (
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[10px] transition"
              >
                <ExternalLink className="w-3 h-3" /> Voir la carte
              </a>
            )}
          </div>
        </Row>
      ) : (
        <Row icon={<MapPin className="w-3.5 h-3.5" />} label="Coordonnées GPS">
          <span className="text-white/40 italic text-[11px]">Aucune donnée GPS dans cette photo</span>
        </Row>
      )}

      {dateTaken && (
        <Row icon={<Clock className="w-3.5 h-3.5" />} label="Prise de vue">
          {format(new Date(dateTaken), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </Row>
      )}

      {(w && h) ? (
        <Row icon={<Ruler className="w-3.5 h-3.5" />} label="Dimensions">
          {w} × {h} px
        </Row>
      ) : null}

      {size && (
        <Row icon={<HardDrive className="w-3.5 h-3.5" />} label="Taille">
          {size}
        </Row>
      )}

      <Row
        icon={item.isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        label="Visibilité"
      >
        {item.isPublic ? 'Public' : 'Privé'}
      </Row>

      {item.createdAt && (
        <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Ajoutée le">
          {format(new Date(item.createdAt), 'd MMMM yyyy', { locale: fr })}
        </Row>
      )}
    </div>
  );
};

export default MediaMetadataPanel;
