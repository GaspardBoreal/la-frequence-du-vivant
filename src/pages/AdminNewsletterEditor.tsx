import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, BarChart3, Eye, Loader2, Mail, RefreshCw, Save, Send, TestTube2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import BlockEditor from '@/components/admin/newsletter/BlockEditor';
import EmailPreview from '@/components/admin/newsletter/EmailPreview';
import AudiencePicker from '@/components/admin/newsletter/AudiencePicker';
import CampaignKpis from '@/components/admin/newsletter/CampaignKpis';
import {
  useDeliveryStatus,
  useNewsletterAudience,
  useNewsletterCampaign,
  useNewsletterMutations,
  useSendNewsletter,
  useTestDeliveryWatch,
  type DeliveryStatusResult,
  type NewsletterCampaign,
  type SendResult,
} from '@/hooks/admin/useNewsletter';
import { UNIVERS_THEMES, type NewsletterBlock, type NewsletterUnivers } from '@/lib/newsletter/blocks';

const MAX_TEST = 10;
/** Domaine déjà vérifié chez Resend pour ce projet. */
const DEFAULT_FROM_EMAIL = 'lettre@mail.la-frequence-du-vivant.com';

/** Studio Newsletter — composition, ciblage, test, envoi et résultats d'une lettre. */
const AdminNewsletterEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading } = useNewsletterCampaign(id);
  const { update } = useNewsletterMutations();
  const send = useSendNewsletter();

  const [draft, setDraft] = React.useState<NewsletterCampaign | null>(null);
  const [testOpen, setTestOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [testResult, setTestResult] = React.useState<SendResult | null>(null);
  const [lastTestEmails, setLastTestEmails] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (campaign && !draft) setDraft(campaign);
  }, [campaign, draft]);

  const audienceQuery = useNewsletterAudience(
    draft?.audience?.mode === 'selection' ? 'tous' : (draft?.univers ?? 'tous'),
  );
  const audience = audienceQuery.data ?? [];

  const destinataires = React.useMemo(() => {
    if (!draft) return 0;
    const joignables = audience.filter((r) => !r.unsubscribed);
    return draft.audience?.mode === 'selection'
      ? joignables.filter((r) => (draft.audience.profileIds ?? []).includes(r.profile_id)).length
      : joignables.length;
  }, [audience, draft]);

  if (isLoading || !draft) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const set = (patch: Partial<NewsletterCampaign>) => setDraft({ ...draft, ...patch } as NewsletterCampaign);

  /** Renvoie false si l'enregistrement a échoué : on n'envoie jamais une version périmée. */
  const save = async (): Promise<boolean> => {
    try {
      await update.mutateAsync({
        id: draft.id,
        nom: draft.nom,
        univers: draft.univers,
        objet: draft.objet,
        preheader: draft.preheader,
        from_name: draft.from_name,
        from_email: draft.from_email?.trim() || null,
        reply_to: draft.reply_to,
        blocks: draft.blocks,
        audience: draft.audience,
      });
      toast.success('Lettre enregistrée');
      return true;
    } catch {
      /* message déjà affiché */
      return false;
    }
  };

  const theme = UNIVERS_THEMES[draft.univers] ?? UNIVERS_THEMES.tous;
  const dejaEnvoyee = draft.statut === 'envoyee';

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to="/admin/outils/newsletter">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Toutes les lettres
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={save} disabled={update.isPending}>
              {update.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Enregistrer
            </Button>
            <Button variant="outline" onClick={() => setTestOpen(true)}>
              <TestTube2 className="mr-1.5 h-4 w-4" /> Tester
            </Button>
            <Button onClick={() => setSendOpen(true)} disabled={dejaEnvoyee}>
              <Send className="mr-1.5 h-4 w-4" /> Envoyer
            </Button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <span className="h-8 w-1.5 rounded-full" style={{ background: theme.accent }} />
          <Input
            value={draft.nom}
            onChange={(e) => set({ nom: e.target.value })}
            className="h-auto border-0 bg-transparent px-0 text-2xl font-bold shadow-none focus-visible:ring-0"
          />
        </div>

        <Tabs defaultValue="composer" className="mt-4">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="composer">
              <Mail className="mr-1.5 h-4 w-4" /> Composer
            </TabsTrigger>
            <TabsTrigger value="apercu">
              <Eye className="mr-1.5 h-4 w-4" /> Aperçu
            </TabsTrigger>
            <TabsTrigger value="ciblage">
              <Users className="mr-1.5 h-4 w-4" /> Ciblage ({destinataires})
            </TabsTrigger>
            <TabsTrigger value="resultats">
              <BarChart3 className="mr-1.5 h-4 w-4" /> Résultats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="composer" className="pt-4">
            <Card className="mb-4 space-y-3 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Objet du message</Label>
                  <Input value={draft.objet} onChange={(e) => set({ objet: e.target.value })} placeholder="Ce que voit la personne dans sa boîte" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Phrase d'accroche (aperçu)</Label>
                  <Input value={draft.preheader ?? ''} onChange={(e) => set({ preheader: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nom de l'expéditeur</Label>
                  <Input value={draft.from_name} onChange={(e) => set({ from_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Adresse de réponse</Label>
                  <Input value={draft.reply_to ?? ''} onChange={(e) => set({ reply_to: e.target.value })} placeholder="contact@la-frequence-du-vivant.com" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Adresse d'expéditeur</Label>
                  <Input
                    value={draft.from_email ?? ''}
                    onChange={(e) => set({ from_email: e.target.value })}
                    placeholder={DEFAULT_FROM_EMAIL}
                  />
                  {!draft.from_email?.trim() && (
                    <p className="text-xs text-amber-600">
                      Aucune adresse choisie : la lettre partira de l'adresse du Carnet de terrain. Indiquez une adresse
                      de votre domaine vérifié, par exemple {DEFAULT_FROM_EMAIL}.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-[1fr_minmax(320px,42%)]">
              <BlockEditor blocks={draft.blocks ?? []} onChange={(blocks: NewsletterBlock[]) => set({ blocks })} />
              <div className="hidden lg:block">
                <EmailPreview blocks={draft.blocks ?? []} univers={draft.univers} preheader={draft.preheader} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="apercu" className="pt-4">
            <EmailPreview blocks={draft.blocks ?? []} univers={draft.univers} preheader={draft.preheader} />
          </TabsContent>

          <TabsContent value="ciblage" className="pt-4">
            <AudiencePicker
              univers={draft.univers}
              onUniversChange={(u: NewsletterUnivers) => set({ univers: u })}
              mode={draft.audience?.mode ?? 'univers'}
              onModeChange={(mode) => set({ audience: { ...(draft.audience ?? { profileIds: [] }), mode } })}
              selected={draft.audience?.profileIds ?? []}
              onSelectedChange={(profileIds) =>
                set({ audience: { mode: draft.audience?.mode ?? 'selection', profileIds } })
              }
            />
          </TabsContent>

          <TabsContent value="resultats" className="pt-4">
            <CampaignKpis campaignId={draft.id} />
          </TabsContent>
        </Tabs>
      </div>

      <TestDialog
        open={testOpen}
        onOpenChange={setTestOpen}
        campaignId={draft.id}
        watchEmails={lastTestEmails}
        onSend={async (emails) => {
          if (!(await save())) {
            toast.error("Enregistrement impossible : le test n'a pas été envoyé.");
            return;
          }
          const res = await send.mutateAsync({ campaignId: draft.id, test: true, testEmails: emails });
          setTestResult(res);
          setLastTestEmails(emails);
          if (res.sent > 0) {
            toast.success(
              `Test accepté pour ${res.sent} adresse${res.sent > 1 ? 's' : ''} — expéditeur ${res.from ?? '(inconnu)'}`,
            );
          }
          if (res.failed > 0) {
            toast.error(`${res.failed} adresse${res.failed > 1 ? 's' : ''} refusée${res.failed > 1 ? 's' : ''}`);
            return; // la fenêtre reste ouverte pour afficher le motif
          }
          // La fenêtre reste ouverte : le suivi de remise s'y met à jour en direct.
        }}
        pending={send.isPending}
        result={testResult}
      />

      <AlertDialog open={sendOpen} onOpenChange={setSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer « {draft.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                <p><strong>{destinataires}</strong> destinataires — {theme.label}</p>
                <p>Objet : {draft.objet || '(vide)'}</p>
                <p>Expéditeur : {draft.from_name}</p>
                <p className="text-muted-foreground">
                  Chaque message contient un lien de désinscription. Les personnes désinscrites sont exclues.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!(await save())) {
                  toast.error("Enregistrement impossible : la lettre n'a pas été envoyée.");
                  return;
                }
                try {
                  const res = await send.mutateAsync({ campaignId: draft.id });
                  toast.success(`Lettre envoyée à ${res.sent} destinataire${res.sent > 1 ? 's' : ''}`);
                  setSendOpen(false);
                } catch {
                  /* message déjà affiché */
                }
              }}
            >
              {send.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Envoyer maintenant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/** Traduction des événements de livraison Resend (relecture directe). */
const DELIVERY_LABELS: Record<string, string> = {
  sent: "accepté par le service d'envoi, remise en cours",
  delivered: 'remis à la boîte du destinataire',
  delivery_delayed: 'remise retardée — nouvelle tentative en cours',
  bounced: 'rejeté par la boîte du destinataire',
  complained: 'signalé comme indésirable par le destinataire',
  opened: 'remis, puis ouvert',
  clicked: 'remis, ouvert et cliqué',
};

/** Traduction du statut de suivi enregistré par le webhook Resend. */
const RECIPIENT_LABELS: Record<string, string> = {
  queued: "en file d'attente",
  sent: "accepté par le service d'envoi, remise en cours",
  delivered: 'remis à la boîte du destinataire',
  delayed: 'remise retardée — nouvelle tentative en cours',
  bounced: 'rejeté par la boîte du destinataire',
  complained: 'signalé comme indésirable par le destinataire',
  opened: 'remis, puis ouvert',
  clicked: 'remis, ouvert et cliqué',
  failed: 'envoi échoué',
};

/** Adresse que Resend appelle pour annoncer la remise, l'ouverture, etc. */
const WEBHOOK_URL = 'https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/newsletter-webhook';

/** Choix des adresses de test parmi les marcheurs, ou saisie libre. */
const TestDialog: React.FC<{
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaignId: string;
  /** Adresses du dernier test : leur sort est suivi en direct. */
  watchEmails: string[];
  onSend: (emails: string[]) => Promise<void>;
  pending: boolean;
  result?: SendResult | null;
}> = ({ open, onOpenChange, campaignId, watchEmails, onSend, pending, result }) => {
  const { data: rows = [] } = useNewsletterAudience('tous');
  const statusCheck = useDeliveryStatus();
  const [statuses, setStatuses] = React.useState<DeliveryStatusResult | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [manual, setManual] = React.useState('');
  const [q, setQ] = React.useState('');

  // Suivi en direct : le webhook Resend met à jour les lignes de test.
  const watch = useTestDeliveryWatch(campaignId, watchEmails, open && (result?.sent ?? 0) > 0);
  const watchRows = watch.data ?? [];

  React.useEffect(() => {
    setStatuses(null);
  }, [result]);

  const emails = React.useMemo(() => {
    const libres = manual
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set([...selected, ...libres])).slice(0, MAX_TEST);
  }, [selected, manual]);

  const filtered = rows.filter((r) =>
    [r.prenom, r.nom, r.email].filter(Boolean).join(' ').toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Envoyer un test</DialogTitle>
          <DialogDescription>
            Jusqu'à {MAX_TEST} adresses. L'objet est préfixé « [TEST] » et le message n'entre pas dans les statistiques.
          </DialogDescription>
        </DialogHeader>

        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un marcheur…" />
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">
          {filtered.slice(0, 200).map((r) => (
            <label key={r.profile_id} className="flex items-center gap-2 py-1 text-sm">
              <Checkbox
                checked={selected.includes(r.email)}
                onCheckedChange={() =>
                  setSelected((s) => (s.includes(r.email) ? s.filter((x) => x !== r.email) : [...s, r.email]))
                }
              />
              <span className="truncate">
                {[r.prenom, r.nom].filter(Boolean).join(' ') || r.email}
                <span className="ml-1 text-xs text-muted-foreground">{r.email}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Autres adresses (séparées par une virgule)</Label>
          <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="moi@exemple.fr" />
        </div>

        {result && (
          <div className="space-y-1.5 rounded-lg border p-3 text-xs">
            <p>
              Dernier test : <strong>{result.sent}</strong> accepté{result.sent > 1 ? 's' : ''},{' '}
              <strong>{result.failed}</strong> refusé{result.failed > 1 ? 's' : ''}
              {result.from ? ` — expéditeur ${result.from}` : ''}
            </p>
            {result.failures?.map((f) => (
              <p key={f.email} className="text-destructive">
                {f.email} : {f.error}
              </p>
            ))}

            {/* Suivi en direct alimenté par le webhook Resend */}
            {watchRows.length > 0 && (
              <div className="space-y-1 border-t pt-2">
                <p className="text-muted-foreground">
                  Suivi de remise{watch.isFetching ? ' (actualisation…)' : ''} — mis à jour automatiquement :
                </p>
                {watchRows.map((r) => (
                  <p key={r.email}>
                    {r.email} : <strong>{RECIPIENT_LABELS[r.statut] ?? r.statut}</strong>
                    {r.error ? <span className="text-destructive"> — {r.error}</span> : null}
                  </p>
                ))}
                {watchRows.some((r) => ['delivered', 'opened', 'clicked'].includes(r.statut)) && (
                  <p className="text-muted-foreground">
                    Le message a été remis à la boîte du destinataire. S'il n'apparaît pas dans la boîte de réception,
                    vérifiez le dossier « Courrier indésirable / Spam » et marquez-le « non spam » : cela améliore la
                    réputation du domaine d'envoi pour les prochains envois.
                  </p>
                )}
              </div>
            )}

            {/* Relecture directe (bloquée si la clé Resend est limitée à l'envoi) */}
            {statuses?.restricted ? (
              <div className="space-y-1.5 border-t pt-2">
                <p>
                  Votre clé Resend est limitée à l'envoi : elle ne permet pas de relire le statut d'un message après
                  coup. Le suivi de remise passe par le « webhook » — Resend nous annonce chaque événement (remis,
                  rejeté, ouvert, cliqué). Pour l'activer :
                </p>
                <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
                  <li>Ouvrez resend.com/webhooks et cliquez « Add webhook ».</li>
                  <li>
                    Adresse : <code className="break-all rounded bg-muted px-1">{WEBHOOK_URL}</code>
                  </li>
                  <li>
                    Événements : email.delivered, email.bounced, email.delivery_delayed, email.complained,
                    email.opened, email.clicked
                  </li>
                  <li>
                    Copiez la clé de signature affichée (elle commence par whsec_) et transmettez-la à l'assistant :
                    il la rangera dans le coffre-fort du projet.
                  </li>
                </ol>
                <p className="text-muted-foreground">
                  Une fois actif, le statut « remis / rejeté / ouvert » de chaque test s'affiche ici automatiquement.
                </p>
              </div>
            ) : (
              statuses?.statuses.map((s) => (
                <p key={s.id}>
                  {s.to ?? s.id} :{' '}
                  {s.error ? (
                    <span className="text-destructive">statut illisible ({s.error})</span>
                  ) : (
                    <strong>{DELIVERY_LABELS[s.lastEvent ?? ''] ?? `en file d'attente (${s.lastEvent ?? 'inconnu'})`}</strong>
                  )}
                </p>
              ))
            )}
            {statuses?.statuses.some((s) => ['delivered', 'opened', 'clicked'].includes(s.lastEvent ?? '')) && (
              <p className="text-muted-foreground">
                Le message a été remis à la boîte du destinataire. S'il n'apparaît pas dans la boîte de réception,
                vérifiez le dossier « Courrier indésirable / Spam » et marquez-le « non spam » : cela améliore la
                réputation du domaine d'envoi pour les prochains envois.
              </p>
            )}
            {!statuses?.restricted && (result.messageIds?.length ?? 0) > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={statusCheck.isPending}
                onClick={async () => {
                  const res = await statusCheck.mutateAsync({ messageIds: result.messageIds ?? [] });
                  setStatuses(res);
                }}
              >
                {statusCheck.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                Vérifier la livraison
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!emails.length || pending}
            onClick={() => {
              void onSend(emails);
            }}
          >
            {pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <TestTube2 className="mr-1.5 h-4 w-4" />}
            Tester sur {emails.length} adresse{emails.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminNewsletterEditor;
