import React from 'react';
import { Footprints, User, Building2, MapPin } from 'lucide-react';
import { KANBAN_COLUMNS } from '@/types/crm';
import { ACTIONS_BY_CODE } from '@/lib/crmOpportunityActions';
import type { PipelineMapPoint } from '@/hooks/useCrmPipelineMapData';
import { STAGE_HUE } from './PipelineStagesFilter';

export const PipelineMapTooltip: React.FC<{ point: PipelineMapPoint }> = ({ point }) => {
  const col = KANBAN_COLUMNS.find((c) => c.id === point.dominantStatut);
  const hue = STAGE_HUE[point.dominantStatut];
  // Unique action codes across linked opps
  const actions = Array.from(new Set(point.opportunities.flatMap((o) => o.actions)));
  const contactName = point.contact
    ? `${point.contact.prenom ?? ''} ${point.contact.nom ?? ''}`.trim()
    : '';

  return (
    <div className="w-[260px] text-foreground">
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: `hsl(${hue})`, boxShadow: `0 0 0 3px hsl(${hue} / 0.18)` }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight">{point.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {point.ville ?? '—'}
            {point.codeNaf && (
              <>
                <span className="opacity-50">·</span>
                <Building2 className="h-3 w-3" />
                <span className="truncate" title={point.libelleNaf ?? ''}>
                  NAF {point.codeNaf}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {(contactName || point.marchesCount > 0) && (
        <div className="my-2 border-t border-border" />
      )}

      {contactName && (
        <p className="flex items-center gap-1.5 text-[11px]">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{contactName}</span>
          {point.contact?.fonction && (
            <span className="text-muted-foreground">— {point.contact.fonction}</span>
          )}
        </p>
      )}
      {point.marchesCount > 0 && (
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px]">
          <Footprints className="h-3 w-3 text-muted-foreground" />
          <span>
            {point.marchesCount} marche{point.marchesCount > 1 ? 's' : ''} liée
            {point.marchesCount > 1 ? 's' : ''}
          </span>
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
          style={{ background: `hsl(${hue})` }}
        >
          {col?.title ?? point.dominantStatut}
        </span>
        {point.opportunities.length > 1 && (
          <span className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">
            +{point.opportunities.length - 1} opp.
          </span>
        )}
        {actions.slice(0, 3).map((code) => {
          const def = ACTIONS_BY_CODE[code as keyof typeof ACTIONS_BY_CODE];
          if (!def) return null;
          return (
            <span
              key={code}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
              style={{
                borderColor: `hsl(${def.hue} / 0.4)`,
                color: `hsl(${def.hue})`,
                background: `hsl(${def.hue} / 0.08)`,
              }}
            >
              <def.icon className="h-2.5 w-2.5" />
              {def.shortLabel}
            </span>
          );
        })}
        {actions.length > 3 && (
          <span className="text-[10px] text-muted-foreground">+{actions.length - 3}</span>
        )}
      </div>

      <p className="mt-2 text-[10px] italic text-muted-foreground">Cliquer pour ouvrir la fiche</p>
    </div>
  );
};
