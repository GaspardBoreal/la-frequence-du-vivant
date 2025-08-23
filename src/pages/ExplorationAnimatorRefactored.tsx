import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import { toast } from 'sonner';
import { marcheModels } from '@/marche-models/registry';
import { Eye, ArrowLeft } from 'lucide-react';
import ExperienceMarcheSimple from '@/components/experience/ExperienceMarcheSimple';
import ExperienceMarcheElabore from '@/components/experience/ExperienceMarcheElabore';
import SpecificPagesManager from '@/components/admin/SpecificPagesManager';

export default function ExplorationAnimatorRefactored() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration } = useExploration(slug || '');
  const { data: explorationMarches } = useExplorationMarches(exploration?.id || '');

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

  // Session creation moved to ExplorationExperience component

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
        <div className="flex items-center gap-4 mb-4">
          <Link to="/admin/explorations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux explorations
            </Button>
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

        {/* Section URLs publiques */}
        <section className="mt-16 mb-16">
          <div className="relative">
            {/* Titre avec ligne décorative */}
            <div className="flex items-center mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border"></div>
              <h2 className="px-6 text-2xl font-semibold text-foreground bg-background">
                URLs publiques de l'exploration
              </h2>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border"></div>
            </div>

            {/* Grille des URLs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* URL Exploration */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  {/* Icône et titre */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground/20 flex items-center justify-center text-2xl shadow-lg">
                      🎭
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Exploration interactive
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        URL principale pour découvrir l'exploration avec ses pages spécifiques et ses marches
                      </p>
                    </div>
                  </div>
                  
                  {/* URL */}
                  {exploration?.slug ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                        <code className="text-sm text-foreground/80 break-all">
                          {window.location.origin}/explorations/{exploration.slug}
                        </code>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => window.open(`/explorations/${exploration.slug}`, '_blank')}
                          className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                          size="sm"
                        >
                          🚀 Ouvrir l'exploration
                        </Button>
                        <Button
                          onClick={() => {
                            const url = `${window.location.origin}/explorations/${exploration.slug}`;
                            navigator.clipboard.writeText(url);
                            toast.success('URL copiée dans le presse-papiers');
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-none px-4"
                        >
                          📋
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800">
                        L'exploration doit être sauvegardée pour générer l'URL
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* URL Galerie Fleuve */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-blue-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
                  {/* Icône et titre */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl shadow-lg">
                      🌊
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Galerie Fleuve
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Visualisation immersive des marches avec 4 modes de vue : carte, liste, grille et timeline
                      </p>
                    </div>
                  </div>
                  
                  {/* URL */}
                  {exploration?.slug ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                        <code className="text-sm text-foreground/80 break-all">
                          {window.location.origin}/galerie-fleuve/exploration/{exploration.slug}
                        </code>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => window.open(`/galerie-fleuve/exploration/${exploration.slug}`, '_blank')}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                          size="sm"
                        >
                          🌊 Ouvrir la galerie
                        </Button>
                        <Button
                          onClick={() => {
                            const url = `${window.location.origin}/galerie-fleuve/exploration/${exploration.slug}`;
                            navigator.clipboard.writeText(url);
                            toast.success('URL copiée dans le presse-papiers');
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-none px-4"
                        >
                          📋
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800">
                        L'exploration doit être sauvegardée pour générer l'URL
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Note d'aide */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/40 rounded-full text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Ces URLs sont publiques et peuvent être partagées librement
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed Generate Button removed - session creation now handled in experience */}

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