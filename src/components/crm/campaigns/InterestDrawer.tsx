import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, ArrowUpRight, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CrmCampaign, CrmCampaignMember } from '@/types/crmCampaign';
import { canalAbouti, engagementOf, CANAL_META } from '@/lib/crm/campaignChannel';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign: CrmCampaign;
  members: CrmCampaignMember[];
}

export const InterestDrawer: React.FC<Props> = ({ open, onOpenChange, campaign, members }) => {
  const gagnes = React.useMemo(
    () => members.filter((m) => engagementOf(m) === 'gagne'),
    [members],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Les intérêts détectés
          </DialogTitle>
          <DialogDescription>
            {gagnes.length} prospect{gagnes.length > 1 ? 's' : ''} ayant manifesté un intérêt sur
            « {campaign.nom} ».
          </DialogDescription>
        </DialogHeader>

        {gagnes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun intérêt détecté pour l'instant.
          </p>
        ) : (
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {gagnes.map((m, i) => {
              const canal = canalAbouti(m) ?? 'email';
              const meta = CANAL_META[canal];
              const Icon = canal === 'telephone' ? Phone : Mail;
              const nom = m.company?.denomination || m.company?.nom_complet || 'Prospect';
              const date = m.last_email_at || m.last_call_at || m.updated_at;
              const card = (
                <div className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:border-primary/60">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{nom}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-white"
                        style={{ background: `hsl(${meta.hue})` }}
                      >
                        <Icon className="h-3 w-3" /> {meta.label}
                      </span>
                      {m.company?.ville && <span>{m.company.ville}</span>}
                      {date && <span>{new Date(date).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </div>
                  {m.opportunity_id && (
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
              );
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {m.opportunity_id ? (
                    <Link
                      to={`/admin/crm/pipeline?opportunity=${m.opportunity_id}`}
                      onClick={() => onOpenChange(false)}
                    >
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button asChild variant="outline" onClick={() => onOpenChange(false)}>
            <Link to={`/admin/crm/pipeline?campaigns=${campaign.id}`}>Voir dans le pipeline</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
