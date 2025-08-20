import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useExploration, useTrackClick, useExplorationMarches } from '@/hooks/useExplorations';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';
import { buildWelcomeComposition } from '@/utils/welcomeComposer';

const ExplorationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const trackClick = useTrackClick();
  
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [generatedSessionId, setGeneratedSessionId] = useState<string | null>(null);
  
  const { data: exploration, isLoading: explorationLoading, error: explorationError } = useExploration(slug!);
  const { data: marches = [] } = useExplorationMarches(exploration?.id || '');

  // Automatic redirection to experience when exploration is loaded
  useEffect(() => {
    if (exploration?.id && !isCreatingSession && !sessionError) {
      console.log('🔧 Starting automatic session creation for exploration:', exploration.id);
      createSessionAndRedirect();
    }
  }, [exploration?.id, isCreatingSession, sessionError]);

  // UUID fallback for older browsers or environments
  const generateSessionId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const createSessionAndRedirect = async () => {
    if (!exploration?.id) {
      console.error('🔧 No exploration ID available');
      return;
    }
    
    try {
      console.log('🔧 Starting session creation process');
      setIsCreatingSession(true);
      setSessionError(null);

      // Track exploration view
      console.log('🔧 Tracking exploration view');
      trackClick.mutate({
        exploration_id: exploration.id,
        action: 'view_exploration'
      });

      // Generate unique session ID
      const sessionId = generateSessionId();
      console.log('🔧 Generated session ID:', sessionId);
      setGeneratedSessionId(sessionId);

      // Generate welcome composition for adaptive experience
      const welcomeComposition = marches.length > 0 ? buildWelcomeComposition(exploration, marches) : null;
      console.log('🔧 Generated welcome composition:', welcomeComposition);

      // Create session with timeout
      console.log('🔧 Creating session in database with timeout');
      const sessionCreationPromise = (supabase as any)
        .from('narrative_sessions')
        .insert({
          id: sessionId,
          exploration_id: exploration.id,
          language: 'fr',
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          status: 'active',
          context: {
            created_from: 'exploration_detail',
            user_ip: null, // Will be set by Supabase
            welcome_composition: welcomeComposition ? JSON.parse(JSON.stringify(welcomeComposition)) : null
          }
        }, { returning: 'minimal' });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 4000)
      );

      const { error } = await Promise.race([sessionCreationPromise, timeoutPromise]);

      if (error) {
        console.error('🔧 Database error creating session:', error);
        throw new Error('Impossible de créer votre session personnalisée');
      }

      console.log('🔧 Session created successfully');
      
      // Redirect to experience
      const redirectUrl = `/explorations/${slug}/experience/${sessionId}`;
      console.log('🔧 Redirecting to:', redirectUrl);
      navigate(redirectUrl, { replace: true });
      
    } catch (error) {
      console.error('🔧 Session creation failed:', error);
      
      if (error instanceof Error && error.message === 'TIMEOUT') {
        console.log('🔧 Timeout occurred, redirecting anyway with generated session ID');
        // Navigate even on timeout - session will be auto-created in ExplorationExperience
        if (generatedSessionId) {
          const redirectUrl = `/explorations/${slug}/experience/${generatedSessionId}`;
          console.log('🔧 Timeout redirect to:', redirectUrl);
          navigate(redirectUrl, { replace: true });
          return;
        }
      }
      
      setSessionError(error instanceof Error ? error.message : 'Une erreur est survenue');
      setIsCreatingSession(false);
    }
  };

  const forceNavigate = () => {
    if (!exploration?.id) return;
    
    const sessionId = generatedSessionId || generateSessionId();
    const redirectUrl = `/explorations/${slug}/experience/${sessionId}`;
    console.log('🔧 Force navigation to:', redirectUrl);
    navigate(redirectUrl, { replace: true });
  };

  // Loading state - Exploration is loading
  if (explorationLoading) {
    return (
      <>
        <SEOHead 
          title="Chargement de l'exploration..."
          description="Préparation de votre expérience narrative personnalisée"
          keywords=""
        />
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gaspard-dark via-gaspard-emerald to-gaspard-forest"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-gaspard-sage/30 via-transparent to-gaspard-mint/20"></div>
          
          {/* Loading content */}
          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            <Sparkles className="h-12 w-12 text-gaspard-gold mx-auto mb-6 animate-pulse" />
            <h1 className="gaspard-main-title text-2xl text-gaspard-cream mb-4">
              Découverte de votre exploration...
            </h1>
            <div className="flex items-center justify-center space-x-2 text-gaspard-cream/70">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Chargement en cours</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state - Exploration not found
  if (explorationError || !exploration) {
    return (
      <>
        <SEOHead 
          title="Exploration introuvable"
          description="Cette exploration n'existe pas ou n'est plus disponible"
          keywords=""
        />
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gaspard-dark via-gaspard-emerald to-gaspard-forest"></div>
          
          {/* Error content */}
          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            <h1 className="gaspard-main-title text-3xl text-gaspard-cream mb-4">
              Exploration introuvable
            </h1>
            <p className="text-gaspard-cream/70 mb-8">
              Cette exploration n'existe pas ou n'est plus disponible.
            </p>
            <Link to="/explorations">
              <Button className="bg-gaspard-gold/20 text-gaspard-cream border-gaspard-gold/30 hover:bg-gaspard-gold/30">
                ← Retour aux explorations
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Session creation error state
  if (sessionError) {
    return (
      <>
        <SEOHead 
          title={exploration.meta_title || `${exploration.name} - Explorations`}
          description={exploration.meta_description || exploration.description || ''}
          keywords={exploration.meta_keywords.join(', ')}
        />
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gaspard-dark via-gaspard-emerald to-gaspard-forest"></div>
          
          {/* Error content */}
          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            <h1 className="gaspard-main-title text-2xl text-gaspard-cream mb-4">
              {exploration.name}
            </h1>
            <p className="text-red-400 mb-6">{sessionError}</p>
            <div className="space-y-3">
              <Button 
                onClick={createSessionAndRedirect}
                disabled={isCreatingSession}
                className="w-full bg-gaspard-gold/20 text-gaspard-cream border-gaspard-gold/30 hover:bg-gaspard-gold/30"
              >
                {isCreatingSession ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Nouvelle tentative...
                  </>
                ) : (
                  'Réessayer'
                )}
              </Button>
              <Link to="/explorations">
                <Button variant="outline" className="w-full">
                  ← Retour aux explorations
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Creating session state - Show splash screen
  return (
    <>
      <SEOHead 
        title={exploration.meta_title || `${exploration.name} - Explorations`}
        description={exploration.meta_description || exploration.description || ''}
        keywords={exploration.meta_keywords.join(', ')}
      />
      
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Background with exploration image if available */}
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-dark via-gaspard-emerald to-gaspard-forest"></div>
        {exploration.cover_image_url && (
          <div className="absolute inset-0 opacity-20">
            <img 
              src={exploration.cover_image_url} 
              alt={exploration.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-gaspard-sage/30 via-transparent to-gaspard-mint/20"></div>
        
        {/* Splash content */}
        <div className="relative z-10 text-center max-w-lg mx-auto px-6">
          <Sparkles className="h-16 w-16 text-gaspard-gold mx-auto mb-8 animate-pulse" />
          
          <h1 className="gaspard-main-title text-3xl md:text-4xl text-gaspard-cream mb-4 drop-shadow-lg">
            {exploration.name}
          </h1>
          
          {exploration.description && (
            <div className="text-gaspard-cream/80 text-lg mb-8 leading-relaxed prose prose-lg prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: exploration.description }}>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-3 text-gaspard-cream/70 mb-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Préparation de votre expérience personnalisée...</span>
          </div>
          
          <div className="mt-4 text-sm text-gaspard-cream/50 mb-6">
            Vous allez être redirigé automatiquement
          </div>
          
          {/* Manual fallback button */}
          <Button 
            onClick={generatedSessionId ? forceNavigate : createSessionAndRedirect}
            variant="outline"
            className="text-gaspard-cream border-gaspard-cream/30 hover:bg-gaspard-cream/10"
            disabled={isCreatingSession}
          >
            {generatedSessionId ? 'Continuer maintenant' : 'Continuer manuellement'}
          </Button>
        </div>
        
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>
        </div>
      </div>
    </>
  );
};

export default ExplorationDetail;