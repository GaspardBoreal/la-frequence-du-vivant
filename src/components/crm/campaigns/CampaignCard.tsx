import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Copy, Trash2, Pencil, Users, Target, Mail, Zap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CAMPAIGN_STATUT_OPTIONS,
  CAMPAIGN_OBJECTIF_OPTIONS,
  type CrmCampaign,
} from '@/types/crmCampaign';
import { canalOf, CANAL_META } from '@/lib/crm/campaignChannel';

interface Props {
  campaign: CrmCampaign;
  counts?: {
    enroles: number;
    joints: number;
    interesses: number;
    a_appeler: number;
    emails_envoyes?: number;
    reponses?: number;
    a_ecrire?: number;
  };
  onEdit: (c: CrmCampaign) => void;
  onDuplicate: (c: CrmCampaign) => void;
  onDelete: (c: CrmCampaign) => void;
}


const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : null;

export const CampaignCard: React.FC<Props> = ({
  campaign,
  counts,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const statut = CAMPAIGN_STATUT_OPTIONS.find((s) => s.value === campaign.statut);
  const objectif = CAMPAIGN_OBJECTIF_OPTIONS.find((o) => o.value === campaign.objectif);
  const canal = canalOf(campaign);
  const canalMeta = CANAL_META[canal];
  const CanalIcon = canal === 'telephone' ? Phone : canal === 'email' ? Mail : Zap;
  const enroles = counts?.enroles ?? 0;
  const joints = counts?.joints ?? 0;
  const interesses = counts?.interesses ?? 0;
  const emailsEnvoyes = counts?.emails_envoyes ?? 0;
  const reponses = counts?.reponses ?? 0;
  const aEcrire = counts?.a_ecrire ?? 0;

  /* Le dénominateur du taux dépend du canal : joints au tél, envois par email. */
  const touches = canal === 'email' ? emailsEnvoyes : canal === 'mixte' ? joints + emailsEnvoyes : joints;
  const succes = canal === 'email' ? reponses : canal === 'mixte' ? interesses + reponses : interesses;
  const taux = touches > 0 ? (succes / touches) * 100 : 0;
  const cible = campaign.objectif_taux ?? 10;
  const tone = taux >= cible ? '150 65% 45%' : taux >= cible * 0.6 ? '38 92% 55%' : '0 75% 58%';
  const progress = campaign.objectif_contacts
    ? Math.min(100, (touches / campaign.objectif_contacts) * 100)
    : enroles > 0
      ? (touches / enroles) * 100
      : 0;
  const aTraiter = canal === 'email' ? aEcrire : canal === 'mixte' ? (counts?.a_appeler ?? 0) + aEcrire : counts?.a_appeler ?? 0;


  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
    >
      <Card className="group relative overflow-hidden border-[hsl(var(--crm-border))] bg-[hsl(var(--crm-surface))] p-4">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `hsl(${statut?.hue ?? '220 10% 55%'})` }}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/admin/crm/campagnes/${campaign.id}`}
              className="block truncate text-base font-semibold text-[hsl(var(--crm-text))] hover:underline"
            >
              {campaign.nom}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span
                className="rounded-full px-2 py-0.5 font-medium text-white"
                style={{ background: `hsl(${statut?.hue ?? '220 10% 55%'})` }}
              >
                {statut?.label ?? campaign.statut}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-white"
                style={{ background: `hsl(${canalMeta.hue})` }}
                title={canalMeta.description}
              >
                <CanalIcon className="h-3 w-3" /> {canalMeta.label}
              </span>

              <span className="rounded-full border border-[hsl(var(--crm-border))] px-2 py-0.5 crm-muted">
                {objectif?.label ?? campaign.objectif}
              </span>
              {(campaign.date_debut || campaign.date_fin) && (
                <span className="crm-muted">
                  {fmtDate(campaign.date_debut)} → {fmtDate(campaign.date_fin) ?? '…'}
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <motion.div
              key={taux.toFixed(1)}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold leading-none"
              style={{ color: `hsl(${tone})` }}
            >
              {taux.toFixed(0)}%
            </motion.div>
            <div className="mt-1 text-[10px] uppercase tracking-wide crm-muted">
              {canal === 'email' ? 'réponses' : 'détection'} · cible {cible}%
            </div>

          </div>
        </div>

        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--crm-surface-2))]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `hsl(${tone})` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] crm-muted">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> {enroles} enrôlés
            </span>
            {canal !== 'email' && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" /> {joints} joints
              </span>
            )}
            {canal !== 'telephone' && (
              <>
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {emailsEnvoyes} envoyés
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {reponses} réponses
                </span>
              </>
            )}
            {canal !== 'email' && (
              <span className="inline-flex items-center gap-1">
                <Target className="h-3 w-3" /> {interesses} intérêts
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <Button asChild size="sm" className="h-8 gap-1.5 text-xs">
            <Link to={`/admin/crm/campagnes/${campaign.id}?tab=appels`}>
              <CanalIcon className="h-3.5 w-3.5" />
              {aTraiter ? `${canalMeta.verbe} (${aTraiter})` : canalMeta.atelier}
            </Link>

          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs">
            <Link to={`/admin/crm/campagnes/${campaign.id}`}>Ouvrir</Link>
          </Button>
          <div className={cn('ml-auto flex items-center gap-0.5 opacity-0 transition-opacity', 'group-hover:opacity-100')}>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(campaign)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDuplicate(campaign)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(campaign)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
