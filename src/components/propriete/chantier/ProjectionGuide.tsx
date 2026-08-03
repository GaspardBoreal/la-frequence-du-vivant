import React from 'react';
import { ArrowRight, MousePointerClick, Sprout, Wand2 } from 'lucide-react';
import { openScenographe } from '@/components/propriete/scenographe/scenographeStore';

interface Props {
  ouvrages: Array<{ id: string; label: string }>;
  /** Un scénario existe déjà sur le lot : la carte se replie. */
  hasScenario: boolean;
  scenarioId?: string | null;
  scenarioObjetId?: string | null;
}

const STEPS = [
  {
    icon: <Sprout className="h-3.5 w-3.5" />,
    title: 'Choisir l’ouvrage',
    text: 'Le Scénographe s’ouvre sur l’emprise réelle de l’ouvrage, fond satellite compris.',
  },
  {
    icon: <MousePointerClick className="h-3.5 w-3.5" />,
    title: 'Poser les espèces',
    text: 'Dans l’Herbier à gauche, cliquez une espèce, puis cliquez la carte : un sujet est planté.',
  },
  {
    icon: <ArrowRight className="h-3.5 w-3.5" />,
    title: 'Revenir ici',
    text: 'Le scénario devient l’« après projeté » : l’ICG se recalcule tout seul.',
  },
];

/**
 * « La table de projection » — apprendre en trois marches comment fabriquer
 * l'après, avec le bouton qui ouvre réellement l'outil sur le bon ouvrage.
 */
export const ProjectionGuide: React.FC<Props> = ({
  ouvrages,
  hasScenario,
  scenarioId,
  scenarioObjetId,
}) => {
  const [objetId, setObjetId] = React.useState<string>(ouvrages[0]?.id ?? '');
  React.useEffect(() => {
    if (!ouvrages.some((o) => o.id === objetId)) setObjetId(ouvrages[0]?.id ?? '');
  }, [ouvrages, objetId]);

  if (hasScenario) {
    return (
      <button
        type="button"
        onClick={() => openScenographe(scenarioObjetId || objetId, { scenarioId: scenarioId ?? undefined })}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11.5px] opacity-80 hover:opacity-100"
      >
        <Wand2 className="h-3.5 w-3.5 text-[#c8a24a]" /> Modifier la scénographie
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-[#c8a24a]/40 bg-[#c8a24a]/[0.07] p-3.5">
      <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] opacity-60">
        Comment fabriquer l’après
      </p>
      <ol className="grid gap-2 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-white/12 bg-black/15 p-2.5">
            <p className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em] opacity-55">
              {s.icon} Marche {i + 1}
            </p>
            <p className="mt-1 text-[12.5px] font-semibold">{s.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug opacity-70">{s.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ouvrages.length > 1 && (
          <select
            value={objetId}
            onChange={(e) => setObjetId(e.target.value)}
            className="rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-[11.5px] [&>option]:text-black"
          >
            {ouvrages.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          disabled={!objetId}
          onClick={() => openScenographe(objetId)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#c8a24a] bg-[#c8a24a]/20 px-3.5 py-1.5 text-[12px] font-medium text-[#e7d3a1] disabled:opacity-40"
        >
          <Wand2 className="h-3.5 w-3.5" /> Ouvrir le Scénographe
        </button>
        <span className="text-[10.5px] italic opacity-55">
          {ouvrages.length > 1
            ? 'Un scénario par ouvrage : composez-les l’un après l’autre.'
            : 'Aucune espèce posée pour l’instant sur ce lot.'}
        </span>
      </div>
    </section>
  );
};

export default ProjectionGuide;
