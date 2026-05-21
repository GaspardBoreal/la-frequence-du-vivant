import React, { useEffect, useState } from 'react';
import { Globe2, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  userId: string;
}

/**
 * Opt-in pour apparaître nommément (prénom + initiale) sur les pages publiques
 * des marches auxquelles le marcheur a participé.
 */
const PublicEventConsentToggle: React.FC<Props> = ({ userId }) => {
  const [value, setValue] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase
      .from('community_profiles')
      .select('public_event_consent')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setValue(!!(data as any)?.public_event_consent);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  const handleChange = async (next: boolean) => {
    setSaving(true);
    setValue(next);
    const { error } = await supabase
      .from('community_profiles')
      .update({ public_event_consent: next } as any)
      .eq('user_id', userId);
    setSaving(false);
    if (error) {
      setValue(!next);
      toast.error('Erreur de sauvegarde');
    } else {
      toast.success(next ? 'Vous apparaîtrez sur les pages publiques 🌿' : 'Votre nom restera privé');
    }
  };

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-emerald-300/70 uppercase tracking-wider px-1">
        Visibilité publique
      </h3>
      <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
        <Globe2 className="w-4 h-4 text-emerald-300/60 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-white font-medium">Apparaître sur les pages publiques</p>
            <Switch
              checked={value ?? false}
              disabled={value === null || saving}
              onCheckedChange={handleChange}
            />
          </div>
          <p className="text-xs text-emerald-200/50 mt-1.5 flex items-start gap-1.5">
            <ShieldCheck className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              Seuls votre prénom et l'initiale de votre nom seront visibles ({'<'}aucun email, ni
              téléphone{'>'}). Désactivé par défaut.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicEventConsentToggle;
