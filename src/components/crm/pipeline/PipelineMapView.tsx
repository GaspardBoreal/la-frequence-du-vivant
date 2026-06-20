import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPinOff, Loader2 } from 'lucide-react';
import type { CrmOpportunity, OpportunityStatus } from '@/types/crm';
import { CrmCompaniesMap } from '@/components/crm/CrmCompaniesMap';
import { CompanyDetailSheet } from '@/components/crm/CompanyDetailSheet';
import { useCrmPipelineMapData, type PipelineMapPoint } from '@/hooks/useCrmPipelineMapData';
import { PipelineStagesFilter, STAGE_HUE } from './PipelineStagesFilter';
import { PipelineMapTooltip } from './PipelineMapTooltip';
import { KANBAN_COLUMNS } from '@/types/crm';

interface Props {
  /** Already filtered by jalons in CrmPipeline */
  opportunitiesAfterActions: CrmOpportunity[];
}

const ALL_STAGES = KANBAN_COLUMNS.map((c) => c.id);

function hueToHex(hue: string): string {
  // Convert "H S% L%" string to hex via temporary DOM
  if (typeof document === 'undefined') return '#0ea5e9';
  const el = document.createElement('div');
  el.style.color = `hsl(${hue})`;
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).color;
  document.body.removeChild(el);
  const m = rgb.match(/\d+/g);
  if (!m) return '#0ea5e9';
  const [r, g, b] = m.map(Number);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export const PipelineMapView: React.FC<Props> = ({ opportunitiesAfterActions }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const stages = React.useMemo<OpportunityStatus[]>(() => {
    const raw = searchParams.get('stages');
    if (raw === null) return ALL_STAGES; // default: all
    if (raw === '') return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is OpportunityStatus => ALL_STAGES.includes(s as OpportunityStatus));
  }, [searchParams]);

  const setStages = (next: OpportunityStatus[]) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next.length === ALL_STAGES.length) p.delete('stages');
        else p.set('stages', next.join(','));
        return p;
      },
      { replace: true },
    );
  };

  const filteredByStage = React.useMemo(
    () => opportunitiesAfterActions.filter((o) => stages.includes(o.statut)),
    [opportunitiesAfterActions, stages],
  );

  const { data, isLoading } = useCrmPipelineMapData(filteredByStage);
  const points = data?.points ?? [];
  const missing = data?.missingGeoloc ?? 0;

  // Selected company drawer — via URL ?company=<id>
  const selectedCompanyId = searchParams.get('company');
  const setSelectedCompanyId = (id: string | null) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (id) p.set('company', id);
        else p.delete('company');
        return p;
      },
      { replace: true },
    );
  };

  // Map our enriched points to map points + colorBy
  const mapPoints = React.useMemo(
    () =>
      points.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        title: p.title,
        subtitle: p.ville ?? undefined,
      })),
    [points],
  );
  const pointById = React.useMemo(() => {
    const m = new Map<string, PipelineMapPoint>();
    points.forEach((p) => m.set(p.id, p));
    return m;
  }, [points]);

  const colorBy = React.useCallback(
    (p: { id: string }) => {
      const pt = pointById.get(p.id);
      if (!pt) return '#0ea5e9';
      return hueToHex(STAGE_HUE[pt.dominantStatut]);
    },
    [pointById],
  );

  const renderTooltip = React.useCallback(
    (p: { id: string }) => {
      const pt = pointById.get(p.id);
      if (!pt) return null;
      return <PipelineMapTooltip point={pt} />;
    },
    [pointById],
  );

  return (
    <div className="space-y-3">
      <PipelineStagesFilter value={stages} onChange={setStages} />

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Chargement de la carte…
            </span>
          ) : (
            <>
              <strong className="text-foreground">{points.length}</strong> entreprise
              {points.length > 1 ? 's' : ''} affichée{points.length > 1 ? 's' : ''}
              {filteredByStage.length === 0 && ' — aucune opportunité dans la sélection'}
            </>
          )}
        </span>
        {missing > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <MapPinOff className="h-3 w-3" />
            {missing} sans géoloc
          </span>
        )}
      </div>

      <CrmCompaniesMap
        companies={mapPoints as any}
        height="calc(100vh - 360px)"
        selectedId={selectedCompanyId}
        onSelect={(id) => setSelectedCompanyId(id)}
        flyOffsetX={-260}
        colorBy={colorBy}
        renderTooltip={renderTooltip}
      />

      <CompanyDetailSheet
        companyId={selectedCompanyId}
        onOpenChange={(o) => !o && setSelectedCompanyId(null)}
      />
    </div>
  );
};
