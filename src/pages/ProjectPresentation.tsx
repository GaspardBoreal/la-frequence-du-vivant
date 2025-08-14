import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEOHead from '@/components/SEOHead';
import PresentationHero from '@/components/presentation/PresentationHero';
import TerritorialSection from '@/components/presentation/TerritorialSection';
import InnovationSection from '@/components/presentation/InnovationSection';
import VisionSection from '@/components/presentation/VisionSection';
import InteractiveDemo from '@/components/presentation/InteractiveDemo';
import TestimonialsSection from '@/components/presentation/TestimonialsSection';
import PresentationFooter from '@/components/presentation/PresentationFooter';
import { Play, Users, Cpu, Heart } from 'lucide-react';

export default function ProjectPresentation() {
  const [activePersona, setActivePersona] = useState<'territorial' | 'innovation' | 'vision'>('territorial');

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Fréquence du Vivant - Révolution des Données Territoriales"
          description="Plateforme révolutionnaire combinant IA, bioacoustique et données ouvertes pour transformer l'approche territoriale de la biodiversité et du climat."
          keywords="intelligence artificielle, biodiversité, données territoriales, bioacoustique, transition climatique"
        />
        
        {/* Hero Section */}
        <PresentationHero />
        
        {/* Navigation par Persona */}
        <section className="bg-muted/20 border-y">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Tabs value={activePersona} onValueChange={(value) => setActivePersona(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-4xl mx-auto h-14">
                <TabsTrigger value="territorial" className="flex items-center gap-2 px-6 py-3">
                  <Users className="h-4 w-4" />
                  <span>Acteurs Territoriaux</span>
                </TabsTrigger>
                <TabsTrigger value="innovation" className="flex items-center gap-2 px-6 py-3">
                  <Cpu className="h-4 w-4" />
                  <span>Solutions Innovation</span>
                </TabsTrigger>
                <TabsTrigger value="vision" className="flex items-center gap-2 px-6 py-3">
                  <Heart className="h-4 w-4" />
                  <span>Vision & Rêve</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="territorial" className="mt-12">
                <TerritorialSection />
              </TabsContent>

              <TabsContent value="innovation" className="mt-12">
                <InnovationSection />
              </TabsContent>

              <TabsContent value="vision" className="mt-12">
                <VisionSection />
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Demo Interactive */}
        <InteractiveDemo />

        {/* Témoignages */}
        <TestimonialsSection />

        {/* Footer de présentation */}
        <PresentationFooter />
      </div>
    </HelmetProvider>
  );
}