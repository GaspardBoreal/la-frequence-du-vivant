import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PublicLivreVivantViewer from '@/components/public/PublicLivreVivantViewer';
import { EPUB_PRESETS, type TexteExport, type EpubExportOptions } from '@/utils/epubExportUtils';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; textes: TexteExport[]; options: EpubExportOptions; title: string };

interface PublishedExportRow {
  title: string;
  subtitle?: string;
  author?: string;
  exploration_id: string | null;
  artistic_direction: string | null;
  cover_url?: string;
}

const PublicLivreVivant: React.FC = () => {
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

      // 1. Fetch publication metadata
      const { data: exportRow, error: exportError } = await supabase
        .from('published_exports')
        .select('title, subtitle, author, exploration_id, artistic_direction, cover_url')
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;

      if (exportError || !exportRow) {
        setState({ status: 'error', message: 'Publication non trouvée.' });
        return;
      }

      const publication = exportRow as PublishedExportRow;

      if (!publication.exploration_id) {
        setState({
          status: 'error',
          message:
            'Cette publication ne contient pas de lecture en ligne (exploration non associée).',
        });
        return;
      }

      // 2. Fetch texts from exploration with join through exploration_marches
      const { data: explorationMarches, error: marchesError } = await supabase
        .from('exploration_marches')
        .select(`
          ordre,
          partie_id,
          marche_id,
          marches!inner(
            id,
            ville,
            nom_marche,
            marche_textes(
              id,
              titre,
              contenu,
              type_texte,
              ordre,
              metadata
            )
          ),
          exploration_parties(
            id,
            titre,
            numero_romain,
            description,
            ordre
          )
        `)
        .eq('exploration_id', publication.exploration_id)
        .eq('publication_status', 'published_public')
        .order('ordre', { ascending: true });

      if (cancelled) return;

      if (marchesError) {
        console.error('Error fetching textes:', marchesError);
        setState({
          status: 'error',
          message: 'Erreur lors du chargement des textes.',
        });
        return;
      }

      // 3. Transform data into TexteExport format
      const textes: TexteExport[] = [];
      
      for (const em of explorationMarches || []) {
        const marche = em.marches as any;
        const partie = em.exploration_parties as any;
        const marcheTextes = marche?.marche_textes || [];

        for (const texte of marcheTextes) {
          textes.push({
            id: texte.id,
            titre: texte.titre,
            contenu: texte.contenu,
            type_texte: texte.type_texte,
            ordre: texte.ordre ?? 1,
            marche_ville: marche?.ville || '',
            marche_nom: marche?.nom_marche || marche?.ville || '',
            partie_id: partie?.id || undefined,
            partie_titre: partie?.titre || undefined,
            partie_numero_romain: partie?.numero_romain || undefined,
            partie_ordre: partie?.ordre || undefined,
          });
        }
      }

      if (textes.length === 0) {
        setState({
          status: 'error',
          message: 'Aucun texte publié disponible pour cette exploration.',
        });
        return;
      }

      // 4. Build export options from artistic_direction
      const presetKey = (publication.artistic_direction || 'galerie_fleuve') as keyof typeof EPUB_PRESETS;
      const preset = EPUB_PRESETS[presetKey] || EPUB_PRESETS.galerie_fleuve;

      const options: EpubExportOptions = {
        title: publication.title,
        subtitle: publication.subtitle || '',
        author: publication.author || 'Gaspard Boréal',
        publisher: 'La Fréquence du Vivant',
        language: 'fr',
        format: presetKey as EpubExportOptions['format'],
        coverImageUrl: publication.cover_url || undefined,
        colorScheme: preset.colorScheme,
        typography: preset.typography,
        includeCover: true,
        includeTableOfContents: true,
        includePartiePages: true,
        includeIllustrations: false,
        organizationMode: 'marche',
        includeMetadata: false,
        includeIndexes: true,
      };

      setState({
        status: 'ready',
        textes,
        options,
        title: publication.title,
      });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement du Livre Vivant...</p>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
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
  }

  return (
    <>
      <Helmet>
        <title>{state.title} | Lecture en ligne</title>
        <meta
          name="description"
          content={`Lisez ${state.title} en ligne avec le Livre Vivant - une expérience de lecture immersive.`}
        />
      </Helmet>

      <PublicLivreVivantViewer
        textes={state.textes}
        options={state.options}
        backUrl={backUrl}
        title={state.title}
      />
    </>
  );
};

export default PublicLivreVivant;
