import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import SEOHead from '@/components/SEOHead';

import { useExploration, useExplorationMarches, ExplorationMarcheComplete } from '@/hooks/useExplorations';
import { useExplorationPages } from '@/hooks/useExplorationPages';
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
import ExperienceWelcomeDordogne from '@/components/experience/ExperienceWelcomeDordogne';
import ExperienceOutroDordogne from '@/components/experience/ExperienceOutroDordogne';
import ExperiencePageAccueil from '@/components/experience/ExperiencePageAccueil';
import ExperiencePageAuteur from '@/components/experience/ExperiencePageAuteur';
import ExperiencePageFeedback from '@/components/experience/ExperiencePageFeedback';
import ExperiencePagePrecommande from '@/components/experience/ExperiencePagePrecommande';
import { AudioProvider } from '@/contexts/AudioContext';


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
  const { data: pages = [] } = useExplorationPages(exploration?.id || '');
  const [settings, setSettings] = useState<NarrativeSettings>({ marche_view_model: 'elabore' });
  const [welcomeComposition, setWelcomeComposition] = useState<any | null>(null);
  const [current, setCurrent] = useState<number>(0);
  
  const steps = useMemo(() => {
    const list: Array<{ 
      type: 'welcome' | 'marche' | 'outro' | 'page'; 
      marche?: ExplorationMarcheComplete;
      page?: any;
    }> = [];
    
    // Add welcome (keeping original behavior if no specific pages)
    const welcomePage = pages.find(p => p.type === 'intro-accueil');
    if (welcomePage) {
      list.push({ type: 'page', page: welcomePage });
    } else {
      list.push({ type: 'welcome' });
    }
    
    // Add intro pages in order (like author pages)
    const introPages = pages.filter(p => p.type.startsWith('intro-') && p.type !== 'intro-accueil')
      .sort((a, b) => a.ordre - b.ordre);
    introPages.forEach(page => {
      list.push({ type: 'page', page });
    });
    
    // Add marches
    marches.forEach((m) => list.push({ type: 'marche', marche: m }));
    
    // Add outro pages in order
    const outroPages = pages.filter(p => p.type.startsWith('fin-'))
      .sort((a, b) => a.ordre - b.ordre);
    outroPages.forEach(page => {
      list.push({ type: 'page', page });
    });
    
    // Add default outro if no specific outro pages
    if (outroPages.length === 0) {
      list.push({ type: 'outro' });
    }
    
    console.log('🔧 Built steps with pages:', list.map(s => ({ type: s.type, name: s.page?.nom || s.type })));
    return list;
  }, [marches, pages]);

  useEffect(() => {
    const load = async () => {
      if (!exploration?.id) return;
      const { data, error } = await supabase
        .from('exploration_narrative_settings')
        .select('*')
        .eq('exploration_id', exploration.id)
        .maybeSingle();
      if (!error && data) {
        const config = data.marche_view_config as any || {};
        setSettings({
          marche_view_model: (data.marche_view_model as any) || 'elabore',
          welcome_tones: config.welcome_tones || [],
          welcome_forms: config.welcome_forms || [],
          welcome_povs: config.welcome_povs || [],
          welcome_senses: config.welcome_senses || [],
          welcome_timeframes: config.welcome_timeframes || [],
          welcome_template: config.welcome_template || null,
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

  // Detect if this is the Dordogne exploration
  const isDordogneExploration = exploration.slug === 'remontee-dordogne-atlas-eaux-vivantes-2025-2045';
  console.log('🔍 ExplorationExperience - isDordogneExploration:', isDordogneExploration, 'exploration.slug:', exploration.slug);
  console.log('🔍 ExplorationExperience - current step:', steps[current]?.type);

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
    <AudioProvider>
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
            isDordogneExploration ? (
              <ExperienceWelcomeDordogne 
                exploration={exploration} 
                settings={settings} 
                onStart={goNext} 
                onStartPodcast={() => {
                  console.log('🎙️ Starting podcast directly in welcome component');
                }}
              />
            ) : welcomeComposition ? (
              <ExperienceWelcomeAdaptive exploration={exploration} composition={welcomeComposition} onStart={goNext} onStartPodcast={() => {
                console.log('🎙️ Starting podcast audio directly');
              }} />
            ) : exploration.slug === 'bioacoustique-poetique' ? (
              <ExperienceWelcomeBioacoustic exploration={exploration} settings={settings} onStart={goNext} />
            ) : (
              <ExperienceWelcome exploration={exploration} settings={settings} onStart={goNext} />
            )
          )}

          {steps[current]?.type === 'page' && steps[current].page && (() => {
            const page = steps[current].page;
            switch (page.type) {
              case 'intro-accueil':
                return <ExperiencePageAccueil page={page} onContinue={goNext} />;
              case 'intro-auteur':
                return <ExperiencePageAuteur page={page} onContinue={goNext} />;
              case 'fin-feedback':
                return <ExperiencePageFeedback page={page} onBack={goPrev} />;
              case 'fin-precommande':
                return <ExperiencePagePrecommande page={page} onBack={goPrev} />;
              default:
                return <ExperiencePageAuteur page={page} onContinue={goNext} />;
            }
          })()}

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
            isDordogneExploration ? (
              <ExperienceOutroDordogne 
                explorationId={exploration.id} 
                sessionId={sessionId!} 
                onBack={() => setCurrent(marches.length)} 
              />
            ) : settings.marche_view_model === 'elabore' ? (
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

        {!isDordogneExploration && <ExperienceFooter />}
      </div>
    </AudioProvider>
  );
}
