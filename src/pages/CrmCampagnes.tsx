import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Megaphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useCrmCampaigns,
  useCampaignsOverview,
  useCampaignMutations,
} from '@/hooks/useCrmCampaigns';
import { CampaignCard } from '@/components/crm/campaigns/CampaignCard';
import { CampaignFormDialog } from '@/components/crm/campaigns/CampaignFormDialog';
import { CAMPAIGN_STATUT_OPTIONS, type CrmCampaign } from '@/types/crmCampaign';

const CrmCampagnes: React.FC = () => {
  const { data: campaigns = [], isLoading } = useCrmCampaigns();
  const { data: counts } = useCampaignsOverview();
  const { createCampaign, updateCampaign, deleteCampaign, duplicateCampaign } =
    useCampaignMutations();

  const [q, setQ] = React.useState('');
  const [statut, setStatut] = React.useState<string>('all');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CrmCampaign | null>(null);
  const [toDelete, setToDelete] = React.useState<CrmCampaign | null>(null);

  const filtered = campaigns.filter((c) => {
    if (statut !== 'all' && c.statut !== statut) return false;
    if (q.trim() && !c.nom.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const totals = React.useMemo(() => {
    let enroles = 0, joints = 0, interesses = 0;
    counts?.forEach((v) => {
      enroles += v.enroles; joints += v.joints; interesses += v.interesses;
    });
    return { enroles, joints, interesses, taux: joints ? (interesses / joints) * 100 : 0 };
  }, [counts]);

  const submit = (payload: Partial<CrmCampaign>) => {
    if (editing) {
      updateCampaign.mutate({ id: editing.id, ...payload } as any, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      createCampaign.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-[hsl(var(--crm-text))] md:text-3xl">
            <Megaphone className="h-6 w-6 text-primary" /> Campagnes
          </h1>
          <p className="mt-1 text-sm crm-muted">
            Cibler, appeler, mesurer la détection d'intérêt — {totals.enroles} prospects enrôlés,{' '}
            {totals.interesses} intérêts détectés ({totals.taux.toFixed(0)}%).
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Nouvelle campagne
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une campagne…"
          className="max-w-xs"
        />
        <button
          type="button"
          onClick={() => setStatut('all')}
          className={`rounded-full border px-3 py-1 text-xs ${
            statut === 'all' ? 'border-transparent bg-primary text-primary-foreground' : 'border-border crm-muted'
          }`}
        >
          Toutes ({campaigns.length})
        </button>
        {CAMPAIGN_STATUT_OPTIONS.map((o) => {
          const n = campaigns.filter((c) => c.statut === o.value).length;
          const active = statut === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setStatut(o.value)}
              className="rounded-full border px-3 py-1 text-xs transition-all"
              style={active ? { background: `hsl(${o.hue})`, color: 'white', borderColor: 'transparent' } : undefined}
            >
              {o.label} ({n})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 crm-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Megaphone className="mx-auto mb-3 h-10 w-10 opacity-25" />
          <p className="text-sm crm-muted">
            Aucune campagne. Créez-en une pour cibler un segment précis et suivre son rendement.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                counts={counts?.get(c.id)}
                onEdit={(x) => { setEditing(x); setFormOpen(true); }}
                onDuplicate={(x) => duplicateCampaign.mutate(x)}
                onDelete={(x) => setToDelete(x)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CampaignFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        campaign={editing}
        onSubmit={submit}
        isSubmitting={createCampaign.isPending || updateCampaign.isPending}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {toDelete?.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les prospects enrôlés seront retirés de la campagne. Les opportunités créées sont
              conservées dans le pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteCampaign.mutate(toDelete.id);
                setToDelete(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CrmCampagnes;
