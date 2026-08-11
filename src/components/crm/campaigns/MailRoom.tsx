import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  Send,
  Copy,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CampaignCanal, CrmCampaign, CrmCampaignMember } from '@/types/crmCampaign';
import { EMAIL_STATUS_META } from '@/types/crmCampaign';
import { useCampaignMemberMutations } from '@/hooks/useCrmCampaigns';
import { renderTemplate, templatesOf, workQueue } from '@/lib/crm/campaignChannel';


interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign: CrmCampaign;
  members: CrmCampaignMember[];
  startAtId?: string | null;
  /** Canal de travail : email pur, ou branche email d'une campagne mixte. */
  canal?: CampaignCanal;
  /** En mixte, permet de basculer ce prospect vers l'appel. */
  onSwitchToCall?: (memberId: string) => void;
}

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

const companyEmail = (m: CrmCampaignMember): string | null => {
  const notes = m.company?.notes ?? '';
  const found = notes.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  return found ? found[0] : null;
};

/** « La Table d'envoi » — un prospect à la fois, le modèle prêt, l'envoi tracé. */
export const MailRoom: React.FC<Props> = ({
  open,
  onOpenChange,
  campaign,
  members,
  startAtId,
  canal = 'email',
  onSwitchToCall,
}) => {
  const { updateMember, convertToOpportunity, recordEmail } = useCampaignMemberMutations(
    campaign.id,
  );

  const templates = React.useMemo(() => templatesOf(campaign), [campaign]);
  const queue = React.useMemo(() => {
    const q = workQueue(members, canal).filter((m) => m.__next.canal === 'email');
    return q.length > 0 ? q : members;
  }, [members, canal]);

  const [idx, setIdx] = React.useState(0);
  const [templateId, setTemplateId] = React.useState(templates[0].id);
  const [objet, setObjet] = React.useState('');
  const [corps, setCorps] = React.useState('');
  const [destinataire, setDestinataire] = React.useState('');
  const [sent, setSent] = React.useState(0);
  const [reponses, setReponses] = React.useState(0);
  const [celebrate, setCelebrate] = React.useState(false);

  const current = queue[idx] as CrmCampaignMember | undefined;
  const company = current?.company;
  const dirigeant = Array.isArray(company?.dirigeants) ? (company?.dirigeants?.[0] as any) : null;

  React.useEffect(() => {
    if (!open) return;
    const start = startAtId ? queue.findIndex((m) => m.id === startAtId) : 0;
    setIdx(start >= 0 ? start : 0);
    setSent(0);
    setReponses(0);
  }, [open, startAtId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Recompose le brouillon à chaque prospect ou changement de modèle. */
  React.useEffect(() => {
    if (!current) return;
    const tpl = templates.find((t) => t.id === templateId) ?? templates[0];
    const vars = {
      societe: company?.nom_complet ?? company?.denomination ?? null,
      contact: dirigeant ? `${dirigeant.prenoms ?? ''} ${dirigeant.nom ?? ''}`.trim() : null,
      pilote: null,
    };
    setObjet(renderTemplate(tpl.objet, vars));
    setCorps(renderTemplate(tpl.corps, vars));
    setDestinataire(companyEmail(current) ?? '');
  }, [current?.id, templateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => setIdx((i) => Math.min(i + 1, Math.max(queue.length - 1, 0)));

  const logSend = (nextCanal: 'telephone' | 'email' | null, days: number | null) => {
    if (!current) return;
    recordEmail.mutate({
      member: current,
      campaign,
      subject: objet,
      body: corps,
      recipient: destinataire || null,
      nextActionCanal: nextCanal,
      nextActionAt: days == null ? null : addDays(days),
    });
    setSent((n) => n + 1);
    next();
  };

  const openMailClient = () => {
    if (!current) return;
    const href = `mailto:${encodeURIComponent(destinataire)}?subject=${encodeURIComponent(
      objet,
    )}&body=${encodeURIComponent(corps)}`;
    window.open(href, '_blank');
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(`${objet}\n\n${corps}`);
    toast.success('Objet et corps copiés');
  };

  const markReponse = () => {
    if (!current) return;
    convertToOpportunity.mutate({ member: current, campaign, via: 'email' });
    setReponses((n) => n + 1);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1400);
    next();
  };

  const meta = EMAIL_STATUS_META[(current?.email_status ?? 'non_contacte') as keyof typeof EMAIL_STATUS_META];
  const taux = sent > 0 ? (reponses / sent) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[92vh] p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Mail className="h-4 w-4 text-primary" /> Table d'envoi
            </span>
            <span className="text-muted-foreground">{campaign.nom}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              {Math.min(idx + 1, queue.length)} / {queue.length}
            </span>
            <span>
              <strong>{sent}</strong> envoyés
            </span>
            <span className="text-emerald-500">
              <strong>{reponses}</strong> réponses
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              {taux.toFixed(0)}%
            </span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!current ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Aucun prospect à contacter. Enrôlez des entreprises depuis l'onglet « Recruter ».
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[1fr_1.2fr]">
            {/* Fiche prospect */}
            <div className="overflow-y-auto border-r p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="text-xl font-semibold">
                    {company?.nom_complet ?? company?.denomination ?? 'Prospect'}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {company?.ville && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {company.ville}
                      </span>
                    )}
                    {company?.libelle_naf && <span>{company.libelle_naf}</span>}
                    <span
                      className="rounded-full px-2 py-0.5 text-white"
                      style={{ background: `hsl(${meta?.hue ?? '220 10% 50%'})` }}
                    >
                      {meta?.label}
                    </span>
                    <span>
                      {current.emails_sent ?? 0} email{(current.emails_sent ?? 0) > 1 ? 's' : ''}
                    </span>
                  </div>

                  {dirigeant && (
                    <div className="mt-3 rounded-lg border p-3 text-sm">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Dirigeant
                      </div>
                      <div className="font-medium">
                        {dirigeant.prenoms} {dirigeant.nom}
                      </div>
                      {dirigeant.qualite && (
                        <div className="text-xs text-muted-foreground">{dirigeant.qualite}</div>
                      )}
                    </div>
                  )}

                  {company?.site_web && (
                    <a
                      href={company.site_web.startsWith('http') ? company.site_web : `https://${company.site_web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" /> {company.site_web}
                    </a>
                  )}

                  {company?.notes && (
                    <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
                      {company.notes}
                    </p>
                  )}

                  {campaign.script?.lien && (
                    <a
                      href={campaign.script.lien}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Plaquette à joindre
                    </a>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Composition */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateId(t.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        templateId === t.id
                          ? 'border-transparent bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {t.nom}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Destinataire
                  </label>
                  <Input
                    value={destinataire}
                    onChange={(e) => setDestinataire(e.target.value)}
                    placeholder="contact@entreprise.fr"
                    type="email"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">Objet</label>
                  <Input value={objet} onChange={(e) => setObjet(e.target.value)} maxLength={300} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">Message</label>
                  <Textarea
                    value={corps}
                    onChange={(e) => setCorps(e.target.value)}
                    rows={12}
                    maxLength={6000}
                  />
                </div>
              </div>

              <div className="border-t p-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button className="h-11" onClick={openMailClient} disabled={!destinataire}>
                    <Send className="mr-1.5 h-4 w-4" /> Ouvrir dans ma messagerie
                  </Button>
                  <Button variant="outline" className="h-11" onClick={copyAll}>
                    <Copy className="mr-1.5 h-4 w-4" /> Copier le message
                  </Button>
                  <Button
                    className="h-11 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => logSend(canal === 'mixte' ? 'telephone' : 'email', 5)}
                    disabled={recordEmail.isPending}
                  >
                    <Mail className="mr-1.5 h-4 w-4" /> Marquer envoyé
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11"
                    onClick={() => logSend('email', 10)}
                    disabled={recordEmail.isPending}
                  >
                    <Clock className="mr-1.5 h-4 w-4" /> Envoyé + relance J+10
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 border-emerald-500/40 text-emerald-600"
                    onClick={markReponse}
                    disabled={convertToOpportunity.isPending}
                  >
                    <ThumbsUp className="mr-1.5 h-4 w-4" /> A répondu — intérêt
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11"
                    onClick={() => {
                      updateMember.mutate({
                        id: current.id,
                        email_status: 'desabonne',
                        next_action_at: null,
                        next_action_canal: null,
                      } as any);
                      next();
                    }}
                  >
                    <ThumbsDown className="mr-1.5 h-4 w-4" /> Ne plus contacter
                  </Button>
                  {canal === 'mixte' && onSwitchToCall && (
                    <Button
                      variant="ghost"
                      className="col-span-2 h-9 text-xs"
                      onClick={() => onSwitchToCall(current.id)}
                    >
                      Basculer ce prospect vers l'appel
                    </Button>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={idx === 0}
                    onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Précédent
                  </Button>
                  <Button size="sm" variant="ghost" onClick={next} disabled={idx >= queue.length - 1}>
                    Passer <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {celebrate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="rounded-2xl bg-emerald-600/95 px-8 py-5 text-2xl font-bold text-white shadow-2xl">
                Réponse obtenue ✦
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
