import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { UserPlus2, Loader2, ShieldCheck, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CSP_OPTIONS, GENDER_OPTIONS } from '@/lib/communityProfileTaxonomy';

const ROLE_OPTIONS = [
  { value: 'marcheur_en_devenir', label: 'En devenir' },
  { value: 'marcheur', label: 'Marcheur' },
  { value: 'eclaireur', label: 'Éclaireur' },
  { value: 'ambassadeur', label: 'Ambassadeur' },
  { value: 'sentinelle', label: 'Sentinelle' },
];

interface FormState {
  email: string;
  password: string;
  send_invite: boolean;
  prenom: string;
  nom: string;
  ville: string;
  telephone: string;
  date_naissance: string;
  genre: string;
  csp: string;
  csp_precision: string;
  role: string;
}

const initial: FormState = {
  email: '',
  password: '',
  send_invite: true,
  prenom: '',
  nom: '',
  ville: '',
  telephone: '',
  date_naissance: '',
  genre: '',
  csp: '',
  csp_precision: '',
  role: 'marcheur_en_devenir',
};

interface CredentialsResult {
  email: string;
  password: string;
  warning?: string | null;
}

const NewMarcheurDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initial);
  const [credentials, setCredentials] = useState<CredentialsResult | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const mutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const { data, error } = await supabase.functions.invoke('admin-create-marcheur', {
        body: {
          email: payload.email.trim().toLowerCase(),
          password: payload.send_invite ? undefined : payload.password,
          send_invite: payload.send_invite,
          prenom: payload.prenom,
          nom: payload.nom,
          ville: payload.ville || null,
          telephone: payload.telephone || null,
          date_naissance: payload.date_naissance || null,
          genre: payload.genre || null,
          csp: payload.csp || null,
          csp_precision: payload.csp_precision || null,
          role: payload.role,
        },
      });
      const payloadOut = (data ?? {}) as {
        error?: string;
        invite_sent?: boolean;
        temporary_password?: string | null;
        warning?: string | null;
      };
      if (error) {
        // Try to extract the actual server error message from the FunctionsHttpError context
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json();
            throw new Error(body?.error || error.message);
          } catch {
            throw new Error(error.message);
          }
        }
        throw error;
      }
      if (payloadOut.error) throw new Error(payloadOut.error);
      return { ...payloadOut, email: payload.email.trim().toLowerCase() };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['community-profiles-admin'] });
      queryClient.invalidateQueries({ queryKey: ['community-impact-aggregates'] });

      if (data.invite_sent) {
        toast.success(`Invitation envoyée à ${data.email}`);
        setForm(initial);
        setOpen(false);
      } else if (data.temporary_password) {
        // Show credentials sheet (do not auto-close — admin must copy the password)
        setCredentials({
          email: data.email,
          password: data.temporary_password,
          warning: data.warning,
        });
        toast.success('Marcheur créé');
      } else {
        toast.success('Marcheur créé');
        setForm(initial);
        setOpen(false);
      }
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Erreur lors de la création');
    },
  });

  const canSubmit =
    form.email.trim() &&
    form.prenom.trim() &&
    form.nom.trim() &&
    (form.send_invite || form.password.length >= 8);

  const copyCredentials = async () => {
    if (!credentials) return;
    const text = `Email : ${credentials.email}\nMot de passe temporaire : ${credentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Identifiants copiés');
    setTimeout(() => setCopied(false), 2000);
  };

  const closeAll = () => {
    setCredentials(null);
    setForm(initial);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setCredentials(null); } setOpen(v); }}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus2 className="h-4 w-4 mr-2" />
          Nouveau marcheur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {credentials ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Marcheur créé ✅</DialogTitle>
              <DialogDescription>
                {credentials.warning ?? "Voici les identifiants temporaires à transmettre au marcheur."}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2 font-mono text-sm">
              <div><span className="text-muted-foreground">Email :</span> {credentials.email}</div>
              <div><span className="text-muted-foreground">Mot de passe :</span> {credentials.password}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Ce mot de passe ne sera plus affiché. Copiez-le et transmettez-le par un canal sécurisé.
              Le marcheur pourra le changer ensuite depuis son espace.
            </p>
            <div className="flex gap-2">
              <Button onClick={copyCredentials} className="flex-1" variant={copied ? 'secondary' : 'default'}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copié' : 'Copier les identifiants'}
              </Button>
              <Button variant="outline" onClick={closeAll}>Fermer</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Créer un nouveau marcheur</DialogTitle>
              <DialogDescription>
                Crée un compte et une fiche communauté. Le marcheur pourra ensuite se connecter et compléter son profil.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compte</h3>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="prenom.nom@email.fr" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Tenter l'invitation par email</p>
                    <p className="text-xs text-muted-foreground">Si le SMTP est indisponible, un mot de passe temporaire vous sera affiché</p>
                  </div>
                  <Switch checked={form.send_invite} onCheckedChange={v => update('send_invite', v)} />
                </div>
                {!form.send_invite && (
                  <div>
                    <Label htmlFor="pwd">Mot de passe (≥ 8 caractères) *</Label>
                    <Input id="pwd" type="text" value={form.password} onChange={e => update('password', e.target.value)} placeholder="à transmettre au marcheur" />
                  </div>
                )}
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identité</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input id="prenom" value={form.prenom} onChange={e => update('prenom', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input id="nom" value={form.nom} onChange={e => update('nom', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ville">Ville</Label>
                    <Input id="ville" value={form.ville} onChange={e => update('ville', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="tel">Téléphone</Label>
                    <Input id="tel" value={form.telephone} onChange={e => update('telephone', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dn">Date de naissance</Label>
                  <Input id="dn" type="date" value={form.date_naissance} onChange={e => update('date_naissance', e.target.value)} />
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualification</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Genre</Label>
                    <Select value={form.genre} onValueChange={v => update('genre', v)}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.emoji} {o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Activité (CSP)</Label>
                    <Select value={form.csp} onValueChange={v => update('csp', v)}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {CSP_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="cspp">Précision activité</Label>
                  <Input id="cspp" maxLength={80} value={form.csp_precision} onChange={e => update('csp_precision', e.target.value)} placeholder="ex. maraîcher bio…" />
                </div>
                <div>
                  <Label>Rôle initial</Label>
                  <Select value={form.role} onValueChange={v => update('role', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => mutation.mutate(form)} disabled={!canSubmit || mutation.isPending} className="flex-1">
                  {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus2 className="h-4 w-4 mr-2" />}
                  {mutation.isPending ? 'Création…' : 'Créer le marcheur'}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              </div>

              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Action réservée aux administrateurs. Si l'invitation par email échoue, un mot de passe temporaire est généré et affiché ici-même.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewMarcheurDialog;
