import React from 'react';
import { Megaphone, Check } from 'lucide-react';
import { useCrmCampaigns } from '@/hooks/useCrmCampaigns';
import { CAMPAIGN_STATUT_OPTIONS } from '@/types/crmCampaign';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  /** nombre d'opportunités par campagne (id -> n) */
  counts?: Map<string, number>;
}

/** Filtre « Campagnes » du Pipeline : multi-sélection, vide = toutes. */
export const PipelineCampaignsFilter: React.FC<Props> = ({ value, onChange, counts }) => {
  const { data: campaigns = [] } = useCrmCampaigns();
  if (campaigns.length === 0) return null;

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide crm-muted">
        <Megaphone className="h-3.5 w-3.5" /> Campagnes
      </span>
      <button
        type="button"
        onClick={() => onChange([])}
        className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
          value.length === 0
            ? 'border-transparent bg-primary text-primary-foreground'
            : 'border-[hsl(var(--crm-border))] crm-muted hover:bg-[hsl(var(--crm-surface-2))]'
        }`}
      >
        Toutes
      </button>
      {campaigns.map((c) => {
        const active = value.includes(c.id);
        const hue = CAMPAIGN_STATUT_OPTIONS.find((s) => s.value === c.statut)?.hue ?? '220 10% 55%';
        const n = counts?.get(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors"
            style={
              active
                ? { background: `hsl(${hue})`, color: 'white', borderColor: 'transparent' }
                : { borderColor: 'hsl(var(--crm-border))' }
            }
          >
            {active && <Check className="h-3 w-3" />}
            {c.nom}
            {typeof n === 'number' && <span className="opacity-70">· {n}</span>}
          </button>
        );
      })}
    </div>
  );
};
