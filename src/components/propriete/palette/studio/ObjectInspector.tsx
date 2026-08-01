import React from 'react';
import { Trash2, Copy, X, MapPin, Scaling } from 'lucide-react';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import { isChromaticTool, teintesOf, floraisonOf } from '@/lib/nuancierKb';
import NuancierPicker from './NuancierPicker';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import type { ProprieteCalque } from '@/hooks/propriete/usePropertyCalques';
import type { ProprieteZone } from '@/hooks/propriete/usePropertyZones';
import { fmtMeasure, measureFor, geometryCenter } from './geoMetrics';
import ObjetPhotoStrip from './photos/ObjetPhotoStrip';
import type { ObjetPhoto } from '@/hooks/propriete/useObjetPhotos';
import SoilLinkBlock from './SoilLinkBlock';
import AskGardenAiBlock from './AskGardenAiBlock';
import { openScenographe } from '@/components/propriete/scenographe/scenographeStore';
import { useOuvrageScenarios } from '@/hooks/propriete/useOuvrageScenarios';

import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

interface Props {
  /** Propriété courante — permet de relire les scénographies de l'ouvrage. */
  proprieteId?: string;
  /** Ouvre la bibliothèque des scénographies de l'Atelier. */
  onOpenScenarioLibrary?: () => void;
  objet: ProprieteObjet;
  calques: ProprieteCalque[];
  zones: ProprieteZone[];
  onPatch: (patch: Partial<ProprieteObjet>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
  /** Active le mode Transformer (déplacer / redimensionner / pivoter). */
  onTransform?: () => void;
  /** Mesure live quand le mode Transformer est actif sur cet objet. */
  transformMeasure?: number | null;
  readOnly?: boolean;
  /** Carnet photo de l'ouvrage (facultatif). */
  photos?: ObjetPhoto[];
  photoUploading?: { done: number; total: number } | null;
  onPhotoUpload?: (files: File[]) => void;
  onPhotoRemove?: (photo: ObjetPhoto) => void;
  onPhotoCaption?: (photoId: string, caption: string) => void;
  onPhotoReorder?: (orderedIds: string[]) => void;
  /** Prélèvements de sol de l'étape « J'analyse » (ancrage agronomique). */
  soilSamples?: SoilSample[];
}




const field =
  'w-full rounded-md border border-[hsl(var(--ds-line))] bg-white/70 px-2 py-1 text-[11px] outline-none focus:border-[hsl(var(--ds-forest))]/50';

export const ObjectInspector: React.FC<Props> = ({
  proprieteId,
  onOpenScenarioLibrary,
  objet,
  calques,
  zones,
  onPatch,
  onDelete,
  onDuplicate,
  onClose,
  onTransform,
  transformMeasure,
  readOnly,
  photos,
  photoUploading,
  onPhotoUpload,
  onPhotoRemove,
  onPhotoCaption,
  onPhotoReorder,
  soilSamples,
}) => {

  const tool = TOOL_BY_KEY[objet.outil_key];
  const [nom, setNom] = React.useState(objet.nom || '');
  const [note, setNote] = React.useState(objet.meta?.note || '');
  const transforming = transformMeasure != null;
  const { scenarios } = useOuvrageScenarios(proprieteId, objet.id);

  React.useEffect(() => {
    setNom(objet.nom || '');
    setNote(objet.meta?.note || '');
  }, [objet.id]);

  if (!tool) return null;
  const value = transforming ? transformMeasure! : measureFor(tool.unit, objet.geometry);
  const center = geometryCenter(objet.geometry);

  return (
    <div
      className="ds-inspector-in relative flex max-h-full flex-col overflow-hidden rounded-t-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/96 text-[hsl(var(--ds-forest-deep))] shadow-2xl backdrop-blur sm:rounded-xl"
      role="dialog"
      aria-label={`Édition · ${tool.label}`}
    >
      {/* Liseré : relie visuellement le panneau à l'objet sélectionné sur la carte */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: tool.color }}
      />

      {/* En-tête collant : l'identité de l'objet reste lisible pendant le défilement */}
      <div className="sticky top-0 z-10 flex items-start gap-2 border-b border-[hsl(var(--ds-line))]/70 bg-[hsl(var(--ds-cream))]/96 px-3 py-2.5 backdrop-blur">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[14px]"
          style={{ backgroundColor: `${tool.color}22` }}
        >
          {tool.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold leading-tight">{tool.label}</p>
          <p className="truncate text-[10px] opacity-60">
            {tool.unit !== 'u' ? fmtMeasure(tool.unit, value) : 'ponctuel'}
            {center ? ` · ${center[0].toFixed(5)}, ${center[1].toFixed(5)}` : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer l'éditeur"
          className="rounded p-1 opacity-50 transition-opacity hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">

        {!readOnly && onTransform && (
          <button
            onClick={onTransform}
            disabled={transforming}
            className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
              transforming
                ? 'border-[hsl(var(--ds-forest))]/60 bg-[hsl(var(--ds-forest))]/10'
                : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/60 hover:bg-[hsl(var(--ds-forest))]/5'
            }`}
          >
            <Scaling className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ds-forest))]" />
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold leading-tight">
                {transforming ? 'Transformation en cours…' : 'Transformer'}
              </span>
              <span className="block text-[9.5px] leading-tight opacity-60">
                déplacer · redimensionner · pivoter · lisser
              </span>
            </span>
          </button>
        )}



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

        {soilSamples && soilSamples.length > 0 && (
          <SoilLinkBlock
            outilKey={objet.outil_key}
            geometry={objet.geometry}
            meta={objet.meta}
            samples={soilSamples}
            readOnly={readOnly}
            onChange={(meta) => onPatch({ meta })}
          />
        )}

        <AskGardenAiBlock
          objetId={objet.id}
          outilKey={objet.outil_key}
          toolLabel={tool?.label ?? 'ouvrage'}
          nom={objet.nom}
        />

        {/* Les scénographies déjà composées pour cet ouvrage */}
        {scenarios.length > 0 && (
          <div className="rounded-lg border border-[hsl(var(--ds-line))] bg-white/50 px-2 py-1.5">
            <p className="mb-1 flex items-center gap-1 text-[9.5px] uppercase tracking-wider opacity-55">
              🎬 {scenarios.length} scénographie{scenarios.length > 1 ? 's' : ''}
              {onOpenScenarioLibrary && (
                <button
                  onClick={onOpenScenarioLibrary}
                  className="ml-auto rounded-full px-1.5 text-[9.5px] normal-case tracking-normal underline decoration-dotted opacity-80 hover:opacity-100"
                >
                  Toutes…
                </button>
              )}
            </p>
            <div className="flex flex-wrap gap-1">
              {scenarios.slice(-3).map((s) => (
                <button
                  key={s.id}
                  onClick={() => openScenographe(objet.id, { scenarioId: s.id })}
                  title={`Rouvrir « ${s.nom} »`}
                  className="max-w-full truncate rounded-full border border-[#c8a24a]/50 bg-[#c8a24a]/10 px-2 py-0.5 text-[10px] hover:bg-[#c8a24a]/20"
                >
                  {s.retenu ? '★ ' : ''}
                  {s.nom} · {s.plantings?.length || 0}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Composer l'ouvrage : poser de vraies espèces à la vraie échelle */}
        <button
          type="button"
          onClick={() => openScenographe(objet.id)}
          className="flex w-full items-center gap-2 rounded-lg border border-[#c8a24a]/45 bg-gradient-to-r from-[#c8a24a]/12 to-transparent px-2.5 py-2 text-left transition-colors hover:border-[#c8a24a] hover:from-[#c8a24a]/20"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#c8a24a]/20 text-[12px]">
            🎬
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold leading-tight">
              Ouvrir le Scénographe
            </span>
            <span className="block text-[9.5px] leading-tight opacity-60">
              Composer la palette sur l’emprise réelle, an 0 → an 10
            </span>
          </span>
        </button>



        {isChromaticTool(objet.outil_key) && (
          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-wider opacity-55">
              Nuancier du massif
            </span>
            <NuancierPicker
              readOnly={readOnly}
              teintes={teintesOf(objet.meta)}
              floraison={floraisonOf(objet.meta)}
              onChange={(patch) => onPatch({ meta: { ...objet.meta, ...patch } as any })}
              onApplyName={(n) => {
                setNom(n);
                onPatch({ nom: n });
              }}
            />
          </div>
        )}

        {onPhotoUpload && (
          <ObjetPhotoStrip
            title={nom || tool.label}
            photos={photos ?? []}
            readOnly={readOnly}
            uploading={photoUploading}
            onUpload={onPhotoUpload}
            onRemove={(p) => onPhotoRemove?.(p)}
            onCaption={(id, c) => onPhotoCaption?.(id, c)}
            onReorder={(ids) => onPhotoReorder?.(ids)}
          />
        )}


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
        <div className="flex gap-1.5 border-t border-[hsl(var(--ds-line))]/70 bg-[hsl(var(--ds-cream))]/96 px-3 py-2.5">
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
