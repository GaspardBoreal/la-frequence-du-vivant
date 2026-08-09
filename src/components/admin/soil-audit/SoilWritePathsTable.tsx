import React from 'react';
import { cn } from '@/lib/utils';
import { SOIL_WRITE_PATHS, REGIME_LABEL, type SoilWriteRegime } from '@/lib/propriete/soilWritePaths';

const TONE: Record<SoilWriteRegime, string> = {
  read_only: 'bg-muted text-muted-foreground',
  guarded_write: 'bg-primary/10 text-primary',
  surgical_write: 'bg-accent text-accent-foreground',
  unprotected: 'bg-destructive/10 text-destructive',
};

export const SoilWritePathsTable: React.FC = () => (
  <div className="space-y-3">
    {SOIL_WRITE_PATHS.map((p) => (
      <div key={p.id} className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <p className="font-medium text-foreground">{p.screen}</p>
          <span className={cn('text-xs rounded-full px-2.5 py-1 font-medium', TONE[p.regime])}>
            {REGIME_LABEL[p.regime]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5">{p.detail}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-2 font-mono break-all">{p.file}</p>
      </div>
    ))}
  </div>
);

export default SoilWritePathsTable;
