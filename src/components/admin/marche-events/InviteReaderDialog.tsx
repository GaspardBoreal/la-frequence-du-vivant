import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mail, Loader2, Copy, Check, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface InviteReaderDialogProps {
  eventId: string | null;
  eventTitle?: string | null;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary';
  triggerSize?: 'sm' | 'default' | 'lg';
  /** Pour rafraîchir la liste après création */
  invalidateKey?: unknown[];
}

export const InviteReaderDialog: React.FC<InviteReaderDialogProps> = ({
  eventId,
  eventTitle,
  triggerLabel = 'Inviter un Lecteur',
  triggerVariant = 'outline',
  triggerSize = 'sm',
  invalidateKey,
}) => {
  const [open, setOpen] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [result, setResult] = useState<{ url: string; emailSent: boolean; emailError: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const reset = () => {
    setPrenom(''); setEmail(''); setSendEmail(true); setResult(null); setCopied(false);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('event-invitation-create', {
        body: {
          event_id: eventId,
          invited_email: email.trim().toLowerCase(),
          invited_prenom: prenom.trim(),
          send_email: sendEmail,
          site_url: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { invite_url: string; email_sent: boolean; email_error: string | null };
    },
    onSuccess: (data) => {
      setResult({ url: data.invite_url, emailSent: data.email_sent, emailError: data.email_error });
      if (data.email_sent) {
        toast.success(`Invitation envoyée à ${email}`);
      } else {
        toast.info('Invitation créée — partagez le lien manuellement.');
      }
      if (invalidateKey) queryClient.invalidateQueries({ queryKey: invalidateKey });
    },
    onError: (e: Error) => toast.error(e.message || "Erreur lors de l'envoi"),
  });

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    toast.success('Lien copié');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          <BookOpen className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {result ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Invitation créée ✅</DialogTitle>
              <DialogDescription>
                {result.emailSent
                  ? `Un email a été envoyé à ${email}.`
                  : `L'envoi automatique n'a pas pu aboutir${result.emailError ? ` (${result.emailError})` : ''}. Copiez le lien et partagez-le manuellement.`}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border bg-muted/40 p-3">
              <code className="text-xs break-all">{result.url}</code>
            </div>
            <div className="flex gap-2">
              <Button onClick={copy} className="flex-1" variant={copied ? 'secondary' : 'default'}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copié' : 'Copier le lien'}
              </Button>
              <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>Fermer</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le lien expire dans 30 jours et est à usage unique.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Inviter un Lecteur</DialogTitle>
              <DialogDescription>
                {eventTitle
                  ? `Le destinataire pourra découvrir « ${eventTitle} » en lecture seule.`
                  : `Le destinataire créera un compte « Lecteur invité » (lecture seule).`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label htmlFor="inv-prenom">Prénom *</Label>
                <Input id="inv-prenom" value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Marie" />
              </div>
              <div>
                <Label htmlFor="inv-email">Email *</Label>
                <Input id="inv-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marie@email.fr" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Envoyer l'email d'invitation</p>
                  <p className="text-xs text-muted-foreground">Sinon, vous pourrez copier le lien et le partager</p>
                </div>
                <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={!prenom.trim() || !email.trim() || mutation.isPending}
                  className="flex-1"
                >
                  {mutation.isPending
                    ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    : <Mail className="h-4 w-4 mr-2" />}
                  {sendEmail ? 'Envoyer l\'invitation' : 'Créer le lien'}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteReaderDialog;
