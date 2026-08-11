import React from 'react';
import { cn } from '@/lib/utils';
import { PipelineActionsFilter } from '@/components/crm/opportunities/PipelineActionsFilter';
import { PipelineStagesFilter } from './PipelineStagesFilter';
import { PipelineCampaignsFilter } from './PipelineCampaignsFilter';
import type { OpportunityActionCode } from '@/lib/crmOpportunityActions';
import type { OpportunityStatus } from '@/types/crm';

interface Props {
  actionsFilter: OpportunityActionCode[];
  setActionsFilter: (next: OpportunityActionCode[]) => void;
  actionsMode: 'and' | 'or';
  setActionsMode: (m: 'and' | 'or') => void;

  stagesFilter: OpportunityStatus[];
  setStagesFilter: (next: OpportunityStatus[]) => void;

  campaignsFilter?: string[];
  setCampaignsFilter?: (next: string[]) => void;
  campaignCounts?: Map<string, number>;

  matchedCount: number;
  totalCount: number;
  className?: string;
}

/**
 * Barre de filtres unique du Pipeline CRM, partagée par les vues
 * Kanban / Liste / Carte. Compose les filtres Jalons + Étapes + Campagnes.
 */
export const PipelineFiltersBar: React.FC<Props> = ({
  actionsFilter,
  setActionsFilter,
  actionsMode,
  setActionsMode,
  stagesFilter,
  setStagesFilter,
  campaignsFilter,
  setCampaignsFilter,
  campaignCounts,
  matchedCount,
  totalCount,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <PipelineActionsFilter
        value={actionsFilter}
        onChange={setActionsFilter}
        mode={actionsMode}
        onModeChange={setActionsMode}
        matchedCount={matchedCount}
        totalCount={totalCount}
      />
      <PipelineStagesFilter value={stagesFilter} onChange={setStagesFilter} />
      {campaignsFilter && setCampaignsFilter && (
        <PipelineCampaignsFilter
          value={campaignsFilter}
          onChange={setCampaignsFilter}
          counts={campaignCounts}
        />
      )}
    </div>
  );
};
