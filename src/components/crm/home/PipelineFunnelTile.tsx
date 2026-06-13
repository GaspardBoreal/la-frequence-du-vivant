import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Props {
  suspects: number;
  prospects: number;
  clients: number;
}

export const PipelineFunnelTile: React.FC<Props> = ({ suspects, prospects, clients }) => {
  const max = Math.max(suspects, prospects, clients, 1);
  const rows = [
    { label: 'Suspects', value: suspects, color: 'from-zinc-500/40 to-zinc-500/10' },
    { label: 'Prospects', value: prospects, color: 'from-[hsl(var(--crm-accent))]/60 to-[hsl(var(--crm-accent))]/10' },
    { label: 'Clients', value: clients, color: 'from-emerald-400/60 to-emerald-400/10' },
  ];

  const conversion = suspects > 0 ? Math.round((clients / suspects) * 100) : 0;

  return (
    <Link
      to="/admin/crm/annuaire?tab=entreprises"
      className="col-span-12 md:col-span-6 md:row-span-2 group"
    >
      <div className="relative h-full rounded-xl crm-surface p-6 overflow-hidden crm-glow">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider crm-muted font-medium mb-1">
              Tunnel de conversion
            </div>
            <div className="text-2xl font-semibold text-[hsl(var(--crm-text))]">
              Suspects → Clients
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold crm-num text-[hsl(var(--crm-accent))]">
              {conversion}%
            </div>
            <div className="text-[10px] uppercase tracking-wider crm-muted">conversion</div>
          </div>
        </div>

        <div className="space-y-4 mt-8">
          {rows.map((row, i) => (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs crm-muted">{row.label}</span>
                <span className="text-xl font-semibold crm-num text-[hsl(var(--crm-text))]">
                  {row.value}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[hsl(var(--crm-surface-2))] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.value / max) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${row.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};
