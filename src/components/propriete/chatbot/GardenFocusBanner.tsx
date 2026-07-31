import React from 'react';
import { Leaf, Target, X } from 'lucide-react';
import { useProprieteChatFocus, proprieteChatFocus } from './proprieteChatFocus';
import { useProprieteObjets } from '@/hooks/propriete/usePropertyObjets';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import { FOCUS_RADII } from './ouvragePrompts';

/**
 * Bandeau de cadrage affiché en tête du chat : l'utilisateur voit d'un coup
 * d'œil sur quoi l'IA est braquée et peut revenir à la propriété entière.
 */
export function GardenFocusBanner({ proprieteId }: { proprieteId?: string }) {
  const focus = useProprieteChatFocus();
  const { objets } = useProprieteObjets(proprieteId);
  const objet = React.useMemo(
    () => (focus.objetId ? (objets ?? []).find((o) => o.id === focus.objetId) ?? null : null),
    [objets, focus.objetId],
  );

  if (!objet) return null;
  const tool = TOOL_BY_KEY[objet.outil_key];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[hsl(var(--ds-gold))]/30 bg-[hsl(var(--ds-forest-deep))] px-3 py-2 text-[hsl(var(--ds-cream))]">
      <Target className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ds-gold))]" />
      <span className="min-w-0 truncate text-[11px]">
        Cadré sur <span className="font-semibold">{objet.nom || tool?.label || 'ouvrage'}</span>
        {tool && !objet.nom ? '' : tool ? ` · ${tool.label.toLowerCase()}` : ''}
      </span>
      <span className="ml-auto flex items-center gap-1">
        {FOCUS_RADII.map((r) => (
          <button
            key={r}
            onClick={() => proprieteChatFocus.setRadius(r)}
            className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
              focus.radiusM === r
                ? 'bg-[hsl(var(--ds-gold))] text-[hsl(var(--ds-forest-deep))]'
                : 'border border-[hsl(var(--ds-cream))]/25 hover:border-[hsl(var(--ds-gold))]/60'
            }`}
          >
            {r} m
          </button>
        ))}
        <button
          onClick={() => proprieteChatFocus.setObjet(null)}
          title="Revenir à la propriété entière"
          className="ml-1 rounded-full p-1 opacity-70 hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      </span>
      <span className="flex w-full items-center gap-1 text-[9.5px] opacity-60">
        <Leaf className="h-2.5 w-2.5" /> Le rayon d’écoute filtre les observations transmises avec le contexte 🏗️.
      </span>
    </div>
  );
}

export default GardenFocusBanner;
