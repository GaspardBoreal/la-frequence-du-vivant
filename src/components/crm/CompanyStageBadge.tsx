import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { STAGE_COLORS, STAGE_LABELS, type CrmCompanyStage } from '@/types/crmCompany';

export const CompanyStageBadge: React.FC<{ stage: CrmCompanyStage; className?: string }> = ({ stage, className }) => (
  <Badge variant="outline" className={cn('border font-medium', STAGE_COLORS[stage], className)}>
    {STAGE_LABELS[stage]}
  </Badge>
);
