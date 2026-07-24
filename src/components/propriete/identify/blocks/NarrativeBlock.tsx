import React from 'react';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';

export const NarrativeBlock: React.FC<{
  conclusion: string;
  onChangeConclusion: (v: string) => void;
  notes: string;
  onChangeNotes: (v: string) => void;
  autoNarrative: string;
  index?: number;
}> = ({ conclusion, onChangeConclusion, notes, onChangeNotes, autoNarrative, index = 3 }) => {
  return (
    <AnalyzeCard
      number={4}
      category="Narration"
      title="Ce que la flore raconte"
      subtitle="Un texte auto-généré à partir de vos observations. Reformulez-le librement pour qu'il vous ressemble."
      index={index}
    >
      <div className="space-y-4">
        {autoNarrative && (
          <div className="rounded-xl bg-[hsl(var(--ds-forest))]/6 border border-[hsl(var(--ds-forest))]/20 p-3 text-[12px] italic text-[hsl(var(--ds-forest-deep))]/80 leading-relaxed">
            <div className="text-[9px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70 mb-1">
              Suggestion
            </div>
            {autoNarrative}
          </div>
        )}
        <div>
          <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
            Conclusion floristique
          </label>
          <textarea
            rows={3}
            value={conclusion}
            onChange={(e) => onChangeConclusion(e.target.value)}
            placeholder="Ce que la végétation vous apprend du lieu…"
            className="mt-1 w-full rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3 text-sm text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-forest))] resize-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
            Notes personnelles
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="Anecdotes de terrain, doutes, plantes à revérifier…"
            className="mt-1 w-full rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3 text-sm text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-forest))] resize-none"
          />
        </div>
      </div>
    </AnalyzeCard>
  );
};
