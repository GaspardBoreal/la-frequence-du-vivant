import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import { toast } from 'sonner';
import { marcheModels } from '@/marche-models/registry';
import { Eye } from 'lucide-react';
import ExperienceMarcheSimple from '@/components/experience/ExperienceMarcheSimple';
import ExperienceMarcheElabore from '@/components/experience/ExperienceMarcheElabore';
import SpecificPagesManager from '@/components/admin/SpecificPagesManager';
import { buildWelcomeComposition } from '@/utils/welcomeComposer';

export default function ExplorationAnimatorRefactored() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration } = useExploration(slug || '');
  const { data: explorationMarches } = useExplorationMarches(exploration?.id || '');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewModel, setPreviewModel] = useState<string>('');
  const [currentMarcheIndex, setCurrentMarcheIndex] = useState(0);

  const [marcheViewModel, setMarcheViewModel] = useState<string>('elabore');
  
  const canSave = useMemo(() => !!exploration?.id, [exploration?.id]);
  
  const currentMarche = useMemo(() => {
    return explorationMarches && explorationMarches.length > 0 ? explorationMarches[currentMarcheIndex] : null;
  }, [explorationMarches, currentMarcheIndex]);

  const getPreviousMarche = useMemo(() => {
    if (!explorationMarches || currentMarcheIndex <= 0) return null;
    return explorationMarches[currentMarcheIndex - 1];
  }, [explorationMarches, currentMarcheIndex]);

  const getNextMarche = useMemo(() => {
    if (!explorationMarches || currentMarcheIndex >= explorationMarches.length - 1) return null;
    return explorationMarches[currentMarcheIndex + 1];
  }, [explorationMarches, currentMarcheIndex]);

  const handlePreviewModel = (modelId: string) => {
    if (!currentMarche) {
      toast.error('Aucune marche disponible pour la prévisualisation');
      return;
    }
    setPreviewModel(modelId);
    setPreviewOpen(true);
  };

  const handleNavigateToPrevious = () => {
    if (explorationMarches && currentMarcheIndex > 0) {
      setCurrentMarcheIndex(currentMarcheIndex - 1);
    }
  };

  const handleNavigateToNext = () => {
    if (explorationMarches && currentMarcheIndex < explorationMarches.length - 1) {
      setCurrentMarcheIndex(currentMarcheIndex + 1);
    }
  };

  const handleBack = () => {
    setPreviewOpen(false);
  };

  // Reset currentMarcheIndex when explorationMarches changes
  useEffect(() => {
    if (explorationMarches && explorationMarches.length > 0) {
      setCurrentMarcheIndex(0);
    }
  }, [explorationMarches]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!exploration?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('exploration_narrative_settings')
        .select('*')
        .eq('exploration_id', exploration.id)
        .maybeSingle();
      if (error) console.warn('load settings error', error);
      if (data) {
        setMarcheViewModel((data.marche_view_model as string) || 'elabore');
      }
      setLoading(false);
    };
    loadSettings();
  }, [exploration?.id]);

  const handleSave = async () => {
    if (!exploration?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('exploration_narrative_settings')
      .upsert({
        exploration_id: exploration.id,
        marche_view_model: marcheViewModel,
      }, { onConflict: 'exploration_id' });
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Échec de l'enregistrement des paramètres narratifs");
    } else {
      toast.success('Paramètres narratifs enregistrés');
    }
  };

  const generateAnimation = async () => {
    if (!exploration?.id || !exploration?.slug) return;
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const ref = typeof document !== 'undefined' ? document.referrer : '';
    
    // Build adaptive welcome composition based on current content
    const composition = buildWelcomeComposition(
      exploration as any,
      (explorationMarches || []) as any,
      { marcheViewModel }
    );

    const { data, error } = await supabase
      .from('narrative_sessions')
      .insert({
        exploration_id: exploration.id,
        language: 'fr',
        user_agent: ua,
        referrer: ref,
        status: 'active',
        context: ({
          created_from: 'exploration_animator_refactored',
          marche_view_model: marcheViewModel,
          welcome_composition: composition,
        } as any)
      })
      .select('id')
      .maybeSingle();
    if (error || !data?.id) {
      console.error(error);
      toast.error("Impossible de générer l'animation");
    } else {
      toast.success('Animation générée avec succès');
      navigate(`/explorations/${exploration.slug}/experience/${data.id}`);
    }
  };

  const title = exploration ? `Animer ${exploration.name} — Exploration` : 'Animer l\'exploration';
  const canonical = exploration ? `${window.location.origin}/explorations/${exploration.slug}/animer` : `${window.location.origin}/explorations/animer`;

  return (
    <>
      <SEOHead 
        title={title.slice(0, 58)} 
        description="Construisez des pages spécifiques et un modèle de marche sur mesure pour votre exploration." 
        canonicalUrl={canonical}
      />

      <header className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-6">
          <Link to="/admin/explorations">
            <Button variant="secondary">Retour aux explorations</Button>
          </Link>
        </div>
        
        <h1 className="mt-4 text-3xl font-bold text-foreground">
          Animer l'exploration {exploration ? `« ${exploration.name} »` : ''}
        </h1>
        <p className="mt-2 text-foreground/80 max-w-2xl">Définissez les pages spécifiques (P1) et le modèle de visualisation des marches (P2).</p>
      </header>

      <main className="container mx-auto px-4 pb-32">
        {/* P1 - Pages spécifiques */}
        <section className="mt-8">
          {exploration?.id && <SpecificPagesManager explorationId={exploration.id} />}
        </section>

        {/* P2 - Modèle de visualisation des marches */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-3">P2 · Modèle de page marche</h2>
          <p className="text-sm text-foreground/70 mb-4">Choisissez un modèle de visualisation. Vous pourrez en ajouter d'autres ultérieurement.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {marcheModels.map((model) => (
              <div
                key={model.id}
                role="button"
                tabIndex={0}
                onClick={() => setMarcheViewModel(model.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMarcheViewModel(model.id)}
                className={`
                  group relative rounded-xl p-6 cursor-pointer
                  transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-lg hover:shadow-primary/10
                  ${marcheViewModel === model.id 
                    ? 'border-2 border-primary bg-primary/5' 
                    : 'border border-border bg-card hover:border-primary/50'
                  }
                `}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{model.name}</h3>
                    <p className="text-sm text-muted-foreground">{model.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {marcheViewModel === model.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewModel(model.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Modèle {model.id}
                </div>
              </div>
            ))}
          </div>

          {explorationMarches && explorationMarches.length > 0 && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-foreground/70">
                  Prévisualisation avec : {currentMarche?.marche?.nom_marche || 'Marche sans nom'}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNavigateToPrevious}
                    disabled={!getPreviousMarche}
                  >
                    ← Précédente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNavigateToNext}
                    disabled={!getNextMarche}
                  >
                    Suivante →
                  </Button>
                </div>
              </div>
              <p className="text-xs text-foreground/60">
                Marche {currentMarcheIndex + 1} sur {explorationMarches.length}
              </p>
            </div>
          )}
        </section>

        {/* Save and Generate buttons */}
        <div className="mt-8 flex gap-4">
          <Button 
            onClick={handleSave}
            disabled={!canSave || saving}
            variant="outline"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </Button>
        </div>
      </main>

      {/* Fixed Generate Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={generateAnimation} 
          disabled={!exploration?.id}
          size="lg"
          className="shadow-lg hover-scale"
        >
          🎬 Générer l'animation
        </Button>
      </div>

      {/* Preview Dialog */}
      {previewOpen && currentMarche && (
        <Dialog open={previewOpen} onOpenChange={() => setPreviewOpen(false)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prévisualisation - {marcheModels.find(m => m.id === previewModel)?.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p>Prévisualisation du modèle {previewModel} avec la marche : {currentMarche?.marche?.nom_marche}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {previewModel === 'simple' ? 'Modèle Simple - Affichage épuré' : 'Modèle Élaboré - Affichage enrichi'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleBack}>Retour</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}