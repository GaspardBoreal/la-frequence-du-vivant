import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; target: string; title?: string };

const PublicEpubRead: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const backUrl = useMemo(() => (slug ? `/epub/${slug}` : '/'), [slug]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!slug) {
        setState({ status: 'error', message: 'Lien invalide.' });
        return;
      }

      const { data: exportRow, error: exportError } = await supabase
        .from('published_exports')
        .select('title, exploration_id')
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;

      if (exportError || !exportRow) {
        setState({ status: 'error', message: "Publication non trouvée." });
        return;
      }

      if (!exportRow.exploration_id) {
        setState({
          status: 'error',
          message:
            'Cette publication ne contient pas de lecture en ligne (exploration non associée).',
        });
        return;
      }

      const { data: exploration, error: explorationError } = await supabase
        .from('explorations')
        .select('slug')
        .eq('id', exportRow.exploration_id)
        .maybeSingle();

      if (cancelled) return;

      if (explorationError || !exploration?.slug) {
        setState({
          status: 'error',
          message:
            "Impossible d'ouvrir la lecture en ligne : exploration introuvable.",
        });
        return;
      }

      // Reuse the existing public reading route.
      setState({
        status: 'ready',
        target: `/explorations/${exploration.slug}/lire`,
        title: exportRow.title ?? undefined,
      });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === 'ready') {
    return <Navigate to={state.target} replace />;
  }

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Lecture en ligne | La Fréquence du Vivant</title>
        <meta
          name="description"
          content="Ouvrir la lecture en ligne (Livre Vivant) pour cette publication."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <BookOpen className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-xl font-semibold mb-2">Lecture indisponible</h1>
            <p className="text-muted-foreground mb-6">{state.message}</p>
            <Link to={backUrl}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PublicEpubRead;
