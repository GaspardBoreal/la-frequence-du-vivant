import React, { useState, useEffect } from 'react';
import { LogOut, User, MapPin, Mail, Phone, Calendar, Heart, Sparkles, Mountain, MessageSquare, Pencil, Save, X, Briefcase, UserCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RoleBadge from './RoleBadge';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CSP_OPTIONS, GENDER_OPTIONS, cspLabel, genderLabel } from '@/lib/communityProfileTaxonomy';

interface CommunityProfile {
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
  marches_count: number;
  formation_validee: boolean;
  certification_validee: boolean;
  kigo_accueil: string | null;
  superpouvoir_sensoriel: string | null;
  niveau_intimite_vivant: string | null;
  created_at: string;
  updated_at: string;
  genre?: string | null;
  csp?: string | null;
  csp_precision?: string | null;
}

interface MonEspaceSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CommunityProfile;
  email: string;
  role: CommunityRoleKey;
  onSignOut: () => void;
  onProfileUpdated: () => void;
}

const KIGO_OPTIONS = [
  { value: 'curieux', label: '🦋 Curieux·se du vivant' },
  { value: 'habitue', label: '🌿 Habitué·e de la nature' },
  { value: 'profond', label: '🌳 Connexion profonde' },
];

const SUPERPOUVOIR_OPTIONS = [
  { value: 'vue', label: '👁️ La vue — je repère un rapace à 2 km' },
  { value: 'ouie', label: '👂 L\'ouïe — je distingue 12 chants d\'oiseaux' },
  { value: 'odorat', label: '👃 L\'odorat — je sens la pluie arriver' },
  { value: 'toucher', label: '✋ Le toucher — je lis les écorces' },
  { value: 'gout', label: '👅 Le goût — je reconnais les plantes comestibles' },
];

const INTIMITE_OPTIONS = [
  { value: 'randonneur', label: '🥾 Randonneur·se du dimanche' },
  { value: 'bivouaqueur', label: '🏕️ Bivouaqueur·se occasionnel·le' },
  { value: 'forestier', label: '🌲 Forestier·ère dans l\'âme' },
];

interface FormData {
  prenom: string;
  nom: string;
  ville: string;
  telephone: string;
  date_naissance: string;
  motivation: string;
  kigo_accueil: string;
  superpouvoir_sensoriel: string;
  niveau_intimite_vivant: string;
  genre: string;
  csp: string;
  csp_precision: string;
}

const MonEspaceSettings: React.FC<MonEspaceSettingsProps> = ({
  open, onOpenChange, profile, email, role, onSignOut, onProfileUpdated,
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    prenom: '',
    nom: '',
    ville: '',
    telephone: '',
    date_naissance: '',
    motivation: '',
    kigo_accueil: '',
    superpouvoir_sensoriel: '',
    niveau_intimite_vivant: '',
  });

  const initials = `${profile.prenom[0] || ''}${profile.nom[0] || ''}`.toUpperCase();

  useEffect(() => {
    if (profile) {
      setFormData({
        prenom: profile.prenom || '',
        nom: profile.nom || '',
        ville: profile.ville || '',
        telephone: profile.telephone || '',
        date_naissance: profile.date_naissance || '',
        motivation: profile.motivation || '',
        kigo_accueil: profile.kigo_accueil || '',
        superpouvoir_sensoriel: profile.superpouvoir_sensoriel || '',
        niveau_intimite_vivant: profile.niveau_intimite_vivant || '',
      });
    }
  }, [profile]);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      prenom: profile.prenom || '',
      nom: profile.nom || '',
      ville: profile.ville || '',
      telephone: profile.telephone || '',
      date_naissance: profile.date_naissance || '',
      motivation: profile.motivation || '',
      kigo_accueil: profile.kigo_accueil || '',
      superpouvoir_sensoriel: profile.superpouvoir_sensoriel || '',
      niveau_intimite_vivant: profile.niveau_intimite_vivant || '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('community_profiles')
        .update({
          prenom: formData.prenom.trim(),
          nom: formData.nom.trim(),
          ville: formData.ville.trim() || null,
          telephone: formData.telephone.trim() || null,
          date_naissance: formData.date_naissance || null,
          motivation: formData.motivation.trim() || null,
          kigo_accueil: formData.kigo_accueil || null,
          superpouvoir_sensoriel: formData.superpouvoir_sensoriel || null,
          niveau_intimite_vivant: formData.niveau_intimite_vivant || null,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast.success('Profil mis à jour ! 🌿');
      setEditing(false);
      onProfileUpdated();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const findLabel = (options: { value: string; label: string }[], value: string | null) => {
    return options.find(o => o.value === value)?.label || '—';
  };

  const ReadOnlyField = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) => (
    <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
      <Icon className="w-4 h-4 text-emerald-300/60 flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-emerald-200/40">{label}</p>
        <p className="text-sm text-white break-words">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditing(false); }}>
      <SheetContent side="right" className="bg-emerald-950 border-l border-white/10 text-white w-[340px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white">Mon profil</SheetTitle>
          <SheetDescription className="text-emerald-200/50 text-center">
            {editing ? 'Modifiez vos informations' : 'Vos informations personnelles'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 pb-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/40 to-teal-600/40 border-2 border-emerald-400/30 flex items-center justify-center text-emerald-100 font-bold text-2xl">
              {initials}
            </div>
            <RoleBadge role={role} size="md" darkMode />
          </div>

          {/* Section 1: Identité */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-emerald-300/70 uppercase tracking-wider px-1">Identité</h3>
            <div className="space-y-2">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-emerald-200/40 mb-1 block">Prénom</label>
                      <Input
                        value={formData.prenom}
                        onChange={e => updateField('prenom', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-emerald-200/40 mb-1 block">Nom</label>
                      <Input
                        value={formData.nom}
                        onChange={e => updateField('nom', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                    <Mail className="w-4 h-4 text-emerald-300/60 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-emerald-200/40">Email</p>
                      <p className="text-sm text-white/60">{email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-emerald-200/40 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Ville
                    </label>
                    <Input
                      value={formData.ville}
                      onChange={e => updateField('ville', e.target.value)}
                      placeholder="Votre ville"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-emerald-200/40 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> Téléphone
                    </label>
                    <Input
                      type="tel"
                      value={formData.telephone}
                      onChange={e => updateField('telephone', e.target.value)}
                      placeholder="06 XX XX XX XX"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-emerald-200/40 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> Date de naissance
                    </label>
                    <Input
                      type="date"
                      value={formData.date_naissance}
                      onChange={e => updateField('date_naissance', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm [color-scheme:dark]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <ReadOnlyField icon={User} label="Nom" value={`${profile.prenom} ${profile.nom}`} />
                  <ReadOnlyField icon={Mail} label="Email" value={email} />
                  <ReadOnlyField icon={MapPin} label="Ville" value={profile.ville} />
                  <ReadOnlyField icon={Phone} label="Téléphone" value={profile.telephone} />
                  <ReadOnlyField icon={Calendar} label="Date de naissance" value={profile.date_naissance} />
                </>
              )}
            </div>
          </div>

          {/* Section 2: Relation au vivant */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-emerald-300/70 uppercase tracking-wider px-1">Votre relation au vivant</h3>
            <div className="space-y-2">
              {editing ? (
                <>
                  <div>
                    <label className="text-xs text-emerald-200/40 mb-1 flex items-center gap-1.5">
                      <Heart className="w-3 h-3" /> Kigo d'accueil
                    </label>
                    <Select value={formData.kigo_accueil} onValueChange={v => updateField('kigo_accueil', v)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-sm">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-emerald-950 border-white/20">
                        {KIGO_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-emerald-200/40 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Superpouvoir sensoriel
                    </label>
                    <Select value={formData.superpouvoir_sensoriel} onValueChange={v => updateField('superpouvoir_sensoriel', v)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-sm">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-emerald-950 border-white/20">
                        {SUPERPOUVOIR_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-emerald-200/40 mb-1 flex items-center gap-1.5">
                      <Mountain className="w-3 h-3" /> Niveau d'intimité
                    </label>
                    <Select value={formData.niveau_intimite_vivant} onValueChange={v => updateField('niveau_intimite_vivant', v)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 text-sm">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-emerald-950 border-white/20">
                        {INTIMITE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-emerald-200/40 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> Motivation
                    </label>
                    <Textarea
                      value={formData.motivation}
                      onChange={e => updateField('motivation', e.target.value)}
                      placeholder="Qu'est-ce qui vous motive ?"
                      rows={3}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-sm min-h-[70px] resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <ReadOnlyField icon={Heart} label="Kigo d'accueil" value={findLabel(KIGO_OPTIONS, profile.kigo_accueil)} />
                  <ReadOnlyField icon={Sparkles} label="Superpouvoir sensoriel" value={findLabel(SUPERPOUVOIR_OPTIONS, profile.superpouvoir_sensoriel)} />
                  <ReadOnlyField icon={Mountain} label="Niveau d'intimité" value={findLabel(INTIMITE_OPTIONS, profile.niveau_intimite_vivant)} />
                  <ReadOnlyField icon={MessageSquare} label="Motivation" value={profile.motivation} />
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {editing ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.prenom.trim() || !formData.nom.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleEdit}
                variant="outline"
                className="w-full border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Modifier mon profil
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => { onSignOut(); onOpenChange(false); }}
              className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MonEspaceSettings;
