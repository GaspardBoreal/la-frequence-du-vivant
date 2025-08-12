import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import SEOHead from '@/components/SEOHead';

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
import ExperienceFooter from '@/components/experience/ExperienceFooter';
import ExperienceWelcomeAdaptive from '@/components/experience/ExperienceWelcomeAdaptive';


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
  const navigate = useNavigate();
  const { data: exploration } = useExploration(slug || '');
  const { data: marches = [] } = useExplorationMarches(exploration?.id || '');
  const [settings, setSettings] = useState<NarrativeSettings>({ marche_view_model: 'elabore' });
  const [welcomeComposition, setWelcomeComposition] = useState<any | null>(null);
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

  // Load session context (welcome_composition) to drive adaptive welcome
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      const { data, error } = await supabase
        .from('narrative_sessions')
        .select('context')
        .eq('id', sessionId)
        .maybeSingle();
      if (!error && data?.context) {
        const ctx: any = data.context as any;
        if (ctx?.welcome_composition) setWelcomeComposition(ctx.welcome_composition);
        if (ctx?.marche_view_model) setSettings((prev) => ({ ...prev, marche_view_model: ctx.marche_view_model }));
      }
    };
    fetchSession();
  }, [sessionId]);

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

  // Full navigation including welcome and outro for 'simple' model
  const currentStep = steps[current];
  const currentMarcheId = currentStep?.type === 'marche' ? currentStep.marche?.marche?.id : null;
  const marcheIndex = currentMarcheId ? marches.findIndex((m) => m.marche?.id === currentMarcheId) : -1;
  
  // For 'simple' model, always allow navigation (buttons will handle flow logic)
  const prevMarche = settings.marche_view_model === 'simple' ? (marcheIndex > 0 ? marches[marcheIndex - 1] : undefined) : (marcheIndex > 0 ? marches[marcheIndex - 1] : undefined);
  const nextMarche = settings.marche_view_model === 'simple' ? (marcheIndex < marches.length - 1 ? marches[marcheIndex + 1] : undefined) : (marcheIndex >= 0 && marcheIndex < marches.length - 1 ? marches[marcheIndex + 1] : undefined);
  
  // For simple model, enable navigation at flow extremities
  const canNavigatePrev = settings.marche_view_model === 'simple' ? true : marcheIndex > 0;
  const canNavigateNext = settings.marche_view_model === 'simple' ? true : marcheIndex >= 0 && marcheIndex < marches.length - 1;

  const navigateToPrevMarche = () => {
    if (settings.marche_view_model === 'simple') {
      // Go to previous step (welcome if first marche)
      setCurrent(current - 1);
    } else {
      // Original logic for 'elabore' model
      if (marcheIndex > 0) setCurrent((marcheIndex - 1) + 1);
    }
  };
  
  const navigateToNextMarche = () => {
    if (settings.marche_view_model === 'simple') {
      // Go to next step (outro if last marche)
      setCurrent(current + 1);
    } else {
      // Original logic for 'elabore' model
      if (marcheIndex >= 0 && marcheIndex < marches.length - 1) setCurrent((marcheIndex + 1) + 1);
    }
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


      <main className="container mx-auto px-4 pb-28">
        <section className="mt-4">
          {steps[current]?.type === 'welcome' && (
            welcomeComposition ? (
              <ExperienceWelcomeAdaptive exploration={exploration} composition={welcomeComposition} onStart={goNext} onStartPodcast={() => navigate(`/explorations/${slug}/experience/${sessionId}/podcast`)} />
            ) : settings.marche_view_model === 'elabore' ? (
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
                canNavigatePrev={canNavigatePrev}
                canNavigateNext={canNavigateNext}
              />
            ) : (
              <ExperienceMarcheElabore
                marche={steps[current].marche!}
                previousMarche={prevMarche}
                nextMarche={nextMarche}
                onNavigateToPrevious={navigateToPrevMarche}
                onNavigateToNext={navigateToNextMarche}
                onBack={() => setCurrent(0)}
                canNavigatePrev={canNavigatePrev}
                canNavigateNext={canNavigateNext}
              />
            )
          )}

          {steps[current]?.type === 'outro' && (
            settings.marche_view_model === 'elabore' ? (
              <ExperienceOutroBioacoustic explorationId={exploration.id} sessionId={sessionId!} />
            ) : (
              <ExperienceOutro 
                explorationId={exploration.id} 
                sessionId={sessionId!} 
                onBack={() => setCurrent(marches.length)} // Go back to last marche
              />
            )
          )}
        </section>
      </main>

      <ExperienceFooter />
    </div>
  );
}
