import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Props {
  eventId: string;
  initialValue: boolean;
}

const ShareNewSignupsPanel: React.FC<Props> = ({ eventId, initialValue }) => {
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const qc = useQueryClient();

  const onToggle = async (next: boolean) => {
    setPending(true);
    const prev = value;
    setValue(next);
    const { error } = await supabase
      .from('marche_events')
      .update({ share_with_new_signups: next })
      .eq('id', eventId);
    setPending(false);
    if (error) {
      setValue(prev);
      toast.error(error.message);
      return;
    }
    toast.success(
      next
        ? 'Partage activé : tout nouveau marcheur sera ajouté silencieusement.'
        : 'Partage désactivé. Les entrées existantes sont conservées.'
    );
    qc.invalidateQueries({ queryKey: ['marche-events-paginated'] });
    qc.invalidateQueries({ queryKey: ['marche-events-all'] });
    qc.invalidateQueries({ queryKey: ['marche-event', eventId] });
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all',
        value
          ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-emerald-500/5'
          : 'border-dashed'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            value ? 'bg-amber-500/15 text-amber-500' : 'bg-muted text-muted-foreground'
          )}
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">
                Partager aux nouveaux marcheurs inscrits
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {value
                  ? 'Tout nouveau marcheur sera silencieusement ajouté comme Lecteur invité dès son inscription. Les marcheurs déjà inscrits ne sont pas concernés.'
                  : 'Activez pour ajouter automatiquement chaque futur nouvel inscrit comme Lecteur invité sur cette marche.'}
              </p>
            </div>
            <Switch checked={value} disabled={pending} onCheckedChange={onToggle} />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ShareNewSignupsPanel;
