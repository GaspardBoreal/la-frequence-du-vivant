import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, UserPlus, Search, CheckCircle2, Building2, ClipboardPaste } from 'lucide-react';
import { PasteImportDialog } from '@/components/crm/PasteImportDialog';

import { useCrmCompanies } from '@/hooks/useCrmCompanies';
import {
  useAllCampaignMemberships,
  useCampaignMemberMutations,
} from '@/hooks/useCrmCampaigns';
import type { CrmCampaign } from '@/types/crmCampaign';

interface Props {
  campaign: CrmCampaign;
  enrolledCompanyIds: Set<string>;
}

/** Panneau « Recruter » : rejoue le ciblage et propose les entreprises non enrôlées. */
export const CampaignRecruit: React.FC<Props> = ({ campaign, enrolledCompanyIds }) => {
  const [search, setSearch] = React.useState('');
  const [picked, setPicked] = React.useState<Set<string>>(new Set());

  const filters = React.useMemo(
    () => ({
      stage: (campaign.ciblage?.stage as any) ?? 'all',
      region: campaign.ciblage?.region,
      departement: campaign.ciblage?.departement,
      ville: campaign.ciblage?.ville,
      code_naf: campaign.ciblage?.code_naf,
      search: search || campaign.ciblage?.search,
    }),
    [campaign.ciblage, search],
  );

  const { data: companies = [], isLoading } = useCrmCompanies(filters);
  const { data: memberships } = useAllCampaignMemberships();
  const { enrollCompanies } = useCampaignMemberMutations(campaign.id);

  const candidates = React.useMemo(
    () => companies.filter((c: any) => !enrolledCompanyIds.has(c.id)),
    [companies, enrolledCompanyIds],
  );

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const enroll = (ids: string[]) => {
    enrollCompanies.mutate(
      { campaign_id: campaign.id, companyIds: ids },
      { onSuccess: () => setPicked(new Set()) },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Affiner la recherche dans la cible…"
            className="pl-8"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={picked.size === 0 || enrollCompanies.isPending}
          onClick={() => enroll(Array.from(picked))}
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Enrôler la sélection ({picked.size})
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPasteOpen(true)}>
          <ClipboardPaste className="mr-1.5 h-3.5 w-3.5" />
          Coller une liste
        </Button>
        <Button
          size="sm"
          disabled={candidates.length === 0 || enrollCompanies.isPending}
          onClick={() => enroll(candidates.map((c: any) => c.id))}
        >
          {enrollCompanies.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : null}
          Tout enrôler ({candidates.length})
        </Button>
      </div>

      <PasteImportDialog open={pasteOpen} onOpenChange={setPasteOpen} lockedCampaignId={campaign.id} />


      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : candidates.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <Building2 className="mx-auto mb-2 h-8 w-8 opacity-30" />
          Aucun prospect supplémentaire pour ce ciblage. Élargissez les critères de la campagne
          ou importez de nouvelles entreprises depuis l'annuaire.
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {candidates.slice(0, 120).map((c: any) => {
              const selected = picked.has(c.id);
              const otherCampaigns = (memberships?.get(c.id) ?? []).filter(
                (id) => id !== campaign.id,
              );
              return (
                <motion.button
                  key={c.id}
                  layout
                  type="button"
                  onClick={() => toggle(c.id)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {c.nom_complet || c.denomination}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[c.ville, c.libelle_naf].filter(Boolean).join(' · ')}
                      </div>
                      {otherCampaigns.length > 0 && (
                        <div className="mt-1 text-[10px] text-amber-500">
                          Déjà dans {otherCampaigns.length} autre campagne
                          {otherCampaigns.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
