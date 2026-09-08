import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Sprout } from 'lucide-react';
import {
  dashboardToCsv, distribution, readSurface, readTempsSemaine,
  SURFACE_BREAKS, tally, tallyExamples, TEMPS_BREAKS,
  type GardenAnswers,
} from '@/lib/onboardingStats';
import {
  NumericDistributionCard, QuestionBarCard, QuestionVignetteCard, RespondentsDrawer,
  type Selection,
} from './DashboardCards';

/** Tableau de bord des réponses du parcours d'accueil, sur le périmètre filtré. */
const OnboardingDashboard: React.FC<{ gardens: GardenAnswers[] }> = ({ gardens }) => {
  const [selection, setSelection] = React.useState<Selection | null>(null);
  const repondants = React.useMemo(() => gardens.filter((g) => g.hasOnboarding), [gardens]);

  // Images officielles de la galerie « Quel jardin vous fait rêver ? »
  const [typeImages, setTypeImages] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    let actif = true;
    supabase
      .from('onboarding_garden_types')
      .select('slug, image_url')
      .then(({ data }) => {
        if (!actif || !data) return;
        const map: Record<string, string> = {};
        data.forEach((t: { slug: string | null; image_url: string | null }) => {
          if (t.slug && t.image_url) map[t.slug] = t.image_url;
        });
        setTypeImages(map);
      });
    return () => { actif = false; };
  }, []);

  const blocs = React.useMemo(() => ({
    profil: tally(repondants, 'profil', { title: 'Qui êtes-vous ?' }),
    lieu: tally(repondants, 'lieu', { title: 'Où jardinez-vous ?' }),
    style: tally(repondants, 'style', { title: 'Quel jardin vous fait rêver ?' }),
    exemple: tallyExamples(repondants),
    priorite: tally(repondants, 'priorite', { title: 'Quelle est votre priorité ?' }),
    amenagements: tally(repondants, 'amenagements', { title: 'Les espaces souhaités' }),
    experience: tally(repondants, 'experience', { title: 'Où en êtes-vous ?' }),
    irrigation: tally(repondants, 'irrigation', { title: 'Pouvez-vous arroser ?' }),
    exposition: tally(repondants, 'exposition', { title: 'Combien de soleil ?' }),
    contraintes: tally(repondants, 'contraintes', { title: 'Qu’est-ce qui vous freine ?' }),
    budget: tally(repondants, 'budget', { title: 'Que souhaitez-vous investir ?' }),
    objectif: tally(repondants, 'objectif_6_mois', { title: 'Quel premier objectif ?' }),
  }), [repondants]);

  const styleIllustre = React.useMemo(() => ({
    ...blocs.style,
    items: blocs.style.items.map((it) => ({ ...it, vignette: typeImages[it.value] ?? null })),
  }), [blocs.style, typeImages]);


  const surfaces = React.useMemo(
    () => distribution(repondants, readSurface, SURFACE_BREAKS, 'm²', 'Quelle place avez-vous ?'),
    [repondants],
  );
  const temps = React.useMemo(
    () => distribution(repondants, readTempsSemaine, TEMPS_BREAKS, 'h/sem.', 'Combien de temps par semaine ?'),
    [repondants],
  );

  const exportCsv = () => {
    const csv = dashboardToCsv(Object.values(blocs), [surfaces, temps]);
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `tableau-de-bord-jardins-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (repondants.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        <Sprout className="mx-auto mb-3 h-10 w-10 opacity-40" />
        Aucun jardin de cette sélection n’a encore répondu au parcours d’accueil.
      </Card>
    );
  }

  const pick = (s: Selection) => setSelection(s);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{repondants.length}</span> jardin
          {repondants.length > 1 ? 's ont' : ' a'} renseigné le parcours d’accueil, sur{' '}
          <span className="tabular-nums">{gardens.length}</span> retenu{gardens.length > 1 ? 's' : ''} par les filtres.
        </p>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Exporter en CSV
        </Button>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <QuestionBarCard result={blocs.profil} onSelect={pick} />
        <QuestionBarCard result={blocs.lieu} onSelect={pick} />
        <NumericDistributionCard result={surfaces} onSelect={pick} />
        <NumericDistributionCard result={temps} onSelect={pick} />
      </div>

      <QuestionVignetteCard result={blocs.style} onSelect={pick} />
      <QuestionVignetteCard result={blocs.exemple} onSelect={pick} />

      <div className="grid gap-4 lg:grid-cols-2">
        <QuestionBarCard result={blocs.priorite} onSelect={pick} />
        <QuestionBarCard result={blocs.amenagements} onSelect={pick} />
        <QuestionBarCard result={blocs.experience} onSelect={pick} />
        <QuestionBarCard result={blocs.irrigation} onSelect={pick} />
        <QuestionBarCard result={blocs.exposition} onSelect={pick} />
        <QuestionBarCard result={blocs.contraintes} onSelect={pick} />
        <QuestionBarCard result={blocs.budget} onSelect={pick} />
        <QuestionBarCard result={blocs.objectif} onSelect={pick} />
      </div>

      <RespondentsDrawer selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
};

export default OnboardingDashboard;
