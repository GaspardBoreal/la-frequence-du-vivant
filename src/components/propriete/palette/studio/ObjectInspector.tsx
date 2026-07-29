import React from 'react';
import { Trash2, Copy, X, MapPin } from 'lucide-react';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import type { ProprieteCalque } from '@/hooks/propriete/usePropertyCalques';
import type { ProprieteZone } from '@/hooks/propriete/usePropertyZones';
import { fmtMeasure, measureFor, geometryCenter } from './geoMetrics';

interface Props {
  objet: ProprieteObjet;
  calques: ProprieteCalque[];
  zones: ProprieteZone[];
  onPatch: (patch: Partial<ProprieteObjet>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
  readOnly?: boolean;
}

const field =
  'w-full rounded-md border border-[hsl(var(--ds-line))] bg-white/70 px-2 py-1 text-[11px] outline-none focus:border-[hsl(var(--ds-forest))]/50';

export const ObjectInspector: React.FC<Props> = ({
  objet,
  calques,
  zones,
  onPatch,
  onDelete,
  onDuplicate,
  onClose,
  readOnly,
}) => {
  const tool = TOOL_BY_KEY[objet.outil_key];
  const [nom, setNom] = React.useState(objet.nom || '');
  const [note, setNote] = React.useState(objet.meta?.note || '');

  React.useEffect(() => {
    setNom(objet.nom || '');
    setNote(objet.meta?.note || '');
  }, [objet.id]);

  if (!tool) return null;
  const value = measureFor(tool.unit, objet.geometry);
  const center = geometryCenter(objet.geometry);

  return (
    <div className="rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 p-3 text-[hsl(var(--ds-forest-deep))] shadow-lg backdrop-blur">
      <div className="mb-2 flex items-start gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[14px]"
          style={{ backgroundColor: `${tool.color}22` }}
        >
          {tool.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold leading-tight">{tool.label}</p>
          <p className="text-[10px] opacity-60">
            {tool.unit !== 'u' ? fmtMeasure(tool.unit, value) : 'ponctuel'}
            {center ? ` · ${center[0].toFixed(5)}, ${center[1].toFixed(5)}` : ''}
          </p>
        </div>
        <button onClick={onClose} className="rounded p-1 opacity-50 hover:opacity-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">Nom</span>
          <input
            className={field}
            value={nom}
            disabled={readOnly}
            onChange={(e) => setNom(e.target.value)}
            onBlur={() => onPatch({ nom: nom.trim() || null })}
            placeholder={tool.label}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
              Calque
            </span>
            <select
              className={field}
              disabled={readOnly}
              value={objet.calque_id ?? ''}
              onChange={(e) => onPatch({ calque_id: e.target.value || null })}
            >
              <option value="">—</option>
              {calques.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
              Emplacement
            </span>
            <select
              className={field}
              disabled={readOnly}
              value={objet.zone_id ?? ''}
              onChange={(e) => onPatch({ zone_id: e.target.value || null })}
            >
              <option value="">Hors emplacement</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nom}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
            Intention / note de chantier
          </span>
          <textarea
            className={`${field} min-h-[52px] resize-y`}
            disabled={readOnly}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onPatch({ meta: { ...objet.meta, note: note.trim() || null } })}
            placeholder="Pourquoi ici ? à quelle saison ?"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider opacity-55">Couleur</span>
          <input
            type="color"
            disabled={readOnly}
            value={(objet.style?.color as string) || tool.color}
            onChange={(e) => onPatch({ style: { ...objet.style, color: e.target.value } })}
            className="h-6 w-10 cursor-pointer rounded border border-[hsl(var(--ds-line))] bg-transparent"
          />
          {objet.meta?.inspiration && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-forest))]/10 px-2 py-0.5 text-[9px]">
              <MapPin className="h-2.5 w-2.5" /> inspiration
            </span>
          )}
        </label>
      </div>

      {!readOnly && (
        <div className="mt-3 flex gap-1.5">
          <button
            onClick={onDuplicate}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-[hsl(var(--ds-line))] py-1 text-[10px] hover:border-[hsl(var(--ds-forest))]/60"
          >
            <Copy className="h-3 w-3" /> Dupliquer
          </button>
          <button
            onClick={onDelete}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-red-500/30 py-1 text-[10px] text-red-600 hover:bg-red-500/10"
          >
            <Trash2 className="h-3 w-3" /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
};

export default ObjectInspector;
