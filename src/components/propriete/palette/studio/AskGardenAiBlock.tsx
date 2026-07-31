import React from 'react';
import { Leaf, Target, MessageSquareQuote } from 'lucide-react';
import { openGardenAi, useProprieteChatFocus } from '@/components/propriete/chatbot/proprieteChatFocus';
import { promptsForOuvrage, FOCUS_RADII } from '@/components/propriete/chatbot/ouvragePrompts';

interface Props {
  objetId: string;
  outilKey: string;
  toolLabel: string;
  nom?: string | null;
}

/**
 * « Interroger l'IA de Jardin sur cet ouvrage » : cadre l'IA sur l'objet
 * sélectionné (+ rayon d'écoute) et propose des amorces contextuelles.
 * Frugal : seule l'ouverture est déclenchée, les données ne partent que
 * via les contextes activés dans la Console.
 */
export const AskGardenAiBlock: React.FC<Props> = ({ objetId, outilKey, toolLabel, nom }) => {
  const focus = useProprieteChatFocus();
  const [radius, setRadius] = React.useState(focus.radiusM || 25);
  const prompts = React.useMemo(
    () => promptsForOuvrage(outilKey, toolLabel, nom),
    [outilKey, toolLabel, nom],
  );

  const who = nom?.trim() ? `« ${nom.trim()} » (${toolLabel.toLowerCase()})` : toolLabel.toLowerCase();
  const ask = (prefill?: string) =>
    openGardenAi({
      objetId,
      radiusM: radius,
      prefill: prefill ?? `Ouvrage cadré : ${who}, rayon d’écoute ${radius} m. `,
    });

  return (
    <div className="rounded-xl border border-[hsl(var(--ds-gold))]/45 bg-[hsl(var(--ds-forest-deep))]/[0.04] p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Leaf className="h-3.5 w-3.5 text-[hsl(var(--ds-forest))]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
          Interroger l’IA de Jardin
        </span>
      </div>

      <button
        onClick={() => ask()}
        className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--ds-gold))]/70 bg-[hsl(var(--ds-forest-deep))] px-3 py-1.5 text-[11px] font-medium text-[hsl(var(--ds-cream))] transition-opacity hover:opacity-90"
      >
        <MessageSquareQuote className="h-3.5 w-3.5 text-[hsl(var(--ds-gold))]" />
        Cadrer l’IA sur cet ouvrage
      </button>

      <div className="mb-2">
        <span className="mb-1 flex items-center gap-1 text-[9.5px] uppercase tracking-wider opacity-55">
          <Target className="h-2.5 w-2.5" /> Rayon d’écoute
        </span>
        <div className="flex gap-1">
          {FOCUS_RADII.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRadius(r);
                if (focus.objetId === objetId) openGardenAi({ objetId, radiusM: r });
              }}
              className={`flex-1 rounded-full border px-1 py-1 text-[10px] transition-colors ${
                radius === r
                  ? 'border-transparent bg-[hsl(var(--ds-forest))]/85 text-[hsl(var(--ds-cream))]'
                  : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/60'
              }`}
            >
              {r} m
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        {prompts.map((p) => (
          <button
            key={p.label}
            onClick={() => ask(p.text)}
            className="flex w-full items-start gap-1.5 rounded-lg border border-[hsl(var(--ds-line))] bg-white/50 px-2 py-1.5 text-left text-[10px] leading-tight transition-colors hover:border-[hsl(var(--ds-forest))]/60 hover:bg-[hsl(var(--ds-forest))]/5"
          >
            <span className="text-[11px] leading-none">{p.emoji}</span>
            <span className="min-w-0">
              <span className="block font-semibold">{p.label}</span>
              <span className="block opacity-60 line-clamp-2">{p.text}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AskGardenAiBlock;
