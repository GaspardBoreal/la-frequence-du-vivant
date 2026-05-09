import React from 'react';
import { Popup } from 'react-leaflet';
import { MapPin, Layers, CloudSun, Loader2 } from 'lucide-react';
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

  return (
    <Popup className="cadastre-parcel-popup" maxWidth={300} minWidth={240} autoPan={true}>
      <style>{`
        .leaflet-pane.leaflet-popup-pane { z-index: 1000 !important; }
        .cadastre-parcel-popup { z-index: 1000 !important; }
        .cadastre-parcel-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.45) !important;
          padding: 0 !important;
          border-radius: 12px !important;
        }
        .cadastre-parcel-popup .leaflet-popup-content { margin: 0 !important; }
        .cadastre-parcel-popup .leaflet-popup-tip { background: rgba(0,0,0,0.85) !important; }
        .cadastre-parcel-popup .leaflet-popup-close-button {
          top: 6px !important;
          right: 6px !important;
          width: 22px !important;
          height: 22px !important;
          line-height: 20px !important;
          text-align: center !important;
          color: #fff !important;
          background: rgba(255,255,255,0.12) !important;
          border: 1px solid rgba(255,255,255,0.35) !important;
          border-radius: 9999px !important;
          backdrop-filter: blur(6px);
          font-size: 16px !important;
          font-weight: 400 !important;
          padding: 0 !important;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .cadastre-parcel-popup .leaflet-popup-close-button:hover {
          background: rgba(239,68,68,0.85) !important;
          border-color: rgba(255,255,255,0.6) !important;
          transform: scale(1.08);
        }
      `}</style>
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
