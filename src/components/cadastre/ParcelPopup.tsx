import React, { useRef, useState } from 'react';
import { Popup } from 'react-leaflet';
import { MapPin, Layers, CloudSun, Loader2, Copy, Check } from 'lucide-react';
import { ParcelInfo } from './cadastreUtils';
import { useParcelWeather, summarizeWeather } from './useParcelWeather';

interface ParcelPopupProps {
  info: ParcelInfo;
  centroid: { lat: number; lng: number } | null;
}

const ParcelPopup: React.FC<ParcelPopupProps> = ({ info, centroid }) => {
  const { data: weather, isLoading: loadingWeather } = useParcelWeather(
    centroid?.lat ?? null,
    centroid?.lng ?? null,
  );
  const w = summarizeWeather(weather);
  const [copied, setCopied] = useState<'lat' | 'lng' | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const hasCoords =
    centroid &&
    Number.isFinite(centroid.lat) &&
    Number.isFinite(centroid.lng);

  const latStr = hasCoords ? centroid!.lat.toFixed(6) : '';
  const lngStr = hasCoords ? centroid!.lng.toFixed(6) : '';

  const copyValue = async (kind: 'lat' | 'lng', value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(kind);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${latStr},${lngStr}`
    : '#';
  const earthUrl = hasCoords
    ? `https://earth.google.com/web/@${latStr},${lngStr},150a,500d,35y,0h,45t,0r`
    : '#';

  return (
    <Popup className="cadastre-parcel-popup" pane="cadastre-popup" maxWidth={300} minWidth={240} autoPan={true}>
      <div className="bg-black/85 backdrop-blur-xl rounded-xl p-3 -m-3 text-white space-y-3">
        {/* Localisation */}
        <section>
          <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] uppercase tracking-wide mb-1">
            <MapPin className="w-3 h-3" /> Localisation
          </div>
          <div className="text-xs text-white/85 space-y-0.5">
            {info.commune && <div>{info.commune}{info.postalCode ? ` (${info.postalCode})` : ''}</div>}
            {info.communeCode && <div className="text-white/60">Code INSEE&nbsp;: {info.communeCode}</div>}
            {info.country && <div className="text-white/60">{info.country}</div>}
          </div>
        </section>

        {/* Cadastre */}
        <section>
          <div className="flex items-center gap-1.5 text-amber-300 text-[11px] uppercase tracking-wide mb-1">
            <Layers className="w-3 h-3" /> Cadastre
          </div>
          <div className="text-xs text-white/85 space-y-0.5">
            {info.parcelId && <div className="font-mono break-all">{info.parcelId}</div>}
            <div className="text-white/60">
              {info.prefix && <>Préfixe {info.prefix} · </>}
              {info.section && <>Section {info.section} · </>}
              {info.number && <>N° {info.number}</>}
            </div>
            {(info.surfaceM2 || info.surfaceHa) && (
              <div className="text-white/70">
                Surface&nbsp;:{' '}
                {info.surfaceHa ? `${info.surfaceHa.toFixed(4)} ha` : `${info.surfaceM2} m²`}
              </div>
            )}
            {hasCoords && (
              <>
                <div className="flex items-center gap-1.5 text-white/70 pt-0.5">
                  <span>GPS&nbsp;:</span>
                  <span className="font-mono text-white/85">{coordsStr}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copier les coordonnées GPS"
                    title={copied ? 'Copié !' : 'Copier les coordonnées'}
                    className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-white/10 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-300 transition-all" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/60 hover:text-white/90 transition-all" />
                    )}
                  </button>
                </div>
                <div className="text-white/70">
                  Découvrir sur&nbsp;:{' '}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline transition-colors"
                  >
                    Google Maps
                  </a>
                  <span className="text-white/40"> · </span>
                  <a
                    href={earthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline transition-colors"
                  >
                    Google Earth
                  </a>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Météo */}
        <section>
          <div className="flex items-center gap-1.5 text-sky-300 text-[11px] uppercase tracking-wide mb-1">
            <CloudSun className="w-3 h-3" /> Relevés météo (30j)
          </div>
          {loadingWeather ? (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Loader2 className="w-3 h-3 animate-spin" /> Chargement…
            </div>
          ) : w.tempMean != null ? (
            <div className="text-xs text-white/85 space-y-0.5">
              <div>Température moyenne&nbsp;: {w.tempMean.toFixed(1)}°C</div>
              {w.tempMin != null && w.tempMax != null && (
                <div className="text-white/60">Min {w.tempMin.toFixed(1)}°C · Max {w.tempMax.toFixed(1)}°C</div>
              )}
              {w.precipSum != null && <div className="text-white/70">Précipitations cumulées&nbsp;: {w.precipSum.toFixed(1)} mm</div>}
              {w.humidityMean != null && <div className="text-white/60">Humidité moy.&nbsp;: {w.humidityMean.toFixed(0)}%</div>}
            </div>
          ) : (
            <div className="text-xs text-white/50">Indisponible</div>
          )}
        </section>
      </div>
    </Popup>
  );
};

export default ParcelPopup;
