import React, { useState } from 'react';
import { MapPin, Copy, Check, ExternalLink, Navigation, Layers } from 'lucide-react';
import { toast } from 'sonner';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';

interface Props {
  nom: string;
  adresse?: string | null;
  ville?: string | null;
  codePostal?: string | null;
  center?: [number, number] | null;
  parcelles?: ProprieteParcelle[];
}

const formatCoord = (v: number, dir: 'lat' | 'lng') => {
  const abs = Math.abs(v);
  const hemi = dir === 'lat' ? (v >= 0 ? 'N' : 'S') : v >= 0 ? 'E' : 'O';
  return `${abs.toFixed(4)}°${hemi}`;
};

/**
 * Bandeau d'adresse glassmorphique affiché sous la carte cadastre.
 * Compose l'adresse à partir des champs propriété + parcelles retenues,
 * expose le GPS du centroïde et des actions d'ouverture externe.
 */
export const PropertyAddressCard: React.FC<Props> = ({
  nom,
  adresse,
  ville,
  codePostal,
  center,
  parcelles = [],
}) => {
  const [copied, setCopied] = useState<'addr' | 'gps' | null>(null);

  const communes = Array.from(
    new Set(
      parcelles
        .map((p) => (p.commune_nom ? `${p.commune_nom}${p.commune_code ? ` (${p.commune_code})` : ''}` : null))
        .filter(Boolean) as string[],
    ),
  );

  const sectionSummary =
    parcelles.length > 0
      ? parcelles.map((p) => `Section ${p.section ?? '—'} · N°${p.numero ?? '—'}`).slice(0, 4)
      : [];

  const line2Parts: string[] = [];
  if (adresse) line2Parts.push(adresse);
  const cityLine = [codePostal, ville].filter(Boolean).join(' ');
  if (cityLine) line2Parts.push(cityLine);
  const addressText = line2Parts.length > 0 ? line2Parts.join(', ') : communes.join(' · ') || 'Adresse non renseignée';

  const gpsText = center ? `${formatCoord(center[0], 'lat')} · ${formatCoord(center[1], 'lng')}` : null;

  const copy = async (text: string, key: 'addr' | 'gps') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
      toast.success('Copié');
    } catch {
      toast.error('Copie impossible');
    }
  };

  const gmapsUrl = center
    ? `https://www.google.com/maps/search/?api=1&query=${center[0]},${center[1]}`
    : null;
  const osmUrl = center
    ? `https://www.openstreetmap.org/?mlat=${center[0]}&mlon=${center[1]}#map=18/${center[0]}/${center[1]}`
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-slate-900/90 via-emerald-950/60 to-slate-950/90 backdrop-blur-xl shadow-lg">
      {/* barre décorative latérale */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400/80 via-emerald-500/60 to-emerald-800/40" />

      <div className="grid md:grid-cols-2 gap-4 p-4 md:p-5 pl-5 md:pl-6">
        {/* Colonne 1 : adresse */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/70 font-semibold">
                Adresse de la propriété
              </div>
              <div className="text-base md:text-lg font-serif italic text-white leading-tight mt-0.5">
                {nom}
              </div>
              <div className="text-sm text-white/85 mt-1">{addressText}</div>
              {communes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {communes.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-100 font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {sectionSummary.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/60 mt-2">
                  <Layers className="w-3 h-3" />
                  <span>{sectionSummary.join(' · ')}{parcelles.length > 4 ? ` · +${parcelles.length - 4}` : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne 2 : GPS + actions */}
        <div className="space-y-2 md:border-l md:border-white/10 md:pl-5">
          <div className="flex items-start gap-2">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/70 font-semibold">
                Coordonnées GPS
              </div>
              {gpsText ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm text-white/90">{gpsText}</span>
                  <button
                    onClick={() => copy(`${center![0]}, ${center![1]}`, 'gps')}
                    className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition"
                    aria-label="Copier les coordonnées"
                    title="Copier"
                  >
                    {copied === 'gps' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <div className="text-sm text-white/50 mt-1">Aucun centre défini</div>
              )}

              <div className="flex flex-wrap gap-1.5 mt-3">
                <button
                  onClick={() => copy(addressText, 'addr')}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 flex items-center gap-1.5 transition"
                >
                  {copied === 'addr' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  Copier l'adresse
                </button>
                {gmapsUrl && (
                  <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3 h-3" /> Google Maps
                  </a>
                )}
                {osmUrl && (
                  <a
                    href={osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3 h-3" /> OpenStreetMap
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyAddressCard;
