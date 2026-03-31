import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, AudioLines, Bird, BookOpen, Download, ExternalLink, Leaf, Mic2, Sparkles, Trees, UserRoundPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import FrequenceWave from '@/components/community/FrequenceWave';
import { storeAffiliateToken } from '@/utils/communityAffiliate';

type LandingData = {
  share_token: string;
  exploration: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    cover_image_url: string | null;
  };
  inviter: {
    prenom: string;
    nom: string;
    role: string;
  };
  marche_event: {
    id: string;
    title: string;
    date_marche: string | null;
    lieu: string | null;
  } | null;
  stats: {
    media_count: number;
    audio_count: number;
    text_count: number;
    species_count: number;
  };
  hero_media: Array<{ id: string; title: string | null; type: string; url: string | null }>;
  audio_highlights: Array<{ id: string; title: string | null; url: string | null; duration: number | null }>;
  text_highlights: Array<{ id: string; title: string | null; content: string | null }>;
};

const CommunityAffiliateLanding: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['community-affiliate-landing', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_community_affiliate_landing', {
        _share_token: token,
      });
      if (error) throw error;
      return data as LandingData | null;
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (!token) return;
    storeAffiliateToken(token);
    supabase.rpc('record_community_affiliate_event', {
      _share_token: token,
      _event_type: 'landing_view',
      _metadata: {
        source: 'public_landing',
        user_agent: navigator.userAgent,
      },
      _referred_user_id: null,
    }).then(() => {});
  }, [token]);

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Invitation introuvable</p>
          <h1 className="text-3xl font-semibold text-foreground">Ce sentier n’existe plus</h1>
          <Button asChild>
            <Link to="/marches-du-vivant">Retour aux Marches du Vivant</Link>
          </Button>
        </div>
      </div>
    );
  }

  const heroVisuals = data.hero_media.filter((item) => item.url).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>Rejoindre les Marcheurs du Vivant</title>
        <meta name="description" content="Découvrez une invitation inspirante aux Marches du Vivant, entre biodiversité, bioacoustique et géopoétique." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border/60 bg-card">
          <div className="absolute inset-0 opacity-60">
            <div className="absolute left-[-8%] top-[-10%] h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute bottom-[-5%] right-[-5%] h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-16">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Invitation vivante</p>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                  Reconnecter les générations au vivant, une marche sensible à la fois.
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                  {data.inviter.prenom} {data.inviter.nom} vous invite à rejoindre une communauté qui mêle sciences, arts narratifs et attention au présent pour explorer {data.exploration.name}.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Biodiversité</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{data.stats.species_count}</p>
                  <p className="text-sm text-muted-foreground">données vivantes recensées</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bioacoustique</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{data.stats.audio_count}</p>
                  <p className="text-sm text-muted-foreground">sons publiés et écoutables</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Géopoétique</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{data.stats.text_count}</p>
                  <p className="text-sm text-muted-foreground">textes partagés par les marcheurs</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to={`/marches-du-vivant/connexion?affiliate=${data.share_token}`}>
                    <UserRoundPlus className="mr-2 h-4 w-4" />
                    Rejoindre la communauté
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to={`/marches-du-vivant/mon-espace/exploration/${data.exploration.id}`}>
                    Découvrir l’exploration
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] border border-border/60 bg-background/80 p-4 shadow-sm">
                <FrequenceWave totalFrequences={0} role="marcheur_en_devenir" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {heroVisuals.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={index === 0 ? 'sm:col-span-2' : ''}
                  >
                    <img
                      src={item.url || ''}
                      alt={item.title || 'Média partagé lors des Marches du Vivant'}
                      className="h-52 w-full rounded-[1.75rem] border border-border/60 object-cover"
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-10 px-6 py-10 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-[1.75rem] border border-border/60 bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bird className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Biodiversité</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Des observations qui donnent envie d’aller voir, rencontrer le vivant sous toutes ses formes, et démocratiser les connaissances autour de la biodiversité.</p>
            </article>
            <article className="rounded-[1.75rem] border border-border/60 bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <AudioLines className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Bioacoustique</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Une approche sobre et sensible pour écouter autrement le monde vivant, partager les sons, et ne plus avoir peur de son évolution.</p>
            </article>
            <article className="rounded-[1.75rem] border border-border/60 bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Géopoétique</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Des récits collectifs inspirants pour transmettre les nouvelles connaissances, animer les communautés et proposer des alternatives au repliement sur soi.</p>
            </article>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-border/60 bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <Leaf className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Médias téléchargeables</h2>
              </div>
              <div className="space-y-3">
                {data.hero_media.slice(0, 6).map((media) => (
                  <a
                    key={media.id}
                    href={media.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/70 px-4 py-3 transition-colors hover:bg-secondary"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{media.title || 'Média du vivant'}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{media.type}</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-border/60 bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Mic2 className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">Écouter le terrain</h2>
                </div>
                <div className="space-y-3">
                  {data.audio_highlights.slice(0, 3).map((audio) => (
                    <a key={audio.id} href={audio.url || '#'} target="_blank" rel="noreferrer" className="block rounded-2xl border border-border/50 bg-background/70 p-4 hover:bg-secondary">
                      <p className="text-sm font-medium text-foreground">{audio.title || 'Paysage sonore'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{audio.duration ? `${Math.round(audio.duration)} sec` : 'Écoute libre'}</p>
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/60 bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">Lire les traces</h2>
                </div>
                <div className="space-y-3">
                  {data.text_highlights.slice(0, 2).map((text) => (
                    <div key={text.id} className="rounded-2xl border border-border/50 bg-background/70 p-4">
                      <p className="text-sm font-medium text-foreground">{text.title || 'Fragment géopoétique'}</p>
                      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{text.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-card p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Notre approche unique</p>
                <h2 className="mt-2 text-3xl font-semibold text-foreground">Mixer sciences, arts narratifs et pratique de l’instant présent.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">Former, transmettre, animer des communautés, impliquer les membres dans la science participative et l’art narratif participatif : ici, chaque marche devient un récit collectif et sensible.</p>
              </div>
              <div className="flex gap-3">
                <Button size="lg" asChild>
                  <Link to={`/marches-du-vivant/connexion?affiliate=${data.share_token}`}>
                    Je rejoins l’aventure
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/marches-du-vivant/association">
                    En savoir plus
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CommunityAffiliateLanding;