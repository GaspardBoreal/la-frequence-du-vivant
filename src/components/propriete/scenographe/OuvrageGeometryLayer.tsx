import React from 'react';
import { GeoJSON, Tooltip } from 'react-leaflet';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import { geometryAreaM2, fmtArea } from '@/components/propriete/palette/studio/geoMetrics';

interface Props {
  objets: ProprieteObjet[];
  activeId: string;
  /** Nombre de sujets posés sur l'ouvrage actif (affiché dans l'infobulle). */
  activePlantings?: number;
  /** Un sujet de l'herbier est armé : la pose reste prioritaire sur la sélection. */
  placing?: boolean;
  onSelectOuvrage: (id: string) => void;
  onSelectSelf?: () => void;
}

/**
 * Les emprises du lieu, désignables à la main : l'ouvrage travaillé en trait
 * plein doré, les voisins en filet discret — un clic suffit pour changer de
 * sujet sans quitter le plan.
 */
export const OuvrageGeometryLayer: React.FC<Props> = ({
  objets,
  activeId,
  activePlantings = 0,
  placing,
  onSelectOuvrage,
  onSelectSelf,
}) => (
  <>
    {objets
      .filter((o) => o.geometry)
      .map((o) => {
        const active = o.id === activeId;
        const tool = TOOL_BY_KEY[o.outil_key];
        const color = active ? tool?.color || '#c8a24a' : '#e8e0cc';
        const area = geometryAreaM2(o.geometry);
        return (
          <GeoJSON
            key={`${o.id}:${active ? 'on' : 'off'}`}
            data={o.geometry as any}
            interactive={!placing}
            bubblingMouseEvents={false}
            style={{
              color,
              weight: active ? 2.4 : 1.2,
              opacity: active ? 1 : 0.55,
              fillColor: color,
              fillOpacity: active ? 0.06 : 0.03,
              dashArray: active ? undefined : '4 5',
            }}
            eventHandlers={{
              click: (e: any) => {
                if (placing) return;
                e.originalEvent?.stopPropagation?.();
                if (active) onSelectSelf?.();
                else onSelectOuvrage(o.id);
              },
              mouseover: (e: any) => e.target.setStyle({ weight: 3.4, fillOpacity: 0.14 }),
              mouseout: (e: any) =>
                e.target.setStyle({
                  weight: active ? 2.4 : 1.2,
                  fillOpacity: active ? 0.06 : 0.03,
                }),
            }}
          >
            <Tooltip sticky direction="top" opacity={0.95}>
              <span className="text-[11px]">
                <strong>{o.nom?.trim() || tool?.label || 'Ouvrage'}</strong>
                {area > 0 && <> · {fmtArea(area)}</>}
                {active ? (
                  <> · {activePlantings} sujet{activePlantings > 1 ? 's' : ''} posé{activePlantings > 1 ? 's' : ''}</>
                ) : (
                  <> · cliquer pour composer</>
                )}
              </span>
            </Tooltip>
          </GeoJSON>
        );
      })}
  </>
);

export default OuvrageGeometryLayer;
