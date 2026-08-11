import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Phone,
  PhoneOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  X,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Target,
} from 'lucide-react';
import {
  CALL_STATUS_META,
  REFUS_MOTIFS,
  type CrmCampaign,
  type CrmCampaignMember,
} from '@/types/crmCampaign';
import { useCampaignMemberMutations } from '@/hooks/useCrmCampaigns';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign: CrmCampaign;
  members: CrmCampaignMember[];
  startAtId?: string | null;
}

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

/** « La Salle d'appels » — un prospect à la fois, script sous les yeux, issue en un clic. */
export const CallRoom: React.FC<Props> = ({
  open,
  onOpenChange,
  campaign,
  members,
  startAtId,
}) => {
  const { updateMember, convertToOpportunity } = useCampaignMemberMutations(campaign.id);

  const queue = React.useMemo(() => {
    const pending = members.filter((m) =>
      ['a_appeler', 'a_rappeler'].includes(m.call_status as string),
    );
    return pending.length > 0 ? pending : members;
  }, [members]);

  const [idx, setIdx] = React.useState(0);
  const [note, setNote] = React.useState('');
  const [motif, setMotif] = React.useState('');
  const [done, setDone] = React.useState(0);
  const [interests, setInterests] = React.useState(0);
  const [celebrate, setCelebrate] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const start = startAtId ? queue.findIndex((m) => m.id === startAtId) : 0;
    setIdx(start >= 0 ? start : 0);
    setNote('');
    setMotif('');
    setDone(0);
    setInterests(0);
  }, [open, startAtId]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = queue[idx];
  const company = current?.company;
  const dirigeant = Array.isArray(company?.dirigeants) ? company?.dirigeants?.[0] : null;

  const next = () => {
    setNote('');
    setMotif('');
    setIdx((i) => Math.min(i + 1, Math.max(queue.length - 1, 0)));
  };

  const record = (
    patch: Partial<CrmCampaignMember>,
    opts: { interest?: boolean } = {},
  ) => {
    if (!current) return;
    updateMember.mutate({
      id: current.id,
      attempts: (current.attempts ?? 0) + 1,
      last_call_at: new Date().toISOString(),
      notes: note.trim() ? `${current.notes ? current.notes + '\n' : ''}${note.trim()}` : current.notes,
      ...patch,
    } as any);
    setDone((d) => d + 1);
    if (opts.interest) {
      setInterests((n) => n + 1);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1400);
    }
    next();
  };

  const markInterest = () => {
    if (!current) return;
    convertToOpportunity.mutate({ member: current, campaign, note: note.trim() || undefined });
    setDone((d) => d + 1);
    setInterests((n) => n + 1);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1400);
    next();
  };

  const rate = done > 0 ? (interests / done) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[92vh] p-0 gap-0 overflow-hidden">
        {/* Bandeau de session */}
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Phone className="h-4 w-4 text-primary" /> Salle d'appels
            </span>
            <span className="text-muted-foreground">{campaign.nom}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              {idx + 1} / {queue.length}
            </span>
            <span>
              <strong>{done}</strong> appels
            </span>
            <span className="text-emerald-500">
              <strong>{interests}</strong> intérêts
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              {rate.toFixed(0)}% · cible {campaign.objectif_taux ?? 10}%
            </span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!current ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Aucun prospect à appeler. Enrôlez des entreprises depuis l'onglet « Recruter ».
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[1.1fr_1fr]">
            {/* Fiche prospect */}
            <div className="overflow-y-auto border-r p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
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
                      style={{
                        background: `hsl(${CALL_STATUS_META[current.call_status as keyof typeof CALL_STATUS_META]?.hue ?? '220 10% 50%'})`,
                      }}
                    >
                      {CALL_STATUS_META[current.call_status as keyof typeof CALL_STATUS_META]?.label}
                    </span>
                    <span>{current.attempts} tentative{current.attempts > 1 ? 's' : ''}</span>
                  </div>

                  {dirigeant && (
                    <div className="mt-3 rounded-lg border p-3 text-sm">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Dirigeant
                      </div>
                      <div className="font-medium">
                        {(dirigeant as any).prenoms} {(dirigeant as any).nom}
                      </div>
                      {(dirigeant as any).qualite && (
                        <div className="text-xs text-muted-foreground">{(dirigeant as any).qualite}</div>
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

                  <div className="mt-4">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Note d'appel
                    </label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Ce qui a été dit, le signal capté, la prochaine étape…"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Motif si refus
                    </label>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {REFUS_MOTIFS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMotif(motif === m ? '' : m)}
                          className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                            motif === m
                              ? 'border-transparent bg-destructive text-destructive-foreground'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Script + issues */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Script de campagne
                </div>
                {[
                  ['Accroche', campaign.script?.accroche],
                  ['Preuve', campaign.script?.preuve],
                  ['Demande', campaign.script?.demande],
                ].map(([label, txt]) =>
                  txt ? (
                    <div key={label as string} className="rounded-lg border p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                        {label}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{txt as string}</p>
                    </div>
                  ) : null,
                )}
                {campaign.script?.lien && (
                  <a
                    href={campaign.script.lien}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Plaquette à envoyer
                  </a>
                )}
                {!campaign.script?.accroche && !campaign.script?.preuve && (
                  <p className="text-sm text-muted-foreground">
                    Aucun script renseigné. Ajoutez-le dans les réglages de la campagne pour tenir
                    la même promesse à chaque appel.
                  </p>
                )}
              </div>

              <div className="border-t p-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="h-11 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={markInterest}
                    disabled={convertToOpportunity.isPending}
                  >
                    <ThumbsUp className="mr-1.5 h-4 w-4" /> Intérêt détecté
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11"
                    onClick={() =>
                      record({ call_status: 'refus', refus_motif: motif || 'Autre' } as any)
                    }
                  >
                    <ThumbsDown className="mr-1.5 h-4 w-4" /> Refus
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11"
                    onClick={() =>
                      record({ call_status: 'a_rappeler', next_call_at: addDays(3) } as any)
                    }
                  >
                    <Clock className="mr-1.5 h-4 w-4" /> Rappeler (J+3)
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11"
                    onClick={() => record({ call_status: 'injoignable' } as any)}
                  >
                    <PhoneOff className="mr-1.5 h-4 w-4" /> Injoignable
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-9 col-span-2 text-xs"
                    onClick={() => record({ call_status: 'joint' } as any)}
                  >
                    <Target className="mr-1.5 h-3.5 w-3.5" /> Joint, sans décision
                  </Button>
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
                Intérêt détecté ✦
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
