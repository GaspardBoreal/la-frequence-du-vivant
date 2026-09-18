import React from 'react';
import { Loader2, MailCheck, MousePointerClick, Eye, AlertTriangle, UserMinus, Send } from 'lucide-react';
import { useCampaignKpis, useCampaignRecipients } from '@/hooks/admin/useNewsletter';

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

/** Tableau de bord d'une campagne : envoi, remise, ouvertures, clics, liens. */
export const CampaignKpis: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const { data: kpis, isLoading } = useCampaignKpis(campaignId);
  const { data: recipients = [] } = useCampaignRecipients(campaignId);

  if (isLoading || !kpis) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Envoyés', value: kpis.sent, icon: Send, sub: `${kpis.recipients} destinataires` },
    { label: 'Remis', value: kpis.delivered, icon: MailCheck, sub: `${pct(kpis.delivered, kpis.sent)} %` },
    { label: 'Ouvertures', value: kpis.opened, icon: Eye, sub: `${pct(kpis.opened, kpis.delivered || kpis.sent)} %` },
    { label: 'Clics', value: kpis.clicked, icon: MousePointerClick, sub: `${pct(kpis.clicked, kpis.delivered || kpis.sent)} %` },
    { label: 'Désinscriptions', value: kpis.unsubscribed, icon: UserMinus, sub: `${pct(kpis.unsubscribed, kpis.sent)} %` },
    { label: 'Erreurs', value: kpis.bounced + kpis.failed, icon: AlertTriangle, sub: 'adresses injoignables' },
  ];

  const maxTl = Math.max(1, ...kpis.timeline.map((t) => Math.max(t.opened, t.clicked)));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-3">
            <c.icon className="mb-1.5 h-4 w-4 text-primary" />
            <p className="text-2xl font-semibold leading-none">{c.value}</p>
            <p className="mt-1 text-xs font-medium">{c.label}</p>
            <p className="text-[11px] text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      {kpis.timeline.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Les premières heures</h3>
          <div className="flex h-32 items-end gap-1 overflow-x-auto">
            {kpis.timeline.slice(-72).map((t) => (
              <div key={t.h} className="flex min-w-[10px] flex-1 flex-col items-center gap-0.5" title={`${t.h} — ${t.opened} ouvertures, ${t.clicked} clics`}>
                <div className="w-full rounded-t bg-primary/70" style={{ height: `${(t.opened / maxTl) * 88}px` }} />
                <div className="w-full rounded-b bg-amber-500/80" style={{ height: `${(t.clicked / maxTl) * 24}px` }} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Barres vertes : ouvertures · barres ambrées : clics.</p>
        </div>
      )}

      {kpis.links.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Liens les plus cliqués</h3>
          <ul className="space-y-1.5">
            {kpis.links.map((l) => (
              <li key={l.url} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-muted-foreground">{l.url}</span>
                <span className="shrink-0 font-semibold">{l.n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipients.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Destinataires</h3>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {recipients.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-3 border-b py-1.5 text-sm last:border-0">
                <span className="min-w-0 truncate">{r.nom || r.email}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.clicked_at ? 'a cliqué' : r.opened_at ? 'a ouvert' : r.statut === 'failed' || r.statut === 'bounced' ? 'erreur' : r.sent_at ? 'envoyé' : 'en file'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignKpis;
