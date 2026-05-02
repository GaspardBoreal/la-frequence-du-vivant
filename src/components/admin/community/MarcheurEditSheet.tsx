import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, X, ShieldCheck, GraduationCap, Award } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CSP_OPTIONS, GENDER_OPTIONS } from '@/lib/communityProfileTaxonomy';

export interface EditableProfile {
  id: string;
  user_id: string;
  prenom: string;
  nom: string;
  ville: string | null;
  telephone: string | null;
  date_naissance: string | null;
  motivation: string | null;
  avatar_url: string | null;
  role: string;
  formation_validee: boolean;
  certification_validee: boolean;
  kigo_accueil: string | null;
  superpouvoir_sensoriel: string | null;
  niveau_intimite_vivant: string | null;
  genre?: string | null;
  csp?: string | null;
  csp_precision?: string | null;
}

const ROLE_OPTIONS = [
  { value: 'marcheur_en_devenir', label: 'En devenir' },
  { value: 'marcheur', label: 'Marcheur' },
  { value: 'eclaireur', label: 'Éclaireur' },
  { value: 'ambassadeur', label: 'Ambassadeur' },
  { value: 'sentinelle', label: 'Sentinelle' },
];

interface Props {
  profile: EditableProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MarcheurEditSheet: React.FC<Props> = ({ profile, open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EditableProfile | null>(profile);

  useEffect(() => { setForm(profile); }, [profile]);

  const mutation = useMutation({
    mutationFn: async (payload: EditableProfile) => {
      const { error } = await supabase
        .from('community_profiles')
        .update({
          prenom: payload.prenom.trim(),
          nom: payload.nom.trim(),
          ville: payload.ville?.trim() || null,
          telephone: payload.telephone?.trim() || null,
          date_naissance: payload.date_naissance || null,
          motivation: payload.motivation?.trim() || null,
          kigo_accueil: payload.kigo_accueil || null,
          superpouvoir_sensoriel: payload.superpouvoir_sensoriel || null,
          niveau_intimite_vivant: payload.niveau_intimite_vivant || null,
          genre: (payload.genre as never) || null,
          csp: (payload.csp as never) || null,
          csp_precision: payload.csp_precision?.trim().slice(0, 80) || null,
          role: payload.role as never,
          formation_validee: payload.formation_validee,
          certification_validee: payload.certification_validee,
        })
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-profiles-admin'] });
      queryClient.invalidateQueries({ queryKey: ['community-impact-aggregates'] });
      toast.success('Fiche marcheur mise à jour');
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur lors de la sauvegarde'),
  });

  if (!form) return null;

  const update = <K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) =>
    setForm(prev => (prev ? { ...prev, [key]: value } : prev));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Éditer la fiche marcheur</SheetTitle>
          <SheetDescription>
            Toutes les informations restent privées. Seuls vous (admin) et le marcheur lui-même y ont accès.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Identité */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Identité</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" value={form.prenom} onChange={e => update('prenom', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={form.nom} onChange={e => update('nom', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ville">Ville</Label>
                <Input id="ville" value={form.ville ?? ''} onChange={e => update('ville', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="tel">Téléphone</Label>
                <Input id="tel" value={form.telephone ?? ''} onChange={e => update('telephone', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="dn">Date de naissance</Label>
              <Input id="dn" type="date" value={form.date_naissance ?? ''} onChange={e => update('date_naissance', e.target.value)} />
            </div>
          </section>

          <Separator />

          {/* Qualification */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Qualification socio-démographique
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Genre</Label>
                <Select value={form.genre ?? ''} onValueChange={v => update('genre', v || null)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.emoji} {o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Activité (CSP INSEE)</Label>
                <Select value={form.csp ?? ''} onValueChange={v => update('csp', v || null)}>
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
              <Label htmlFor="cspp">Précision (libre, max 80 car.)</Label>
              <Input
                id="cspp"
                maxLength={80}
                value={form.csp_precision ?? ''}
                onChange={e => update('csp_precision', e.target.value)}
                placeholder="ex. maraîcher bio, professeure des écoles…"
              />
            </div>
          </section>

          <Separator />

          {/* Relation au vivant */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Relation au vivant
            </h3>
            <div>
              <Label>Kigo d'accueil</Label>
              <Input value={form.kigo_accueil ?? ''} onChange={e => update('kigo_accueil', e.target.value)} />
            </div>
            <div>
              <Label>Superpouvoir sensoriel</Label>
              <Input value={form.superpouvoir_sensoriel ?? ''} onChange={e => update('superpouvoir_sensoriel', e.target.value)} />
            </div>
            <div>
              <Label>Niveau d'intimité avec le vivant</Label>
              <Input value={form.niveau_intimite_vivant ?? ''} onChange={e => update('niveau_intimite_vivant', e.target.value)} />
            </div>
            <div>
              <Label>Motivation</Label>
              <Textarea rows={3} value={form.motivation ?? ''} onChange={e => update('motivation', e.target.value)} />
            </div>
          </section>

          <Separator />

          {/* Statut */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Statut communautaire</h3>
            <div>
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={v => update('role', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-emerald-500" /> Formation validée
              </div>
              <Switch checked={form.formation_validee} onCheckedChange={v => update('formation_validee', v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-amber-500" /> Certification validée
              </div>
              <Switch checked={form.certification_validee} onCheckedChange={v => update('certification_validee', v)} />
            </div>
          </section>

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-background py-3">
            <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="h-3 w-3 mt-0.5 flex-shrink-0" />
            L'email et le mot de passe sont gérés par l'authentification Supabase et ne sont pas modifiables ici.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MarcheurEditSheet;
