import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Copy, MapPin, ArrowLeft, Music, FileText, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const PartagePublic: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'texte';

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-shared', id, type],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_shared_contribution', {
        p_id: id!,
        p_type: type,
      });
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: data?.titre || 'Contribution', url });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Lien copié !');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-white/40 text-sm">Chargement…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/60 text-sm">Cette contribution n'est pas disponible ou n'est plus partagée.</p>
        <Link to="/marches-du-vivant" className="text-violet-400 text-sm underline">
          Découvrir Les Marches du Vivant
        </Link>
      </div>
    );
  }

  const profile = data.profile || {};
  const marche = data.marche || {};
  const pageTitle = data.titre || 'Contribution partagée';
  const pageDesc = data.type === 'texte'
    ? (data.contenu || '').slice(0, 160)
    : `${data.type === 'photo' ? 'Photo' : data.type === 'video' ? 'Vidéo' : 'Audio'} par ${profile.prenom || 'un marcheur'}`;

  return (
    <>
      <Helmet>
        <title>{pageTitle} — Les Marches du Vivant</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        {data.url && data.type !== 'audio' && <meta property="og:image" content={data.url} />}
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="min-h-screen bg-gray-950 relative">
        {/* Violet accent bar */}
        <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-violet-600 to-violet-900 z-50" />

        {/* Header */}
        <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-sm border-b border-white/5 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 text-xs font-bold">
                  {(profile.prenom || '?')[0]}
                </div>
              )}
              <div>
                <p className="text-white text-sm font-medium">{profile.prenom || 'Marcheur'}</p>
                {marche.lieu && (
                  <p className="text-white/40 text-[10px] flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" /> {marche.lieu}
                  </p>
                )}
              </div>
            </div>
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Share2 className="w-4 h-4 text-violet-400" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto px-4 py-8">
          {/* Text content */}
          {data.type === 'texte' && (
            <article className="space-y-6">
              {data.type_texte && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 uppercase tracking-wider">
                  {data.type_texte}
                </span>
              )}
              {data.titre && (
                <h1 className="text-2xl md:text-3xl font-serif text-white leading-relaxed">
                  {data.titre}
                </h1>
              )}
              <div className="text-white/80 text-base md:text-lg leading-relaxed whitespace-pre-line font-serif">
                {data.contenu}
              </div>
            </article>
          )}

          {/* Photo */}
          {data.type === 'photo' && data.url && (
            <div className="space-y-4">
              <img src={data.url} alt={data.titre || ''} className="w-full rounded-lg" />
              {data.titre && <h1 className="text-lg text-white font-medium">{data.titre}</h1>}
              {data.description && <p className="text-white/60 text-sm">{data.description}</p>}
            </div>
          )}

          {/* Video */}
          {data.type === 'video' && data.url && (
            <div className="space-y-4">
              {data.url.includes('youtube') || data.url.includes('vimeo') ? (
                <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  ▶ Voir la vidéo
                </a>
              ) : (
                <video controls className="w-full rounded-lg">
                  <source src={data.url} />
                </video>
              )}
              {data.titre && <h1 className="text-lg text-white font-medium">{data.titre}</h1>}
            </div>
          )}

          {/* Audio */}
          {data.type === 'audio' && data.url && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-6 flex flex-col items-center gap-4">
                <Music className="w-12 h-12 text-violet-400/60" />
                <audio controls className="w-full">
                  <source src={data.url} />
                </audio>
              </div>
              {data.titre && <h1 className="text-lg text-white font-medium">{data.titre}</h1>}
            </div>
          )}

          {/* Meta */}
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-white/30 text-xs">
              {format(new Date(data.created_at), 'dd MMMM yyyy', { locale: fr })}
            </span>
            {marche.nom && (
              <span className="text-white/30 text-xs">{marche.nom}</span>
            )}
          </div>
        </main>

        {/* CTA footer */}
        <footer className="border-t border-white/5 py-6 px-4 text-center">
          <Link
            to="/marches-du-vivant"
            className="text-violet-400/70 text-xs hover:text-violet-300 transition-colors"
          >
            Les Marches du Vivant — Explorer
          </Link>
          {profile.slug && (
            <div className="mt-2">
              <Link
                to={`/marcheur/${profile.slug}/carnet`}
                className="text-white/30 text-[10px] hover:text-white/50 transition-colors"
              >
                Voir le carnet de {profile.prenom}
              </Link>
            </div>
          )}
        </footer>
      </div>
    </>
  );
};

export default PartagePublic;
