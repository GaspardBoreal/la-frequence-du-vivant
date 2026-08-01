import React from 'react';
import { Circle, Hexagon, RectangleHorizontal, RotateCw, Ruler, Sparkles } from 'lucide-react';
import type { ObjetTransformApi } from '@/hooks/propriete/useObjetTransform';
import {
  footprintArea,
  footprintRing,
  fmtMeters,
  presetsFor,
  type FootprintShape,
} from '@/lib/footprintGeom';
import { TOOL_BY_KEY } from '@/lib/paysageTools';

const SHAPES: Array<{ key: FootprintShape; label: string; Icon: any }> = [
  { key: 'circle', label: 'Rond', Icon: Circle },
  { key: 'rect', label: 'Rectangle', Icon: RectangleHorizontal },
  { key: 'hex', label: 'Pans coupés', Icon: Hexagon },
];

/**
 * « Donner l'emprise réelle » : transforme un ouvrage ponctuel (citerne,
 * composteur, ruche…) en une emprise polygonale à la dimension réelle du
 * terrain, avec gabarits métier, dimensions en mètres et orientation.
 * Le point reste le centre de l'emprise ; ensuite les poignées du mode
 * Transformer prennent le relais.
 */
export const EmpriseRealPanel: React.FC<{ api: ObjetTransformApi; color: string }> = ({
  api,
  color,
}) => {
  const objet = api.objet;
  const toolKey = objet?.outil_key;
  const presets = React.useMemo(() => presetsFor(toolKey), [toolKey]);

  /** Centre figé : le point d'origine posé sur la carte. */
  const centerRef = React.useRef<[number, number] | null>(null);
  const [open, setOpen] = React.useState(false);
  const [shape, setShape] = React.useState<FootprintShape>('circle');
  const [a, setA] = React.useState(1.6);
  const [b, setB] = React.useState(1.2);
  const [rot, setRot] = React.useState(0);
  const converted = React.useRef(false);

  const objetId = objet?.id ?? null;
  React.useEffect(() => {
    centerRef.current = null;
    converted.current = false;
    setOpen(false);
    setShape('circle');
    setA(1.6);
    setB(1.2);
    setRot(0);
  }, [objetId]);

  // Mémorise le centre dès l'entrée en mode Transformer d'un point.
  if (objet && !centerRef.current && api.coords.length === 1) {
    centerRef.current = api.coords[0];
  }

  const spec = React.useMemo(() => ({ shape, a, b, rotation: rot }), [shape, a, b, rot]);

  const applySpec = React.useCallback(() => {
    const center = centerRef.current;
    if (!center) return;
    const ring = footprintRing(center, spec);
    const poly = { type: 'Polygon', coordinates: [ring] };
    if (!converted.current) {
      api.morph(poly);
      converted.current = true;
    } else {
      api.preview(ring);
    }
  }, [api, spec]);

  // Aperçu temps réel dès que le panneau est ouvert.
  React.useEffect(() => {
    if (!open) return;
    applySpec();
  }, [open, applySpec]);

  if (!objet) return null;
  // Le panneau n'a de sens que pour un ouvrage né ponctuel.
  if (!converted.current && api.kind !== 'Point') return null;

  const tool = toolKey ? TOOL_BY_KEY[toolKey] : null;
  const area = footprintArea(spec);

  if (!open) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[600] flex justify-center px-3">
        <button
          onClick={() => setOpen(true)}
          className="pointer-events-auto group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] shadow-2xl backdrop-blur transition"
          style={{
            borderColor: `${color}66`,
            backgroundColor: 'hsl(var(--ds-cream) / 0.96)',
            color: 'hsl(var(--ds-forest-deep))',
          }}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[12px]"
            style={{ backgroundColor: `${color}22` }}
          >
            {tool?.glyph ?? '◆'}
          </span>
          <span className="font-serif italic">Donner l'emprise réelle</span>
          <Sparkles
            className="h-3.5 w-3.5 opacity-70 transition group-hover:rotate-12"
            style={{ color }}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[600] flex justify-center px-3">
      <div className="pointer-events-auto w-full max-w-xl rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/97 p-4 shadow-2xl backdrop-blur">
        {/* En-tête */}
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-[13px]"
            style={{ backgroundColor: `${color}22` }}
          >
            {tool?.glyph ?? '◆'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[14px] italic text-[hsl(var(--ds-forest-deep))]">
              {objet.nom || tool?.label || 'Ouvrage'} · emprise réelle
            </p>
            <p className="text-[10.5px] uppercase tracking-[0.18em] text-[hsl(var(--ds-forest-deep))]/55">
              le point devient une surface à l'échelle du jardin
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] tabular-nums"
            style={{ backgroundColor: `${color}18`, color: 'hsl(var(--ds-forest-deep))' }}
          >
            ≈ {area < 10 ? area.toFixed(2) : Math.round(area)} m²
          </span>
        </div>

        {/* Gabarits métier */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setShape(p.spec.shape);
                setA(p.spec.a);
                setB(p.spec.b ?? p.spec.a);
              }}
              className="rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] transition hover:border-[hsl(var(--ds-forest))]/60 hover:bg-[hsl(var(--ds-forest))]/5"
            >
              {p.label}
              {p.hint && <span className="ml-1 opacity-55">{p.hint}</span>}
            </button>
          ))}
        </div>

        {/* Forme */}
        <div className="mb-3 flex gap-1.5">
          {SHAPES.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setShape(key)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] transition ${
                shape === key
                  ? 'border-transparent text-[hsl(var(--ds-cream))]'
                  : 'border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60'
              }`}
              style={shape === key ? { backgroundColor: color } : undefined}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Dimensions */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[10.5px] uppercase tracking-[0.16em] text-[hsl(var(--ds-forest-deep))]/60">
              <Ruler className="h-3 w-3" />
              {shape === 'rect' ? 'Longueur' : 'Diamètre'} · {fmtMeters(a)}
            </span>
            <input
              type="range"
              min={0.3}
              max={30}
              step={0.1}
              value={a}
              onChange={(e) => setA(Number(e.target.value))}
              className="w-full accent-[hsl(var(--ds-forest))]"
            />
          </label>

          {shape === 'rect' ? (
            <label className="block">
              <span className="mb-1 flex items-center gap-1 text-[10.5px] uppercase tracking-[0.16em] text-[hsl(var(--ds-forest-deep))]/60">
                <Ruler className="h-3 w-3 rotate-90" /> Largeur · {fmtMeters(b)}
              </span>
              <input
                type="range"
                min={0.3}
                max={30}
                step={0.1}
                value={b}
                onChange={(e) => setB(Number(e.target.value))}
                className="w-full accent-[hsl(var(--ds-forest))]"
              />
            </label>
          ) : (
            <div className="hidden sm:block" />
          )}

          {shape !== 'circle' && (
            <label className="block sm:col-span-2">
              <span className="mb-1 flex items-center gap-1 text-[10.5px] uppercase tracking-[0.16em] text-[hsl(var(--ds-forest-deep))]/60">
                <RotateCw className="h-3 w-3" /> Orientation · {Math.round(rot)}°
              </span>
              <input
                type="range"
                min={0}
                max={180}
                step={1}
                value={rot}
                onChange={(e) => setRot(Number(e.target.value))}
                className="w-full accent-[hsl(var(--ds-forest))]"
              />
            </label>
          )}
        </div>

        <p className="mt-3 text-[10.5px] italic text-[hsl(var(--ds-forest-deep))]/60">
          Ajustez ici la taille réelle, puis affinez au doigt avec les poignées de la forme.
          « Valider » en haut de carte scelle l'emprise.
        </p>
      </div>
    </div>
  );
};

export default EmpriseRealPanel;
