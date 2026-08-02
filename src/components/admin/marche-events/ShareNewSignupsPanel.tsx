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

  const countAutoReaders = async () => {
    const { count } = await supabase
      .from('event_invited_readers')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('invite_source', 'auto_new_signup');
    return count ?? 0;
  };

  const onToggle = async (next: boolean) => {
    setPending(true);
    const prev = value;
    setValue(next);
    const before = await countAutoReaders();
    const { error } = await supabase
      .from('marche_events')
      .update({ share_with_new_signups: next })
      .eq('id', eventId);
    if (error) {
      setPending(false);
      setValue(prev);
      toast.error(error.message);
      return;
    }
    const after = await countAutoReaders();
    setPending(false);
    const delta = Math.abs(after - before);
    toast.success(
      next
        ? `Partage activé — ${delta} marcheur${delta > 1 ? 's' : ''} en accueil invité${delta > 1 ? 's' : ''}. Les futurs inscrits le seront automatiquement.`
        : `Partage désactivé — ${delta} invitation${delta > 1 ? 's' : ''} automatique${delta > 1 ? 's' : ''} retirée${delta > 1 ? 's' : ''}. Les invitations manuelles et les inscrits sont conservés.`
    );
    qc.invalidateQueries({ queryKey: ['marche-events-paginated'] });
    qc.invalidateQueries({ queryKey: ['marche-events-all'] });
    qc.invalidateQueries({ queryKey: ['marche-event', eventId] });
    qc.invalidateQueries({ queryKey: ['event-invited-readers', eventId] });
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
