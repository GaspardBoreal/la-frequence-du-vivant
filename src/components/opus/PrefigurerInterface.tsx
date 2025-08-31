import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrefigurations, useOpusExploration, useMarcheContextes } from '@/hooks/useOpus';
import { useExplorationMarches, useExploration } from '@/hooks/useExplorations';
import { useIsMobile } from '@/hooks/use-mobile';
import type { PrefigurationInteractive } from '@/types/opus';
import type { ExplorationMarcheComplete } from '@/hooks/useExplorations';
import { 
  Waves, 
  Calendar, 
  BookOpen, 
  Cpu, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  Eye,
  Navigation,
  Zap,
  Sparkles,
  Filter,
  ChevronDown,
  Home
} from 'lucide-react';

interface PrefigurerInterfaceProps {
  opusSlug: string;
  onClose?: () => void;
}

interface MarcheContextData {
  id: string;
  nom_marche?: string;
  ville: string;
  contexte?: any;
  photos: any[];
  audio: any[];
  textes: any[];
}

const EXPERIENCE_CONFIGS = {
  contexte_hydrologique: {
    icon: Waves,
    title: 'Contexte Hydrologique',
    description: 'Navigation fluviale interactive entre contextes',
    color: 'text-blue-400',
    bgColor: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
    particles: '🌊'
  },
  especes_caracteristiques: {
    icon: BookOpen,
    title: 'Espèces Caractéristiques',
    description: 'Biodiversité locale et conservation',
    color: 'text-orange-400',
    bgColor: 'bg-gradient-to-br from-orange-500/10 to-amber-500/10',
    particles: '🦋'
  },
  vocabulaire_local: {
    icon: BookOpen,
    title: 'Vocabulaire local',
    description: 'Lexique territorial et expressions locales',
    color: 'text-amber-400',
    bgColor: 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10',
    particles: '📚'
  },
  projection_2035_2045: {
    icon: Calendar,
    title: 'Projections 2035-2045',
    description: 'Exploration temporelle des futurs possibles',
    color: 'text-purple-400',
    bgColor: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
    particles: '🔮'
  },
  technodiversite: {
    icon: Cpu,
    title: 'Technodiversité',
    description: 'Innovations low-tech et open-hardware',
    color: 'text-green-400',
    bgColor: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
    particles: '⚡'
  },
  fables: {
    icon: BookOpen,
    title: 'Fables',
    description: 'Narratives poétiques et récits territoriaux',
    color: 'text-indigo-400',
    bgColor: 'bg-gradient-to-br from-indigo-500/10 to-violet-500/10',
    particles: '📖'
  }
};

export const PrefigurerInterface: React.FC<PrefigurerInterfaceProps> = ({
  opusSlug,
  onClose
}) => {
  const isMobile = useIsMobile();
  
  // Récupérer l'exploration depuis le slug
  const { data: exploration } = useExploration(opusSlug);
  const { data: explorationMarches = [], isLoading: isLoadingMarches } = useExplorationMarches(exploration?.id || '');
  
  const [activeExperience, setActiveExperience] = useState<string | null>(null);
  const [selectedMarche, setSelectedMarche] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([0.7]);
  const [ambientSounds, setAmbientSounds] = useState(true);
  const [particleEffects, setParticleEffects] = useState(true);
  const [zoomLevel, setZoomLevel] = useState([1]);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Animation canvas pour les effets visuels
  useEffect(() => {
    if (!canvasRef.current || !activeExperience) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];

    // Créer des particules selon le mode
    const config = EXPERIENCE_CONFIGS[activeExperience as keyof typeof EXPERIENCE_CONFIGS];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: config.color.includes('blue') ? '#3b82f6' :
               config.color.includes('purple') ? '#8b5cf6' :
               config.color.includes('orange') ? '#f97316' : '#10b981'
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (particleEffects) {
        particles.forEach(particle => {
          // Mise à jour position
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          // Rebond sur les bords
          if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1;
          if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1;
          
          // Dessin
          ctx.save();
          ctx.globalAlpha = particle.opacity;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeExperience, isPlaying, particleEffects]);

  const handleExperienceSelect = (experienceType: string) => {
    setActiveExperience(experienceType);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetExperience = () => {
    setIsPlaying(false);
    setActiveExperience(null);
    setZoomLevel([1]);
  };

  // Obtenir les données contextuelles pour la marche sélectionnée
  const getContextData = (): MarcheContextData[] => {
    if (selectedMarche === 'all') {
      return explorationMarches.map(em => ({
        id: em.marche?.id || '',
        nom_marche: em.marche?.nom_marche,
        ville: em.marche?.ville || '',
        photos: em.marche?.photos || [],
        audio: em.marche?.audio || [],
        textes: [...(em.marche?.textes || []), ...(em.marche?.etudes || [])]
      }));
    }
    
    const marche = explorationMarches.find(em => em.marche?.id === selectedMarche);
    if (!marche?.marche) return [];
    
    return [{
      id: marche.marche.id,
      nom_marche: marche.marche.nom_marche,
      ville: marche.marche.ville,
      photos: marche.marche.photos || [],
      audio: marche.marche.audio || [],
      textes: [...(marche.marche.textes || []), ...(marche.marche.etudes || [])]
    }];
  };

  if (isLoadingMarches) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header - Mobile First */}
      <div className={`flex items-center justify-between p-4 ${isMobile ? 'flex-col gap-4' : 'flex-row'} border-b border-border`}>
        <div className={`flex items-center gap-3 ${isMobile ? 'justify-center' : ''}`}>
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="h-5 w-5" />
            </Button>
          )}
          <div className={`${isMobile ? 'text-center' : ''}`}>
            <h1 className="text-xl md:text-2xl font-bold text-foreground drop-shadow-sm">
              Préfigurer
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">{exploration?.name || 'Chargement...'}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 md:gap-4 ${isMobile ? 'flex-wrap justify-center' : ''}`}>
          {/* Filtres par marche */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={selectedMarche} onValueChange={setSelectedMarche}>
              <SelectTrigger className="w-32 md:w-40">
                <SelectValue placeholder="Marche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marches</SelectItem>
                {explorationMarches.map((em) => (
                  <SelectItem key={em.marche?.id} value={em.marche?.id || ''}>
                    {em.marche?.ville || em.marche?.nom_marche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Contrôles globaux - Réduits sur mobile */}
          {!isMobile && (
            <>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={1}
                  step={0.1}
                  className="w-16 md:w-20"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={ambientSounds}
                  onCheckedChange={setAmbientSounds}
                />
                <span className="text-xs md:text-sm">Sons</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={particleEffects}
                  onCheckedChange={setParticleEffects}
                />
                <span className="text-xs md:text-sm">Effets</span>
              </div>
            </>
          )}
          
          {/* Toggle sidebar sur mobile */}
          {isMobile && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </Button>
          )}
          
        </div>
      </div>

      <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* Panneau de sélection des expériences - Mobile First */}
        <div className={`
          ${isMobile 
            ? sidebarOpen ? 'h-auto' : 'h-0 overflow-hidden'
            : 'w-80'
          } 
          border-r border-border p-4 md:p-6 space-y-4 overflow-y-auto
          ${isMobile ? 'transition-all duration-300' : ''}
        `}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Dimensions d'Exploration</h2>
            <Badge variant="outline">{getContextData().length} marche(s)</Badge>
          </div>
          
          {Object.entries(EXPERIENCE_CONFIGS).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeExperience === key;
            
            return (
              <Card 
                key={key}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isActive ? 'ring-2 ring-primary bg-card' : 'bg-card/50 hover:bg-card'
                }`}
                onClick={() => handleExperienceSelect(key)}
              >
                <CardHeader className={`pb-3 ${isMobile ? 'p-4' : 'p-6'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 md:h-5 md:w-5 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm md:text-base">{config.title}</CardTitle>
                      <p className="text-muted-foreground text-xs md:text-sm line-clamp-2">{config.description}</p>
                    </div>
                  </div>
                </CardHeader>
                
                {isActive && (
                  <CardContent className={`pt-0 ${isMobile ? 'px-4 pb-4' : 'p-6 pt-0'}`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary text-primary-foreground">
                        Actif
                      </Badge>
                      <span className="text-lg">{config.particles}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {getContextData().length} contexte(s)
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Zone d'expérience principale - Mobile First */}
        <div className="flex-1 relative min-h-[400px] md:min-h-0">
          <canvas
            ref={canvasRef}
            width={isMobile ? 400 : 800}
            height={isMobile ? 300 : 600}
            className="absolute inset-0 w-full h-full"
          />
          
          {!activeExperience ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="text-center">
                <Sparkles className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-primary" />
                <h2 className="text-lg md:text-2xl font-bold mb-2">Sélectionnez une dimension</h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  {explorationMarches.length} marche(s) prête(s) à être explorée(s)
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Filtre actuel: {selectedMarche === 'all' ? 'Toutes les marches' : 
                    explorationMarches.find(em => em.marche?.id === selectedMarche)?.marche?.ville}
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 p-4 md:p-6">
              {/* Interface spécifique à l'expérience */}
              <div className="h-full flex flex-col">
                <div className={`flex items-center justify-between mb-4 md:mb-6 ${isMobile ? 'flex-col gap-4' : 'flex-row'}`}>
                  <div className="flex items-center gap-2 md:gap-4">
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "icon"}
                      onClick={togglePlayPause}
                      className="bg-card/50 border-border"
                    >
                      {isPlaying ? 
                        <Pause className="h-4 w-4" /> : 
                        <Play className="h-4 w-4" />
                      }
                    </Button>
                    
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "icon"}
                      onClick={resetExperience}
                      className="bg-card/50 border-border"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    
                    {!isMobile && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <Slider
                          value={zoomLevel}
                          onValueChange={setZoomLevel}
                          min={0.5}
                          max={3}
                          step={0.1}
                          className="w-24 md:w-32"
                        />
                        <span className="text-sm w-12">{Math.round(zoomLevel[0] * 100)}%</span>
                      </div>
                    )}
                  </div>
                  
                  <Badge variant="outline" className="bg-card/50 border-border">
                    {EXPERIENCE_CONFIGS[activeExperience as keyof typeof EXPERIENCE_CONFIGS].title}
                  </Badge>
                </div>
                
                {/* Contenu de l'expérience avec données réelles */}
                <div className="flex-1 rounded-lg bg-card/30 backdrop-blur-sm border border-border p-4 md:p-6 overflow-auto">
                  <div className="h-full">
                    <div className="grid gap-4 md:gap-6">
                      {/* Aperçu des données contextuelles */}
                      <div className="text-center mb-4">
                        <div className="text-4xl md:text-6xl mb-4">
                          {EXPERIENCE_CONFIGS[activeExperience as keyof typeof EXPERIENCE_CONFIGS].particles}
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold mb-2">
                          {EXPERIENCE_CONFIGS[activeExperience as keyof typeof EXPERIENCE_CONFIGS].title}
                        </h3>
                        <p className="text-muted-foreground mb-4 text-sm md:text-base">
                          Exploration de {getContextData().length} contexte(s) territorial
                        </p>
                      </div>

                      {/* Grille des contextes */}
                      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                        {getContextData().map((contexte) => (
                          <Card key={contexte.id} className="bg-card/50 border-border">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm md:text-base">{contexte.ville}</CardTitle>
                              {contexte.nom_marche && (
                                <p className="text-xs md:text-sm text-muted-foreground">{contexte.nom_marche}</p>
                              )}
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center gap-2 text-xs">
                                <span>{contexte.photos.length} photos</span>
                                <span>•</span>
                                <span>{contexte.audio.length} audio</span>
                                <span>•</span>
                                <span>{contexte.textes.length} textes</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="text-center text-sm text-muted-foreground mt-4">
                        {isPlaying ? (
                          <div className="flex items-center gap-2 justify-center">
                            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                            Exploration active
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-2 h-2 bg-muted rounded-full"></div>
                            En pause
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Contrôles de navigation flottants - Masqués sur mobile */}
          {activeExperience && !isMobile && (
            <div className="absolute bottom-6 left-6">
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      <span className="text-sm">Navigation tactile</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Toucher pour explorer • Pincer pour zoomer
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};