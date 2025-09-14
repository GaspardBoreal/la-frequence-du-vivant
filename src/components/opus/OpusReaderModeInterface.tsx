import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Lightbulb, 
  MapPin, 
  Droplets, 
  Leaf, 
  Building, 
  Users, 
  Save, 
  Eye, 
  Bot,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Camera,
  Video,
  Heart
} from 'lucide-react';

interface OpusReaderModeProps {
  marcheId: string;
  marcheName: string;
  explorationId?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

interface FormSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  questions: FormQuestion[];
  completed: boolean;
}

interface FormQuestion {
  id: string;
  label: string;
  description: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  required: boolean;
  placeholder?: string;
  options?: string[];
  value: string | string[];
  helpText?: string;
  example?: string;
}

export const OpusReaderModeInterface: React.FC<OpusReaderModeProps> = ({
  marcheId,
  marcheName,
  explorationId,
  onSuccess,
  onClose
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedSections, setExpandedSections] = useState<string[]>(['eau']);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [progress, setProgress] = useState(0);

  // État du formulaire progressif
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Configuration des sections avec questions simplifiées
  const formSections: FormSection[] = [
    {
      id: 'eau',
      title: '💧 L\'eau et la rivière',
      description: 'Parlez-nous de l\'eau à cet endroit',
      icon: <Droplets className="w-5 h-5" />,
      completed: false,
      questions: [
        {
          id: 'niveau_eau',
          label: 'Comment est le niveau de l\'eau en ce moment ?',
          description: 'Décrivez ce que vous observez',
          type: 'select',
          required: true,
          options: ['Très bas', 'Bas', 'Normal', 'Haut', 'Très haut', 'Je ne sais pas'],
          value: '',
          helpText: 'Comparez avec ce que vous avez déjà vu ici',
          example: 'Par exemple: "Plus bas que d\'habitude" ou "Niveau normal pour la saison"'
        },
        {
          id: 'couleur_eau',
          label: 'De quelle couleur est l\'eau ?',
          description: 'Aidez-nous à comprendre la qualité de l\'eau',
          type: 'select',
          required: true,
          options: ['Claire/transparente', 'Légèrement trouble', 'Brune/terreuse', 'Verte', 'Autre couleur'],
          value: '',
          helpText: 'La couleur nous renseigne sur ce qui se passe dans l\'eau'
        },
        {
          id: 'odeur_eau',
          label: 'Y a-t-il une odeur particulière ?',
          description: 'Les odeurs révèlent beaucoup de choses',
          type: 'textarea',
          required: false,
          placeholder: 'Décrivez l\'odeur si vous en sentez une...',
          value: '',
          example: '"Ça sent la vase", "Odeur d\'herbe fraîche", "Pas d\'odeur particulière"'
        }
      ]
    },
    {
      id: 'nature',
      title: '🌿 Plantes et animaux',
      description: 'Qu\'est-ce qui vit ici ?',
      icon: <Leaf className="w-5 h-5" />,
      completed: false,
      questions: [
        {
          id: 'plantes_visibles',
          label: 'Quelles plantes voyez-vous ?',
          description: 'Décrivez la végétation autour de vous',
          type: 'textarea',
          required: true,
          placeholder: 'Décrivez les plantes que vous reconnaissez...',
          value: '',
          helpText: 'Même si vous ne connaissez pas les noms, décrivez ce que vous voyez',
          example: '"Des grands arbres avec des feuilles en forme de cœur", "De l\'herbe haute", "Des roseaux"'
        },
        {
          id: 'animaux_vus',
          label: 'Avez-vous vu des animaux ?',
          description: 'Oiseaux, poissons, insectes...',
          type: 'textarea',
          required: false,
          placeholder: 'Décrivez les animaux que vous avez observés...',
          value: '',
          example: '"Des canards", "Un héron gris", "Des petits poissons", "Beaucoup d\'insectes"'
        },
        {
          id: 'saison_observation',
          label: 'À quelle saison avez-vous fait cette observation ?',
          description: 'Cela nous aide à comprendre les cycles naturels',
          type: 'select',
          required: true,
          options: ['Printemps', 'Été', 'Automne', 'Hiver'],
          value: '',
          helpText: 'Les espèces varient selon les saisons'
        }
      ]
    },
    {
      id: 'amenagements',
      title: '🏗️ Constructions et aménagements',
      description: 'Ce que les humains ont construit ici',
      icon: <Building className="w-5 h-5" />,
      completed: false,
      questions: [
        {
          id: 'constructions_visibles',
          label: 'Quelles constructions voyez-vous ?',
          description: 'Ponts, barrages, bâtiments...',
          type: 'textarea',
          required: true,
          placeholder: 'Décrivez ce qui a été construit par l\'homme...',
          value: '',
          example: '"Un pont en pierre", "Un petit barrage", "Une maison au bord de l\'eau"'
        },
        {
          id: 'etat_constructions',
          label: 'Dans quel état sont ces constructions ?',
          description: 'Cela nous renseigne sur l\'histoire du lieu',
          type: 'select',
          required: false,
          options: ['Très bon état', 'Bon état', 'État moyen', 'Dégradé', 'En ruines'],
          value: '',
          helpText: 'L\'état des constructions raconte l\'histoire du lieu'
        }
      ]
    },
    {
      id: 'mots',
      title: '📖 Mots et expressions du coin',
      description: 'Le vocabulaire local de ce territoire',
      icon: <BookOpen className="w-5 h-5" />,
      completed: false,
      questions: [
        {
          id: 'mots_locaux',
          label: 'Connaissez-vous des mots spéciaux utilisés ici ?',
          description: 'Mots pour désigner la rivière, les lieux, les phénomènes...',
          type: 'textarea',
          required: false,
          placeholder: 'Partagez les mots et expressions que vous connaissez...',
          value: '',
          example: '"On dit \'la prade\' pour le pré près de la rivière", "Les anciens appellent ça \'le gour\'"'
        },
        {
          id: 'histoires_locales',
          label: 'Y a-t-il des histoires liées à ce lieu ?',
          description: 'Légendes, anecdotes, souvenirs...',
          type: 'textarea',
          required: false,
          placeholder: 'Racontez les histoires que vous connaissez...',
          value: '',
          example: '"Mon grand-père me racontait que...", "Il paraît qu\'autrefois..."'
        }
      ]
    }
  ];

  // Sauvegarde automatique
  const autoSave = useCallback(async () => {
    if (!autoSaveEnabled) return;
    
    try {
      // Sauvegarder en localStorage pour récupération
      localStorage.setItem(`opus_draft_${marcheId}`, JSON.stringify({
        formData,
        timestamp: Date.now(),
        progress
      }));
      
      toast({
        title: "💾 Sauvegarde automatique",
        description: "Vos données ont été sauvegardées",
      });
    } catch (error) {
      console.error('Erreur sauvegarde automatique:', error);
    }
  }, [formData, marcheId, progress, autoSaveEnabled, toast]);

  // Charger un brouillon existant
  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(`opus_draft_${marcheId}`);
      if (draft) {
        const { formData: savedData, progress: savedProgress } = JSON.parse(draft);
        setFormData(savedData);
        setProgress(savedProgress);
        toast({
          title: "📄 Brouillon récupéré",
          description: "Nous avons récupéré vos données sauvegardées",
        });
      }
    } catch (error) {
      console.error('Erreur chargement brouillon:', error);
    }
  }, [marcheId, toast]);

  // Mise à jour d'une réponse
  const updateAnswer = (questionId: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Calculer le progrès
    const totalQuestions = formSections.reduce((acc, section) => acc + section.questions.length, 0);
    const answeredQuestions = Object.keys({ ...formData, [questionId]: value }).length;
    setProgress((answeredQuestions / totalQuestions) * 100);
    
    // Sauvegarde automatique
    setTimeout(autoSave, 1000);
  };

  // Validation en temps réel
  const validateSection = (sectionId: string) => {
    const section = formSections.find(s => s.id === sectionId);
    if (!section) return { isValid: false, errors: [] };
    
    const errors: string[] = [];
    section.questions.forEach(question => {
      if (question.required && !formData[question.id]) {
        errors.push(`${question.label} est obligatoire`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  };

  // Toggle section
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const renderQuestion = (question: FormQuestion) => {
    const value = formData[question.id] || (question.type === 'multiselect' ? [] : '');
    
    return (
      <div key={question.id} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium flex items-center gap-2">
            {question.label}
            {question.required && <span className="text-destructive">*</span>}
            {question.helpText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{question.helpText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </label>
          <p className="text-sm text-muted-foreground">{question.description}</p>
          {question.example && (
            <p className="text-xs text-info bg-info/10 p-2 rounded border border-info/20">
              💡 Exemple : {question.example}
            </p>
          )}
        </div>

        {question.type === 'text' && (
          <Input
            value={value as string}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="focus:ring-2 focus:ring-primary/20"
          />
        )}

        {question.type === 'textarea' && (
          <Textarea
            value={value as string}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="focus:ring-2 focus:ring-primary/20"
          />
        )}

        {question.type === 'select' && (
          <Select value={value as string} onValueChange={(val) => updateAnswer(question.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Choisissez une option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Validation en temps réel */}
        {question.required && !value && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Cette information est importante pour comprendre votre territoire
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête avec progress */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl">Racontez votre territoire</span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                {marcheName} • Mode d'écriture simplifié pour lecteurs Gaspard Boréal
              </p>
            </div>
          </CardTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progression</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Introduction conviviale */}
      <Alert className="border-accent/30 bg-accent/10">
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <strong>Bienvenue !</strong> Vous allez nous aider à comprendre votre territoire. 
          Répondez simplement aux questions, avec vos propres mots. Il n'y a pas de "mauvaises" réponses.
          Vos observations sont précieuses ! 💝
        </AlertDescription>
      </Alert>

      {/* Options de sauvegarde */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
            className="rounded"
          />
          <span>Sauvegarde automatique</span>
        </div>
        <Button variant="outline" size="sm" onClick={loadDraft}>
          <Save className="w-4 h-4 mr-2" />
          Charger un brouillon
        </Button>
      </div>

      {/* Sections du formulaire */}
      <div className="space-y-4">
        {formSections.map((section, index) => {
          const isExpanded = expandedSections.includes(section.id);
          const validation = validateSection(section.id);
          const hasAnswers = section.questions.some(q => formData[q.id]);
          
          return (
            <Card key={section.id} className={`transition-all duration-300 ${
              isExpanded ? 'ring-2 ring-primary/20' : ''
            }`}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSection(section.id)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      hasAnswers ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {hasAnswers ? <CheckCircle className="w-4 h-4" /> : section.icon}
                    </div>
                    <div>
                      <span className="text-lg">{section.title}</span>
                      <p className="text-sm text-muted-foreground font-normal">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAnswers && (
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        {section.questions.filter(q => formData[q.id]).length}/{section.questions.length}
                      </Badge>
                    )}
                    {isExpanded ? 
                      <ChevronDown className="w-5 h-5" /> : 
                      <ChevronRight className="w-5 h-5" />
                    }
                  </div>
                </CardTitle>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-6">
                  {section.questions.map(renderQuestion)}
                  
                  {/* Validation de section */}
                  {!validation.isValid && validation.errors.length > 0 && (
                    <Alert variant="destructive" className="border-warning/30 bg-warning/10">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="font-medium">Pour continuer :</p>
                          <ul className="list-disc list-inside text-sm">
                            {validation.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onClose}>
          Sauvegarder et fermer
        </Button>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button className="bg-gradient-to-r from-primary to-accent">
            <Bot className="w-4 h-4 mr-2" />
            Générer l'import IA
          </Button>
        </div>
      </div>
    </div>
  );
};