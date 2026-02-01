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

      // 2. Fetch exploration_marches with parties
      const { data: explorationMarches, error: marchesError } = await supabase
        .from('exploration_marches')
        .select(`
          ordre,
          partie_id,
          marche_id,
          marches!inner(
            id,
            ville,
            nom_marche
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
        console.error('Error fetching exploration_marches:', marchesError);
        setState({
          status: 'error',
          message: 'Erreur lors du chargement des marches.',
        });
        return;
      }

      // 3. Get all marche_ids and fetch textes separately (no FK on marche_textes)
      const marcheIds = (explorationMarches || []).map(em => (em.marches as any)?.id).filter(Boolean);
      
      if (marcheIds.length === 0) {
        setState({
          status: 'error',
          message: 'Aucune marche publiée pour cette exploration.',
        });
        return;
      }

      const { data: allTextes, error: textesError } = await supabase
        .from('marche_textes')
        .select('id, titre, contenu, type_texte, ordre, metadata, marche_id')
        .in('marche_id', marcheIds)
        .order('ordre', { ascending: true });

      if (cancelled) return;

      if (textesError) {
        console.error('Error fetching textes:', textesError);
        setState({
          status: 'error',
          message: 'Erreur lors du chargement des textes.',
        });
        return;
      }

      // 4. Build a map of marche_id -> marche info for quick lookup
      const marcheMap = new Map<string, { ville: string; nom: string; partie: any; ordre: number }>();
      for (const em of explorationMarches || []) {
        const marche = em.marches as any;
        if (marche?.id) {
          marcheMap.set(marche.id, {
            ville: marche.ville || '',
            nom: marche.nom_marche || marche.ville || '',
            partie: em.exploration_parties as any,
            ordre: em.ordre ?? 0,
          });
        }
      }

      // 5. Transform data into TexteExport format
      const textes: TexteExport[] = [];
      
      for (const texte of allTextes || []) {
        const marcheInfo = marcheMap.get(texte.marche_id);
        if (marcheInfo) {
          textes.push({
            id: texte.id,
            titre: texte.titre,
            contenu: texte.contenu,
            type_texte: texte.type_texte,
            ordre: texte.ordre ?? 1,
            marche_ville: marcheInfo.ville,
            marche_nom: marcheInfo.nom,
            partie_id: marcheInfo.partie?.id || undefined,
            partie_titre: marcheInfo.partie?.titre || undefined,
            partie_numero_romain: marcheInfo.partie?.numero_romain || undefined,
            partie_ordre: marcheInfo.partie?.ordre || undefined,
          });
        }
      }

      // Sort textes by marche ordre then texte ordre
      textes.sort((a, b) => {
        const marcheA = marcheMap.get((allTextes || []).find(t => t.id === a.id)?.marche_id || '');
        const marcheB = marcheMap.get((allTextes || []).find(t => t.id === b.id)?.marche_id || '');
        const ordreA = marcheA?.ordre ?? 0;
        const ordreB = marcheB?.ordre ?? 0;
        if (ordreA !== ordreB) return ordreA - ordreB;
        return (a.ordre ?? 0) - (b.ordre ?? 0);
      });

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
