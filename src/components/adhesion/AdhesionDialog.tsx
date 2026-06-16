import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, Loader2, Heart, Check } from 'lucide-react';

interface AdhesionFormProps {
  onSuccess?: () => void;
  source?: string;
  embedded?: boolean;
}

const TYPES = [
  { value: 'agroecologique', label: 'Agroécologique', emoji: '🌾' },
  { value: 'ecotouristique', label: 'Écotouristique', emoji: '🥾' },
  { value: 'geopoetique', label: 'Géopoétique', emoji: '📖' },
  { value: 'autre', label: 'Autre', emoji: '✨' },
] as const;

const COLLEGES = [
  {
    value: 'actifs',
    label: 'Collège des Adhérents Actifs',
    desc: 'Marcheurs, contributeurs et organisateurs qui font vivre les marches du vivant au quotidien.',
  },
  {
    value: 'partenaires_mecenes',
    label: 'Collège des Partenaires & Mécènes',
    desc: 'Entreprises, fondations et structures qui soutiennent la Fréquence (validation par le bureau).',
  },
  {
    value: 'fondateurs',
    label: 'Collège des Fondateurs',
    desc: 'Membres fondateurs initiaux — collège réservé (validation par le bureau).',
  },
] as const;

export const AdhesionForm: React.FC<AdhesionFormProps> = ({ onSuccess, source, embedded }) => {
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | 'linked' | 'pending'>(null);
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    ville: '',
    types_marches: [] as string[],
    autre_type_marche: '',
    commentaires: '',
    college_demande: 'actifs' as string,
    rgpd_consent: false,
  });

  const toggleType = (v: string) => {
    setForm((f) => ({
      ...f,
      types_marches: f.types_marches.includes(v)
        ? f.types_marches.filter((t) => t !== v)
        : [...f.types_marches, v],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rgpd_consent) {
      toast.error('Merci d’accepter la conformité RGPD pour rejoindre l’association.');
      return;
    }
    if (!form.prenom || !form.nom || !form.email) {
      toast.error('Prénom, Nom et Email sont requis.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-adhesion', {
        body: {
          ...form,
          source: source ?? searchParams.get('src') ?? 'formulaire_public',
          campaign: searchParams.get('campaign') ?? null,
        },
      });
      if (error) throw error;
      if ((data as any)?.ok) {
        setDone(((data as any).outcome as 'linked' | 'pending') ?? 'pending');
        toast.success('Bienvenue dans la Fréquence du Vivant 🌿');
        onSuccess?.();
      } else {
        throw new Error('Réponse invalide');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Désolé, une erreur est survenue. Réessayez ou écrivez-nous.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold">Vous êtes maintenant en résonance.</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {done === 'linked'
            ? 'Votre profil de marcheur a été mis à jour. Vous rejoignez le Collège des Adhérents Actifs.'
            : 'Nous avons reçu votre demande. Vous serez recontacté·e très prochainement pour finaliser votre adhésion.'}
        </p>
        <p className="text-sm text-muted-foreground">Merci de prêter votre attention au vivant.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prenom">Prénom <span className="text-rose-500">*</span></Label>
          <Input id="prenom" required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nom">Nom <span className="text-rose-500">*</span></Label>
          <Input id="nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email <span className="text-rose-500">*</span></Label>
          <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telephone">Téléphone</Label>
          <Input id="telephone" type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ville">Ville d’habitation</Label>
          <Input id="ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Quels types de marche vous attirent ?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => toggleType(t.value)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-base min-h-[52px] w-full transition ${
                form.types_marches.includes(t.value)
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100'
                  : 'border-stone-200 dark:border-emerald-500/20 hover:border-emerald-300'
              }`}
            >
              <span className="shrink-0 text-lg">{t.emoji}</span>
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
        {form.types_marches.includes('autre') && (
          <Input
            placeholder="Précisez le type de marche…"
            value={form.autre_type_marche}
            onChange={(e) => setForm({ ...form, autre_type_marche: e.target.value })}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Collège que vous souhaitez rejoindre</Label>
        <RadioGroup value={form.college_demande} onValueChange={(v) => setForm({ ...form, college_demande: v })}>
          {COLLEGES.map((c) => (
            <label
              key={c.value}
              htmlFor={`college-${c.value}`}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition ${
                form.college_demande === c.value
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10'
                  : 'border-stone-200 dark:border-emerald-500/20 hover:border-emerald-300'
              }`}
            >
              <RadioGroupItem id={`college-${c.value}`} value={c.value} className="mt-1" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.desc}</div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="commentaires">Commentaires (facultatif)</Label>
        <Textarea
          id="commentaires"
          rows={3}
          value={form.commentaires}
          onChange={(e) => setForm({ ...form, commentaires: e.target.value })}
          placeholder="Ce qui vous touche, vos envies, vos compétences à partager…"
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-stone-200 dark:border-emerald-500/20 p-3 bg-stone-50/60 dark:bg-emerald-950/30">
        <Checkbox
          id="rgpd"
          checked={form.rgpd_consent}
          onCheckedChange={(c) => setForm({ ...form, rgpd_consent: !!c })}
        />
        <span className="text-xs text-muted-foreground leading-relaxed">
          J’accepte que la Fréquence du Vivant conserve mes données pour gérer mon adhésion et m’envoie ses actualités
          (newsletter). Conformément au RGPD, je peux demander à tout moment la modification ou la suppression de mes
          données. <span className="text-rose-500">Accord obligatoire pour rejoindre l’association.</span>
        </span>
      </label>

      <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
        Rejoindre l'association
      </Button>
    </form>
  );
};

interface AdhesionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
}

export const AdhesionDialog: React.FC<AdhesionDialogProps> = ({ open, onOpenChange, source }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          Rejoindre la Fréquence
        </DialogTitle>
        <DialogDescription>
          Une association loi 1901 qui relie marcheurs, scientifiques, artistes et territoires autour du vivant.
        </DialogDescription>
      </DialogHeader>
      <AdhesionForm source={source} onSuccess={() => { /* dialog reste ouvert sur l'écran de succès */ }} />
    </DialogContent>
  </Dialog>
);

export default AdhesionDialog;
