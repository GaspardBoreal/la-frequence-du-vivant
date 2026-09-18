import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Camera, Compass, Search, Sprout, Users } from 'lucide-react';
import { useMarcheurParcours, type ParcoursEvent } from '@/hooks/admin/useMarcheurParcours';
import ParcoursTimeline from './ParcoursTimeline';

const PERIODES = [
  { days: 7, label: '7 j' },
  { days: 30, label: '30 j' },
  { days: 90, label: '90 j' },
  { days: 365, label: '1 an' },
];

interface MarcheurOption {
  user_id: string;
  prenom: string | null;
  nom: string | null;
  ville: string | null;
}

const UNIVERS_FILTRES = [
  { key: 'all', label: 'Tout', icon: Compass },
  { key: 'marches', label: 'Marches', icon: Users },
  { key: 'jardin', label: 'Jardins', icon: Sprout },
  { key: 'contribution', label: 'Contributions', icon: Camera },
  { key: 'assistant', label: 'Assistant', icon: Bot },
];

const ParcoursTab: React.FC = () => {
  const [recherche, setRecherche] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [univers, setUnivers] = useState('all');

  const { data: marcheurs } = useQuery({
    queryKey: ['parcours-marcheurs'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MarcheurOption[]> => {
      const { data, error } = await supabase
        .from('community_profiles')
        .select('user_id, prenom, nom, ville')
        .order('prenom');
      if (error) throw new Error(error.message);
      return (data ?? []) as MarcheurOption[];
    },
  });

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const base = marcheurs ?? [];
    if (!q) return base.slice(0, 40);
    return base
      .filter((m) => `${m.prenom ?? ''} ${m.nom ?? ''} ${m.ville ?? ''}`.toLowerCase().includes(q))
      .slice(0, 40);
  }, [marcheurs, recherche]);

  const { data, isLoading, error } = useMarcheurParcours(userId, days);

  const events: ParcoursEvent[] = data?.events ?? [];
  const filtres = univers === 'all' ? events : events.filter((e) => e.univers === univers);

  const compte = (u: string) => events.filter((e) => e.univers === u).length;
  const questions = events.filter((e) => e.univers === 'assistant' && e.kind === 'user').length;

  const selectionne = marcheurs?.find((m) => m.user_id === userId);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Chercher un marcheur (nom, ville)…"
            className="pl-9"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {liste.map((m) => {
            const actif = m.user_id === userId;
            return (
              <button
                key={m.user_id}
                type="button"
                onClick={() => setUserId(actif ? null : m.user_id)}
                className={`min-h-[44px] shrink-0 rounded-full border px-3 text-sm transition-all ${
                  actif
                    ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/30'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                }`}
              >
                {[m.prenom, m.nom].filter(Boolean).join(' ') || 'Sans nom'}
                {m.ville && <span className="ml-1 text-xs opacity-70">· {m.ville}</span>}
              </button>
            );
          })}
          {liste.length === 0 && <p className="text-sm text-muted-foreground">Aucun marcheur trouvé.</p>}
        </div>
      </div>

      {!userId && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Choisissez un marcheur pour reconstituer son parcours d’usage.
        </div>
      )}

      {userId && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {PERIODES.map((p) => (
              <Button
                key={p.days}
                size="sm"
                variant={days === p.days ? 'default' : 'outline'}
                onClick={() => setDays(p.days)}
              >
                {p.label}
              </Button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              {selectionne ? [selectionne.prenom, selectionne.nom].filter(Boolean).join(' ') : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Marches', value: compte('marches'), icon: Users },
              { label: 'Jardins', value: compte('jardin'), icon: Sprout },
              { label: 'Contributions', value: compte('contribution'), icon: Camera },
              { label: 'Questions à l’Assistant', value: questions, icon: Bot },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-3 text-center">
                <k.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {UNIVERS_FILTRES.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setUnivers(f.key)}
                className={`min-h-[40px] shrink-0 rounded-full border px-3 text-xs font-medium ${
                  univers === f.key
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">Lecture du parcours…</p>}
          {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
          {!isLoading && !error && <ParcoursTimeline events={filtres} />}
        </>
      )}
    </div>
  );
};

export default ParcoursTab;
