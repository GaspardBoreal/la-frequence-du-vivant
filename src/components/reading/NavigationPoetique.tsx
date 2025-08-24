// Phase 3.3: Poetic Navigation System
// Implements the 3 revolutionary navigation modes for immersive reading

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Route, 
  Sparkles, 
  Users, 
  ArrowRight,
  MapPin,
  Calendar,
  Hash,
  Brain,
  Compass
} from 'lucide-react';
import { getTextTypeInfo } from '@/types/textTypes';
import type { ExplorationTextContent } from '@/types/exploration';
import type { Exploration, ExplorationMarcheComplete } from '@/hooks/useExplorations';

type NavigationMode = 'constellation' | 'chemin-marches' | 'dialogue-interieur';

interface Props {
  exploration: Exploration;
  marches: ExplorationMarcheComplete[];
  textContent: ExplorationTextContent[];
  currentMode: NavigationMode;
  onModeChange: (mode: NavigationMode) => void;
  onTextSelect: (textId: string) => void;
  selectedTextId?: string;
}

interface ConstellationNode {
  text: ExplorationTextContent;
  connections: string[]; // IDs of related texts
  position: { x: number; y: number };
  themeStrength: number;
}

interface CheminNode {
  text: ExplorationTextContent;
  marche: any;
  chronologicalOrder: number;
  geographicalContext: string;
}

const NavigationPoetique: React.FC<Props> = ({ 
  exploration, 
  marches, 
  textContent, 
  currentMode, 
  onModeChange, 
  onTextSelect,
  selectedTextId 
}) => {

  // Constellation mode: semantic links between texts
  const constellationData = useMemo(() => {
    const nodes: ConstellationNode[] = textContent.map((text, index) => {
      // Calculate semantic connections based on shared tags
      const connections = textContent
        .filter(other => other.id !== text.id)
        .filter(other => other.tags.some(tag => text.tags.includes(tag)))
        .map(other => other.id);

      // Generate positioning in a spiral/constellation pattern
      const angle = (index / textContent.length) * 2 * Math.PI;
      const radius = 150 + (index % 3) * 80;
      
      return {
        text,
        connections,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        },
        themeStrength: text.tags.length,
      };
    });

    return nodes;
  }, [textContent]);

  // Chemin des Marches: chronological/geographical ordering
  const cheminData = useMemo(() => {
    const nodes: CheminNode[] = textContent
      .map(text => {
        const marche = marches.find(m => m.marche?.id === text.marcheId);
        return {
          text,
          marche: marche?.marche,
          chronologicalOrder: text.order || 0,
          geographicalContext: marche?.marche?.region || 'Territoire',
        };
      })
      .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);

    return nodes;
  }, [textContent, marches]);

  // Dialogue Intérieur: Laurent TRIPIED ↔ Gaspard Boréal
  const dialogueData = useMemo(() => {
    return textContent.filter(text => 
      text.type === 'correspondance' || 
      text.tags.some(tag => 
        tag.toLowerCase().includes('laurent') || 
        tag.toLowerCase().includes('gaspard') ||
        tag.toLowerCase().includes('dialogue')
      )
    ).sort((a, b) => a.order - b.order);
  }, [textContent]);

  const renderConstellation = () => (
    <div className="relative h-96 overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="-300 -200 600 400"
        >
          {/* Draw connections between related texts */}
          {constellationData.map(node => 
            node.connections.map(connectionId => {
              const targetNode = constellationData.find(n => n.text.id === connectionId);
              if (!targetNode) return null;
              
              return (
                <motion.line
                  key={`${node.text.id}-${connectionId}`}
                  x1={node.position.x}
                  y1={node.position.y}
                  x2={targetNode.position.x}
                  y2={targetNode.position.y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeOpacity="0.2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: Math.random() * 1 }}
                />
              );
            })
          )}
        </svg>

        {/* Text nodes */}
        {constellationData.map((node, index) => {
          const typeInfo = getTextTypeInfo(node.text.type);
          const isSelected = selectedTextId === node.text.id;
          
          return (
            <motion.div
              key={node.text.id}
              className={`absolute cursor-pointer transition-all duration-300 ${
                isSelected ? 'z-10 scale-125' : 'hover:scale-110'
              }`}
              style={{
                left: `calc(50% + ${node.position.x}px)`,
                top: `calc(50% + ${node.position.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => onTextSelect(node.text.id)}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 ${
                isSelected 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background border-primary/30 hover:border-primary/60'
              }`}>
                <span className="text-lg">{typeInfo.icon}</span>
              </div>
              
              {/* Text preview on hover/selection */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 z-20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="shadow-xl border-primary/20">
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm mb-1">{node.text.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {typeInfo.label}
                        </p>
                        <p className="text-xs line-clamp-3">
                          {node.text.content.substring(0, 100)}...
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );

  const renderCheminMarches = () => (
    <div className="space-y-4">
      {cheminData.map((node, index) => {
        const typeInfo = getTextTypeInfo(node.text.type);
        const isSelected = selectedTextId === node.text.id;
        
        return (
          <motion.div
            key={node.text.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="relative"
          >
            {/* Timeline connector */}
            {index < cheminData.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-8 bg-primary/30" />
            )}
            
            <div 
              className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'bg-primary/10 border-primary shadow-lg' 
                  : 'hover:bg-muted/50 border-border hover:border-primary/30'
              }`}
              onClick={() => onTextSelect(node.text.id)}
            >
              {/* Order indicator */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium ${
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeInfo.icon}</span>
                  <h4 className="font-medium">{node.text.title}</h4>
                  <Badge variant="outline">{typeInfo.label}</Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {node.marche && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {node.geographicalContext}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Étape {node.chronologicalOrder}
                  </span>
                </div>
                
                <p className="text-sm line-clamp-2">
                  {node.text.content.substring(0, 150)}...
                </p>
                
                {node.text.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {node.text.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {node.text.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{node.text.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const renderDialogueInterieur = () => (
    <div className="space-y-6">
      <div className="text-center p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg">
        <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
        <h3 className="font-medium mb-2">Dialogue Laurent TRIPIED ↔ Gaspard Boréal</h3>
        <p className="text-sm text-muted-foreground">
          Exploration de la dualité créatrice entre l'entrepreneur technologique et le poète des mondes hybrides
        </p>
      </div>
      
      {dialogueData.length > 0 ? (
        <div className="space-y-4">
          {dialogueData.map((text, index) => {
            const typeInfo = getTextTypeInfo(text.type);
            const isSelected = selectedTextId === text.id;
            const isLaurent = text.tags.some(tag => tag.toLowerCase().includes('laurent'));
            
            return (
              <motion.div
                key={text.id}
                initial={{ opacity: 0, x: isLaurent ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`flex ${isLaurent ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-lg p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                    isLaurent 
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400' 
                      : 'bg-emerald-50 dark:bg-emerald-950/30 border-r-4 border-emerald-400'
                  } ${isSelected ? 'shadow-lg scale-105' : 'hover:shadow-md'}`}
                  onClick={() => onTextSelect(text.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span>{typeInfo.icon}</span>
                    <h4 className="font-medium text-sm">{text.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {isLaurent ? 'Laurent TRIPIED' : 'Gaspard Boréal'}
                    </Badge>
                  </div>
                  <p className="text-sm line-clamp-3">
                    {text.content.substring(0, 200)}...
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune correspondance disponible pour cette exploration.</p>
          <p className="text-sm mt-2">Ce dialogue se développera au fil des créations futures.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Navigation Poétique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={currentMode} onValueChange={(value) => onModeChange(value as NavigationMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="constellation" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Constellation
              </TabsTrigger>
              <TabsTrigger value="chemin-marches" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                Chemin des Marches
              </TabsTrigger>
              <TabsTrigger value="dialogue-interieur" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Dialogue Intérieur
              </TabsTrigger>
            </TabsList>

            <TabsContent value="constellation" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 inline mr-2" />
                  Navigation par liens thématiques et sémantiques
                </div>
                {renderConstellation()}
              </div>
            </TabsContent>

            <TabsContent value="chemin-marches" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <Route className="h-4 w-4 inline mr-2" />
                  Parcours chronologique des explorations territoriales
                </div>
                {renderCheminMarches()}
              </div>
            </TabsContent>

            <TabsContent value="dialogue-interieur" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <Users className="h-4 w-4 inline mr-2" />
                  Correspondance entre l'entrepreneur et le poète
                </div>
                {renderDialogueInterieur()}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NavigationPoetique;