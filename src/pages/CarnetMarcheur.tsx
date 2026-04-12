import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Camera, FileText, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CarnetMarcheur: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-carnet', slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_marcheur_carnet', { p_slug: slug! });
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-white/40 text-sm">Chargement du carnet…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/60 text-sm">Ce carnet n'existe pas ou n'est pas accessible.</p>
        <Link to="/marches-du-vivant" className="text-violet-400 text-sm underline">
          Découvrir Les Marches du Vivant
        </Link>
      </div>
    );
  }

  const profile = data.profile || {};
  const textes = (data.textes || []) as any[];
  const medias = (data.medias || []) as any[];
  const allItems = [...textes, ...medias].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const roleLabels: Record<string, string> = {
    marcheur_en_devenir: 'Marcheur en devenir',
    marcheur: 'Marcheur',
    eclaireur: 'Éclaireur',
    ambassadeur: 'Ambassadeur',
    sentinelle: 'Sentinelle',
  };

  return (
    <>
      <Helmet>
        <title>Carnet de {profile.prenom || 'Marcheur'} — Les Marches du Vivant</title>
        <meta name="description" content={`Carnet de terrain de ${profile.prenom}, ${roleLabels[profile.role] || profile.role}. ${allItems.length} contributions partagées.`} />
        <meta property="og:title" content={`Carnet de ${profile.prenom}`} />
        <meta property="og:type" content="profile" />
      </Helmet>

      <div className="min-h-screen bg-gray-950">
        {/* Violet accent bar */}
        <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-violet-600 to-violet-900 z-50" />

        {/* Profile header */}
        <header className="border-b border-white/5 px-4 py-8">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-violet-500/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 text-2xl font-bold">
                {(profile.prenom || '?')[0]}
              </div>
            )}
            <div>
              <h1 className="text-white text-xl font-medium">{profile.prenom}</h1>
              <p className="text-violet-400/70 text-sm">
                {roleLabels[profile.role] || profile.role}
                {profile.marches_count > 0 && ` · ${profile.marches_count} marche${profile.marches_count > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </header>

        {/* Content grid */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          {allItems.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-12">
              Aucune contribution partagée pour le moment.
            </p>
          ) : (
            <div className="columns-1 sm:columns-2 gap-4 space-y-4">
              {allItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/partage/${item.id}?type=${item.type}`}
                  className="block break-inside-avoid bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-violet-500/30 transition-colors group"
                >
                  {/* Photo preview */}
                  {item.type === 'photo' && item.url && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={item.url}
                        alt={item.titre || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="p-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {item.type === 'texte' ? (
                        <FileText className="w-3 h-3 text-amber-400/60" />
                      ) : item.type === 'video' ? (
                        <Camera className="w-3 h-3 text-blue-400/60" />
                      ) : (
                        <Camera className="w-3 h-3 text-emerald-400/60" />
                      )}
                      <span className="text-white text-xs font-medium truncate">
                        {item.titre || 'Sans titre'}
                      </span>
                    </div>

                    {item.type === 'texte' && item.contenu && (
                      <p className="text-white/40 text-[11px] line-clamp-4 whitespace-pre-line font-serif">
                        {item.contenu}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-white/20 text-[9px]">
                        {format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      {item.marche_nom && (
                        <span className="text-white/20 text-[9px] truncate max-w-[120px]">
                          {item.marche_nom}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 px-4 text-center">
          <Link
            to="/marches-du-vivant"
            className="text-violet-400/70 text-xs hover:text-violet-300 transition-colors"
          >
            Les Marches du Vivant — Explorer
          </Link>
        </footer>
      </div>
    </>
  );
};

export default CarnetMarcheur;
