import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { UserPlus2, Loader2, ShieldCheck } from 'lucide-react';
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

const NewMarcheurDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initial);
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
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-profiles-admin'] });
      queryClient.invalidateQueries({ queryKey: ['community-impact-aggregates'] });
      toast.success('Marcheur créé avec succès');
      setForm(initial);
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur lors de la création'),
  });

  const canSubmit =
    form.email.trim() &&
    form.prenom.trim() &&
    form.nom.trim() &&
    (form.send_invite || form.password.length >= 8);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus2 className="h-4 w-4 mr-2" />
          Nouveau marcheur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau marcheur</DialogTitle>
          <DialogDescription>
            Crée un compte et une fiche communauté. Le marcheur pourra ensuite se connecter et compléter son profil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Compte */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compte</h3>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="prenom.nom@email.fr" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Envoyer une invitation par email</p>
                <p className="text-xs text-muted-foreground">Le marcheur définira son mot de passe lui-même</p>
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

          {/* Identité */}
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

          {/* Qualification */}
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
            Action réservée aux administrateurs. L'utilisateur reçoit (ou peut recevoir) un email pour activer son compte.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMarcheurDialog;
