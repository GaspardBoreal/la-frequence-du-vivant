import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Pencil, Loader2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useCrmCampaign,
  useCampaignMembers,
  useCampaignStats,
  useCampaignDaily,
  useCampaignMutations,
} from '@/hooks/useCrmCampaigns';
import { CampaignAnalytics } from '@/components/crm/campaigns/CampaignAnalytics';
import { CampaignMembersTable } from '@/components/crm/campaigns/CampaignMembersTable';
import { CampaignRecruit } from '@/components/crm/campaigns/CampaignRecruit';
import { CampaignFormDialog } from '@/components/crm/campaigns/CampaignFormDialog';
import { CampaignWorkbench } from '@/components/crm/campaigns/CampaignWorkbench';
import { canalOf, CANAL_META } from '@/lib/crm/campaignChannel';
import { CAMPAIGN_STATUT_OPTIONS, type CrmCampaign } from '@/types/crmCampaign';


const CrmCampagneDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'pilotage';

  const { data: campaign, isLoading } = useCrmCampaign(id);
  const { data: members = [] } = useCampaignMembers(id);
  const { data: stats } = useCampaignStats(id);
  const { data: daily } = useCampaignDaily(id);
  const { updateCampaign } = useCampaignMutations();

  const [formOpen, setFormOpen] = React.useState(false);
  const [callOpen, setCallOpen] = React.useState(false);
  const [startAt, setStartAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (searchParams.get('tab') === 'appels' && campaign) setCallOpen(true);
  }, [searchParams, campaign]);

  const enrolledCompanyIds = React.useMemo(
    () => new Set(members.map((m) => m.company_id).filter(Boolean) as string[]),
    [members],
  );

  const setTab = (t: string) =>
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      n.set('tab', t);
      return n;
    }, { replace: true });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 crm-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center crm-muted">
        Campagne introuvable.{' '}
        <Link to="/admin/crm/campagnes" className="text-primary hover:underline">
          Retour aux campagnes
        </Link>
      </div>
    );
  }

  const statut = CAMPAIGN_STATUT_OPTIONS.find((s) => s.value === campaign.statut);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <Link
          to="/admin/crm/campagnes"
          className="inline-flex items-center gap-1 text-xs crm-muted hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Campagnes
        </Link>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-[hsl(var(--crm-text))]">
              <Megaphone className="h-5 w-5 text-primary" />
              {campaign.nom}
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                style={{ background: `hsl(${statut?.hue ?? '220 10% 55%'})` }}
              >
                {statut?.label}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                style={{ background: `hsl(${CANAL_META[canalOf(campaign)].hue})` }}
              >
                {CANAL_META[canalOf(campaign)].label}
              </span>

            </h1>
            {campaign.description && (
              <p className="mt-1 max-w-2xl text-sm crm-muted">{campaign.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" /> Réglages
            </Button>
            <Button onClick={() => { setStartAt(null); setCallOpen(true); }}>
              <Phone className="mr-1.5 h-4 w-4" /> {CANAL_META[canalOf(campaign)].atelier}
            </Button>

          </div>
        </div>
      </motion.div>

      <Tabs value={tab === 'appels' ? 'pilotage' : tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pilotage">Pilotage</TabsTrigger>
          <TabsTrigger value="prospects">Prospects ({members.length})</TabsTrigger>
          <TabsTrigger value="recruter">Recruter</TabsTrigger>
        </TabsList>

        <TabsContent value="pilotage" className="pt-4">
          <CampaignAnalytics campaign={campaign} stats={stats} daily={daily} />
        </TabsContent>

        <TabsContent value="prospects" className="pt-4">
          <CampaignMembersTable
            campaignId={campaign.id}
            campaignName={campaign.nom}
            members={members}
            onCall={(memberId) => { setStartAt(memberId); setCallOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="recruter" className="pt-4">
          <CampaignRecruit campaign={campaign} enrolledCompanyIds={enrolledCompanyIds} />
        </TabsContent>
      </Tabs>

      <CampaignFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        campaign={campaign}
        onSubmit={(payload: Partial<CrmCampaign>) =>
          updateCampaign.mutate({ id: campaign.id, ...payload } as any, {
            onSuccess: () => setFormOpen(false),
          })
        }
        isSubmitting={updateCampaign.isPending}
      />

      <CampaignWorkbench
        open={callOpen}
        onOpenChange={(o) => {
          setCallOpen(o);
          if (!o && searchParams.get('tab') === 'appels') setTab('pilotage');
        }}
        campaign={campaign}
        members={members}
        startAtId={startAt}
      />

    </div>
  );
};

export default CrmCampagneDetail;
