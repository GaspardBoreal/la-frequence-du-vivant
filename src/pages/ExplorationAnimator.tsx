import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import { toast } from 'sonner';
import { marcheModels } from '@/marche-models/registry';
import { Eye } from 'lucide-react';
import ExperienceMarcheSimple from '@/components/experience/ExperienceMarcheSimple';
import ExperienceMarcheElabore from '@/components/experience/ExperienceMarcheElabore';
import ExperienceWelcomeAdaptive from '@/components/experience/ExperienceWelcomeAdaptive';
import { buildWelcomeComposition } from '@/utils/welcomeComposer';

const TONES = ['lyrique','ironique','minimaliste','prophétique','éco-poétique','bioacoustique'] as const;
const FORMS = ['haïku','note scientifique','dialogue','légende de carte','titre de presse','post Instagram'] as const;
const POVS  = ["l'eau","l'oiseau symbolique de cette exploration","un drone","un satellite","une IA oracle","un souvenir futur"] as const;
const SENSES = ['sonore','olfactive','tactile','chromatique'] as const;
const TIMES  = ['passé historique','présent','futur 2050','futur 2100'] as const;

type Arr = readonly string[];

export default function ExplorationAnimator() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration } = useExploration(slug || '');
  const { data: explorationMarches } = useExplorationMarches(exploration?.id || '');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewModel, setPreviewModel] = useState<string>('');
  const [currentMarcheIndex, setCurrentMarcheIndex] = useState(0);

  const [welcomeTones, setWelcomeTones] = useState<string[]>([]);
  const [welcomeForms, setWelcomeForms] = useState<string[]>([]);
  const [welcomePovs, setWelcomePovs] = useState<string[]>([]);
  const [welcomeSenses, setWelcomeSenses] = useState<string[]>([]);
  const [welcomeTimes, setWelcomeTimes] = useState<string[]>([]);
  const [welcomeTemplate, setWelcomeTemplate] = useState<string>('');
  const [marcheViewModel, setMarcheViewModel] = useState<string>('elabore');
  
  // Custom text fields for "autre" options
  const [tonesCustom, setTonesCustom] = useState<string>('');
  const [formsCustom, setFormsCustom] = useState<string>('');
  const [povsCustom, setPovsCustom] = useState<string>('');
  const [sensesCustom, setSensesCustom] = useState<string>('');
  const [timesCustom, setTimesCustom] = useState<string>('');

  // Accueil auto-adaptatif (Auto/Manuel)
  const [welcomeAuto, setWelcomeAuto] = useState<boolean>(true);
  const [welcomeVariant, setWelcomeVariant] = useState<'story-cover' | 'media-mosaic' | 'audio-first' | 'map-first'>('story-cover');

  // Preview accueil
  const [previewWelcomeOpen, setPreviewWelcomeOpen] = useState(false);
  const [previewWelcomeComposition, setPreviewWelcomeComposition] = useState<any | null>(null);

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

  const openWelcomePreview = () => {
    if (!exploration) return;
    const composition = buildWelcomeComposition(
      exploration as any,
      (explorationMarches || []) as any,
      { marcheViewModel }
    );
    if (!welcomeAuto && welcomeVariant) {
      (composition as any).variant = welcomeVariant as any;
    }
    setPreviewWelcomeComposition(composition);
    setPreviewWelcomeOpen(true);
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
        setWelcomeTones(Array.isArray(data.welcome_tones) ? [...(data.welcome_tones as string[])] : []);
        setWelcomeForms(Array.isArray(data.welcome_forms) ? [...(data.welcome_forms as string[])] : []);
        setWelcomePovs(Array.isArray(data.welcome_povs) ? [...(data.welcome_povs as string[])] : []);
        setWelcomeSenses(Array.isArray(data.welcome_senses) ? [...(data.welcome_senses as string[])] : []);
        setWelcomeTimes(Array.isArray(data.welcome_timeframes) ? [...(data.welcome_timeframes as string[])] : []);
        setWelcomeTemplate(data.welcome_template || '');
        setMarcheViewModel((data.marche_view_model as string) || 'elabore');
        // Load custom text fields
        setTonesCustom(data.welcome_tones_custom || '');
        setFormsCustom(data.welcome_forms_custom || '');
        setPovsCustom(data.welcome_povs_custom || '');
        setSensesCustom(data.welcome_senses_custom || '');
        setTimesCustom(data.welcome_timeframes_custom || '');
        // Interaction config: accueil auto/manuel
        const ic = (data.interaction_config as any) || null;
        if (ic) {
          setWelcomeAuto(ic.welcome_auto ?? true);
          setWelcomeVariant(ic.welcome_variant ?? 'story-cover');
        }
      }
      setLoading(false);
    };
    loadSettings();
  }, [exploration?.id]);

  const toggle = (value: string, list: string[], setter: (v:string[])=>void) => {
    if (list.includes(value)) setter(list.filter(v => v !== value));
    else setter([...list, value]);
  };

  const handleSave = async () => {
    if (!exploration?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('exploration_narrative_settings')
      .upsert({
        exploration_id: exploration.id,
        welcome_tones: welcomeTones,
        welcome_forms: welcomeForms,
        welcome_povs: welcomePovs,
        welcome_senses: welcomeSenses,
        welcome_timeframes: welcomeTimes,
        welcome_template: welcomeTemplate,
        marche_view_model: marcheViewModel,
        welcome_tones_custom: tonesCustom || null,
        welcome_forms_custom: formsCustom || null,
        welcome_povs_custom: povsCustom || null,
        welcome_senses_custom: sensesCustom || null,
        welcome_timeframes_custom: timesCustom || null,
        interaction_config: ({
          welcome_auto: welcomeAuto,
          welcome_variant: welcomeVariant,
        } as any),
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
    // Override variant in manual mode
    if (!welcomeAuto && welcomeVariant) {
      (composition as any).variant = welcomeVariant as any;
    }

    const { data, error } = await supabase
      .from('narrative_sessions')
      .insert({
        exploration_id: exploration.id,
        language: 'fr',
        user_agent: ua,
        referrer: ref,
        status: 'active',
        context: ({
          created_from: 'exploration_animator',
          marche_view_model: marcheViewModel,
          welcome_mode: welcomeAuto ? 'auto' : 'manuel',
          welcome_variant: (composition as any).variant,
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
        description="Construisez un accueil poétique, un modèle de marche et une scène d'interaction sur mesure." 
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
        <p className="mt-2 text-foreground/80 max-w-2xl">Définissez les intentions poétiques (P1), le modèle de visualisation des marches (P2) et l'espace d'interaction (P3).</p>
      </header>

      <main className="container mx-auto px-4 pb-32">
        {/* P1 - Accueil spécifique */}
        <section className="mt-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h2 className="text-2xl font-semibold">P1 · Accueil spécifique</h2>
            <Button variant="outline" onClick={openWelcomePreview} className="hover-scale">Prévisualiser l’accueil</Button>
          </div>
          <p className="text-sm text-foreground/70 mb-4">Composez l'intonation et la forme d'un écran d'accueil propre à cette exploration.</p>

          <div className="mb-6 rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium">Accueil auto-adaptatif</h3>
                <p className="text-sm text-foreground/70">L’accueil se compose automatiquement selon les marches et médias. Désactivez pour choisir un variant.</p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="welcome-auto" className="text-sm">Auto</Label>
                <Switch id="welcome-auto" checked={welcomeAuto} onCheckedChange={(v) => setWelcomeAuto(!!v)} />
              </div>
            </div>
            {!welcomeAuto && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2">Variant manuel</Label>
                <RadioGroup value={welcomeVariant} onValueChange={(v) => setWelcomeVariant(v as any)} className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="story-cover" id="v-story" />
                    <Label htmlFor="v-story" className="text-sm">Story cover</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="media-mosaic" id="v-mosaic" />
                    <Label htmlFor="v-mosaic" className="text-sm">Media mosaic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="audio-first" id="v-audio" />
                    <Label htmlFor="v-audio" className="text-sm">Audio first</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="map-first" id="v-map" />
                    <Label htmlFor="v-map" className="text-sm">Map first</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2 underline">Variations de ton</h3>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <label key={t} className="flex items-center gap-2">
                    <Checkbox checked={welcomeTones.includes(t)} onCheckedChange={() => toggle(t, welcomeTones, setWelcomeTones)} />
                    <span className="text-sm">{t}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="tones-custom" className="text-sm font-medium">Autre :</Label>
                <Input 
                  id="tones-custom"
                  value={tonesCustom}
                  onChange={(e) => setTonesCustom(e.target.value.slice(0, 250))}
                  placeholder="Décrivez un autre ton (max 250 caractères)"
                  maxLength={250}
                  className="mt-1"
                />
                <p className="text-xs text-foreground/60 mt-1">{tonesCustom.length}/250</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Variations de forme</h3>
              <div className="grid grid-cols-2 gap-2">
                {FORMS.map(f => (
                  <label key={f} className="flex items-center gap-2">
                    <Checkbox checked={welcomeForms.includes(f)} onCheckedChange={() => toggle(f, welcomeForms, setWelcomeForms)} />
                    <span className="text-sm">{f}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="forms-custom" className="text-sm font-medium">Autre :</Label>
                <Input 
                  id="forms-custom"
                  value={formsCustom}
                  onChange={(e) => setFormsCustom(e.target.value.slice(0, 250))}
                  placeholder="Décrivez une autre forme (max 250 caractères)"
                  maxLength={250}
                  className="mt-1"
                />
                <p className="text-xs text-foreground/60 mt-1">{formsCustom.length}/250</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 underline">Variations de point de vue</h3>
              <div className="grid grid-cols-2 gap-2">
                {POVS.map(p => (
                  <label key={p} className="flex items-center gap-2">
                    <Checkbox checked={welcomePovs.includes(p)} onCheckedChange={() => toggle(p, welcomePovs, setWelcomePovs)} />
                    <span className="text-sm">{p}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="povs-custom" className="text-sm font-medium">Autre :</Label>
                <Input 
                  id="povs-custom"
                  value={povsCustom}
                  onChange={(e) => setPovsCustom(e.target.value.slice(0, 250))}
                  placeholder="Décrivez un autre point de vue (max 250 caractères)"
                  maxLength={250}
                  className="mt-1"
                />
                <p className="text-xs text-foreground/60 mt-1">{povsCustom.length}/250</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Variations sensorielles</h3>
              <div className="grid grid-cols-2 gap-2">
                {SENSES.map(s => (
                  <label key={s} className="flex items-center gap-2">
                    <Checkbox checked={welcomeSenses.includes(s)} onCheckedChange={() => toggle(s, welcomeSenses, setWelcomeSenses)} />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="senses-custom" className="text-sm font-medium">Autre :</Label>
                <Input 
                  id="senses-custom"
                  value={sensesCustom}
                  onChange={(e) => setSensesCustom(e.target.value.slice(0, 250))}
                  placeholder="Décrivez une autre variation sensorielle (max 250 caractères)"
                  maxLength={250}
                  className="mt-1"
                />
                <p className="text-xs text-foreground/60 mt-1">{sensesCustom.length}/250</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 underline">Variations temporelles</h3>
              <div className="grid grid-cols-2 gap-2">
                {TIMES.map(ti => (
                  <label key={ti} className="flex items-center gap-2">
                    <Checkbox checked={welcomeTimes.includes(ti)} onCheckedChange={() => toggle(ti, welcomeTimes, setWelcomeTimes)} />
                    <span className="text-sm">{ti}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="times-custom" className="text-sm font-medium">Autre :</Label>
                <Input 
                  id="times-custom"
                  value={timesCustom}
                  onChange={(e) => setTimesCustom(e.target.value.slice(0, 250))}
                  placeholder="Décrivez une autre variation temporelle (max 250 caractères)"
                  maxLength={250}
                  className="mt-1"
                />
                <p className="text-xs text-foreground/60 mt-1">{timesCustom.length}/250</p>
              </div>
            </div>
          </div>
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
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  ${marcheViewModel === model.id 
                    ? 'border-4 border-primary bg-primary shadow-md shadow-primary/20 scale-[1.02]' 
                    : 'border-2 border-border hover:border-primary/50 hover:bg-muted/30'
                  }
                `}
                aria-selected={marcheViewModel === model.id}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-3">
                    <h3 className={`text-base font-semibold transition-colors duration-200 ${
                      marcheViewModel === model.id ? 'text-white' : 'text-foreground group-hover:text-primary'
                    }`}>
                      {model.name}
                    </h3>
                    <p className={`text-sm mt-2 transition-colors duration-200 ${
                      marcheViewModel === model.id ? 'text-foreground' : 'text-foreground/70 group-hover:text-foreground/90'
                    }`}>
                      {model.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {currentMarche && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewModel(model.id);
                        }}
                        className={`
                          p-2 rounded-full transition-all duration-200
                          ${marcheViewModel === model.id 
                            ? 'bg-white/20 text-white hover:bg-white/30' 
                            : 'bg-muted/80 text-muted-foreground hover:bg-primary/10 hover:text-primary'
                          }
                        `}
                        title="Prévisualiser ce modèle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className={`
                      flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium
                      transition-all duration-200
                      ${marcheViewModel === model.id 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                      }
                    `}>
                      {marcheViewModel === model.id && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {marcheViewModel === model.id ? 'Sélectionné' : 'Choisir'}
                    </div>
                  </div>
                </div>
                <p className={`text-xs mt-4 font-mono transition-colors duration-200 ${
                  marcheViewModel === model.id ? 'text-foreground/70' : 'text-foreground/50 group-hover:text-foreground/70'
                }`}>
                  Exemple d'URL : {model.examplePath}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* P3 - Interaction */}
        <section className="mt-10 mb-12">
          <h2 className="text-2xl font-semibold mb-3">P3 · Espace d'interaction</h2>
          <p className="text-sm text-foreground/70 mb-6">MVP: journalisez les interactions lors des tests, la scène dédiée arrivera dans l'étape suivante.</p>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </Button>
        </section>
      </main>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
        <div className="container mx-auto flex justify-center">
          <Button 
            onClick={generateAnimation}
            disabled={!exploration}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            Générer une animation
          </Button>
        </div>
      </div>

      {/* Preview Modal (Marche model) */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Aperçu du modèle "{marcheModels.find(m => m.id === previewModel)?.name}"
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {currentMarche && previewModel && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Prévisualisation appliquée à la marche : <span className="font-medium">{currentMarche.marche?.nom_marche || currentMarche.marche?.ville}</span>
                  {explorationMarches && explorationMarches.length > 1 && (
                    <span className="ml-2">({currentMarcheIndex + 1}/{explorationMarches.length})</span>
                  )}
                </p>
                
                <div className="border rounded-lg p-4 bg-muted/20">
                  {previewModel === 'simple' ? (
                    <ExperienceMarcheSimple 
                      marche={currentMarche} 
                      isModal={true}
                      previousMarche={getPreviousMarche}
                      nextMarche={getNextMarche}
                      onNavigateToPrevious={handleNavigateToPrevious}
                      onNavigateToNext={handleNavigateToNext}
                      onBack={handleBack}
                    />
                  ) : (
                    <ExperienceMarcheElabore 
                      marche={currentMarche} 
                      isModal={true}
                      previousMarche={getPreviousMarche}
                      nextMarche={getNextMarche}
                      onNavigateToPrevious={handleNavigateToPrevious}
                      onNavigateToNext={handleNavigateToNext}
                      onBack={handleBack}
                    />
                  )}
                </div>
              </div>
            )}
            
            {!currentMarche && (
              <p className="text-center text-muted-foreground py-8">
                Aucune marche disponible pour la prévisualisation
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              setMarcheViewModel(previewModel);
              setPreviewOpen(false);
              toast.success('Modèle sélectionné');
            }}>
              Utiliser ce modèle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Welcome Modal */}
      <Dialog open={previewWelcomeOpen} onOpenChange={setPreviewWelcomeOpen}>
        <DialogContent className="max-w-[900px] w-[95vw] animate-fade-in">
          <DialogHeader>
            <DialogTitle>Aperçu de l’accueil adaptatif</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {exploration && previewWelcomeComposition ? (
              <div className="border rounded-lg p-4 bg-muted/20">
                <ExperienceWelcomeAdaptive 
                  exploration={exploration as any} 
                  composition={previewWelcomeComposition}
                  onStart={() => setPreviewWelcomeOpen(false)}
                />
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Impossible de générer l’aperçu pour le moment.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewWelcomeOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
