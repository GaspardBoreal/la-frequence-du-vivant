import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Mail, X, Zap } from 'lucide-react';
import type { CrmCampaign, CrmCampaignMember } from '@/types/crmCampaign';
import { CallRoom } from './CallRoom';
import { MailRoom } from './MailRoom';
import { canalOf, workQueue, CANAL_META } from '@/lib/crm/campaignChannel';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign: CrmCampaign;
  members: CrmCampaignMember[];
  startAtId?: string | null;
}

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : null;

/**
 * « L'Atelier de campagne » — un seul espace de travail qui change de visage
 * selon le canal : salle d'appels, table d'envoi, ou piste unifiée.
 */
export const CampaignWorkbench: React.FC<Props> = ({
  open,
  onOpenChange,
  campaign,
  members,
  startAtId,
}) => {
  const canal = canalOf(campaign);
  const [room, setRoom] = React.useState<'piste' | 'appel' | 'email'>('piste');
  const [focusId, setFocusId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setFocusId(startAtId ?? null);
    setRoom(canal === 'email' ? 'email' : canal === 'telephone' ? 'appel' : 'piste');
  }, [open, startAtId, canal]);

  const queue = React.useMemo(() => workQueue(members, canal), [members, canal]);
  const due = queue.filter((m) => m.__next.due);

  if (canal === 'telephone' || (canal === 'mixte' && room === 'appel')) {
    return (
      <CallRoom
        open={open}
        onOpenChange={(o) => {
          if (!o && canal === 'mixte') {
            setRoom('piste');
            return;
          }
          onOpenChange(o);
        }}
        campaign={campaign}
        members={members}
        startAtId={focusId}
      />
    );
  }

  if (canal === 'email' || (canal === 'mixte' && room === 'email')) {
    return (
      <MailRoom
        open={open}
        onOpenChange={(o) => {
          if (!o && canal === 'mixte') {
            setRoom('piste');
            return;
          }
          onOpenChange(o);
        }}
        campaign={campaign}
        members={members}
        startAtId={focusId}
        canal={canal}
        onSwitchToCall={(id) => {
          setFocusId(id);
          setRoom('appel');
        }}
      />
    );
  }

  /* Piste unifiée (campagnes mixtes) */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[88vh] p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Zap className="h-4 w-4 text-primary" /> {CANAL_META.mixte.atelier}
            </span>
            <span className="text-muted-foreground">{campaign.nom}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              {due.length} à faire maintenant
            </span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b px-4 py-3">
          <Button
            size="sm"
            onClick={() => {
              setFocusId(null);
              setRoom('email');
            }}
          >
            <Mail className="mr-1.5 h-4 w-4" /> Enchaîner les emails
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFocusId(null);
              setRoom('appel');
            }}
          >
            <Phone className="mr-1.5 h-4 w-4" /> Enchaîner les appels
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {queue.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Rien à faire pour l'instant — la campagne est à jour.
            </p>
          ) : (
            <ul className="space-y-2">
              {queue.map((m, i) => {
                const isMail = m.__next.canal === 'email';
                return (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.3) }}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                      m.__next.due ? 'border-primary/30 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                      style={{
                        background: `hsl(${isMail ? '270 65% 60%' : '210 90% 56%'})`,
                      }}
                    >
                      {isMail ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {m.company?.nom_complet ?? m.company?.denomination ?? 'Prospect'}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {m.__next.label}
                        {m.__next.at && !m.__next.due ? ` · prévu le ${fmt(m.__next.at)}` : ''}
                        {m.company?.ville ? ` · ${m.company.ville}` : ''}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={m.__next.due ? 'default' : 'outline'}
                      className="h-8 shrink-0 text-xs"
                      onClick={() => {
                        setFocusId(m.id);
                        setRoom(isMail ? 'email' : 'appel');
                      }}
                    >
                      {isMail ? 'Écrire' : 'Appeler'}
                    </Button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
