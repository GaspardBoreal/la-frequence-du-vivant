import React from 'react';
import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { useExploration, useExplorationMarches, ExplorationMarcheComplete } from '@/hooks/useExplorations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DecorativeParticles from '@/components/DecorativeParticles';
import ExperienceWelcome from '@/components/experience/ExperienceWelcome';
import ExperienceWelcomeBioacoustic from '@/components/experience/ExperienceWelcomeBioacoustic';
import ExperienceMarcheSimple from '@/components/experience/ExperienceMarcheSimple';
import ExperienceMarcheElabore from '@/components/experience/ExperienceMarcheElabore';
import ExperienceOutro from '@/components/experience/ExperienceOutro';
import ExperienceOutroBioacoustic from '@/components/experience/ExperienceOutroBioacoustic';


interface NarrativeSettings {
  marche_view_model?: 'simple' | 'elabore';
  welcome_tones?: string[];
  welcome_forms?: string[];
  welcome_povs?: string[];
  welcome_senses?: string[];
  welcome_timeframes?: string[];
  welcome_template?: string | null;
}

export default function ExplorationExperience() {
  const { slug, sessionId } = useParams<{ slug: string; sessionId: string }>();
  const { data: exploration } = useExploration(slug || '');
  const { data: marches = [] } = useExplorationMarches(exploration?.id || '');

  const [settings, setSettings] = useState<NarrativeSettings>({ marche_view_model: 'elabore' });
  const [current, setCurrent] = useState<number>(0);
  const steps = useMemo(() => {
    const list: Array<{ type: 'welcome' | 'marche' | 'outro'; marche?: ExplorationMarcheComplete }> = [];
    list.push({ type: 'welcome' });
    marches.forEach((m) => list.push({ type: 'marche', marche: m }));
    list.push({ type: 'outro' });
    return list;
  }, [marches]);

  useEffect(() => {
    const load = async () => {
      if (!exploration?.id) return;
      const { data, error } = await supabase
        .from('exploration_narrative_settings')
        .select('*')
        .eq('exploration_id', exploration.id)
        .maybeSingle();
      if (!error && data) {
        setSettings({
          marche_view_model: (data.marche_view_model as any) || 'elabore',
          welcome_tones: data.welcome_tones || [],
          welcome_forms: data.welcome_forms || [],
          welcome_povs: data.welcome_povs || [],
          welcome_senses: data.welcome_senses || [],
          welcome_timeframes: data.welcome_timeframes || [],
          welcome_template: data.welcome_template || null,
        });
      }
    };
    load();
  }, [exploration?.id]);

  useEffect(() => {
    const logView = async () => {
      if (!exploration?.id || !sessionId || !steps[current]) return;
      const step = steps[current];
      await supabase.from('narrative_interactions').insert({
        exploration_id: exploration.id,
        session_id: sessionId,
        type: 'step_view',
        marche_id: step.marche?.marche?.id || null,
        payload: { index: current, type: step.type },
      });
    };
    logView();
  }, [current, exploration?.id, sessionId, steps]);

  if (!exploration) return null;

  const metaTitle = (exploration.meta_title || `Expérience — ${exploration.name}`).slice(0, 58);
  const canonical = `${window.location.origin}/explorations/${exploration.slug}/experience/${sessionId}`;

  const goPrev = () => setCurrent((c) => Math.max(0, c - 1));
  const goNext = () => setCurrent((c) => Math.min(steps.length - 1, c + 1));

  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  // Marche-level navigation (used by hero arrows) respects only the marches subset
  const currentStep = steps[current];
  const currentMarcheId = currentStep?.type === 'marche' ? currentStep.marche?.marche?.id : null;
  const marcheIndex = currentMarcheId ? marches.findIndex((m) => m.marche?.id === currentMarcheId) : -1;
  const prevMarche = marcheIndex > 0 ? marches[marcheIndex - 1] : undefined;
  const nextMarche = marcheIndex >= 0 && marcheIndex < marches.length - 1 ? marches[marcheIndex + 1] : undefined;

  const navigateToPrevMarche = () => {
    if (marcheIndex > 0) setCurrent((marcheIndex - 1) + 1); // +1 offset because step 0 is welcome
  };
  const navigateToNextMarche = () => {
    if (marcheIndex >= 0 && marcheIndex < marches.length - 1) setCurrent((marcheIndex + 1) + 1);
  };


  return (
    <div className="min-h-screen relative">
      <SEOHead
        title={metaTitle}
        description={exploration.meta_description || exploration.description || ''}
        keywords={(exploration.meta_keywords || []).join(', ')}
        canonicalUrl={canonical}
      />

      <DecorativeParticles />

      <header className="container mx-auto px-4 py-4">
        <nav className="flex flex-wrap gap-2 text-xs">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`px-3 py-1 rounded-full border transition-colors ${
                i === current ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground/80 hover:bg-muted'
              }`}
              aria-current={i === current}
            >
              {s.type === 'welcome' ? 'Accueil' : s.type === 'outro' ? 'Fin' : (s.marche?.marche?.nom_marche || s.marche?.marche?.ville || 'Marche')}
            </button>
          ))}
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-28">
        <section className="mt-4">
          {steps[current]?.type === 'welcome' && (
            settings.marche_view_model === 'elabore' ? (
              <ExperienceWelcomeBioacoustic exploration={exploration} settings={settings} onStart={goNext} />
            ) : (
              <ExperienceWelcome exploration={exploration} settings={settings} onStart={goNext} />
            )
          )}

          {steps[current]?.type === 'marche' && steps[current].marche && (
            settings.marche_view_model === 'simple' ? (
              <ExperienceMarcheSimple
                marche={steps[current].marche!}
                previousMarche={prevMarche}
                nextMarche={nextMarche}
                onNavigateToPrevious={navigateToPrevMarche}
                onNavigateToNext={navigateToNextMarche}
                onBack={() => setCurrent(0)}
              />
            ) : (
              <ExperienceMarcheElabore
                marche={steps[current].marche!}
                previousMarche={prevMarche}
                nextMarche={nextMarche}
                onNavigateToPrevious={navigateToPrevMarche}
                onNavigateToNext={navigateToNextMarche}
                onBack={() => setCurrent(0)}
              />
            )
          )}

          {steps[current]?.type === 'outro' && (
            settings.marche_view_model === 'elabore' ? (
              <ExperienceOutroBioacoustic explorationId={exploration.id} sessionId={sessionId!} />
            ) : (
              <ExperienceOutro explorationId={exploration.id} sessionId={sessionId!} />
            )
          )}
        </section>
      </main>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur border-t">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="secondary" onClick={goPrev} disabled={isFirst}>
            Précédent
          </Button>
          <div className="text-xs text-foreground/60">
            Étape {current + 1} / {steps.length}
          </div>
          <Button onClick={goNext} disabled={isLast}>
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
