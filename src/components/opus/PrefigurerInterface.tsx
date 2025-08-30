import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { usePrefigurations, useOpusExploration } from '@/hooks/useOpus';
import type { PrefigurationInteractive } from '@/types/opus';
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
  Sparkles
} from 'lucide-react';

interface PrefigurerInterfaceProps {
  opusSlug: string;
  onClose?: () => void;
}

const EXPERIENCE_CONFIGS = {
  confluence: {
    icon: Waves,
    title: 'Mode Confluence',
    description: 'Navigation fluviale interactive entre contextes',
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    particles: '🌊'
  },
  projection: {
    icon: Calendar,
    title: 'Mode Projection',
    description: 'Exploration temporelle vers 2035-2045',
    color: 'text-purple-600',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
    particles: '🔮'
  },
  fables_vivantes: {
    icon: BookOpen,
    title: 'Fables Vivantes',
    description: 'Narratives adaptatives et musicales',
    color: 'text-orange-600',
    bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
    particles: '📖'
  },
  technodiversite: {
    icon: Cpu,
    title: 'Technodiversité',
    description: 'Innovations low-tech et open-hardware',
    color: 'text-green-600',
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
    particles: '⚡'
  }
};

export const PrefigurerInterface: React.FC<PrefigurerInterfaceProps> = ({
  opusSlug,
  onClose
}) => {
  const { data: opus } = useOpusExploration(opusSlug);
  const { data: prefigurations, isLoading } = usePrefigurations(opus?.id || '');
  
  const [activeExperience, setActiveExperience] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([0.7]);
  const [ambientSounds, setAmbientSounds] = useState(true);
  const [particleEffects, setParticleEffects] = useState(true);
  const [zoomLevel, setZoomLevel] = useState([1]);
  
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Préfigurer
          </h1>
          <p className="text-slate-400">{opus?.nom || 'Chargement...'}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Contrôles globaux */}
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={1}
              step={0.1}
              className="w-20"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={ambientSounds}
              onCheckedChange={setAmbientSounds}
            />
            <span className="text-sm">Sons ambiants</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={particleEffects}
              onCheckedChange={setParticleEffects}
            />
            <span className="text-sm">Effets</span>
          </div>
          
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Panneau de sélection des expériences */}
        <div className="w-80 border-r border-slate-700 p-6 space-y-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Expériences Immersives</h2>
          
          {Object.entries(EXPERIENCE_CONFIGS).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeExperience === key;
            
            return (
              <Card 
                key={key}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isActive ? 'ring-2 ring-blue-500 bg-slate-800' : 'bg-slate-800/50 hover:bg-slate-800'
                }`}
                onClick={() => handleExperienceSelect(key)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">{config.title}</CardTitle>
                      <p className="text-slate-400 text-sm">{config.description}</p>
                    </div>
                  </div>
                </CardHeader>
                
                {isActive && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-600 text-white">
                        Actif
                      </Badge>
                      <span className="text-xl">{config.particles}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Zone d'expérience principale */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="absolute inset-0 w-full h-full"
          />
          
          {!activeExperience ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                <h2 className="text-2xl font-bold mb-2">Sélectionnez une expérience</h2>
                <p className="text-slate-400">
                  Choisissez un mode d'exploration dans le panneau de gauche
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 p-6">
              {/* Interface spécifique à l'expérience */}
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={togglePlayPause}
                      className="bg-slate-800/50 border-slate-600"
                    >
                      {isPlaying ? 
                        <Pause className="h-4 w-4" /> : 
                        <Play className="h-4 w-4" />
                      }
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={resetExperience}
                      className="bg-slate-800/50 border-slate-600"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <Slider
                        value={zoomLevel}
                        onValueChange={setZoomLevel}
                        min={0.5}
                        max={3}
                        step={0.1}
                        className="w-32"
                      />
                      <span className="text-sm w-12">{Math.round(zoomLevel[0] * 100)}%</span>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="bg-slate-800/50 border-slate-600 text-white">
                    {EXPERIENCE_CONFIGS[activeExperience as keyof typeof EXPERIENCE_CONFIGS].title}
                  </Badge>
                </div>
                
                {/* Contenu de l'expérience */}
                <div className="flex-1 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-slate-600 p-6">
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">
                        {activeExperience === 'confluence' && '🌊'}
                        {activeExperience === 'projection' && '🔮'}
                        {activeExperience === 'fables_vivantes' && '📖'}
                        {activeExperience === 'technodiversite' && '⚡'}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {EXPERIENCE_CONFIGS[activeExperience as keyof typeof EXPERIENCE_CONFIGS].title}
                      </h3>
                      <p className="text-slate-400 mb-4">
                        Interface immersive en cours de développement...
                      </p>
                      <div className="text-sm text-slate-500">
                        {isPlaying ? (
                          <div className="flex items-center gap-2 justify-center">
                            <div className="animate-pulse w-2 h-2 bg-green-400 rounded-full"></div>
                            Expérience active
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
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
          
          {/* Contrôles de navigation flottants */}
          {activeExperience && (
            <div className="absolute bottom-6 left-6">
              <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      <span className="text-sm">Navigation 3D</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Clic-glisser pour tourner • Molette pour zoomer
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