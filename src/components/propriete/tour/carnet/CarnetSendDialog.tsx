import React from 'react';
import { Loader2, Mail, Plus, Search, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { ProprieteTour, TourAction } from '@/hooks/propriete/useProprieteTours';
import { buildCarnetPdfBlob, carnetFilename, type CarnetOptions } from './CarnetTerrainPdf';
import { useCarnetRecipients, useSendCarnet } from '@/hooks/propriete/useCarnetEnvoi';

const MAX = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fmtDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const ROLE_LABEL: Record<string, string> = {
  proprietaire: 'Propriétaire',
  prestataire: 'Prestataire',
  marcheur_historique: 'Marcheur historique',
  participant: 'Participant',
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tour: ProprieteTour;
  actions: TourAction[];
  proprieteId: string;
  proprieteNom: string;
  options: CarnetOptions;
  onSent?: () => void;
}

export const CarnetSendDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  tour,
  actions,
  proprieteId,
  proprieteNom,
  options,
  onSent,
}) => {
  const { data: recipients = [], isLoading } = useCarnetRecipients(proprieteId, open);
  const send = useSendCarnet();

  const [selected, setSelected] = React.useState<string[]>([]);
  const [emails, setEmails] = React.useState<string[]>([]);
  const [emailDraft, setEmailDraft] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setSubject(`Carnet de terrain — ${proprieteNom} — ${fmtDate(tour.date_tour)}`);
    setBody(
      `Bonjour,\n\nVoici le carnet de terrain du tour de jardin « ${tour.titre} » à ${proprieteNom}, prévu le ${fmtDate(
        tour.date_tour,
      )}.\n\nIl se glisse dans la poche : à imprimer, plier et annoter au crayon en marchant.\n\nÀ bientôt dans le jardin.`,
    );
  }, [open, proprieteNom, tour.date_tour, tour.titre]);

  const total = selected.length + emails.length;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => `${r.prenom ?? ''} ${r.nom ?? ''}`.toLowerCase().includes(q));
  }, [recipients, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (total >= MAX) {
        toast.info(`${MAX} destinataires maximum`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const addEmail = () => {
    const v = emailDraft.trim().toLowerCase();
    if (!v) return;
    if (!EMAIL_RE.test(v)) {
      toast.error('Adresse email invalide');
      return;
    }
    if (emails.includes(v)) {
      setEmailDraft('');
      return;
    }
    if (total >= MAX) {
      toast.info(`${MAX} destinataires maximum`);
      return;
    }
    setEmails((prev) => [...prev, v]);
    setEmailDraft('');
  };

  const gestes = React.useMemo(() => actions.map((a) => a.titre), [actions]);

  const submit = async () => {
    if (total === 0) {
      toast.error('Choisissez au moins un destinataire');
      return;
    }
    try {
      const docProps = {
        tour,
        actions,
        proprieteNom,
        options,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      };
      const blob = await buildCarnetPdfBlob(docProps);
      const pdfBase64 = await blobToBase64(blob);
      const result = await send.mutateAsync({
        tourId: tour.id,
        proprieteId,
        subject: subject.trim(),
        body,
        profileIds: selected,
        emails,
        pdfBase64,
        pdfFilename: carnetFilename(docProps),
        proprieteNom,
        tourTitre: tour.titre,
        dateTour: fmtDate(tour.date_tour),
        dureeMin: tour.duree_min ?? null,
        saison: tour.saison ?? null,
        gestes,
      });
      if (result.status === 'partial') {
        toast.warning(`Carnet envoyé à ${result.sent} personne(s), ${result.failed} échec(s)`);
      } else {
        toast.success(`Carnet envoyé à ${result.sent} personne${result.sent > 1 ? 's' : ''}`);
      }
      if (result.sansEmail?.length) {
        toast.info(`Sans adresse connue : ${result.sansEmail.join(', ')}`);
      }
      onSent?.();
      onOpenChange(false);
      setSelected([]);
      setEmails([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "L'envoi n'a pas abouti");
      console.error('[carnet-send]', e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Envoyer le carnet
          </DialogTitle>
          <DialogDescription>
            {total}/{MAX} destinataire{total > 1 ? 's' : ''} · le carnet part en pièce jointe, aux couleurs de Fréquence
            Jardin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Marcheurs */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Marcheurs du jardin et des marches
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un nom…"
                className="pl-8 h-10"
              />
            </div>
            <div className="max-h-[38vh] overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {isLoading && (
                <p className="p-3 text-sm text-muted-foreground">Chargement des marcheurs…</p>
              )}
              {!isLoading && filtered.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">Aucun marcheur trouvé.</p>
              )}
              {filtered.map((r) => {
                const nom = [r.prenom, r.nom].filter(Boolean).join(' ') || 'Marcheur';
                const checked = selected.includes(r.community_profile_id);
                return (
                  <label
                    key={r.community_profile_id}
                    className={`flex min-h-[44px] items-center gap-3 px-3 py-2 text-sm ${
                      r.has_email ? 'cursor-pointer hover:bg-muted/50' : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!r.has_email}
                      onCheckedChange={() => toggle(r.community_profile_id)}
                      aria-label={`Envoyer à ${nom}`}
                    />
                    <span className="min-w-0 flex-1 truncate">{nom}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {r.has_email ? ROLE_LABEL[r.role ?? ''] ?? r.role ?? '' : 'sans email'}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Adresses libres */}
          <section className="space-y-2">
            <Label htmlFor="carnet-email" className="text-xs uppercase tracking-wide text-muted-foreground">
              Autres adresses
            </Label>
            <div className="flex gap-2">
              <Input
                id="carnet-email"
                type="email"
                inputMode="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addEmail();
                  }
                }}
                placeholder="prenom@exemple.fr"
                className="h-10"
              />
              <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={addEmail} aria-label="Ajouter cette adresse">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {emails.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {emails.map((e) => (
                  <li key={e}>
                    <button
                      type="button"
                      onClick={() => setEmails((prev) => prev.filter((x) => x !== e))}
                      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 text-xs hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Retirer ${e}`}
                    >
                      {e}
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Message */}
          <section className="space-y-2">
            <Label htmlFor="carnet-subject" className="text-xs uppercase tracking-wide text-muted-foreground">
              Objet
            </Label>
            <Input
              id="carnet-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className="h-10"
            />
            <Label htmlFor="carnet-body" className="text-xs uppercase tracking-wide text-muted-foreground">
              Message
            </Label>
            <Textarea
              id="carnet-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={5000}
            />
          </section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={send.isPending || total === 0 || !subject.trim()}>
            {send.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CarnetSendDialog;
