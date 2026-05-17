import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import ExplorationForm from '@/components/admin/ExplorationForm';
import DecorativeParticles from '@/components/DecorativeParticles';
import { Palette, Sparkles, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DuplicateExplorationDialog from '@/components/admin/DuplicateExplorationDialog';
import { supabase } from '@/integrations/supabase/client';

const ExplorationFormPage = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [explorationName, setExplorationName] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    supabase
      .from('explorations')
      .select('name')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setExplorationName(data.name);
      });
  }, [id]);

  return (
    <>
      <SEOHead 
        title={`${isEdit ? 'Modifier' : 'Créer'} une exploration - Admin`}
        description={`Interface d'administration pour ${isEdit ? 'modifier' : 'créer'} une exploration thématique`}
        keywords="admin, exploration, création, édition"
      />
      
      <div className="min-h-screen relative overflow-hidden">
        {/* Arrière-plan immersif */}
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-dark via-gaspard-emerald to-gaspard-forest"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-gaspard-sage/30 via-transparent to-gaspard-mint/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(29,90,74,0.3),transparent_70%)]"></div>
        
        {/* Particules décoratives */}
        <DecorativeParticles />
        
        {/* Contenu principal */}
        <div className="relative z-10 container mx-auto px-6 py-12">
          {/* En-tête poétique */}
          <header className="text-center mb-12 animate-fade-in">
            <div className="flex justify-center items-center gap-4 mb-6">
              <Palette className="h-8 w-8 text-gaspard-gold animate-soft-pulse" />
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-gaspard-gold to-transparent rounded-full"></div>
              <Sparkles className="h-6 w-6 text-gaspard-cream animate-gentle-float" />
            </div>
            
            <h1 className="gaspard-main-title text-4xl md:text-5xl font-bold mb-4 text-gaspard-cream">
              {isEdit ? 'Redéfinir l\'Exploration' : 'Tisser une Nouvelle Exploration'}
            </h1>
            
            <p className="gaspard-category text-lg text-gaspard-cream/80 max-w-2xl mx-auto leading-relaxed font-light">
              {isEdit ? 'Redonnez forme à cette essence narrative' : 'Créez un nouvel univers d\'exploration thématique'}
            </p>
            
            {/* Ligne décorative animée */}
            <div className="mt-8 w-24 h-0.5 bg-gradient-to-r from-gaspard-gold to-gaspard-cream mx-auto rounded-full opacity-60"></div>

            {isEdit && id && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setDuplicateOpen(true)}
                  className="rounded-full bg-background/20 border-gaspard-cream/30 text-gaspard-cream hover:bg-background/30 hover:text-gaspard-cream"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer cette exploration
                </Button>
              </div>
            )}
          </header>

          <ExplorationForm explorationId={id} />
        </div>

        {isEdit && id && (
          <DuplicateExplorationDialog
            source={{ id, name: explorationName || 'Exploration' }}
            open={duplicateOpen}
            onOpenChange={setDuplicateOpen}
          />
        )}
        
        {/* Texture de fond subtile */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>
        </div>
      </div>
    </>
  );
};

export default ExplorationFormPage;