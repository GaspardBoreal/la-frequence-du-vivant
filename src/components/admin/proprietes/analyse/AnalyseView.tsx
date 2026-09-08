import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Mail, Bell, Gauge, Sprout, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  buildEmailLoops, buildNotifications, buildPersonae, oversolicited, readiness,
} from '@/lib/onboardingSegments';
import type { GardenAnswers } from '@/lib/onboardingStats';
import PersonaeAnalysis from './PersonaeAnalysis';
import EmailLoopsAnalysis from './EmailLoopsAnalysis';
import NotificationsAnalysis from './NotificationsAnalysis';
import ReadinessAnalysis from './ReadinessAnalysis';
import { RespondentsDrawer, type Selection } from '../dashboard/DashboardCards';

type Volet = 'personae' | 'emails' | 'notifications' | 'reussite';

const VOLETS: { key: Volet; label: string; icon: React.ElementType; sous: string }[] = [
  { key: 'personae', label: 'Personae', icon: Users, sous: 'À qui parlons-nous ?' },
  { key: 'emails', label: 'Boucles d’emails', icon: Mail, sous: 'Quoi écrire, et quand' },
  { key: 'notifications', label: 'Notifications', icon: Bell, sous: 'Ce que l’app doit signaler' },
  { key: 'reussite', label: 'Rêve et moyens', icon: Gauge, sous: 'Où accompagner en priorité' },
];

/** Quatre lectures des réponses du parcours d'accueil, chiffres calculés localement. */
const AnalyseView: React.FC<{ gardens: GardenAnswers[] }> = ({ gardens }) => {
  const [volet, setVolet] = React.useState<Volet>('personae');
  const [selection, setSelection] = React.useState<Selection | null>(null);
  const [synthese, setSynthese] = React.useState<string | null>(null);
  const [chargement, setChargement] = React.useState(false);

  const repondants = React.useMemo(() => gardens.filter((g) => g.hasOnboarding), [gardens]);
  const personae = React.useMemo(() => buildPersonae(repondants), [repondants]);
  const loops = React.useMemo(() => buildEmailLoops(personae), [personae]);
  const notifications = React.useMemo(() => buildNotifications(personae), [personae]);
  const fragiles = React.useMemo(() => oversolicited(personae), [personae]);
  const scores = React.useMemo(() => readiness(repondants), [repondants]);

  const onSelect = (titre: string, sousTitre: string, list: GardenAnswers[]) =>
    setSelection({ titre, sousTitre, gardens: list });

  const demanderSynthese = async () => {
    setChargement(true);
    setSynthese(null);
    try {
      // Agrégats anonymes uniquement : aucun nom de jardin n'est transmis.
      const payload = {
        volet,
        total: repondants.length,
        personae: personae.map((p) => ({
          nom: p.nom, effectif: p.gardens.length, part: p.part,
          surfaceMediane: p.surfaceMediane, tempsMedian: p.tempsMedian,
          reve: p.reveDominant, freins: p.freins,
          ambition: p.ambitionMoyenne, moyens: p.moyensMoyens,
        })),
        reussite: {
          prioritaire: scores.filter((s) => s.niveau === 'prioritaire').length,
          conforter: scores.filter((s) => s.niveau === 'conforter').length,
          autonome: scores.filter((s) => s.niveau === 'autonome').length,
        },
      };
      const { data, error } = await supabase.functions.invoke('admin-onboarding-analyse', { body: payload });
      if (error) throw error;
      const texte = (data as { synthese?: string; error?: string } | null)?.synthese;
      if (!texte) throw new Error((data as { error?: string } | null)?.error ?? 'Réponse vide');
      setSynthese(texte);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'La synthèse n’a pas pu être produite.');
    } finally {
      setChargement(false);
    }
  };

  if (repondants.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        <Sprout className="mx-auto mb-3 h-10 w-10 opacity-40" />
        Aucun jardin de cette sélection n’a encore répondu au parcours d’accueil.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {VOLETS.map((v) => {
          const Icon = v.icon;
          const actif = volet === v.key;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => { setVolet(v.key); setSynthese(null); }}
              className={`rounded-xl border p-3 text-left transition-colors ${
                actif ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-accent/40'
              }`}
            >
              <Icon className={`mb-1.5 h-4 w-4 ${actif ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium leading-tight">{v.label}</p>
              <p className="text-[11px] text-muted-foreground">{v.sous}</p>
            </button>
          );
        })}
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          Lecture de <span className="font-semibold text-foreground tabular-nums">{repondants.length}</span> jardin
          {repondants.length > 1 ? 's' : ''} ayant renseigné le parcours d’accueil. Tous les chiffres sont calculés
          à partir des réponses, sans intelligence artificielle.
        </p>
        <Button size="sm" variant="outline" onClick={demanderSynthese} disabled={chargement}>
          {chargement ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
          Synthèse par l’IA
        </Button>
      </Card>

      {synthese && (
        <Card className="border-primary/40 bg-primary/5 p-4 sm:p-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Synthèse
          </p>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{synthese}</div>
        </Card>
      )}

      {volet === 'personae' && <PersonaeAnalysis personae={personae} onSelect={onSelect} />}
      {volet === 'emails' && <EmailLoopsAnalysis loops={loops} />}
      {volet === 'notifications' && <NotificationsAnalysis rules={notifications} fragiles={fragiles} />}
      {volet === 'reussite' && <ReadinessAnalysis rows={scores} onSelect={onSelect} />}

      <RespondentsDrawer selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
};

export default AnalyseView;
