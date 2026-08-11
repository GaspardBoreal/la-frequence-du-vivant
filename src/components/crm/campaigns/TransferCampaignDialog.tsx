import React from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Search, ArrowRight, Check, Unlink2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CAMPAIGN_STATUT_OPTIONS } from '@/types/crmCampaign';
import {
  useCrmCampaigns,
  useCampaignsOverview,
  useCampaignTransfer,
  type TransferTarget,
} from '@/hooks/useCrmCampaigns';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Éléments à déplacer (membre de campagne et/ou opportunité). */
  targets: TransferTarget[];
  /** Campagne d'origine (pour l'afficher et la désactiver). */
  currentCampaignId?: string | null;
  currentCampaignName?: string | null;
  /** Libellé de ce qui est déplacé, ex. « Barjane ». */
  subjectLabel?: string;
  /** Autoriser le détachement complet. */
  allowDetach?: boolean;
  onDone?: () => void;
}

export const TransferCampaignDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  targets,
  currentCampaignId,
  currentCampaignName,
  subjectLabel,
  allowDetach = true,
  onDone,
}) => {
  const { data: campaigns = [], isLoading } = useCrmCampaigns();
  const { data: overview } = useCampaignsOverview();
  const transfer = useCampaignTransfer();
  const [q, setQ] = React.useState('');
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setQ('');
      setSelected(null);
    }
  }, [open]);

  const filtered = campaigns.filter((c) =>
    q.trim() ? c.nom.toLowerCase().includes(q.trim().toLowerCase()) : true,
  );

  const target = campaigns.find((c) => c.id === selected) ?? null;
  const count = targets.length;
  const subject =
    subjectLabel ?? (count > 1 ? `${count} prospects` : 'Ce prospect');

  const run = (campaignId: string | null) => {
    transfer.mutate(
      { targets, targetCampaignId: campaignId },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDone?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Transférer vers une campagne
          </DialogTitle>
          <DialogDescription>
            {currentCampaignName
              ? `${subject} quitte « ${currentCampaignName} » pour la campagne choisie.`
              : `${subject} sera rattaché${count > 1 ? 's' : ''} à la campagne choisie.`}{' '}
            L'historique d'appels et l'opportunité liée suivent automatiquement.
          </DialogDescription>
        </DialogHeader>

        {campaigns.length > 6 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une campagne…"
              className="pl-8"
            />
          </div>
        )}

        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {isLoading && <div className="py-6 text-center text-sm text-muted-foreground">Chargement…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">Aucune campagne.</div>
          )}
          {filtered.map((c) => {
            const meta = CAMPAIGN_STATUT_OPTIONS.find((s) => s.value === c.statut);
            const hue = meta?.hue ?? '150 65% 45%';
            const isCurrent = c.id === currentCampaignId;
            const isSelected = c.id === selected;
            const n = overview?.get(c.id)?.enroles ?? 0;
            return (
              <motion.button
                key={c.id}
                type="button"
                whileHover={isCurrent ? undefined : { x: 2 }}
                disabled={isCurrent}
                onClick={() => setSelected(c.id)}
                className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all disabled:cursor-default disabled:opacity-60"
                style={{
                  borderColor: isSelected ? `hsl(${hue})` : `hsl(${hue} / 0.3)`,
                  backgroundColor: isSelected ? `hsl(${hue} / 0.14)` : `hsl(${hue} / 0.05)`,
                }}
              >
                <Megaphone className="h-4 w-4 shrink-0" style={{ color: `hsl(${hue})` }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium" style={{ color: `hsl(${hue})` }}>
                    {c.nom}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {meta?.label ?? c.statut} · {n} prospect{n > 1 ? 's' : ''}
                    {isCurrent ? ' · campagne actuelle' : ''}
                  </span>
                </span>
                {isSelected && <Check className="h-4 w-4 shrink-0" style={{ color: `hsl(${hue})` }} />}
              </motion.button>
            );
          })}
        </div>

        {target && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <span className="truncate">{currentCampaignName ?? 'Hors campagne'}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate font-medium text-primary">{target.nom}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {allowDetach && currentCampaignId ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={transfer.isPending}
              onClick={() => run(null)}
            >
              <Unlink2 className="mr-2 h-4 w-4" />
              Retirer de la campagne
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={transfer.isPending}>
              Annuler
            </Button>
            <Button disabled={!selected || transfer.isPending} onClick={() => run(selected)}>
              {transfer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transférer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
