import React, { useState } from 'react';
import { Footprints, UserPlus, ArrowLeft, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MarcheurPicker } from './MarcheurPicker';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import type { MarcheurForCrm } from '@/hooks/useMarcheursForCrm';
import { toast } from 'sonner';

type Step = 'choice' | 'picker' | 'confirm' | 'manual';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddMemberDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const [step, setStep] = useState<Step>('choice');
  const [picked, setPicked] = useState<MarcheurForCrm | null>(null);
  const [fonction, setFonction] = useState('');
  const [isActive, setIsActive] = useState(true);

  // manual form
  const [m, setM] = useState({ prenom: '', nom: '', email: '', fonction: '', telephone: '' });

  const { members, createMember } = useTeamMembers();
  const existingUserIds = new Set(
    members.map((mm) => mm.user_id).filter(Boolean) as string[],
  );

  const reset = () => {
    setStep('choice');
    setPicked(null);
    setFonction('');
    setIsActive(true);
    setM({ prenom: '', nom: '', email: '', fonction: '', telephone: '' });
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handlePick = (mar: MarcheurForCrm) => {
    if (existingUserIds.has(mar.user_id)) {
      toast.error('Ce marcheur est déjà membre de l\'équipe');
      return;
    }
    setPicked(mar);
    setFonction(mar.role === 'ambassadeur' ? 'Ambassadeur' : mar.role === 'sentinelle' ? 'Sentinelle' : '');
    setStep('confirm');
  };

  const submitFromMarcheur = () => {
    if (!picked) return;
    createMember.mutate(
      {
        prenom: picked.prenom,
        nom: picked.nom,
        email: null,
        fonction: fonction || null,
        telephone: picked.telephone || null,
        is_active: isActive,
        user_id: picked.user_id,
        photo_url: picked.avatar_url,
      },
      { onSuccess: () => close(false) },
    );
  };

  const submitManual = () => {
    if (!m.prenom || !m.nom) {
      toast.error('Prénom et nom sont requis');
      return;
    }
    createMember.mutate(
      {
        prenom: m.prenom,
        nom: m.nom,
        email: m.email || null,
        fonction: m.fonction || null,
        telephone: m.telephone || null,
        is_active: isActive,
        user_id: null,
        photo_url: null,
      },
      { onSuccess: () => close(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'choice' && (
              <Button variant="ghost" size="sm" className="-ml-2 h-8" onClick={() => setStep('choice')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {step === 'choice' && 'Ajouter un membre'}
            {step === 'picker' && 'Choisir un marcheur'}
            {step === 'confirm' && 'Confirmer l\'ajout'}
            {step === 'manual' && 'Nouveau membre externe'}
          </DialogTitle>
          <DialogDescription>
            {step === 'choice' && 'Sélectionnez la source du nouveau membre de l\'équipe CRM'}
            {step === 'picker' && 'Recherchez un marcheur dans la communauté'}
            {step === 'confirm' && 'Vérifiez et complétez les informations'}
            {step === 'manual' && 'Saisissez les informations du membre'}
          </DialogDescription>
        </DialogHeader>

        {step === 'choice' && (
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setStep('picker')}
              className="relative group p-6 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent hover:border-primary hover:shadow-lg hover:-translate-y-0.5 transition-all text-left"
            >
              <Badge className="absolute top-3 right-3 gap-1 bg-primary text-primary-foreground">
                <Sparkles className="h-3 w-3" /> Recommandé
              </Badge>
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Footprints className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-1">Depuis la communauté</h3>
              <p className="text-sm text-muted-foreground">
                Promouvoir un marcheur (ambassadeur, sentinelle…) comme utilisateur du CRM.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStep('manual')}
              className="p-6 rounded-xl border-2 border-border hover:border-foreground/30 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
            >
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserPlus className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="font-semibold text-base mb-1">Membre externe</h3>
              <p className="text-sm text-muted-foreground">
                Créer un membre manuellement (prestataire, partenaire non marcheur…).
              </p>
            </button>
          </div>
        )}

        {step === 'picker' && (
          <MarcheurPicker existingUserIds={existingUserIds} onPick={handlePick} />
        )}

        {step === 'confirm' && picked && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border">
              <Avatar className="h-14 w-14">
                <AvatarImage src={picked.avatar_url || undefined} />
                <AvatarFallback>{picked.prenom?.[0]}{picked.nom?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{picked.prenom} {picked.nom}</p>
                <p className="text-sm text-muted-foreground">
                  {picked.ville || '—'} {picked.role && `· ${picked.role}`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fonction">Fonction dans le CRM (optionnel)</Label>
              <Input
                id="fonction"
                value={fonction}
                onChange={(e) => setFonction(e.target.value)}
                placeholder="ex. Ambassadeur Dordogne"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <Label htmlFor="active">Membre actif</Label>
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <p className="text-xs text-muted-foreground">
              Le rôle CRM (Admin / Membre / Marcheur) sera attribuable depuis la carte du membre après création.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('picker')}>Changer</Button>
              <Button onClick={submitFromMarcheur} disabled={createMember.isPending}>
                Ajouter à l'équipe
              </Button>
            </div>
          </div>
        )}

        {step === 'manual' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" value={m.prenom} onChange={(e) => setM({ ...m, prenom: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" value={m.nom} onChange={(e) => setM({ ...m, nom: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={m.email} onChange={(e) => setM({ ...m, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fct">Fonction</Label>
                <Input id="fct" value={m.fonction} onChange={(e) => setM({ ...m, fonction: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tel">Téléphone</Label>
                <Input id="tel" value={m.telephone} onChange={(e) => setM({ ...m, telephone: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <Label htmlFor="active-m">Membre actif</Label>
              <Switch id="active-m" checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => close(false)}>Annuler</Button>
              <Button onClick={submitManual} disabled={createMember.isPending}>Ajouter</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
