import React from 'react';
import { FileText, Sparkles, Route } from 'lucide-react';

export type PartnerAuditView = 'synthese' | 'detail' | 'roadmap';

const ALL_OPTIONS: { value: PartnerAuditView; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'synthese', label: 'Version synthétique', icon: Sparkles },
  { value: 'detail', label: 'Version détaillée', icon: FileText },
  { value: 'roadmap', label: 'Feuille de route', icon: Route },
];

/** Sélecteur segmenté entre lecture synthétique, version détaillée et feuille de route. */
export const PartnerAuditViewSwitcher: React.FC<{
  value: PartnerAuditView;
  onChange: (v: PartnerAuditView) => void;
  className?: string;
  /** Onglets à proposer ; par défaut synthèse + détail */
  available?: PartnerAuditView[];
}> = ({ value, onChange, className, available }) => {
  const allowed = available ?? (['synthese', 'detail'] as PartnerAuditView[]);
  const options = ALL_OPTIONS.filter((o) => allowed.includes(o.value));


  return (
    <div
      className={`inline-flex gap-1 rounded-full border border-border/70 bg-card/70 p-1 backdrop-blur print:hidden ${className ?? ''}`}
      role="tablist"
    >
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default PartnerAuditViewSwitcher;
