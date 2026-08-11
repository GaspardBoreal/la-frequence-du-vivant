import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  ComposedChart,
} from 'recharts';
import type { CampaignStats, CrmCampaign, CrmCampaignMember } from '@/types/crmCampaign';
import {
  canalOf,
  canalDeclencheur,
  emailStatsOf,
  interestRateOf,
  usesEmail as canalUsesEmail,
} from '@/lib/crm/campaignChannel';

interface Props {
  campaign: CrmCampaign;
  stats?: CampaignStats | null;
  daily?: Array<{ jour: string; appels: number; interesses: number }>;
  members?: CrmCampaignMember[];
}


const Tile: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  hue?: string;
  onClick?: () => void;
}> = ({ label, value, hint, hue, onClick }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <Card
      className={`p-3 ${onClick ? 'cursor-pointer transition-colors hover:border-primary/60' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold" style={hue ? { color: `hsl(${hue})` } : undefined}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </Card>
  </motion.div>
);

export const CampaignAnalytics: React.FC<Props> = ({ campaign, stats, daily = [], members = [] }) => {
  const s = stats ?? ({} as CampaignStats);
  const joints = s.joints ?? 0;
  const cible = campaign.objectif_taux ?? 10;
  const canal = canalOf(campaign);
  const showEmail = canalUsesEmail(campaign);
  const mail = emailStatsOf(members);
  const declencheur = canalDeclencheur(members);
  /* Indicateur roi commun à tous les canaux. */
  const interet = interestRateOf(
    { joints, interesses: s.interesses, emails_envoyes: mail.envoyes, reponses: mail.repondus },
    members,
  );
  const taux = interet.taux;

  const funnel = [
    { etape: 'Enrôlés', n: s.enroles ?? 0 },
    ...(showEmail ? [{ etape: 'Écrits', n: mail.envoyes }] : []),
    ...(showEmail && mail.ouverts > 0 ? [{ etape: 'Ouverts', n: mail.ouverts }] : []),
    ...(canal !== 'email' || (s.appels ?? 0) > 0 ? [{ etape: 'Appelés', n: s.appels ?? 0 }] : []),
    { etape: 'Touchés', n: interet.touches },
    { etape: 'Intéressés', n: interet.succes },
    { etape: 'Gagnées', n: s.opp_gagnees ?? 0 },
  ];



  const chartData = daily.map((d) => ({
    jour: new Date(d.jour).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    appels: d.appels,
    interesses: d.interesses,
    taux: d.appels ? Math.round((d.interesses / d.appels) * 100) : 0,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Tile label="Enrôlés" value={s.enroles ?? 0} />
        <Tile
          label="Détection d'intérêt"
          value={`${taux.toFixed(0)}%`}
          hint={`${interet.succes} / ${interet.touches} touchés · cible ${cible}%`}
          hue={taux >= cible ? '150 65% 45%' : taux >= cible * 0.6 ? '38 92% 55%' : '0 75% 58%'}
        />
        {(canal !== 'email' || (s.appels ?? 0) > 0) && (
          <Tile label="Appels passés" value={s.appels ?? 0} hint={`${s.a_appeler ?? 0} restants`} />
        )}
        {showEmail && (
          <Tile
            label="Emails envoyés"
            value={mail.envoyes}
            hint={`${mail.a_ecrire} à écrire`}
            hue="270 65% 60%"
          />
        )}
        {showEmail && (
          <Tile
            label="Taux de réponse"
            value={`${mail.taux_reponse.toFixed(0)}%`}
            hint={`${mail.repondus} réponses · ${mail.bounces} bounces`}
            hue="270 65% 60%"
          />
        )}
        {(canal !== 'email' || (s.rappels_du_jour ?? 0) > 0) && (
          <Tile label="Rappels du jour" value={s.rappels_du_jour ?? 0} hue="38 92% 55%" />
        )}

        <Tile label="Opportunités" value={s.opportunites ?? 0} hint={`${s.opp_actives ?? 0} actives`} />
        <Tile
          label="CA potentiel"
          value={new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(s.ca_potentiel ?? 0)}
          hue="150 65% 45%"
        />
      </div>

      {canal === 'mixte' && (declencheur.telephone > 0 || declencheur.email > 0) && (
        <Card className="p-4">
          <div className="mb-2 text-sm font-semibold">Quel canal a déclenché l'intérêt ?</div>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            <div
              style={{
                width: `${(declencheur.telephone / (declencheur.telephone + declencheur.email)) * 100}%`,
                background: 'hsl(210 90% 56%)',
              }}
            />
            <div
              style={{
                width: `${(declencheur.email / (declencheur.telephone + declencheur.email)) * 100}%`,
                background: 'hsl(270 65% 60%)',
              }}
            />
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span>Téléphone · {declencheur.telephone}</span>
            <span>Email · {declencheur.email}</span>
          </div>
        </Card>
      )}


      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 text-sm font-semibold">Entonnoir de la campagne</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ left: 18 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="etape" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="n" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 text-sm font-semibold">Rythme d'appels et détection</div>
          <div className="h-[220px]">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Les appels enregistrés apparaîtront ici jour par jour.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="appels" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="interesses" stroke="hsl(150 65% 45%)" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-2 text-sm font-semibold">Motifs de refus</div>
        {(s.motifs_refus ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun refus qualifié pour l'instant.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {s.motifs_refus.map((m) => (
              <span
                key={m.motif}
                className="rounded-full border px-3 py-1 text-xs"
                title={`${m.n} refus`}
              >
                {m.motif} · <strong>{m.n}</strong>
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
